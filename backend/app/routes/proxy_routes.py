from fastapi import APIRouter, Request

from app.services.next_proxy import fetch_next_json, proxy_next_request


router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Hello World"}


@router.get("/health")
async def health_check():
    return await fetch_next_json("/api/health")


@router.get("/pages/public")
async def public_pages():
    return await fetch_next_json("/api/pages/public")


@router.post("/auth/login")
async def auth_login(request: Request):
    return await proxy_next_request("POST", "/api/auth/login", request)


@router.get("/auth/me")
async def auth_me(request: Request):
    return await proxy_next_request("GET", "/api/auth/me", request)


@router.post("/auth/logout")
async def auth_logout(request: Request):
    return await proxy_next_request("POST", "/api/auth/logout", request)


@router.post("/contact/send")
async def contact_send(request: Request):
    return await proxy_next_request("POST", "/api/contact/send", request)


@router.api_route("/pages", methods=["GET", "POST"])
async def pages_root(request: Request):
    return await proxy_next_request(request.method, "/api/pages", request)


@router.api_route("/pages/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def pages_nested(full_path: str, request: Request):
    return await proxy_next_request(request.method, f"/api/pages/{full_path}", request)


@router.api_route("/menu", methods=["GET", "PUT"])
async def menu_root(request: Request):
    return await proxy_next_request(request.method, "/api/menu", request)


@router.api_route("/menu/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def menu_nested(full_path: str, request: Request):
    return await proxy_next_request(request.method, f"/api/menu/{full_path}", request)


@router.api_route("/admin/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def admin_nested(full_path: str, request: Request):
    return await proxy_next_request(request.method, f"/api/admin/{full_path}", request)
