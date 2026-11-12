from app.core.security import hash_password, verify_password
from tests.conftest import register


def test_password_is_hashed_and_verifiable():
    hashed = hash_password("secret-pass")
    assert hashed != "secret-pass"
    assert verify_password("secret-pass", hashed)
    assert not verify_password("wrong", hashed)


def test_register_and_me(client):
    headers = register(client)
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "jane@example.com"
    assert "hashed_password" not in r.json()


def test_duplicate_email_rejected(client):
    register(client)
    r = client.post("/api/auth/register", json={"email": "JANE@example.com", "full_name": "J", "password": "password123"})
    assert r.status_code == 409


def test_weak_password_and_bad_email_rejected(client):
    assert client.post("/api/auth/register", json={"email": "a@b.com", "full_name": "A", "password": "short"}).status_code == 422
    assert client.post("/api/auth/register", json={"email": "nope", "full_name": "A", "password": "password123"}).status_code == 422


def test_login_success_and_failures(client):
    register(client)
    ok = client.post("/api/auth/login", json={"email": "jane@example.com", "password": "password123"})
    assert ok.status_code == 200 and ok.json()["access_token"]
    assert client.post("/api/auth/login", json={"email": "jane@example.com", "password": "bad-password"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "ghost@example.com", "password": "password123"}).status_code == 401


def test_protected_routes_require_valid_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/resumes", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_update_profile(client, auth):
    r = client.patch("/api/auth/me", headers=auth, json={"full_name": "Jane Updated"})
    assert r.status_code == 200 and r.json()["full_name"] == "Jane Updated"
