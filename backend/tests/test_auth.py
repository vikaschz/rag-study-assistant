def test_register_returns_user_without_password_hash(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "study_user", "email": "study@example.com", "password": "password123"},
    )
    assert response.status_code == 201
    assert response.json()["username"] == "study_user"
    assert "hashed_password" not in response.json()


def test_register_normalizes_username_to_lowercase(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "Study_User", "email": "case@example.com", "password": "password123"},
    )
    assert response.status_code == 201
    assert response.json()["username"] == "study_user"


def test_duplicate_email_is_rejected(client):
    payload = {"username": "first_user", "email": "same@example.com", "password": "password123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    payload["username"] = "second_user"
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_duplicate_username_is_rejected(client):
    payload = {"username": "same_user", "email": "first@example.com", "password": "password123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    payload["email"] = "second@example.com"
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_duplicate_username_is_rejected_case_insensitively(client):
    first = client.post(
        "/api/auth/register",
        json={"username": "CaseSensitive", "email": "first-case@example.com", "password": "password123"},
    )
    second = client.post(
        "/api/auth/register",
        json={"username": "casesensitive", "email": "second-case@example.com", "password": "password123"},
    )
    assert first.status_code == 201
    assert second.status_code == 409


def test_login_and_current_user(client, registered_user):
    login = client.post(
        "/api/auth/login", data={"username": registered_user["email"], "password": "Correct-Horse-123"}
    )
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {login.json()['access_token']}"})
    assert me.status_code == 200
    assert me.json()["id"] == registered_user["id"]


def test_incorrect_password_is_rejected(client, registered_user):
    response = client.post(
        "/api/auth/login", data={"username": registered_user["email"], "password": "wrong-password"}
    )
    assert response.status_code == 401


def test_invalid_and_missing_jwt_are_rejected(client):
    assert client.get("/api/auth/me").status_code == 401
    invalid = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
    assert invalid.status_code == 401
