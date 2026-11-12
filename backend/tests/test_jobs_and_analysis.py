from app.ai.providers.mock_provider import DEFAULT_ANALYSIS, MockLLMProvider
from app.core.exceptions import AIServiceError
from app.ai.factory import get_llm_provider
from app.main import app
from tests.conftest import create_job, upload


def setup_pair(client, headers):
    rid = upload(client, headers).json()["id"]
    jid = create_job(client, headers).json()["id"]
    return rid, jid


def test_job_crud_and_validation(client, auth, other_auth):
    r = create_job(client, auth)
    assert r.status_code == 201
    jid = r.json()["id"]
    assert client.post("/api/jobs", headers=auth, json={"title": "x", "company": "y", "description": "short"}).status_code == 422
    assert len(client.get("/api/jobs", headers=auth).json()) == 1
    assert client.get(f"/api/jobs/{jid}", headers=other_auth).status_code == 404
    assert client.delete(f"/api/jobs/{jid}", headers=auth).status_code == 204


def test_analyze_saves_structured_result(client, auth):
    rid, jid = setup_pair(client, auth)
    r = client.post("/api/analysis/analyze", headers=auth, json={"resume_id": rid, "job_id": jid})
    assert r.status_code == 201
    body = r.json()
    assert body["match_score"] == 72
    assert body["result"]["missing_skills"] == ["Docker", "AWS"]
    assert "estimate" in body["disclaimer"]
    assert body["model_name"] == "mock-model"
    history = client.get("/api/analysis/history", headers=auth).json()
    assert len(history) == 1 and history[0]["company"] == "Acme"
    assert client.get(f"/api/analysis/{body['id']}", headers=auth).status_code == 200


def test_analyze_requires_ownership_of_both_resources(client, auth, other_auth):
    rid, jid = setup_pair(client, auth)
    r = client.post("/api/analysis/analyze", headers=other_auth, json={"resume_id": rid, "job_id": jid})
    assert r.status_code == 404
    other_job = create_job(client, other_auth).json()["id"]
    r = client.post("/api/analysis/analyze", headers=other_auth, json={"resume_id": rid, "job_id": other_job})
    assert r.status_code == 404


def test_invalid_llm_json_is_retried_then_succeeds(client, auth):
    llm = MockLLMProvider(json_responses=[{"match_score": 500}, DEFAULT_ANALYSIS])
    app.dependency_overrides[get_llm_provider] = lambda: llm
    rid, jid = setup_pair(client, auth)
    r = client.post("/api/analysis/analyze", headers=auth, json={"resume_id": rid, "job_id": jid})
    assert r.status_code == 201 and llm.json_calls == 2


def test_persistently_invalid_llm_output_returns_502(client, auth):
    llm = MockLLMProvider(json_responses=[{"match_score": 500}])
    app.dependency_overrides[get_llm_provider] = lambda: llm
    rid, jid = setup_pair(client, auth)
    r = client.post("/api/analysis/analyze", headers=auth, json={"resume_id": rid, "job_id": jid})
    assert r.status_code == 502
    assert client.get("/api/analysis/history", headers=auth).json() == []


def test_llm_outage_returns_502(client, auth):
    llm = MockLLMProvider(json_responses=[AIServiceError("down")])
    app.dependency_overrides[get_llm_provider] = lambda: llm
    rid, jid = setup_pair(client, auth)
    assert client.post("/api/analysis/analyze", headers=auth, json={"resume_id": rid, "job_id": jid}).status_code == 502


def test_delete_analysis_and_isolation(client, auth, other_auth):
    rid, jid = setup_pair(client, auth)
    aid = client.post("/api/analysis/analyze", headers=auth, json={"resume_id": rid, "job_id": jid}).json()["id"]
    assert client.get(f"/api/analysis/{aid}", headers=other_auth).status_code == 404
    assert client.delete(f"/api/analysis/{aid}", headers=other_auth).status_code == 404
    assert client.delete(f"/api/analysis/{aid}", headers=auth).status_code == 204


def test_deleting_resume_removes_its_analyses(client, auth):
    rid, jid = setup_pair(client, auth)
    client.post("/api/analysis/analyze", headers=auth, json={"resume_id": rid, "job_id": jid})
    client.delete(f"/api/resumes/{rid}", headers=auth)
    assert client.get("/api/analysis/history", headers=auth).json() == []


def test_extract_json_helper():
    from app.ai.base import extract_json
    assert extract_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert extract_json('Here you go: {"a": 2} thanks') == {"a": 2}
    try:
        extract_json("no json here")
    except AIServiceError:
        pass
    else:
        raise AssertionError("expected AIServiceError")
