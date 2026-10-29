"""One explicit GPT Image submission. No retries, fallback, or prompt rewriting."""
import base64
import time

import httpx

from .config import settings
from .hosted_chat import rejection
from .providers import Cancelled, ProviderFailure


def generate(prompt, transparent, references, request_id, cancelled, submitted):
    cfg = settings()
    if not cfg.openai_api_key.get_secret_value():
        raise ProviderFailure('provider_unavailable', 'Connect OpenAI on the server to create images.')
    if cancelled():
        raise Cancelled()
    body = {'model': cfg.openai_image_model, 'prompt': prompt, 'n': 1, 'size': '1024x1024',
            'quality': 'high', 'output_format': 'png', 'background': 'transparent' if transparent else 'auto'}
    headers = {'Authorization': 'Bearer ' + cfg.openai_api_key.get_secret_value(), 'X-Client-Request-Id': request_id}
    files = [('image[]', (name, data, mime)) for name, data, mime in references]
    submitted()
    start = time.monotonic()
    try:
        with httpx.Client(timeout=httpx.Timeout(600, connect=15)) as client:
            if files:
                response = client.post('https://api.openai.com/v1/images/edits', headers=headers,
                                       data={k: str(v) for k, v in body.items()}, files=files)
            else:
                response = client.post('https://api.openai.com/v1/images/generations', headers=headers, json=body)
    except (httpx.TimeoutException, httpx.TransportError) as exc:
        raise ProviderFailure('submission_uncertain', 'The image submission cannot be confirmed. It will not be repeated automatically.') from exc
    if not response.is_success:
        if response.status_code not in {400, 401, 403, 404, 413, 422, 429}:
            raise ProviderFailure('submission_uncertain', 'The image service returned a server error. Review the request before retrying.')
        raise rejection(response)
    try:
        value = response.json()
        usage = value['usage']
        inputs, outputs = usage['input_tokens'], usage['output_tokens']
        if type(inputs) is not int or type(outputs) is not int or min(inputs, outputs) < 0:
            raise ValueError('Invalid usage')
        # Conservatively price every input token at the higher image rate.
        # Official Sunburst rates checked 2026-10-10: text 5, image 8, output 30 / 1M.
        cost = round((inputs * 8 + outputs * 30) / 1_000_000, 6)
        data = base64.b64decode(value['data'][0]['b64_json'], validate=True)
        if len(value['data']) != 1 or not data:
            raise ValueError('Expected one image')
    except (ValueError, KeyError, TypeError, IndexError) as exc:
        raise ProviderFailure('submission_uncertain', 'The image response has incomplete output or billing details. Review it before retrying.') from exc
    return data, {'model': cfg.openai_image_model, 'provider': 'openai', 'quality': 'high',
                  'background': body['background'], 'request_id': request_id,
                  'usage': usage, 'cost_estimate_usd': cost, 'seconds': round(time.monotonic() - start, 3),
                  'pricing_version': 'gpt-image-sunburst-2026-10-10', 'qualification': 'candidate'}
