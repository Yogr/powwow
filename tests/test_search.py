import httpx
import pytest
from powwow.search import SearchUnavailable, search_instructions, web_search, wikipedia_query


def test_wikipedia_lookup_bounds_sources_and_uses_fixed_host():
    def handler(request):
        assert request.url.host == "en.wikipedia.org"
        assert len(request.url.params['gsrsearch']) == 200
        return httpx.Response(200, json={"query": {"pages": {"1": {"pageid": 1, "title": "Ceramic", "extract": "Clay materials", "fullurl": "https://en.wikipedia.org/wiki/Ceramic", "index": 1}}}})
    with httpx.Client(transport=httpx.MockTransport(handler)) as client:
        sources = web_search('x' * 500, client=client)
    assert sources[0]['content'] == 'Clay materials'
    assert sources[0]['search_provider'] == 'Wikipedia'
    assert 'Wikipedia-only' in search_instructions(sources)


def test_lookup_failure_is_not_a_fake_result():
    with httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(429))) as client:
        with pytest.raises(SearchUnavailable):
            web_search('ceramics', client=client)


def test_natural_question_removes_output_instructions_from_encyclopedia_query():
    assert wikipedia_query('What is ceramic material? Use the available sources, keep the answer brief, and cite a source link.') == 'ceramic material'


def test_brave_filters_non_https_results():
    body = {"web": {"results": [{"url": "javascript:alert(1)", "title": "bad"}, {"url": "https://example.org/article", "title": "Valid", "description": "Excerpt"}]}}
    with httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(200, json=body))) as client:
        sources = web_search('ceramic', 'test-key', client)
    assert len(sources) == 1
    assert sources[0]['url'] == 'https://example.org/article'
