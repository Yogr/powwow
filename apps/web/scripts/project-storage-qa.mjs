import {chromium, expect} from '@playwright/test';
import fs from 'node:fs/promises';
const base = process.env.POWWOW_QA_URL || 'http://127.0.0.1:5173';
const output = new URL('../../../evals/reports/project-storage/', import.meta.url);
await fs.mkdir(output, {recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true});
const report = {checks:[],errors:[]};
const check = text => {report.checks.push(text);console.log('PASS',text);};

async function fixture({supported=true, installed=false, width=1440, storageMode='cloud', allowUploads=false}={}) {
  const page = await browser.newPage({viewport:{width,height:960}, reducedMotion:'reduce'});
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.addInitScript(({supported,installed})=>{
    window.SpeechRecognition=class {
      start(){window.__recognition=this;window.__speechStarts=(window.__speechStarts||0)+1;}
      stop(){this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'last words'}}]});this.onend?.();}
      abort(){window.__speechAborted=true;}
    };
    window.__pickerCalls=0;
    Object.defineProperty(window,'showDirectoryPicker',{configurable:true,value:supported ? async()=>{
      window.__pickerCalls++;
      if(window.__cancelPicker) throw new DOMException('Canceled','AbortError');
      return (await navigator.storage.getDirectory()).getDirectoryHandle('QA project folder',{create:true});
    } : undefined});
    if(installed){ const original=window.matchMedia.bind(window);window.matchMedia=query=>query==='(display-mode: standalone)' ? {...original(query),matches:true} : original(query); }
  },{supported,installed});
  const projects=[], writes=[];
  const prefs={app_language:'en', storage_mode:'cloud', plan:'free', storage_quota_bytes:524288000,storage_used_bytes:490*1024**2,storage_reserved_bytes:0,storage_grace_bytes:25*1024**2,storage_staged_bytes:0,local_retention_hours:24,checkout_available:false,component_priorities:{design:1,tasks:2}};
  const workspace={version:0,workspace:{initialized:false,kind:null,brief:'',answers:{},assumptions:[],components:[],tasks:[],records:{},design:'',plan_prompt:''}};
  prefs.storage_mode=storageMode;
  const uploads=[];
  await page.route('**/v1/**',async route=>{
    const p=new URL(route.request().url()).pathname, method=route.request().method();let data=[];
    if(p==='/v1/config')data={auth_mode:'local'};
    else if(p==='/v1/account/preferences'){if(method==='PATCH')Object.assign(prefs,route.request().postDataJSON());data=prefs;}
    else if(p==='/v1/projects'){
      if(method==='POST'){const body=route.request().postDataJSON();writes.push(body);data={...body,id:`project-${projects.length}`,archived:false,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};projects.push(data);}
      else data=projects;
    } else if(p==='/v1/builder/catalog')data={kinds:[],components:[{id:'design',name:'Project Blueprint',priority:1},{id:'tasks',name:'Task Board',priority:2}]};
    else if(p.endsWith('/workspace'))data=workspace;
    else if(p==='/v1/catalog')data={models:[],skills:[],capabilities:[],workflows:[],providers:[]};
    else if(p==='/v1/uploads'){
      if(!allowUploads){await route.fulfill({status:413,json:{detail:{code:'storage_quota',storage_mode:'cloud',action:'upgrade_storage',message:'Your cloud storage is full.'}}});return;}
      const name=/filename="([^"]+)"/.exec(route.request().postData())?.[1];
      data={id:`reference-${uploads.length}`,name,kind:'document',mime_type:'text/plain',size_bytes:4,storage_mode:'cloud',available:true,metadata:{source:'upload'},created_at:new Date().toISOString()};
      uploads.push(data);
    }
    else if(p==='/v1/artifacts')data=uploads;
    await route.fulfill({json:data});
  });
  await page.goto(base);
  await expect(page.getByRole('heading',{name:'What should we work on?'})).toBeVisible();
  return {page,writes,uploads};
}
async function openProject(page){
  const open=page.getByRole('button',{name:'Open sidebar',exact:true});if(await open.isVisible())await open.click();
  await page.getByRole('button',{name:'Create project',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Project Name',exact:true})).toBeVisible();
}

try {
  for(const storageMode of ['unselected','local']){
    const refs=await fixture({storageMode,allowUploads:true});
    await refs.page.getByRole('button',{name:'Add to your message',exact:true}).click();
    const chooser=refs.page.waitForEvent('filechooser');
    await refs.page.getByRole('menuitem',{name:'Add a file for reference',exact:true}).click();
    await (await chooser).setFiles({name:'chosen.txt',mimeType:'text/plain',buffer:Buffer.from('test')});
    await expect(refs.page.locator('.attachment-chip')).toContainText('chosen.txt');
    const transfer=await refs.page.evaluateHandle(()=>{
      const data=new DataTransfer();data.items.add(new File(['test'],'dropped.txt',{type:'text/plain'}));return data;
    });
    await refs.page.locator('form.composer').dispatchEvent('drop',{dataTransfer:transfer});
    await expect(refs.page.locator('.attachment-chip')).toHaveCount(2);
    await expect(refs.page.locator('.attachment-chip').last()).toContainText('dropped.txt');
    await expect(refs.page.getByRole('dialog')).toHaveCount(0);
    expect(await refs.page.evaluate(()=>window.__pickerCalls)).toBe(0);
    expect(refs.uploads).toHaveLength(2);
    await refs.page.getByRole('button',{name:'Remove chosen.txt',exact:true}).click();
    await expect(refs.page.locator('.attachment-chip')).toHaveCount(1);
    check(`File selection and drop attach references without storage setup (${storageMode})`);
    await refs.page.close();
  }
  const {page,writes}=await fixture();
  for(const [name,expected] of [['Write a novel',/novel/],['Build a game',/game/],['Start your screenplay',/screenplay/],['Write a song',/song/],['Create some art',/concept art/],['Learn a language',/learn a language/]]){
    await page.locator('.creative-prompts').getByRole('button',{name,exact:true}).click();
    await expect(page.getByRole('textbox',{name:'Describe your request'})).toHaveValue(expected);
  }
  await expect(page.locator('.creative-showcase button')).toHaveCount(0);
  await page.screenshot({path:new URL('shortcuts-desktop.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  check('Six creation shortcuts restore editable drafts, including Learn a language; orbit remains decorative');
  await openProject(page);
  await expect(page.getByRole('radio',{name:'Local',exact:true})).toBeChecked();
  await expect(page.getByRole('dialog')).not.toContainText('Project instructions');
  const triggerBox=await page.getByRole('button',{name:'Create project',exact:true}).first().boundingBox();
  const dialogBox=await page.getByRole('dialog').boundingBox();
  expect(dialogBox.width).toBeLessThanOrEqual(320);
  expect(Math.abs(dialogBox.y-triggerBox.y-triggerBox.height)).toBeLessThanOrEqual(10);
  await expect(page.getByRole('dialog')).not.toContainText('allow access');
  await page.getByRole('textbox',{name:'Project Name',exact:true}).fill('My local movie');
  await page.screenshot({path:new URL('local-project.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  await page.evaluate(()=>window.__cancelPicker=true);
  await page.getByRole('button',{name:'Create project',exact:true}).last().click();
  await expect(page.getByRole('textbox',{name:'Project Name',exact:true})).toHaveValue('My local movie');
  expect(writes).toHaveLength(0);
  await page.evaluate(()=>window.__cancelPicker=false);
  await page.getByRole('button',{name:'Create project',exact:true}).last().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes[0]).toMatchObject({name:'My local movie',storage_mode:'local'});
  await expect(page.getByRole('heading',{name:'What should we work on in My local movie?'})).toBeVisible();
  await expect(page.locator('.project-tools').getByRole('button',{name:'Project Blueprint',exact:true})).toHaveCount(0);
  await expect(page.locator('.project-tools').getByRole('button',{name:'Task Board',exact:true})).toHaveCount(0);
  await expect(page.getByRole('textbox',{name:'Describe your request'})).toHaveValue('');
  const draft=page.getByRole('textbox',{name:'Describe your request'});
  await draft.fill('Build a game');
  await page.getByRole('button',{name:'Dictate message',exact:true}).click();
  await expect(page.getByRole('button',{name:'Stop dictation',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Send request',exact:true})).toBeDisabled();
  await page.evaluate(()=>{
    const event={resultIndex:0,results:[{isFinal:true,0:{transcript:'with a fox'}}]};
    window.__recognition.onresult(event);window.__recognition.onresult(event);
    window.__recognition.stop=function(){this.onresult?.({resultIndex:1,results:[{isFinal:true,0:{transcript:'with a fox'}},{isFinal:true,0:{transcript:'collecting stars'}}]});this.onend?.();};
  });
  await expect(draft).toHaveValue('Build a game with a fox');
  await page.getByRole('button',{name:'Stop dictation',exact:true}).click();
  await expect(draft).toHaveValue('Build a game with a fox collecting stars');
  expect(await page.evaluate(()=>window.__recognition.continuous)).toBe(true);
  await page.getByRole('button',{name:'Dictate message',exact:true}).click();
  await page.evaluate(()=>window.__recognition.onerror({error:'not-allowed'}));
  await expect(page.getByRole('alert')).toContainText('Microphone access was not allowed');
  await expect(draft).toHaveValue('Build a game with a fox collecting stars');
  await page.getByRole('button',{name:'Dictate message',exact:true}).click();
  await page.evaluate(()=>window.__lateResult=window.__recognition.onresult);
  await page.getByRole('button',{name:'New conversation',exact:true}).click();
  await page.evaluate(()=>window.__lateResult({resultIndex:0,results:[{isFinal:true,0:{transcript:'wrong chat'}}]}));
  await expect(draft).toHaveValue('');
  await page.screenshot({path:new URL('new-project-chat.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  check('Dictation appends once, retains final words on stop, handles denied permission, and discards results after navigation');
  let intentCalls=0;
  await page.route('**/v1/intent',async route=>{intentCalls++;await route.fulfill({json:{capability:'chat',available:false,summary:'Fixture unavailable'}});});
  await draft.fill('Build a game with a fox');
  await page.getByRole('button',{name:'Send request',exact:true}).click();
  await expect.poll(()=>intentCalls).toBe(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  check('First project message goes to normal chat intent without a setup wizard');
  expect(await page.evaluate(()=>window.__pickerCalls)).toBe(2);
  check('Compact project dialog defaults Local, preserves canceled folder choice and creates only after permission');
  await openProject(page);
  await page.getByRole('radio',{name:'Cloud',exact:true}).check();
  await expect(page.getByText('490 MB of 500 MB cloud storage used')).toBeVisible();
  await page.getByRole('button',{name:'Upgrade your storage',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Upgrade your storage'})).toContainText('Install Powwow');
  await expect(page.getByRole('button',{name:'Checkout coming soon'})).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog',{name:'Project Name'})).toBeVisible();
  await page.getByRole('textbox',{name:'Project Name',exact:true}).fill('My cloud book');
  await page.getByRole('button',{name:'Create project',exact:true}).last().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes[1]).toMatchObject({name:'My cloud book',storage_mode:'cloud'});
  expect(writes[0].storage_mode).toBe('local');
  expect(await page.evaluate(()=>window.__pickerCalls)).toBe(2);
  check('Cloud choice shows allowance/upgrade, keeps other project choices and never asks for a folder in the browser');
  await page.getByRole('button',{name:'New chat',exact:true}).last().click();
  await page.getByRole('button',{name:'Add to your message',exact:true}).click();
  const picker=page.waitForEvent('filechooser');
  await page.getByRole('menuitem',{name:'Add a file for reference',exact:true}).click();
  await (await picker).setFiles({name:'note.txt',mimeType:'text/plain',buffer:Buffer.from('test')});
  await expect(page.getByRole('dialog',{name:'Upgrade your storage'})).toBeVisible();
  check('A server cloud-quota rejection opens Upgrade your storage and preserves existing work');
  await page.close();

  const remote=await fixture({supported:false,width:320});
  await openProject(remote.page);
  await expect(remote.page.getByRole('radio',{name:'Local',exact:true})).toHaveCount(0);
  await expect(remote.page.getByRole('radio',{name:'Cloud',exact:true})).toBeChecked();
  await expect(remote.page.getByText('490 MB of 500 MB cloud storage used')).toBeVisible();
  await remote.page.getByRole('textbox',{name:'Project Name',exact:true}).fill('Cloud on this browser');
  await remote.page.screenshot({path:new URL('cloud-project-320.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  expect(await remote.page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await remote.page.getByRole('button',{name:'Create project',exact:true}).last().click();
  await expect(remote.page.getByRole('dialog')).toHaveCount(0);
  expect(remote.writes[0].storage_mode).toBe('cloud');
  check('Unsupported browsers show only Cloud, allowance and upgrade; compact dialog fits 320px');
  await remote.page.close();

  const installed=await fixture({installed:true});
  await openProject(installed.page);
  await expect(installed.page.getByRole('radio',{name:'Local',exact:true})).toBeChecked();
  await installed.page.getByRole('radio',{name:'Cloud',exact:true}).check();
  await expect(installed.page.getByText('Cloud files will also sync to your chosen folder while Powwow is open.')).toHaveCount(0);
  await installed.page.getByRole('textbox',{name:'Project Name',exact:true}).fill('Synced project');
  await installed.page.getByRole('button',{name:'Create project',exact:true}).last().click();
  await expect(installed.page.getByRole('dialog')).toHaveCount(0);
  expect(installed.writes[0].storage_mode).toBe('cloud');
  expect(await installed.page.evaluate(()=>window.__pickerCalls)).toBe(1);
  check('Installed app defaults Local and connects a folder when Cloud sync is selected');
  expect(report.errors).toEqual([]);
} catch(error){report.errors.push(error.stack||String(error));process.exitCode=1;}
finally{await browser.close();await fs.writeFile(new URL('report.json',output),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
