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
    # Admin authentication for chatbot admin APIs
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=45,
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("user", {}).get("email") == ADMIN_EMAIL
    return api_client


def _seed_public_chat(client: requests.Session, visitor_id: str | None = None):
    session_id = f"TEST_chatbot_admin_{uuid.uuid4().hex}"
    message_payload = {
        "session_id": session_id,
        "message": "Bonjour, je veux réserver une balade avec 2 personnes.",
        "language": "fr",
    }
    if visitor_id:
        message_payload["visitor_id"] = visitor_id

    post_response = client.post(
        f"{BASE_URL}/api/chat/message",
        json=message_payload,
        timeout=150,
    )
    assert post_response.status_code == 200
    post_data = post_response.json()
    assert isinstance(post_data.get("content"), str)
    assert post_data["content"].strip() != ""

    history_response = client.get(f"{BASE_URL}/api/chat/session/{session_id}", timeout=45)
    assert history_response.status_code == 200
    history_payload = history_response.json()
    assert history_payload.get("session_id") == session_id
    assert isinstance(history_payload.get("messages"), list)
    assert len(history_payload["messages"]) >= 2
    return session_id, history_payload["messages"], post_data.get("visitor_id")


# Chatbot prompt settings lifecycle via admin proxy (Next + Prisma)
def test_admin_chatbot_settings_get_returns_bundle(admin_client):
    response = admin_client.get(f"{BASE_URL}/api/admin/chatbot/settings", timeout=45)
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data.get("draft"), dict)
    assert isinstance(data["draft"].get("systemPrompt"), str)
    assert "history" in data and isinstance(data["history"], list)


def test_admin_chatbot_settings_put_saves_draft(admin_client):
    current = admin_client.get(f"{BASE_URL}/api/admin/chatbot/settings", timeout=45)
    assert current.status_code == 200
    current_data = current.json()
    draft = current_data["draft"]

    marker = f"TEST_NOTE_{uuid.uuid4().hex[:8]}"
    draft["notes"] = marker

    save_response = admin_client.put(
        f"{BASE_URL}/api/admin/chatbot/settings",
        json=draft,
        timeout=45,
    )
    assert save_response.status_code == 200
    save_payload = save_response.json()
    assert isinstance(save_payload.get("draft"), dict)
    assert save_payload["draft"].get("notes") == marker

    verify_response = admin_client.get(f"{BASE_URL}/api/admin/chatbot/settings", timeout=45)
    assert verify_response.status_code == 200
    verify_payload = verify_response.json()
    assert verify_payload["draft"].get("notes") == marker


# Chatbot conversation browsing and reply simulation APIs in FastAPI
def test_admin_chatbot_conversations_and_detail_and_generate_reply(admin_client):
    session_id, messages, _ = _seed_public_chat(admin_client)
    user_message = next((m for m in messages if m.get("role") == "user"), None)
    assert isinstance(user_message, dict)
    assert isinstance(user_message.get("id"), str)

    conversations_response = admin_client.get(f"{BASE_URL}/api/admin/chatbot/conversations", timeout=45)
    assert conversations_response.status_code == 200
    conversations = conversations_response.json()
    assert isinstance(conversations, list)
    assert any(item.get("session_id") == session_id for item in conversations)

    detail_response = admin_client.get(f"{BASE_URL}/api/admin/chatbot/conversation/{session_id}", timeout=45)
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail.get("session_id") == session_id
    assert isinstance(detail.get("messages"), list)
    assert isinstance(detail.get("feedbacks"), dict)

    generate_response = admin_client.post(
        f"{BASE_URL}/api/admin/chatbot/conversation/{session_id}/generate-reply",
        json={"messageId": user_message["id"], "mode": "draft"},
        timeout=150,
    )
    assert generate_response.status_code == 200
    generated = generate_response.json()
    assert generated.get("messageId") == user_message["id"]
    assert generated.get("mode") == "draft"
    assert isinstance(generated.get("content"), str)
    assert generated["content"].strip() != ""


