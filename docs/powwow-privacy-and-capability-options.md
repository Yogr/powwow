# Powwow: private peer inference and local model capability

> **Scope update, September 30, 2026:** Peer privacy research is deferred while the [current PoC](../README.md) builds the interface and generation workflows on Powwow-managed cloud hardware. This document remains background research rather than a prerequisite for the first build.

Research date: September 27, 2026. This extends the [initial architecture](powwow-feasibility-and-design.md). It distinguishes documented capabilities, research results, and proposed experiments. No cryptographic inference implementation, hardware security assessment, or model benchmark was performed for this report.

## 1. Decision summary

Customer confidentiality should be a release requirement for private peer inference. An ordinary encrypted connection to an ordinary consumer GPU cannot meet it against a malicious host administrator.

There are genuine alternatives:

| Route | Privacy mechanism | Existing consumer GPUs | Principal limitation |
|---|---|---|---|
| Confidential computing | Hardware isolates the executing workload from the host | Ordinary GeForce cards are not in the documented supported stack | Qualified platforms; vendor/firmware trust; physical-attack exclusions |
| Secure multiparty computation (MPC) | Several parties compute using cryptographic shares | Potentially usable | Protocol-specific corruption threshold, communication, repeated computation, malicious-security requirements |
| Fully homomorphic encryption (FHE) | Workers calculate on ciphertext; client retains decryption key | Possible with suitable resources and implementation | Large computation and memory overhead; model-specific compilation and validation |
| Trusted processor plus protected GPU outsourcing | Trusted side masks intermediate computations and retains sensitive operations | Potentially usable | Trusted preprocessing, online work, network round trips, whole-transformer security |
| Contracted ordinary providers | Organizational controls and accountability | Yes | Provider remains technically capable of reading content |
| Own-device processing | Keep execution within the customer's chosen devices | Yes | Depends on customer hardware and endpoint security |

The first four have different engineering and security assumptions. The last two are different trust arrangements. Do not label all of them as the same privacy guarantee.

I found no demonstrated, deployable system that simultaneously provides unrestricted consumer-device enrollment for every private task, protection against arbitrary malicious operators, frontier-model interactive quality, and the lowest market cost. This is a statement about the evidence reviewed, not a claim of mathematical impossibility.

## 2. Specify the guarantee before choosing technology

### Proposed private-processing promise

Customer content includes prompts, attachments, outputs, embeddings, intermediate activations, KV caches, and tool results. A public hardware provider must not receive recoverable content outside the selected protected protocol. The customer should also be able to choose whether Powwow itself is trusted with plaintext.

Specify these separate properties:

- **Confidentiality:** which parties can learn content, and under what assumptions?
- **Integrity:** can a provider silently substitute a model, change an answer, or forge work?
- **Availability:** can a provider interrupt or delay the request? Encryption cannot make an unwilling machine execute.
- **Metadata:** what is revealed by model choice, payload size, timing, source IP, token count, or routing? Padding and relays reduce some leakage at added cost.
- **Retention:** which systems can retain data, and whose deletion behavior is technically enforceable?
- **Action authority:** what happens when a result proposes sending a message, running code, or changing an external resource?

A malicious operator may control the OS, hypervisor, network, storage, and multiple apparent worker identities. A stronger attacker may open the machine, probe buses, modify components, or exploit side channels. These are different threat models and must not be conflated.

The ordinary cloud trust relationship places trust in an accountable service operator and its controls. A public peer network replaces part of that organizational trust with hardware enforcement, cryptographic protocols, or explicitly qualified providers.

## 3. Confidential computing: strongest practical starting point for normal-speed inference

The computation can use plaintext internally while hardware prevents the surrounding host administrator from reading protected state. A confidential CPU VM must have a protected connection to a compatible confidential GPU; shielding only the CPU is insufficient.

NVIDIA's current reference matrix includes H100/H200, B200, HGX B300, and RTX PRO 6000 Blackwell **Server Edition**, with specified AMD SEV-SNP or Intel TDX CPU platforms. It does not list GeForce RTX 5090 or the RTX PRO Workstation Edition. A documented single-GPU configuration exists, but the complete CPU, motherboard, firmware, and software platform must qualify. [Supported platforms](https://docs.nvidia.com/datacenter/cloud-native/confidential-containers/latest/supported-platforms.html)

