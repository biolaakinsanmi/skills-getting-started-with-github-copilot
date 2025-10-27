import uuid
from urllib.parse import quote

from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_get_activities_no_cache_header():
    r = client.get("/activities")
    assert r.status_code == 200
    # server should instruct clients not to cache the activities response
    assert r.headers.get("cache-control") == "no-store"
    assert isinstance(r.json(), dict)


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    activity_path = quote(activity, safe="")
    email = f"test+{uuid.uuid4().hex}@example.com"

    # Ensure email not already present
    r = client.get("/activities")
    assert email not in r.json()[activity]["participants"]

    # Sign up
    r = client.post(f"/activities/{activity_path}/signup", params={"email": email})
    assert r.status_code == 200
    assert f"Signed up {email}" in r.json().get("message", "")

    # Confirm participant was added
    r = client.get("/activities")
    assert email in r.json()[activity]["participants"]

    # Duplicate signup should fail
    r = client.post(f"/activities/{activity_path}/signup", params={"email": email})
    assert r.status_code == 400

    # Unregister
    r = client.delete(f"/activities/{activity_path}/participants", params={"email": email})
    assert r.status_code == 200
    assert f"Removed {email}" in r.json().get("message", "")

    # Confirm removal
    r = client.get("/activities")
    assert email not in r.json()[activity]["participants"]


def test_unregister_nonexistent_returns_404():
    activity = "Chess Club"
    activity_path = quote(activity, safe="")
    email = f"nonexistent+{uuid.uuid4().hex}@example.com"

    r = client.delete(f"/activities/{activity_path}/participants", params={"email": email})
    assert r.status_code == 404


def test_signup_nonexistent_activity_returns_404():
    activity = "No Such Activity"
    activity_path = quote(activity, safe="")
    email = f"test+{uuid.uuid4().hex}@example.com"

    r = client.post(f"/activities/{activity_path}/signup", params={"email": email})
    assert r.status_code == 404
