import os

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
FINAL_ADMIN_EMAIL = "florence.levot@nexus-conseil.ch"
FINAL_ADMIN_PASSWORD = os.environ.get("FINAL_ADMIN_PASSWORD")

if not FINAL_ADMIN_PASSWORD:
    pytest.skip("FINAL_ADMIN_PASSWORD is not configured", allow_module_level=True)


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_login_with_final_admin_succeeds(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": FINAL_ADMIN_EMAIL, "password": FINAL_ADMIN_PASSWORD},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("user"), dict)
    assert data["user"].get("email") == FINAL_ADMIN_EMAIL
    assert data["user"].get("role") == "SUPER_ADMIN"
    assert isinstance(data.get("expiresAt"), str)
    assert data["expiresAt"].strip() != ""


def test_auth_me_returns_authenticated_user_after_login(api_client):
    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": FINAL_ADMIN_EMAIL, "password": FINAL_ADMIN_PASSWORD},
        timeout=30,
    )
    assert login_response.status_code == 200

    me_response = api_client.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert me_response.status_code == 200
    data = me_response.json()
    assert data.get("email") == FINAL_ADMIN_EMAIL
    assert data.get("role") == "SUPER_ADMIN"


def test_logout_invalidates_session_and_me_returns_401(api_client):
    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": FINAL_ADMIN_EMAIL, "password": FINAL_ADMIN_PASSWORD},
        timeout=30,
    )
    assert login_response.status_code == 200

    logout_response = api_client.post(f"{BASE_URL}/api/auth/logout", json={}, timeout=30)
    assert logout_response.status_code == 200
    logout_data = logout_response.json()
    assert logout_data.get("success") is True

    me_response = api_client.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert me_response.status_code == 401
    me_data = me_response.json()
    assert "detail" in me_data