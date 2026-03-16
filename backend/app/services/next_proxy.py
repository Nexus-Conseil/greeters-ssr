import asyncio
from typing import Dict

import requests
from fastapi import HTTPException, Request, Response

from app.core import NEXT_INTERNAL_URL, logger


async def fetch_next_json(path: str):
    def _request():
        response = requests.get(f"{NEXT_INTERNAL_URL}{path}", timeout=30)
        response.raise_for_status()
        return response.json()

    try:
        return await asyncio.to_thread(_request)
    except requests.RequestException as error:
        logger.error("Next proxy error on %s: %s", path, error)
        raise HTTPException(status_code=502, detail=f"Next route indisponible: {path}") from error


async def proxy_next_request(method: str, path: str, request: Request | None = None):
    def _request(headers: Dict[str, str], body: bytes | None, query_string: str):
        suffix = f"?{query_string}" if query_string else ""
        response = requests.request(
            method,
            f"{NEXT_INTERNAL_URL}{path}{suffix}",
            headers=headers,
            data=body,
            allow_redirects=False,
            timeout=30,
        )
        return response

    headers: Dict[str, str] = {}
    body: bytes | None = None
    query_string = ""

    if request is not None:
        headers = {
            key: value
            for key, value in request.headers.items()
            if key.lower() not in {"host", "content-length", "connection"}
        }
        query_string = request.url.query

        if method in {"POST", "PUT", "PATCH", "DELETE"}:
            body = await request.body()

    try:
        next_response = await asyncio.to_thread(_request, headers, body, query_string)
    except requests.RequestException as error:
        logger.error("Next proxy error on %s: %s", path, error)
        raise HTTPException(status_code=502, detail=f"Next route indisponible: {path}") from error

    proxied_response = Response(
        content=next_response.content,
        status_code=next_response.status_code,
        media_type=next_response.headers.get("content-type", "application/json"),
    )

    for header_name in ("set-cookie", "location"):
        header_value = next_response.headers.get(header_name)
        if header_value:
            proxied_response.headers[header_name] = header_value

    return proxied_response


async def get_authenticated_next_user(request: Request, allowed_roles: set[str]):
    def _request():
        headers = {}
        cookie_header = request.headers.get("cookie")
        if cookie_header:
            headers["cookie"] = cookie_header
        return requests.get(f"{NEXT_INTERNAL_URL}/api/auth/me", headers=headers, timeout=30)

    try:
        response = await asyncio.to_thread(_request)
    except requests.RequestException as error:
        logger.error("Next auth proxy error: %s", error)
        raise HTTPException(status_code=502, detail="Impossible de valider la session administrateur.") from error

    if response.status_code == 401:
        raise HTTPException(status_code=401, detail="Authentification requise.")

    if not response.ok:
        raise HTTPException(status_code=502, detail="La session administrateur n'a pas pu être validée.")

    user = response.json()
    role = str(user.get("role", ""))
    if role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Droits insuffisants pour cette action.")

    return user