Decentralized ownership is compatible with this mechanism. Intel describes a Targon architecture combining independent providers, TDX, GPU confidential computing, attestation, and key release. This establishes an architectural precedent, not a security audit of Powwow or a promise about arbitrary home hardware. [Intel architecture article](https://community.intel.com/t5/Blogs/Products-and-Solutions/Security/Decentralized-Compute-on-Untrusted-Hardware-Using-Intel-TDX-and/post/1741192)

### Proposed Powwow request flow

1. Worker starts the approved confidential environment and supported model runtime.
2. The verifier sends a fresh challenge and checks CPU and GPU evidence, security versions, non-debug state, and approved workload measurements.
3. An ephemeral session key is bound to that verified workload. A genuine device certificate alone is insufficient.
4. The client releases encrypted customer input only to that endpoint.
5. Tokenization, inference, temporary storage, and output encryption remain within the protected boundary.
6. Logs and metrics exclude content. Outbound access is restricted. MCP credentials remain at the customer's trusted gateway.
7. Firmware/image revocation and expired evidence cause rejection. Private jobs never silently fall back to ordinary plaintext workers.

Use audited code, reproducible builds where possible, transparent approved-version records, and independently reviewable verification policies. These controls are part of the proposed design; attestation alone does not prove that approved application code behaves safely. [NVIDIA attestation concepts](https://docs.nvidia.com/datacenter/cloud-native/confidential-containers/latest/attestation.html)

### Limits that matter for a residential network

NVIDIA's self-hosted threat model protects against ordinary privileged inspection but excludes physical attacks, side channels, vulnerable/malicious guest applications, and compromised key-release administration. The host can still stop the machine. [Published threat model](https://docs.nvidia.com/enterprise-reference-architectures/deploying-proprietary-models-confidential-compute-self-hosted-vms/latest/trust-and-threat-model.html)

This boundary has concrete consequences: AMD's September 14, 2026 bulletin describes physical DDR5 fault injection affecting SEV-SNP and classifies it outside the published physical-security scope. It is not evidence that every confidential platform is broken, but it prevents an unconditional guarantee against physically malicious owners. [AMD bulletin](https://www.amd.com/en/resources/product-security/bulletin/amd-sb-3048.html)

For stronger assurance, qualify operators and physical environments in addition to attestation, or use an appropriate cryptographic route. The public pool necessarily becomes smaller for this class of job. NVIDIA also states that its confidential-computing capability requires a production license; include those terms in economics. [Licensing](https://docs.nvidia.com/datacenter/cloud-native/confidential-containers/latest/licensing.html)

## 4. Secure multiparty computation: a route for ordinary GPUs

MPC divides sensitive numbers into randomized shares and evaluates a computation while preserving the protocol's privacy properties. These are not pieces of English text. Each party's permitted view reveals no protected input beyond the protocol's stated leakage and corruption assumptions.

For an illustrative two-party additive sharing scheme, neither share identifies the secret by itself, while both together reconstruct it. Other schemes have different thresholds. Choose a published protocol and its security model rather than assuming that any set of two or three peers is safe.

Key design questions:

- How many parties may collude? Can one operator register all of them?
- Does the protocol resist malicious deviations, or only parties who execute it correctly while observing data?
- Who creates preprocessing material, and can it be reused safely?
- How many network rounds and transferred bytes are needed per generated token?
- What happens if a party disconnects while holding live shares or cache state?
- Are model routing and memory-access patterns also protected?

Open model weights can make the problem easier than protecting both customer inputs and proprietary model weights. Some linear operations can be performed locally on shares. Attention, normalization, nonlinear functions, comparisons, and output selection still need appropriate secure treatment.

A published MPC characterization distinguishes these public-weight and secret-weight costs. SIGMA provides an example of GPU-accelerated secure inference whose online performance relies on a semi-honest protocol and a trusted preprocessing dealer. That preprocessing must be included in Powwow's capacity and cost accounting. [MPC characterization](https://bearhw.ece.vt.edu/content/dam/bearhw_ece_vt_edu/publications/2022_ispass_mpc.pdf), [SIGMA](https://petsymposium.org/popets/2024/popets-2024-0107.pdf)

### Proposed research topology

Start with two GPU participants: one under the customer's control and one remote provider, or independently controlled qualified providers under an explicit non-collusion assumption. Keeping a customer-controlled party avoids relying only on anonymous account diversity, but requires customer-side computation and availability. Test a malicious-secure implementation rather than assuming performance-oriented semi-honest code meets the launch threat model.

Expand to independent provider groups only after specifying collusion resistance, identity controls, and recovery. Geography and IP addresses do not prove independent ownership.

## 5. Fully homomorphic encryption: the most direct cryptographic answer

FHE allows supported arithmetic to operate on ciphertext. The worker need not receive a decryption key. Customer content can remain encrypted even if the operator copies its RAM and storage. This directly addresses the original memory-inspection concern.

The difficulty is efficient inference: encrypted arithmetic, large ciphertexts, precision management, nonlinear approximations, and repeated token generation add substantial work. The encrypted implementation must be evaluated for both security and output quality. FHE confidentiality alone does not prove the worker calculated the correct result; authenticated protocol handling and appropriate integrity checks are separate requirements.

The cited Cachemir protocol assumes semi-honest participants. A complete deployment must also prevent malicious responses and client feedback from becoming decryption oracles. Message authentication alone does not verify the computation.

### What the research evidence actually shows

- **Scaling up Privacy-Preserving ML (January 2026):** Llama-2-7B using eight RTX 4090s in one server. The paper reports 85 seconds for prefill and 33 seconds per generated token, but its methodology estimates full-model timings from measured blocks. Only the final 128 of 4,096 input tokens are encrypted. This is not an all-private long prompt on internet peers. [Paper](https://arxiv.org/html/2601.18511v1)
- **Cachemir (February 2026):** encrypted Llama-3-8B generation with reported sub-100-second token latency on A100-class hardware. Its evaluation assumptions and component-derived timings require scrutiny before treating them as a product benchmark. [Paper](https://arxiv.org/html/2602.11470v1)

These results demonstrate progress and consumer-GPU relevance. They do not establish cheap, interactive frontier inference on a broad residential network. Published workload limitations must remain attached to performance claims.

A sensible early experiment is a small, fixed-output task where a high privacy value can justify latency. That is a different initial market from a general chat replacement. Actual FHE worker eligibility also depends on ciphertext memory, supported kernels, and communication, not just whether a GPU can run the plaintext model.

## 6. Trusted processing plus private GPU outsourcing

This is the most directly relevant research direction if using existing consumer GPUs remains essential.

For a linear layer with public weights W, use suitable fixed-point encoding and fresh, single-use masks over a finite field or ring. A trusted processor selects a secret mask r, sends x+r to an untrusted GPU, receives W(x+r), and subtracts the precomputed Wr. A correctly implemented protocol handles arithmetic, randomness, and result verification; ordinary floating-point noise and this expression alone are not a secure implementation.

Slalom demonstrates this principle with trusted execution and an untrusted nearby GPU. Its original method calculates the unmasking material on the trusted side ahead of time, uses fresh masks, and keeps nonlinear steps trusted. Its evaluated workloads were CNNs, not modern autoregressive LLMs over home internet. [Slalom paper](https://arxiv.org/html/1806.03287v2)

The trusted controller could be the customer's own device. If it resides with an untrusted provider, it needs its own protected execution mechanism. Secure outsourcing of preprocessing is an additional research problem, rather than permission to disclose masks to a GPU that also sees the masked inputs. [Slalom at the Carnival](https://research.uni-luebeck.de/en/publications/slalom-at-the-carnival-privacy-preserving-inference-with-masks-fr/)

The engineering questions for Powwow are substantial:

- The original protocol computes Wr on the trusted side, itself a substantial matrix multiplication. Preprocessing shifts that work away from request latency without removing its compute, energy, or storage cost.
- Sending both the mask and masked data to the same adversary defeats the protection.
- Reusing masks or leaking intermediate state can break the security argument.
- Attention contains operations on input-dependent values, not only multiplication by fixed public weights.
- Secure checks must detect forged computations without creating a decryption oracle.
- Many exchanges per layer can make WAN latency dominate.

A September 2026 preprint, SpliTEE, studies a CPU TEE with a 32 GB untrusted GPU for small LLMs, co-located on one physical server. Its GPU privacy mechanism uses differential privacy and its evaluation assumes a semi-honest GPU. Those properties differ from cryptographic confidentiality against arbitrary hostile internet peers. Treat it as research evidence for partitioning, not a ready security guarantee. [SpliTEE](https://arxiv.org/html/2609.15039v1)

## 7. Approaches that do not establish the required guarantee

| Approach | What remains exposed |
|---|---|
| TLS, encrypted disks, ordinary VM or container | Content during ordinary host-controlled execution |
| TPM or secure boot by themselves | The unprotected GPU execution path |
| Splitting model layers across peers | Intermediate values may reveal prompts and outputs |
| Sending embeddings instead of text | Numerical representations may be inverted or analyzed |
| Removing names | Context and task details may identify people or reveal secrets |
| Rotating, shuffling, or adding ad hoc noise | No confidentiality proof follows from the data looking unfamiliar |
| Blockchain, receipts, deposits, or reputation | Accountability or incentives do not prevent copying plaintext |
| A proof of correct computation by itself | The prover may still have seen the input |

Split-inference research demonstrates reconstruction of private data from intermediate representations. Do not turn an empirical reduction in an attack's success rate into a promise of no disclosure. [Activation leakage research](https://arxiv.org/abs/2605.23158)

Differential privacy is useful under a precisely defined privacy unit and budget. It is not interchangeable with encryption of an arbitrary exact customer request. Its utility/privacy tradeoff must be evaluated for the proposed service.

## 8. RTX 5090 versus a frontier AI service

### Same model, same computation

If the complete model, numerical behavior, context, instructions, tools, and inference budget were equivalent, consumer hardware could in principle deliver comparable capability. It might take much longer. Floating-point ordering and sampling mean individual responses need not match exactly.

GPU hardware does not contribute additional learned knowledge. It determines which workload fits, how quickly it executes, and how many requests can run at once. Models exceeding VRAM can sometimes be offloaded to CPU RAM or storage, preserving the model while trading speed for capacity. [Big Model Inference](https://huggingface.co/docs/accelerate/main/en/usage_guides/big_modeling)

### What is known about GPT-6 Astra

The current official documentation describes Astra's capabilities, context window, reasoning options, and hosted tools. It does not establish downloadable weights, a parameter count, or a hardware requirement for local deployment. Therefore this report does not claim Astra fits on a 5090, requires a particular number of GPUs, or has a known percentage advantage over a local model. [Astra model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra)

Reasoning effort also changes the work performed before the final answer. Matching only the visible output length would not ensure an equivalent inference budget. [OpenAI reasoning guide](https://developers.openai.com/api/docs/guides/reasoning)

### Memory is a major practical limit

Idealized weights-only storage, decimal GB:

| Parameters | 16-bit | 4-bit |
|---|---:|---:|
| 8 billion | 16 GB | 4 GB |
| 32 billion | 64 GB | 16 GB |
| 70 billion | 140 GB | 35 GB |

Formula: parameter count multiplied by bits per parameter, divided by eight. Quantization metadata, mixed-precision tensors, temporary buffers, encoders, and context state are additional. These rows are illustrative models, not estimates of Astra's size.

Qwen's official Qwen3-32B Q4_K_M artifact is 19.8 GB, while Q8_0 is 34.8 GB. A suitable four-bit configuration can leave room on a 32 GB GPU; its context and concurrency are still bounded. [Official artifacts](https://huggingface.co/Qwen/Qwen3-32B-GGUF/tree/main)

Quantization can affect quality. A model's advertised context window does not mean that full context fits on every supported device. KV cache memory often grows with context and concurrent sequences; exact growth depends on architecture. [Quantization explanation](https://huggingface.co/docs/transformers/quantization/concept_guide), [Cache strategies](https://huggingface.co/docs/transformers/main/en/kv_cache)

Mixture-of-experts active parameter counts do not equal total model storage. DeepSeek-R1 documents 671B total parameters and 37B active per token; all required experts still have to remain available somewhere. [Model card](https://huggingface.co/deepseek-ai/DeepSeek-R1)

### Why larger infrastructure helps

RTX 5090 provides 32 GB and no NVLink. An H200 example provides 141 GB and high-bandwidth NVLink, allowing tightly connected multi-GPU systems to support larger working sets. This is an illustrative hardware comparison, not a claim about OpenAI's deployment. [RTX 5090](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/), [H200](https://www.nvidia.com/en-us/data-center/h200/)

A frontier service's advantage can come from stronger training and post-training, larger or better architectures, sufficient memory for the intended precision/context, greater inference budgets, and integrated tools. More GPUs do not automatically improve the answer: the system must use them for a larger model or productive additional work.

Consumer GPUs can produce high-quality results on selected tasks. For example, current open model cards document substantial coding/reasoning capabilities, but their benchmark conditions may involve particular scaffolds and long budgets. They do not prove that a quantized single-card configuration matches Astra generally. [Example: Qwen3.6-27B](https://huggingface.co/Qwen/Qwen3.6-27B)

## 9. Bottlenecks and cost controls

| Bottleneck | Consequence | Useful response |
|---|---|---|
| Model quality | More speed cannot supply missing learned capability | Evaluate several models on actual tasks |
| VRAM | Limits weights, context, batch, and modality components | Quantize carefully; choose fitting recipes; use local clusters where justified |
| Compute and memory bandwidth | Limits prefill, decoding, and media speed | Optimized kernels, power/performance tuning, workload-specific measurement |
| Internet latency and bandwidth | Hurts repeated distributed exchanges | Complete-job routing; nearby secure-computation groups; measure WAN protocol costs |
| Cold models | Downloads/loading overwhelm short jobs | Keep popular compatible models warm and use placement informed by caches |
| Privacy protocol overhead | More computation, memory, transfers, or qualified hardware | Measure cost for the exact privacy guarantee |
| Low utilization | Insufficient paid work for enrolled devices | Grow supply with demand; distinguish availability from paid usage |
| Failure and verification | More work per accepted output | Stable providers, bounded retries, task-specific audits |

Batching can lower cost per result but needs memory and may increase waiting time. Longer reasoning and more samples can improve some results but consume additional resources; small-model ensembles do not automatically recover frontier capability.

## 10. The 20-GPU earnings example

Illustrative assumptions, not current equipment quotes or income forecasts:

- 20 GPUs, $2,000 each: $40,000 GPU-only capital.
- Paid work 50% of the year, with machines powered on throughout.
- Per-GPU allocation of 650 W active system draw and 50 W idle.
- Electricity at $0.18/kWh.
- Payout rate is the contributor's receipt after Powwow's fee.
- Excludes host purchases, cooling, maintenance, networking, taxes, financing, and other costs.

| Payout per paid GPU-hour | Annual cash after assumed electricity, all 20 | GPU-only payback |
|---|---:|---:|
| $0.20 | $6,482 | 6.17 years |
| $0.30 | $15,242 | 2.62 years |
| $0.40 | $24,002 | 1.67 years |

Under these assumptions, 18-month GPU-only payback needs about $0.43 per paid hour and 12-month payback about $0.58. At 80% paid utilization, those thresholds fall to roughly $0.31 and $0.40 respectively. At 25%, they rise to about $0.75 and $1.06. Other costs raise all thresholds.

Formula per GPU:

```text
annual cash = 8760 * [u * (p - active_kW * electricity_rate)
                     - (1-u) * idle_kW * electricity_rate]
payback years = GPU capital / annual cash
```

The 5090's specified total graphics power is 575 W, but actual inference draw and system overhead require measurement; the scenario's 650 W is an assumption. Existing idle hardware and newly purchased dedicated hardware have different economics. Millions of registered GPUs do not create customer demand by themselves.

## 11. Recommended decision and experiments

### Near-term product route

Use qualified confidential-compute providers for private remote inference, with an explicit published threat model and operator requirements appropriate to physical risk. Keep own-device processing available. Ordinary consumer providers can participate only in jobs whose privacy requirements their execution path meets.

This establishes a product path, but it does narrow the hardware available for ordinary private inference. Do not pretend otherwise.

### Research route for the full consumer-hardware vision

Compare a malicious-secure MPC design and trusted-processor GPU outsourcing against an FHE baseline. Use public model weights and a bounded, fixed task first. Retain the same quality target across implementations, including any changed activations or numerical precision.

Measure:

- Whole-request latency, first-output latency, throughput, and cost per accepted result.
- Actual client/anchor computation, preprocessing, total device-hours, energy, and peak memory.
- Bytes and rounds across 20/50/100 ms links; do not extrapolate a local-server benchmark to a WAN.
- Single-request latency separately from amortized batch throughput.
- Security against the defined number of colluding and actively malicious providers.
- Recovery after disconnects without unsafe reuse of shares or masks.
- Privacy of outputs, caches, intermediates, and metadata as well as the original prompt.

Before a public privacy claim, require a protocol security argument, a carefully scoped implementation, independent specialist review, and end-to-end checks of logging, keys, routing, retries, and tool execution. Performance tests alone cannot establish confidentiality.

### Model capability experiment

Use the same representative tasks, permitted tools, output requirements, and cost/time limits for a local quantized model and the hosted Astra service. Include long context, coding with tests, tool use, and difficult reasoning. Report task success, user-rated quality, latency, and cost; avoid a single invented percentage of frontier capability.

### Decision rule

If unrestricted existing consumer GPUs are essential, private peer inference is a research-led product with unresolved cost and performance. If qualified distributed hardware is acceptable, confidential inference offers a nearer path with explicit assumptions. Both can use the same application, catalog, and job orchestration, but their privacy guarantees must remain distinguishable.
