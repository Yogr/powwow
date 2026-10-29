from copy import deepcopy

from powwow.builder import experience_components
from powwow.builder_schemas import BuilderWorkspace
from powwow.project_details import DETAIL_CATEGORIES


def test_legacy_categories_preserve_every_value_and_identity():
    source = BuilderWorkspace(kind="game", components=["design", "tasks", *DETAIL_CATEGORIES],
        records={key: [{"id": "same-id", "title": "Saved entry", "fields": {
            "description": "Existing prose", "reference": "image-id", "custom_fact": "Never lose me",
            "source": "https://example.com/evidence", "role": "A role",
        }}] for key in DETAIL_CATEGORIES}).model_dump()
    migrated = experience_components(deepcopy(source))
    assert migrated["components"] == ["design", "tasks", "details"]
    assert len(migrated["detail_categories"]) == len(DETAIL_CATEGORIES)
    for key in DETAIL_CATEGORIES:
        record = migrated["records"][key][0]
        assert record["id"] == "same-id" and record["title"] == "Saved entry"
        assert record["fields"]["reference"] == "image-id"
        assert set(record["fields"]) == {"description", "reference"}
        for value in ("Existing prose", "Never lose me", "https://example.com/evidence", "A role"):
            assert value in record["fields"]["description"]
    assert experience_components(deepcopy(migrated)) == migrated
    assert source["records"]["characters"][0]["fields"]["role"] == "A role"


def test_custom_category_roundtrip_rename_conflict_and_removal(client, workspace):
    url = f"/v1/projects/{workspace[0]['id']}/workspace"
    initial = client.get(url).json()
    initial["workspace"].update(components=["details"], detail_categories=[{"id": "detail-props", "name": "Props"}],
        records={"detail-props": [{"id": "lantern", "title": "The lantern", "fields": {"description": "Brass", "reference": "existing-image"}}]})
    saved = client.put(url, json=initial)
    assert saved.status_code == 200, saved.text
    renamed = saved.json()
    renamed["workspace"]["detail_categories"][0]["name"] = "Important objects"
    assert client.put(url, json=renamed).status_code == 200
    assert client.put(url, json=renamed).status_code == 409
    loaded = client.get(url).json()
    assert loaded["workspace"]["records"]["detail-props"][0]["fields"]["reference"] == "existing-image"
    loaded["workspace"]["detail_categories"] = []
    loaded["workspace"]["records"] = {}
    assert client.put(url, json=loaded).status_code == 200
    assert client.get(url).json()["workspace"]["detail_categories"] == []


def test_categories_are_validated_and_project_scoped(client, workspace):
    url = f"/v1/projects/{workspace[0]['id']}/workspace"
    doc = client.get(url).json()
    doc["workspace"]["detail_categories"] = [{"id": "detail-a", "name": "Places"}, {"id": "detail-b", "name": "places"}]
    assert client.put(url, json=doc).status_code == 422
    doc["workspace"]["detail_categories"] = [{"id": "tasks", "name": "Places"}]
    assert client.put(url, json=doc).status_code == 422
    doc["workspace"]["detail_categories"] = []
    doc["workspace"]["records"] = {"detail-unknown": []}
    assert client.put(url, json=doc).status_code == 422
    other = client.post("/v1/projects", json={"name": "Other"}).json()
    assert client.get(f"/v1/projects/{other['id']}/workspace").json()["workspace"]["detail_categories"] == []