# Feedback create/list/delete lifecycle
def test_admin_chatbot_feedback_create_list_delete(admin_client):
    session_id, messages, _ = _seed_public_chat(admin_client)
    assistant_message = next((m for m in messages if m.get("role") == "assistant"), None)
    assert isinstance(assistant_message, dict)

    create_response = admin_client.post(
        f"{BASE_URL}/api/admin/chatbot/feedback",
        json={
            "sessionId": session_id,
            "messageId": assistant_message["id"],
            "feedback": f"TEST feedback {uuid.uuid4().hex[:8]}",
        },
        timeout=45,
    )
    assert create_response.status_code == 200
    created_payload = create_response.json()
    assert created_payload.get("success") is True
    created_feedback = created_payload.get("feedback")
    assert isinstance(created_feedback, dict)
    feedback_id = created_feedback.get("id")
    assert isinstance(feedback_id, str)

    list_response = admin_client.get(f"{BASE_URL}/api/admin/chatbot/feedbacks", timeout=45)
    assert list_response.status_code == 200
    feedbacks = list_response.json()
    assert isinstance(feedbacks, list)
    assert any(entry.get("id") == feedback_id for entry in feedbacks)

    delete_response = admin_client.delete(f"{BASE_URL}/api/admin/chatbot/feedback/{feedback_id}", timeout=45)
    assert delete_response.status_code == 200
    delete_payload = delete_response.json()
    assert delete_payload.get("success") is True

    verify_response = admin_client.get(f"{BASE_URL}/api/admin/chatbot/feedbacks", timeout=45)
    assert verify_response.status_code == 200
    verify_feedbacks = verify_response.json()
    assert all(entry.get("id") != feedback_id for entry in verify_feedbacks)


# Improvement synthesis/list/deactivate flow
def test_admin_chatbot_improvements_synthesize_list_deactivate(admin_client):
    session_id, messages, _ = _seed_public_chat(admin_client)
    assistant_message = next((m for m in messages if m.get("role") == "assistant"), None)
    assert isinstance(assistant_message, dict)

    feedback_response = admin_client.post(
        f"{BASE_URL}/api/admin/chatbot/feedback",
        json={
            "sessionId": session_id,
            "messageId": assistant_message["id"],
            "feedback": f"TEST improvement trigger {uuid.uuid4().hex[:8]}",
        },
        timeout=45,
    )
    assert feedback_response.status_code == 200

    synth_response = admin_client.post(
        f"{BASE_URL}/api/admin/chatbot/synthesize-improvements",
        json={},
        timeout=180,
    )
    assert synth_response.status_code == 200
    synth_payload = synth_response.json()
    assert synth_payload.get("success") is True

    list_response = admin_client.get(f"{BASE_URL}/api/admin/chatbot/improvements", timeout=45)
    assert list_response.status_code == 200
    improvements = list_response.json()
    assert isinstance(improvements, list)
    if not improvements:
        pytest.skip("No improvements returned after synthesis")

    active_improvement = next((entry for entry in improvements if entry.get("active") is True), None)
    if not active_improvement:
        pytest.skip("No active improvement available for deactivation")

    deactivate_response = admin_client.delete(
        f"{BASE_URL}/api/admin/chatbot/improvement/{active_improvement['id']}",
        timeout=45,
    )
    assert deactivate_response.status_code == 200
    deactivate_payload = deactivate_response.json()
    assert deactivate_payload.get("success") is True


# Public chat persistence + visitor memory path basic regression
def test_public_chat_persists_history_and_visitor_memory_path(api_client):
    visitor_id = f"TEST_visitor_{uuid.uuid4().hex[:10]}"

    session_one, messages_one, returned_visitor_id = _seed_public_chat(api_client, visitor_id=visitor_id)
    assert returned_visitor_id == visitor_id
    assert any(message.get("role") == "assistant" for message in messages_one)

    session_two, messages_two, returned_again = _seed_public_chat(api_client, visitor_id=visitor_id)
    assert session_two != session_one
    assert returned_again == visitor_id
    assert any(message.get("role") == "assistant" for message in messages_two)
