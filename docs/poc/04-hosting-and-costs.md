# 4. Hosting and costs

> Implementation update, September 30, 2026: the application now exists. See [current status and evidence](07-implementation-status.md) and the [selected Runpod stack](../setup/01-provider-decision.md). This document preserves the original planning baseline.

Research date: September 30, 2026. Status: options and experiment design. No cloud account, reservation, purchase, or deployment has been made. [Planning index](../../README.md).

## Recommended approach

Use one region, one application backend, managed PostgreSQL, object storage, and independently deployable GPU workers. Start with one worker processing jobs serially during scheduled development sessions. Choose hardware after model compatibility checks; compare 48 GB against 80/96 GB configurations using identical jobs.

**Proposed hyperscaler default: AWS with a G6e worker for the first compatible profiles.** This is an implementation starting point, not a finding that AWS is cheapest. GCP is equally viable if credits, quotas, or existing accounts favor it. Benchmark a specialist GPU provider alongside the hyperscaler before committing to steady capacity.

## Provider comparison

| Option | Candidate deployment | Main advantage | Main tradeoff |
|---|---|---|---|
| AWS | CPU API service, RDS PostgreSQL, S3, EC2 GPU workers | Integrated infrastructure and a straightforward dedicated-worker path | More configuration; GPU quotas and whole-instance costs |
| GCP | Cloud Run for CPU API, Cloud SQL, GCS, Compute Engine GPU workers | Integrated managed application services and several GPU families | Regional GPU availability/quotas and machine-shape constraints |
| Runpod | GPU Pods or Serverless workers with a separate app backend | Direct GPU-oriented deployment choices | Compare cloud type, region, availability, storage, and shutdown behavior |
| Modal | Containerized Python GPU functions with a separate app backend | Managed execution and fine-grained resource billing | Platform-specific operational integration; cold starts and billed extras |

AWS G6e uses L40S GPUs with 48 GB each. A `g6e.2xlarge` supplies one GPU and 64 GiB host memory; `g6e.4xlarge` has 128 GiB host memory. Choose enough host memory for offloaded components. [AWS instance specifications](https://aws.amazon.com/ec2/instance-types/g6e/)

GCP G2 supplies L4 GPUs with 24 GB each. G4 includes RTX PRO 6000 configurations, including a full 96 GB GPU and fractional configurations; memory and performance depend on the exact shape. Use A-series options if the workload needs a different accelerator. Multiple smaller GPUs do not form one large memory pool automatically. [GCP GPU machine types](https://docs.cloud.google.com/compute/docs/gpus)

Runpod lists Pods, Serverless, and separate Community/Secure Cloud selections. Obtain a quote for the selected product and region; the pricing page's lowest displayed figure is not a universal rate. [Runpod pricing](https://www.runpod.io/pricing)

Modal lists per-second GPU prices and separate CPU/memory charges. At the research date, its published GPU-only rates convert to approximately **$1.95/hour for L40S** and **$2.50/hour for A100 80 GB**. These are reference prices, not a complete Powwow bill or reserved-capacity offer. [Modal pricing](https://modal.com/pricing)

## Hardware experiment order

1. **Compatibility baseline:** use an available A100 80 GB or another verified roomy GPU for the first complete container tests, especially native TRELLIS dependencies. Confirm exact profile memory use.
2. **Cost baseline:** run image, 5B video, and 3D profiles on L40S 48 GB where compatible. The recommendation does not promise all profiles fit unmodified.
3. **Quality comparison:** test the larger video candidate and heavier image profile on 80/96 GB hardware. Compare accepted-output cost and latency.
4. **Concurrency:** only after single-job correctness, find safe per-model concurrency and split pools when queueing justifies it.

Persist weights on an attached cache volume or provider-supported equivalent. Keep durable inputs and outputs in object storage. A stopped or deleted worker must not own the sole copy of a result. Benchmark the native extension stack on Blackwell before choosing it solely on price or VRAM.

## Initial AWS and GCP layouts

| Function | AWS path | GCP path |
|---|---|---|
| Static web assets | S3 + CloudFront or equivalent web hosting | Static hosting/CDN chosen for the project |
| CPU API and scheduler | ECS/Fargate or a small CPU VM initially | Cloud Run API plus a suitable scheduler process |
| Database / durable jobs | RDS PostgreSQL | Cloud SQL PostgreSQL |
| Artifact/model storage | S3 plus worker cache volumes | GCS plus worker cache disks |
| GPU inference | EC2 GPU worker with outbound job polling | Compute Engine GPU worker with outbound job polling |
| Secrets and monitoring | Managed secrets and CloudWatch | Secret Manager and Cloud Logging/Monitoring |

Keep application traffic separate from inference workloads. For the PoC, a worker authenticates to a control API and claims jobs; the public browser never connects directly to a GPU runtime. Use the same container and job contract on either cloud. Object-storage adapters must explicitly handle S3 and GCS differences rather than pretending their APIs are identical.

Start with on-demand resources. Spot/preemptible instances become useful after retries, intermediate checkpoints, and interruption accounting work. Model caches and artifact transfer paths should be in the same region as workers where practical.

## Cost accounting

Measure these separately: useful GPU execution, warm idle time, model loading, cold-start/download time, CPU/RAM, storage, egress, failed attempts, and premium API usage.

```text
cost per accepted result =
  (allocated worker cost + CPU/RAM + storage/transfer
   + premium API calls + failed attempts + idle allocation)
  / number of results accepted by the evaluation rubric
```

Do not count idle allocation twice when using total worker spend. For a dedicated instance, its full hourly rate already covers its bundled compute; add only separately billed resources. For serverless services, use actual billed resource durations and extras.

Illustrative arithmetic only: at $2 per GPU-hour, a 30-second generation uses $0.0167 of active GPU time. If a dedicated worker is productively busy only 20% of its billed time, the effective GPU allocation is about $0.0833 per such result, before other costs. A 300-second generation uses $0.1667 active GPU time, or about $0.8333 at that utilization. These timings are hypothetical, not Powwow benchmarks.

At the same illustrative $2/hour, 40 development hours cost $80 of GPU time; 730 continuously billed hours cost $1,460. An intermittently used PoC should compare scheduled shutdown and scale-down behavior before paying for a continuously warm machine.

Before any deployment, record: provider, product, region, exact SKU, GPU and host RAM, quoted rate, billing increments, disk charges, egress, availability, quotas, and quote date. Set a total experiment budget and maximum run cost. A billing alert alone is not a hard cap; the scheduler must enforce limits and stop admitting work.

## Hosting selection gate

Use the same test corpus and settings across candidates. Capture p50/p95 warm time, cold time, peak memory, failures, developer setup effort, total billed cost, and artifact transfer time. Pick the lowest-cost deployment that reaches the required quality and latency and is reproducible by another developer.

Unresolved decisions: preferred cloud account/credits, region, monthly experiment ceiling, acceptable video wait, and expected active users. The interface phase can proceed without them. Final provisioning depends on these values and current quota availability.


