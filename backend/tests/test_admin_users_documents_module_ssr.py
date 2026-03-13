import os
import uuid

import pytest
import requests
from dotenv import dotenv_values


def _load_base_url() -> str:
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    if not base_url:
        base_url = dotenv_values("/app/frontend/.env").get("REACT_APP_BACKEND_URL")
    if not base_url:
        pytest.skip("REACT_APP_BACKEND_URL is not configured", allow_module_level=True)
    return str(base_url).rstrip("/")


BASE_URL = _load_base_url()
ADMIN_EMAIL = "florence.levot@nexus-conseil.ch"
ADMIN_PASSWORD = "Greeters&58!"


@pytest.fixture
def api_client():
    return requests.Session()


@pytest.fixture
def admin_client(api_client):
    # Module: admin login/session bootstrapping for users/documents APIs
    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=60,
    )
    assert login_response.status_code == 200
    payload = login_response.json()
    assert payload.get("user", {}).get("email") == ADMIN_EMAIL
    return api_client


def test_admin_shell_dashboard_and_chatbot_page_load(admin_client):
    # Module: redesigned shell + sidebar routes smoke check
    dashboard_response = admin_client.get(f"{BASE_URL}/admin", timeout=60)
    assert dashboard_response.status_code == 200
    dashboard_html = dashboard_response.text
    assert 'data-testid="admin-shell-layout"' in dashboard_html
    assert 'data-testid="admin-dashboard-page"' in dashboard_html

    chatbot_response = admin_client.get(f"{BASE_URL}/admin/chatbot", timeout=60)
    assert chatbot_response.status_code == 200
    chatbot_html = chatbot_response.text
    assert 'data-testid="admin-chatbot-page"' in chatbot_html


def test_admin_users_crud(admin_client):
    # Module: users API CRUD lifecycle
    list_response = admin_client.get(f"{BASE_URL}/api/admin/users", timeout=60)
    assert list_response.status_code == 200
    users = list_response.json()
    assert isinstance(users, list)

    marker = uuid.uuid4().hex[:8]
    create_payload = {
        "name": f"TEST_User_{marker}",
        "email": f"test_admin_users_{marker}@example.com",
        "password": f"StrongPass!{marker}",
        "role": "EDITOR",
    }
    create_response = admin_client.post(f"{BASE_URL}/api/admin/users", json=create_payload, timeout=60)
    assert create_response.status_code == 201
    created = create_response.json().get("user")
    assert isinstance(created, dict)
    assert created.get("email") == create_payload["email"]
    assert created.get("role") == "EDITOR"
    user_id = created.get("id")
    assert isinstance(user_id, str)

    patch_response = admin_client.patch(
        f"{BASE_URL}/api/admin/users/{user_id}",
        json={"role": "ADMIN"},
        timeout=60,
    )
    assert patch_response.status_code == 200
    patched = patch_response.json().get("user")
    assert isinstance(patched, dict)
    assert patched.get("id") == user_id
    assert patched.get("role") == "ADMIN"

    verify_response = admin_client.get(f"{BASE_URL}/api/admin/users", timeout=60)
    assert verify_response.status_code == 200
    verified_users = verify_response.json()
    matched = next((entry for entry in verified_users if entry.get("id") == user_id), None)
    assert isinstance(matched, dict)
    assert matched.get("role") == "ADMIN"

    delete_response = admin_client.delete(f"{BASE_URL}/api/admin/users/{user_id}", timeout=60)
    assert delete_response.status_code == 200
    assert delete_response.json().get("success") is True

    verify_delete_response = admin_client.get(f"{BASE_URL}/api/admin/users", timeout=60)
    assert verify_delete_response.status_code == 200
    after_delete = verify_delete_response.json()
    assert all(entry.get("id") != user_id for entry in after_delete)


def test_admin_documents_crud_with_multipart_upload(admin_client):
    # Module: documents API CRUD lifecycle (multipart upload)
    list_response = admin_client.get(f"{BASE_URL}/api/admin/documents", timeout=60)
    assert list_response.status_code == 200
    documents = list_response.json()
    assert isinstance(documents, list)

    marker = uuid.uuid4().hex[:8]
    file_name = f"test_admin_doc_{marker}.txt"
    files = {
        "file": (file_name, f"Document test {marker}".encode("utf-8"), "text/plain"),
    }
    data = {
        "category": f"TEST_category_{marker}",
        "description": f"TEST_description_{marker}",
    }
    upload_response = admin_client.post(f"{BASE_URL}/api/admin/documents", files=files, data=data, timeout=60)
    assert upload_response.status_code == 201
    uploaded = upload_response.json().get("document")
    assert isinstance(uploaded, dict)
    assert uploaded.get("originalFilename") == file_name
    assert uploaded.get("category") == data["category"]
    document_id = uploaded.get("id")
    assert isinstance(document_id, str)

    patch_payload = {
        "category": f"TEST_category_updated_{marker}",
        "description": f"TEST_description_updated_{marker}",
    }
    patch_response = admin_client.patch(
        f"{BASE_URL}/api/admin/documents/{document_id}",
        json=patch_payload,
        timeout=60,
    )
    assert patch_response.status_code == 200
    patched_document = patch_response.json().get("document")
    assert isinstance(patched_document, dict)
    assert patched_document.get("id") == document_id
    assert patched_document.get("category") == patch_payload["category"]
    assert patched_document.get("description") == patch_payload["description"]

    verify_response = admin_client.get(f"{BASE_URL}/api/admin/documents", timeout=60)
    assert verify_response.status_code == 200
    verified_documents = verify_response.json()
    matched = next((entry for entry in verified_documents if entry.get("id") == document_id), None)
    assert isinstance(matched, dict)
    assert matched.get("category") == patch_payload["category"]
    assert matched.get("description") == patch_payload["description"]

    delete_response = admin_client.delete(f"{BASE_URL}/api/admin/documents/{document_id}", timeout=60)
    assert delete_response.status_code == 200
    assert delete_response.json().get("success") is True

    verify_delete_response = admin_client.get(f"{BASE_URL}/api/admin/documents", timeout=60)
    assert verify_delete_response.status_code == 200
    after_delete = verify_delete_response.json()
    assert all(entry.get("id") != document_id for entry in after_delete)
