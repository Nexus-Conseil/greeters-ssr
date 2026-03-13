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
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def admin_client(api_client):
    # Module: admin auth proxy login/me/logout session readiness
    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=45,
    )
    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload.get("user", {}).get("email") == ADMIN_EMAIL
    return api_client


def _seed_chat_and_get_user_message(client: requests.Session):
    session_id = f"TEST_cmp_{uuid.uuid4().hex}"
    post_response = client.post(
        f"{BASE_URL}/api/chat/message",
        json={
            "session_id": session_id,
            "message": "Bonjour, je veux comparer réponse historique et nouvelle réponse.",
            "language": "fr",
        },
        timeout=150,
    )
    assert post_response.status_code == 200
    post_payload = post_response.json()
    assert isinstance(post_payload.get("content"), str)
    assert post_payload["content"].strip() != ""

    history_response = client.get(f"{BASE_URL}/api/chat/session/{session_id}", timeout=45)
    assert history_response.status_code == 200
    history_payload = history_response.json()
    assert history_payload.get("session_id") == session_id
    assert isinstance(history_payload.get("messages"), list)
    user_message = next((entry for entry in history_payload["messages"] if entry.get("role") == "user"), None)
    assert isinstance(user_message, dict)
    assert isinstance(user_message.get("id"), str)
    return session_id, user_message["id"]


def test_admin_auth_me_returns_expected_profile(admin_client):
    # Module: redesigned admin shell still depends on /api/auth/me profile payload
    me_response = admin_client.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert me_response.status_code == 200
    me_payload = me_response.json()
    assert me_payload.get("email") == ADMIN_EMAIL
    assert me_payload.get("role") == "SUPER_ADMIN"


def test_admin_login_endpoint_stability_over_multiple_attempts(api_client):
    # Module: login stability check for redesigned login page integration
    statuses = []
    for _ in range(5):
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=45,
        )
        statuses.append(response.status_code)
        assert response.status_code == 200
        payload = response.json()
        assert payload.get("user", {}).get("email") == ADMIN_EMAIL


def test_admin_chatbot_conversations_include_seeded_session(admin_client):
    # Module: chatbot admin conversation list for redesigned chatbot console
    seeded_session_id, _ = _seed_chat_and_get_user_message(admin_client)

    list_response = admin_client.get(f"{BASE_URL}/api/admin/chatbot/conversations", timeout=45)
    assert list_response.status_code == 200
    conversations = list_response.json()
    assert isinstance(conversations, list)
    target = next((item for item in conversations if item.get("session_id") == seeded_session_id), None)
    assert isinstance(target, dict)
    assert target.get("message_count", 0) >= 2


def test_admin_chatbot_generate_reply_from_user_message_returns_content(admin_client):
    # Module: comparator generation backend path (draft/published simulation)
    session_id, user_message_id = _seed_chat_and_get_user_message(admin_client)

    generate_response = admin_client.post(
        f"{BASE_URL}/api/admin/chatbot/conversation/{session_id}/generate-reply",
        json={"messageId": user_message_id, "mode": "published"},
        timeout=150,
    )
    assert generate_response.status_code == 200
    payload = generate_response.json()
    assert payload.get("messageId") == user_message_id
    assert payload.get("mode") == "published"
    assert isinstance(payload.get("content"), str)
    assert payload["content"].strip() != ""


def test_admin_users_page_renders_with_authenticated_session(admin_client):
    # Module: SSR admin users landing page wiring after shell redesign
    page_response = admin_client.get(f"{BASE_URL}/admin/users", timeout=60)
    assert page_response.status_code == 200
    html = page_response.text
    assert "data-testid=\"admin-users-page\"" in html
    assert "data-testid=\"admin-users-table\"" in html


def test_admin_documents_page_renders_with_authenticated_session(admin_client):
    # Module: SSR admin documents landing page wiring after shell redesign
    page_response = admin_client.get(f"{BASE_URL}/admin/documents", timeout=60)
    assert page_response.status_code == 200
    html = page_response.text
    assert "data-testid=\"admin-documents-page\"" in html
    assert "data-testid=\"admin-documents-table\"" in html
