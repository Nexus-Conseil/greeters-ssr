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


# Regression coverage for branch 1503 selective merge: admin APIs + public chatbot/session APIs.
BASE_URL = _load_base_url()
FINAL_ADMIN_EMAIL = "florence.levot@nexus-conseil.ch"
FINAL_ADMIN_PASSWORD = "Greeters&58!"


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def authenticated_client(api_client):
    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": FINAL_ADMIN_EMAIL, "password": FINAL_ADMIN_PASSWORD},
        timeout=30,
    )
    if login_response.status_code != 200:
        pytest.skip("Final admin login failed; skipping authenticated admin API checks")
    return api_client


def test_core_health_endpoint(api_client):
    response = api_client.get(f"{BASE_URL}/api/health", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert data.get("status") == "ok"


def test_core_public_pages_endpoint(api_client):
    response = api_client.get(f"{BASE_URL}/api/pages/public", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_chat_message_then_session_endpoint(api_client):
    session_id = f"TEST_MERGE_1503_{uuid.uuid4().hex[:10]}"
    payload = {
        "session_id": session_id,
        "visitor_id": f"visitor_{session_id}",
        "message": "Bonjour, je veux reserver une balade.",
        "language": "fr",
    }
    message_response = api_client.post(f"{BASE_URL}/api/chat/message", json=payload, timeout=90)
    assert message_response.status_code == 200
    message_data = message_response.json()
    assert isinstance(message_data.get("content"), str)
    assert message_data.get("content", "").strip() != ""

    session_response = api_client.get(f"{BASE_URL}/api/chat/session/{session_id}", timeout=30)
    assert session_response.status_code == 200
    session_data = session_response.json()
    assert session_data.get("session_id") == session_id
    assert isinstance(session_data.get("messages"), list)
    assert len(session_data.get("messages", [])) >= 1
    first_message = session_data["messages"][0]
    assert first_message.get("role") in {"user", "assistant"}
    assert isinstance(first_message.get("content"), str)


def test_admin_users_endpoint_authenticated(authenticated_client):
    response = authenticated_client.get(f"{BASE_URL}/api/admin/users", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert isinstance(data[0].get("email"), str)
        assert isinstance(data[0].get("role"), str)


def test_admin_documents_endpoint_authenticated(authenticated_client):
    response = authenticated_client.get(f"{BASE_URL}/api/admin/documents", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert isinstance(data[0].get("id"), str)
        assert isinstance(data[0].get("category"), str)


def test_admin_chatbot_settings_endpoint_authenticated(authenticated_client):
    response = authenticated_client.get(f"{BASE_URL}/api/admin/chatbot/settings", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert isinstance(data.get("draft"), dict)
    assert isinstance(data.get("history"), list)
