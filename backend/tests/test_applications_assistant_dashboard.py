from tests.conftest import create_job, upload


def make_app(client, headers, **extra):
    body = {"company": "Acme", "position": "Backend Engineer", **extra}
    return client.post("/api/applications", headers=headers, json=body)


def test_application_lifecycle_and_filter(client, auth):
    a = make_app(client, auth, note="Referred by a friend").json()
    assert a["status"] == "applied" and a["notes"][0]["content"] == "Referred by a friend"
    make_app(client, auth, company="Globex", status="interview")

    r = client.patch(f"/api/applications/{a['id']}", headers=auth,
                     json={"status": "interview", "interview_date": "2026-12-01T10:00:00Z"})
    assert r.status_code == 200 and r.json()["status"] == "interview" and r.json()["interview_date"]

    assert len(client.get("/api/applications", headers=auth).json()) == 2
    assert len(client.get("/api/applications?status=interview", headers=auth).json()) == 2
    assert client.get("/api/applications?status=offered", headers=auth).json() == []
    assert client.get("/api/applications?status=bogus", headers=auth).status_code == 422

    n = client.post(f"/api/applications/{a['id']}/notes", headers=auth, json={"content": "Round 1 done"})
    assert n.status_code == 201 and len(n.json()["notes"]) == 2
    note_id = n.json()["notes"][0]["id"]
    assert client.delete(f"/api/applications/{a['id']}/notes/{note_id}", headers=auth).status_code == 204
    assert client.delete(f"/api/applications/{a['id']}", headers=auth).status_code == 204


def test_application_ownership(client, auth, other_auth):
    aid = make_app(client, auth).json()["id"]
    assert client.patch(f"/api/applications/{aid}", headers=other_auth, json={"status": "offered"}).status_code == 404
    assert client.delete(f"/api/applications/{aid}", headers=other_auth).status_code == 404
    assert client.post(f"/api/applications/{aid}/notes", headers=other_auth, json={"content": "x"}).status_code == 404
    foreign_job = create_job(client, auth).json()["id"]
    assert make_app(client, other_auth, job_id=foreign_job).status_code == 404


def test_assistant_chat_uses_tools_and_checks_ownership(client, auth, other_auth, mock_llm):
    rid = upload(client, auth).json()["id"]
    jid = create_job(client, auth).json()["id"]
    r = client.post("/api/assistant/chat", headers=auth, json={
        "resume_id": rid, "job_id": jid, "message": "Why is Docker missing?",
        "history": [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]})
    assert r.status_code == 200
    assert r.json()["reply"] == "Mock assistant reply." and r.json()["tools_used"]
    assert "FastAPI" in mock_llm.last_chat_args["system"]  # resume passed as context
    assert "never invent" in mock_llm.last_chat_args["system"].lower()
    assert mock_llm.last_chat_args["messages"][-1]["content"] == "Why is Docker missing?"

    stolen = client.post("/api/assistant/chat", headers=other_auth, json={"resume_id": rid, "message": "hi"})
    assert stolen.status_code == 404


def test_assistant_rejects_bad_input(client, auth):
    assert client.post("/api/assistant/chat", headers=auth, json={"resume_id": 1, "message": ""}).status_code == 422


def test_dashboard_summary(client, auth):
    empty = client.get("/api/dashboard/summary", headers=auth).json()
    assert empty["total_resumes"] == 0 and empty["average_match_score"] is None

    rid = upload(client, auth).json()["id"]
    jid = create_job(client, auth).json()["id"]
    client.post("/api/analysis/analyze", headers=auth, json={"resume_id": rid, "job_id": jid})
    make_app(client, auth, status="shortlisted")
    s = client.get("/api/dashboard/summary", headers=auth).json()
    assert s["total_resumes"] == 1 and s["total_jobs"] == 1 and s["total_analyses"] == 1
    assert s["average_match_score"] == 72.0
    assert s["applications_by_status"]["shortlisted"] == 1
    assert len(s["recent_analyses"]) == 1


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}
