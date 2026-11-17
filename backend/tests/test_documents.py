import io
import uuid
import zipfile
from types import SimpleNamespace

import pytest
from sqlalchemy.orm import Session

from app.routers import documents as document_routes
from app.services import document_storage


@pytest.fixture
def storage_root(tmp_path, monkeypatch):
    root = tmp_path / "storage"
    monkeypatch.setattr(document_storage, "get_storage_root", lambda: root)
    return root


def make_office_file(kind: str) -> bytes:
    stream = io.BytesIO()
    main_entry = "word/document.xml" if kind == "docx" else "ppt/presentation.xml"
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
        archive.writestr(main_entry, "<document/>")
    return stream.getvalue()


def make_project(client, auth_headers):
    response = client.post("/api/projects/", json={"name": "Documents"}, headers=auth_headers)
    assert response.status_code == 201
    return response.json()


def upload(client, project_id, headers, filename, content):
    return client.post(
        f"/api/projects/{project_id}/documents/",
        files={"file": (filename, content, "application/octet-stream")},
        headers=headers,
    )


@pytest.mark.parametrize(
    ("filename", "content"),
    [
        ("notes.pdf", b"%PDF-1.7\nfixture"),
        ("notes.docx", make_office_file("docx")),
        ("slides.pptx", make_office_file("pptx")),
        ("notes.txt", "Study notes\n".encode()),
    ],
)
def test_upload_supported_documents(client, auth_headers, storage_root, filename, content):
    project = make_project(client, auth_headers)
    response = upload(client, project["id"], auth_headers, filename, content)

    assert response.status_code == 201
    document = response.json()
    assert document["original_filename"] == filename
    assert document["file_type"] == filename.rsplit(".", 1)[-1]
    assert document["file_size"] == len(content)
    assert document["processing_status"] == "uploaded"
    assert "file_path" not in document
    stored_paths = list((storage_root / "documents" / document["user_id"] / project["id"]).glob("*"))
    assert len(stored_paths) == 1
    assert stored_paths[0].is_file()
    assert stored_paths[0].name != filename


def test_rejects_unsupported_empty_malformed_and_binary_text(client, auth_headers, storage_root):
    project = make_project(client, auth_headers)
    for filename, content, expected_status in [
        ("script.exe", b"not allowed", 400),
        ("empty.txt", b"", 400),
        ("broken.pdf", b"not a PDF", 400),
        ("broken.docx", b"not a ZIP", 400),
        ("binary.txt", b"\x00\xff", 400),
    ]:
        response = upload(client, project["id"], auth_headers, filename, content)
        assert response.status_code == expected_status, response.text
    assert not [path for path in storage_root.rglob("*") if path.is_file()]


def test_rejects_oversized_document(client, auth_headers, storage_root, monkeypatch):
    project = make_project(client, auth_headers)
    monkeypatch.setattr(document_routes, "get_settings", lambda: SimpleNamespace(max_upload_size_mb=1))

    response = upload(client, project["id"], auth_headers, "large.txt", b"a" * (1024 * 1024 + 1))

    assert response.status_code == 413
    assert not [path for path in storage_root.rglob("*") if path.is_file()]


def test_upload_requires_authentication(client):
    response = client.post(
        f"/api/projects/{uuid.uuid4()}/documents/", files={"file": ("notes.txt", b"text")}
    )
    assert response.status_code == 401


def test_upload_to_another_users_project_is_hidden(client, auth_headers):
    project = make_project(client, auth_headers)
    second = client.post(
        "/api/auth/register",
        json={"username": "document_other", "email": "document_other@example.com", "password": "password123"},
    )
    token = client.post(
        "/api/auth/login", data={"username": second.json()["email"], "password": "password123"}
    ).json()["access_token"]

    response = upload(client, project["id"], {"Authorization": f"Bearer {token}"}, "notes.txt", b"text")
    assert response.status_code == 404


def test_list_and_get_documents_are_owner_scoped(client, auth_headers, storage_root):
    project = make_project(client, auth_headers)
    created = upload(client, project["id"], auth_headers, "private.txt", b"private text").json()

    listing = client.get(f"/api/projects/{project['id']}/documents/", headers=auth_headers)
    assert listing.status_code == 200
    assert [item["id"] for item in listing.json()] == [created["id"]]
    fetched = client.get(f"/api/documents/{created['id']}", headers=auth_headers)
    assert fetched.status_code == 200
    assert "file_path" not in fetched.json()

    second = client.post(
        "/api/auth/register",
        json={"username": "document_reader", "email": "document_reader@example.com", "password": "password123"},
    )
    token = client.post(
        "/api/auth/login", data={"username": second.json()["email"], "password": "password123"}
    ).json()["access_token"]
    other_headers = {"Authorization": f"Bearer {token}"}
    assert client.get(f"/api/documents/{created['id']}", headers=other_headers).status_code == 404
    assert client.get(f"/api/projects/{project['id']}/documents/", headers=other_headers).status_code == 404


def test_delete_document_and_missing_physical_file(client, auth_headers, storage_root):
    project = make_project(client, auth_headers)
    created = upload(client, project["id"], auth_headers, "delete.txt", b"delete me").json()
    stored = next((storage_root / "documents" / created["user_id"] / project["id"]).glob("*.txt"))

    assert client.delete(f"/api/documents/{created['id']}", headers=auth_headers).status_code == 204
    assert not stored.exists()
    assert client.get(f"/api/documents/{created['id']}", headers=auth_headers).status_code == 404

    missing = upload(client, project["id"], auth_headers, "missing.txt", b"file missing").json()
    stored_missing = next((storage_root / "documents" / missing["user_id"] / project["id"]).glob("*.txt"))
    stored_missing.unlink()
    assert client.delete(f"/api/documents/{missing['id']}", headers=auth_headers).status_code == 204


def test_database_failure_removes_saved_file(client, auth_headers, storage_root, monkeypatch):
    project = make_project(client, auth_headers)

    def fail_commit(self):
        raise RuntimeError("simulated database failure")

    monkeypatch.setattr(Session, "commit", fail_commit)
    response = upload(client, project["id"], auth_headers, "rollback.txt", b"cleanup this file")

    assert response.status_code == 500
    assert not [path for path in storage_root.rglob("*") if path.is_file()]


def test_deleting_project_removes_uploaded_files(client, auth_headers, storage_root):
    project = make_project(client, auth_headers)
    created = upload(client, project["id"], auth_headers, "project-file.txt", b"delete with project").json()
    stored = next((storage_root / "documents" / created["user_id"] / project["id"]).glob("*.txt"))

    response = client.delete(f"/api/projects/{project['id']}", headers=auth_headers)

    assert response.status_code == 204
    assert not stored.exists()
    assert not [path for path in storage_root.rglob("*") if path.is_file()]
