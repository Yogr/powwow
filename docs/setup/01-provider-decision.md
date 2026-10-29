# Hosting decision: Runpod for GPU inference

Decision date: September 30, 2026. Public prices checked September 30 / October 1, 2026. No account was opened, paid resource started, or paid benchmark run as part of this decision.

## Selected stack

**Use Runpod Serverless for custom model containers, Supabase for accounts/Postgres/private artifacts, Railway for the Python API and persistent job workers, and Cloudflare Pages Free for the React web app.** Vercel Pro is the equally compatible option if its familiar dashboard is worth the additional cost. The Flutter clients call the same API. Either frontend host serves the same Vite build; this choice requires no application stack change for production.

Runpod gives Powwow direct control of model weights, CUDA dependencies, and request handlers, with an asynchronous API and workers that can scale to zero. Start with separate image, video, and TRELLIS containers. A single inexpensive development GPU can run profiles sequentially, but incompatible environments should stay isolated. [Custom handlers](https://docs.runpod.io/serverless/workers/handler-functions), [container deployment](https://docs.runpod.io/serverless/workers/deploy), [billing](https://docs.runpod.io/serverless/pricing).

Keep Supabase. A GPU service is not an equally complete replacement for managed user authentication, relational data, and private artifact access. Running those ourselves on a GPU machine would add operational work and prevent cheap GPU shutdown. Railway supplies the small, continuously available CPU processes that a static frontend host and GPU queue do not cover.

## Ranking against your priorities

These are **engineering suitability ratings from 1 to 5**, not performance benchmarks or measured financial savings. The columns follow your priority order. Custom model support is a pass requirement. The cost score considers intermittent use, storage, and operational overhead; the cost of an accepted output still requires the same workload on each provider.

| Overall choice | Custom models and API | Low total PoC cost | Setup simplicity | Hardware/service options | Decision |
|---|---:|---:|---:|---:|---|
| **1. Runpod** | 5 | 4 | 4 | 4 | Best starting combination: custom containers, published affordable GPU tiers, managed queue, scale to zero |
| 2. Vast.ai | 5 | 4–5 | 2 | 3–4 | Often strongest raw rental price; final cost depends on host, storage, transfer, reliability, and worker lifecycle |
| 3. Modal | 5 | 3–4 | 5 | 4 | Excellent Python deployment experience and credits; CPU/RAM are additional to the GPU rate |
| 4. AWS | 5 | 2–3 | 2 | 5 | Strong integrated platform; more IAM/network/quota work and provisioned infrastructure for this small PoC |
| 5. Google Cloud | 5 | 2–3 | 2 | 5 | Also a sound production platform; region/quota/machine shape and managed database costs complicate the first build |

**Runpod is the recommendation, not a claim that it beats every Vast listing or credit offer.** Vast wins if a tested host's all-in cost is substantially lower and we accept more infrastructure work. The adapter keeps that route open without a client rewrite. Its serverless system uses host-priced instances; cold workers still incur storage and transfer charges. [Vast pricing](https://docs.vast.ai/guides/instances/pricing), [serverless billing states](https://docs.vast.ai/guides/serverless/pricing), [custom workers](https://docs.vast.ai/guides/serverless/overview).

AWS offers L40S instances and its full infrastructure ecosystem, but new accounts can require GPU quota increases. GCP offers several accelerator families with region-specific availability. Neither has been given an invented region-specific quote here. [AWS G6e specifications](https://aws.amazon.com/ec2/instance-types/g6e/), [EC2 pricing and billing](https://aws.amazon.com/ec2/pricing/on-demand/), [AWS quotas](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html), [Google GPU documentation](https://docs.cloud.google.com/compute/docs/gpus), [Google pricing](https://cloud.google.com/products/compute/pricing).

## Actual published prices, with limits

All amounts below are USD before tax. They are provider prices, **not measured Powwow cost per generation**.

| Product | Published reference | Use |
|---|---|---|
| Runpod Serverless 24 GB L4/A5000/3090 group | $0.69/GPU-hour | First image candidate with offload; validate actual assigned GPU |
| Runpod Serverless 48 GB A40/A6000 group | $1.22/GPU-hour | Cheapest roomy compatibility candidate |
| Runpod Serverless 48 GB L40/L40S/6000 Ada group | $1.75/GPU-hour on pricing page | Faster image/video candidate |
| Runpod Serverless A100 80 GB | $2.72/GPU-hour on pricing page | Initial TRELLIS compatibility target |
| Runpod standard network volume below 1 TB | $0.07/GB-month | 100 GB cache = $7/month even if GPU scales to zero |
| Modal L40S | $0.000542/s = $1.9512/GPU-hour | Additional CPU and memory charges |
| Modal A100 80 GB | $0.000694/s = $2.4984/GPU-hour | Additional CPU and memory charges |
| Modal Starter | $0 plan + usage; $30/month credits | Credits can make a small initial experiment cheapest |

Runpod's pricing page says it was updated September 27, 2026. Its July endpoint settings documentation still lists some different rates: for example, $0.00053/s ($1.908/h) for the L40S group. **Use the console quote shown before deployment as the charge to budget against.** Workers are billed during startup, model loading, execution, and idle timeout. Network volumes add cost and constrain worker location. [Current pricing](https://www.runpod.io/pricing), [billing rules](https://docs.runpod.io/serverless/pricing), [endpoint settings](https://docs.runpod.io/serverless/endpoints/endpoint-configurations), [Modal pricing](https://modal.com/pricing).

Illustrative arithmetic at $1.75/hour: 30 billed seconds cost $0.0146; 10 billed minutes cost $0.2917. These durations are examples, not measured latency. A 100 GB cache plus 10 billed GPU-hours is $24.50 before other charges. Three separate 100 GB caches would cost $21/month before GPU time. Start with image only and add storage when a workflow is ready to test.

| Non-GPU service | Starting plan | Production consideration |
|---|---|---|
| Supabase | Free: 500 MB database, 1 GB file storage, 50,000 MAU, 5 GB uncached + 5 GB cached egress | Projects pause after a week of inactivity; Pro starts at $25/month; media can exhaust storage first |
| Railway | Trial credit available; Hobby $5 minimum monthly usage including $5 of resources | CPU, memory, transfer, and storage determine actual spend; do not assume $5 is an unlimited flat bill |
| Cloudflare Pages | Free static asset requests; 500 builds/month, one concurrent build, 20,000 files, 25 MiB per asset | Recommended cost-saving commercial frontend; use Supabase for generated media and Railway for API requests |
| Vercel | Hobby only for personal, noncommercial use | Use Pro for commercial Powwow hosting; currently starts at $20/month plus additional usage |

Sources: [Supabase plans](https://supabase.com/pricing), [Railway plans](https://railway.com/pricing), [Cloudflare static pricing](https://developers.cloudflare.com/pages/functions/pricing/), [Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Vercel Hobby restrictions](https://vercel.com/docs/plans/hobby), [Vercel prices](https://vercel.com/pricing). A business PoC is not automatically personal/noncommercial because it has no paying users.

Cloudflare's published Pages offering and developer terms do not impose Vercel Hobby's personal/noncommercial restriction. Our recommendation is to use its free static hosting for this commercial PoC within those terms and limits. No Pages Functions are needed. The general free-service terms restrict collecting payment-card details on a free-hosted property; any later billing flow should use the payment provider's hosted checkout. [Pages offering](https://www.cloudflare.com/products/pages/), [developer terms](https://www.cloudflare.com/service-specific-terms-developer-platform/), [self-serve terms §2.2.1(h) and §2.6](https://www.cloudflare.com/terms/).

## Model and hardware selection

| Profile | Intended first cloud target | Why / constraints |
|---|---|---|
| FLUX.2 klein **4B** | 24 GB with CPU offload, then benchmark 48 GB | Upstream describes about 13 GB VRAM; whole-process memory depends on resolution and offload. This model is Apache 2.0; the 9B variant has different terms |
| Wan2.2 TI2V 5B | 48 GB initially; benchmark 24 GB offload | Native upstream supports 720-class 121-frame output and a 24 GB offloaded path. Model loading and generation can take minutes |
| TRELLIS.2 4B | A100 80 GB for first native runtime build/smoke | Upstream requires Linux and at least 24 GB. Native extension compatibility matters; 80 GB is headroom, not a permanent requirement |

Sources: [FLUX card](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B), [Wan runtime and memory notes](https://github.com/Wan-Video/Wan2.2), [TRELLIS requirements](https://github.com/microsoft/TRELLIS.2).

The TRELLIS pipeline's default dependencies include a gated DINOv3 encoder, the earlier TRELLIS sparse decoder, and BRIA RMBG-2.0. Our runner pins the first two and **uses prepared input without BRIA background removal**. Accept the DINOv3 terms and request access before that test. Inspect NVIDIA rasterization/rendering component licenses before commercial deployment. Model names alone do not establish the terms of the complete pipeline. [Pinned upstream pipeline](https://huggingface.co/microsoft/TRELLIS.2-4B/blob/af44b45f2e35a493886929c6d786e563ec68364d/pipeline.json), [DINOv3 card](https://huggingface.co/facebook/dinov3-vitl16-pretrain-lvd1689m), [BRIA model terms](https://huggingface.co/briaai/RMBG-2.0), [nvdiffrast license](https://github.com/NVlabs/nvdiffrast/blob/v0.4.0/LICENSE.txt).

## Production path with the same stack

Start with one API process, a chat job worker, a media job worker, Supabase Postgres, private artifacts, and one concurrent generation per endpoint. Separate CPU workers keep a long video request from holding up chat; their capability filters use the same durable database queue. Increase worker count when measured queue latency warrants it. Keep GPU weights in a cache and durable results in Supabase, so GPU shutdown cannot delete project output. Enable only workflows that have passed real generation and export checks.

Before paid launch, record cold/warm latency, peak GPU and host RAM, exact GPU assigned, failures, useful output rate, container digest, and the provider invoice. Track total spending per accepted output, including failed attempts and idle allocation. There are no Powwow cloud performance measurements yet. The setup guide describes the remaining live deployment checks.
