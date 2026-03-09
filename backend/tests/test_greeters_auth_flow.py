import os

import pytest
import requests

# Greeters auth API and protected admin route regression tests
BASE_URL = os.environ.get("GREETERS_BASE_URL")

if not BASE_URL:
    pytest.skip("GREETERS_BASE_URL is not configured", allow_module_level=True)

BASE_URL = BASE_URL.rstrip("/")
VALID_EMAIL = "admin@greeters.local"
VALID_PASSWORD = "AdminPass!12345"
INVALID_PASSWORD = "WrongPass123!"


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_me_returns_401_when_unauthenticated(api_client):
    response = api_client.get(f"{BASE_URL}/api/auth/me")

    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Non authentifié."


def test_login_rejects_invalid_credentials(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": VALID_EMAIL, "password": INVALID_PASSWORD},
    )

    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Identifiants invalides."


def test_login_accepts_valid_seeded_admin_and_sets_cookie(api_client):
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": VALID_EMAIL, "password": VALID_PASSWORD},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == VALID_EMAIL
    assert data["sessionDurationDays"] == 7

    set_cookie = response.headers.get("set-cookie", "")
    assert "greeters_session=" in set_cookie
    assert "HttpOnly" in set_cookie


def test_me_returns_current_user_when_authenticated(api_client):
    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": VALID_EMAIL, "password": VALID_PASSWORD},
    )
    assert login_response.status_code == 200

    me_response = api_client.get(f"{BASE_URL}/api/auth/me")
    assert me_response.status_code == 200

    user = me_response.json()
    assert user["email"] == VALID_EMAIL
    assert user["role"] == "SUPER_ADMIN"


def test_admin_route_protected_and_accessible_after_login(api_client):
    unauthenticated = api_client.get(f"{BASE_URL}/admin", allow_redirects=False)
    assert unauthenticated.status_code == 307
    assert "/admin/login?redirect=%2Fadmin" in unauthenticated.headers["location"]

    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": VALID_EMAIL, "password": VALID_PASSWORD},
    )
    assert login_response.status_code == 200

    authenticated = api_client.get(f"{BASE_URL}/admin")
    assert authenticated.status_code == 200
    assert 'data-testid="admin-dashboard-page"' in authenticated.text


def test_logout_clears_session_and_me_returns_401(api_client):
    login_response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": VALID_EMAIL, "password": VALID_PASSWORD},
    )
    assert login_response.status_code == 200

    logout_response = api_client.post(f"{BASE_URL}/api/auth/logout")
    assert logout_response.status_code == 200
    assert logout_response.json()["success"] is True

    set_cookie = logout_response.headers.get("set-cookie", "")
    assert "greeters_session=" in set_cookie
    assert "Max-Age=0" in set_cookie

    me_response = api_client.get(f"{BASE_URL}/api/auth/me")
    assert me_response.status_code == 401
    assert me_response.json()["detail"] == "Non authentifié."
