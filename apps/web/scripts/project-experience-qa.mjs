import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({channel:'msedge',headless:true});
const base = process.env.POWWOW_QA_URL || 'http://127.0.0.1:5173';
const report = {note:'UI protocol fixtures; not evidence of classifier or model quality.', checks:[], errors:[]};
const output = new URL('../../../evals/reports/project-experience/',import.meta.url);
await fs.mkdir(output,{recursive:true});
const check = text => {report.checks.push(text);console.log('PASS',text);};
async function fixture(kind, width=1440){
  const page = await browser.newPage({viewport:{width,height:960}});
  page.on('pageerror',e=>report.errors.push(e.stack || e.message));
  await page.addInitScript(()=>{localStorage.setItem('powwow.project','project');});
  const now = new Date().toISOString();
  const project={id:'project',name:'My project',context_mode:'project',archived:false,storage_mode:'cloud',created_at:now,updated_at:now};
  const chats=[],messages=[],runs=[],profiles=[],seen=[];
  const empty={initialized:false,kind:null,brief:'',answers:{},assumptions:[],components:[],tasks:[],records:{},design:'',plan_prompt:''};
  let workspace={version:0,workspace:structuredClone(empty)};
  const introduction=kind==='language' ? "Welcome. I'll be your personal Spanish tutor. We'll practice through guided daily conversations by text or speech, with translations and word help." : "Welcome to your novel workspace. We'll develop your premise, characters and story, then write and revise chapter by chapter.";
  const components=[['plot','Story & Plot'],['timeline','Timeline'],['design','Blueprint'],['tasks','Task Board'],['language','Language learning'],['manuscript','Book & Script Editor'],['characters','Characters'],['memory','Project Memory']].map(([id,name])=>({id,name,description:name,icon:id}));
  const languageCatalog={languages:[{code:'en',name:'English',native_name:'English',locale:'en-US'},{code:'es',name:'Spanish',native_name:'Español',locale:'es-ES'}],levels:[{id:'beginner',name:'Just starting',description:'Beginner'}],intelligence:{setup_required:true,tiers:[],qualification:'candidate'}};
  const requests=[];
  await page.route('**/v1/**',async route=>{
    const p=new URL(route.request().url()).pathname, method=route.request().method();
    const body=method==='POST' ? route.request().postDataJSON() : null;
    requests.push({p,method,body});
    let data=[];
    if(p==='/v1/config')data={auth_mode:'local',max_run_budget_usd:5};
    else if(p==='/v1/projects')data=[project];
    else if(p==='/v1/projects/project')data=project;
    else if(p==='/v1/account/preferences')data={app_language:'en',storage_mode:'cloud',plan:'free',storage_quota_bytes:524288000,storage_used_bytes:0,storage_reserved_bytes:0,component_priorities:{},storage_grace_bytes:0,storage_staged_bytes:0};
    else if(p==='/v1/account/experience-tours')data=seen;
    else if(p.startsWith('/v1/account/experience-tours/')){seen.push(p.split('/').at(-1));data={completed:true};}
    else if(p==='/v1/catalog')data={capabilities:[],models:[],skills:[],workflows:[],providers:[]};
    else if(p==='/v1/builder/catalog')data={kinds:[],components};
    else if(p==='/v1/languages/catalog')data=languageCatalog;
    else if(p.endsWith('/workspace'))data=workspace;
    else if(p.endsWith('/language/profiles')){
      if(method==='POST'){const profile={...body,id:'learner',project_id:'project',start_date:'2026-10-05'};profiles.push(profile);data=profile;}else data=profiles;
    }
    else if(p.includes('/language/profiles/learner/days'))data={profile:profiles[0],days:[],current_day_id:null};
    else if(p==='/v1/chats'){
      if(method==='POST'){data={...body,id:'chat',created_at:now,updated_at:now};chats.push(data);}else data=chats;
    }
    else if(p==='/v1/chats/chat/messages'){
      if(method==='POST'){data={...body,id:'user',role:'user',chat_id:'chat',created_at:now};messages.push(data);}else data=messages;
    }
    else if(p==='/v1/intent')data={id:'intent',capability:'chat',task:'conversation',available:true,needs_image:false,method:'rules',skill_ids:[],summary:'',web_search:false};
    else if(p==='/v1/runs'){
      if(method==='POST'){
        workspace={version:1,workspace:{...empty,initialized:true,kind,brief:messages[0].content,components:kind==='language'?['language']:['plot','timeline','characters','manuscript'],answers:kind==='language'?{target_language:'es',native_language:'en'}:{},records:kind==='book'?{characters:[{id:'mara',title:'Mara',fields:{role:'Flight surgeon'}}],memory:[{id:'accuracy',title:'Historical accuracy',fields:{content:'Verify rescue mission history.'}}]}:{}}};
        data={...body,id:'run',chat_id:'chat',project_id:'project',status:'running',capability:'chat',stage:'classify',progress:1,output_text:introduction,settings:{...body.settings,project_experience:true,experience_ready:true,experience_destination:kind==='language'?'language':'plot',experience_intro:introduction},model:'fixture',provider:'fixture',model_provenance:{project_update:{status:'applied',changes:kind==='book'?[{component:'characters',title:'Mara'}]:[]}},attachment_ids:[],artifact_ids:[],created_at:now,updated_at:now,completed_at:now};
        data.context_snapshot=[];
        runs.push(data);messages.push({id:'assistant',chat_id:'chat',role:'assistant',content:introduction,run_id:'run',created_at:now,attachment_ids:[]});
      }else data=runs;
    }
    await route.fulfill({json:data});
  });
  await page.goto(base);
  await expect(page.getByRole('heading',{name:'What should we work on in My project?'})).toBeVisible();
  return {page,requests,advance:()=>{runs[0].stage="interpret";},complete:()=>{runs[0].status='succeeded';},completeFollowup:()=>{
    workspace=structuredClone(workspace);
    workspace.version++;
    workspace.workspace.records.characters[0].fields.traits='Patient under pressure';
    runs.unshift({...runs[0],id:'followup',settings:{},model_provenance:{project_update:{status:'applied',changes:[{component:'characters',title:'Mara'}]}}});
  }};
}
async function finishTour(page) {
  const dialog=page.getByRole('dialog',{name:'Welcome to your project'});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Next',exact:true}).click();
  await dialog.getByRole('button',{name:'Next',exact:true}).click();
  await dialog.getByRole('button',{name:"Let's begin",exact:true}).click();
  await expect(dialog).toHaveCount(0);
}
try{
  const language=await fixture('language');
  await language.page.getByRole('textbox',{name:'Describe your request'}).fill('I want to learn spanish');
  await language.page.getByRole('button',{name:'Send request',exact:true}).click();
  await expect(language.page.locator('.project-thinking')).toBeVisible();
  await expect(language.page.getByRole('textbox',{name:'Describe your request'})).toBeVisible();
  await expect(language.page.locator('.builder-workspace-surface')).toHaveCount(0);
  await expect(language.page.locator('.project-thinking .creative-showcase')).toHaveCount(0);
  await expect(language.page.locator('.thinking-status')).toContainText('Understanding your idea');
  const elapsed = await language.page.locator('.thinking-elapsed').textContent();
  await expect(language.page.locator('.thinking-elapsed')).not.toHaveText(elapsed);
  language.advance();
  await expect(language.page.locator('.thinking-status')).toContainText('Working through the details');
  await language.page.screenshot({path:new URL('thinking.png' ,output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  check('While inference runs, chat stays visible with live stage updates, elapsed time and a pulsing indicator');
  language.complete();
  await expect(language.page.locator('.project-arriving')).toBeVisible({timeout:10000});
  await expect.poll(()=>language.requests.filter(r=>r.p.endsWith('/language/profiles')&&r.method==='POST').length).toBe(1);
  expect(language.requests.find(r=>r.p.endsWith('/language/profiles')&&r.method==='POST').body.target_language).toBe('es');
  await finishTour(language.page);
  await expect(language.page.getByRole('navigation',{name:'Project components'})).not.toContainText('Blueprint');
  await expect(language.page.locator('.experience-welcome')).toHaveCount(0);
  await language.page.screenshot({path:new URL('spanish-intake.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  check('Spanish opens the inferred learner, with one first-use tour and no blueprint/task tools or banner');
  await language.page.close();
  const novel=await fixture('book',1440);
  await novel.page.getByRole('textbox',{name:'Describe your request'}).fill("I want to write a novel called Apollo Lost. Mara is the flight surgeon.");
  await novel.page.getByRole('button',{name:'Send request',exact:true}).click();
  await expect.poll(()=>novel.requests.filter(r=>r.p==="/v1/runs" && r.method==="POST").length).toBe(1);
  expect(novel.requests.find(r=>r.p==='/v1/runs' && r.method==='POST').body.budget_usd).toBe(5);
  novel.complete();
  await expect(novel.page.locator('.project-arriving')).toBeVisible({timeout:10000});
  const animations=await novel.page.locator('.project-component-tabs button').evaluateAll(nodes=>nodes.slice(0,4).map(n=>getComputedStyle(n).animationDelay));
  expect(new Set(animations).size).toBe(4);
  await finishTour(novel.page);
  const tabs=novel.page.getByRole('navigation',{name:'Project components'});
  await expect(tabs.getByRole('button',{name:'Chat',exact:true})).toHaveCount(0);
  expect(await tabs.evaluate(node => getComputedStyle(node).justifyContent)).toBe('center');
  expect((await tabs.getByRole('button').allTextContents()).slice(0,4)).toEqual(['Story & Plot','Timeline','Characters','Book & Script Editor']);
  await expect(novel.page.getByRole('textbox',{name:'Describe your request'})).toBeInViewport();
  await novel.page.screenshot({path:new URL('novel-desktop.png',output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  check('Novel components arrive in sequence; Story & Plot opens with project chat anchored below');
  await tabs.getByRole('button',{name:'Characters',exact:true}).click();
  await expect(novel.page.getByRole('textbox',{name:'Character name'})).toHaveValue('Mara');
  await novel.page.getByRole('textbox',{name:'Character name'}).fill('Mara — unsaved edit');
  const reads=novel.requests.filter(r=>r.p.endsWith('/workspace')).length;
  novel.completeFollowup();
  await expect.poll(()=>novel.requests.filter(r=>r.p.endsWith('/workspace')).length,{timeout:10000}).toBeGreaterThan(reads);
  await expect(novel.page.getByRole('textbox',{name:'Character name'})).toHaveValue('Mara — unsaved edit');
  check('Background refresh preserves the open editor draft');
  for (const width of [390,320]) {
    await novel.page.setViewportSize({width,height:844});
    await novel.page.waitForTimeout(350);
    expect(await novel.page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(novel.page.getByRole('textbox',{name:'Describe your request'})).toBeInViewport();
    await novel.page.screenshot({path:new URL(`novel-${width}.png`,output).pathname.replace(/^\/([A-Z]:)/,'$1')});
  }
  novel.page.once("dialog", dialog => dialog.accept());
  await novel.page.reload();
  await novel.page.getByRole("button", {name:"Open sidebar", exact:true}).click();
  await novel.page.locator('.project-tools').getByRole('button',{name:'Characters',exact:true}).click();
  await expect(novel.page.locator('.experience-tour')).toHaveCount(0);
  check('Mobile project tabs and chat reflow; completed tours do not reappear after reload');
  await novel.page.close();
  expect(report.errors).toEqual([]);
}catch(e){report.errors.push(e.stack||String(e));process.exitCode=1;}
finally{await browser.close();await fs.writeFile(new URL('report.json',output),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
