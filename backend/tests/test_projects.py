import uuid


def test_create_list_get_and_delete_project(client, auth_headers):
    created = client.post("/api/projects/", json={"name": "Biology", "description": "Cell notes"}, headers=auth_headers)
    assert created.status_code == 201
    project_id = created.json()["id"]
    assert created.json()["name"] == "Biology"

    listing = client.get("/api/projects/", headers=auth_headers)
    assert listing.status_code == 200
    assert [project["id"] for project in listing.json()] == [project_id]

    fetched = client.get(f"/api/projects/{project_id}", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["description"] == "Cell notes"

    deleted = client.delete(f"/api/projects/{project_id}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get(f"/api/projects/{project_id}", headers=auth_headers).status_code == 404


def test_users_cannot_access_each_others_projects(client, auth_headers):
    project = client.post("/api/projects/", json={"name": "Private"}, headers=auth_headers).json()
    other = client.post(
        "/api/auth/register",
        json={"username": "another_user", "email": "another@example.com", "password": "password123"},
    )
    login = client.post("/api/auth/login", data={"username": other.json()["email"], "password": "password123"})
    other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    assert client.get(f"/api/projects/{project['id']}", headers=other_headers).status_code == 404
    assert client.delete(f"/api/projects/{project['id']}", headers=other_headers).status_code == 404
    assert client.get("/api/projects/", headers=other_headers).json() == []


def test_projects_require_authentication(client):
    project_id = uuid.uuid4()
    assert client.post("/api/projects/", json={"name": "No token"}).status_code == 401
    assert client.get("/api/projects/").status_code == 401
    assert client.get(f"/api/projects/{project_id}").status_code == 401
    assert client.delete(f"/api/projects/{project_id}").status_code == 401
