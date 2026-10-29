import runpod
from runtime import generate

def handler(job):
    runpod.serverless.progress_update(job, {"stage": "loading_model"})
    result = generate(job["input"])
    runpod.serverless.progress_update(job, {"stage": "complete"})
    return result

if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})

