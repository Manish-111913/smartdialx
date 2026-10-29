"""HTTP API: routing, status codes and the shape of the main responses."""

import json
import threading
import time
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import pytest

from smartdialx.api import Api, make_handler
from smartdialx.console import Console


@pytest.fixture(scope="module")
def api(tmp_path_factory):
    console = Console(str(tmp_path_factory.mktemp("api") / "console.db"), history_s=300)
    while console.clock.now() < time.time() - 2:
        console.step()
    server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(Api(console)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}/api", console
    server.shutdown()
    server.server_close()
    console.close()


def call(base, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


@pytest.mark.parametrize("path", [
    "/health", "/overview", "/overview?campaign=1&since=900", "/agents", "/agents/1", "/campaigns",
    "/campaigns/1", "/calls", "/calls?scope=live", "/live", "/pacing", "/pacing?campaign=2", "/decisions",
    "/providers", "/providers/B", "/events", "/recovery", "/settings", "/simulations",
])
def test_reads(api, path):
    base, _ = api
    status, body = call(base, "GET", path)
    assert status == 200, body


def test_overview_funnel_adds_up(api):
    base, _ = api
    _, body = call(base, "GET", "/overview")
    f = body["funnel"]
    assert f["attempts"] >= f["answered"] >= f["willing"] >= f["connected"]
    assert body["kpis"]["screening_attempts"] == f["attempts"]
    assert sum(body["agents"][s] for s in ("AVAILABLE", "RESERVED", "DIALING", "CONNECTED", "WRAP_UP",
                                            "PAUSED", "OFFLINE")) == body["agents"]["total"]


def test_errors(api):
    base, _ = api
    assert call(base, "GET", "/agents/9999")[0] == 404
    assert call(base, "GET", "/nothing")[0] == 404
    assert call(base, "PUT", "/agents")[0] == 405
    assert call(base, "GET", "/overview?since=abc")[0] == 400
    assert call(base, "POST", "/campaigns", {"name": "x"})[0] == 400
    assert call(base, "POST", "/providers/A/fault", {"kind": "outage", "duration_s": 1})[0] == 400


def test_operator_actions(api):
    base, console = api
    status, body = call(base, "POST", "/agents", {"name": "Api Person"})
    assert status == 200
    agent_id = body["agent"]["id"]
    status, body = call(base, "POST", f"/agents/{agent_id}/state", {"state": "PAUSED"})
    assert status == 200 and body["agent"]["state"] == "PAUSED"

    status, body = call(base, "POST", "/campaigns", {"name": "Api Campaign", "borrowers": 10, "status": "PAUSED",
                                                     "screening": True, "mode": "predictive"})
    assert status == 200
    cid = body["campaign"]["id"]
    assert body["campaign"]["targets"] == 10
    status, body = call(base, "PATCH", f"/campaigns/{cid}", {"mode": "progressive"})
    assert body["campaign"]["mode"] == "progressive"
    status, body = call(base, "POST", f"/campaigns/{cid}/status", {"status": "STOPPED"})
    assert body["campaign"]["display_status"] == "STOPPED"
    assert call(base, "POST", f"/campaigns/{cid}/status", {"status": "RUNNING"})[0] == 400

    status, body = call(base, "POST", "/providers/A/fault", {"kind": "duplicates", "duration_s": 60})
    assert status == 200 and body["provider"]["fault"]["kind"] == "duplicates"
    call(base, "POST", "/providers/A/fault", {"kind": "normal"})
    assert "A" not in console.faults

    status, body = call(base, "PUT", "/settings", {"pacing": {"prior_answer_rate": 0.4}})
    assert status == 200 and body["settings"]["pacing"]["prior_answer_rate"] == 0.4
    call(base, "POST", "/settings/reset")


def test_event_and_call_details(api):
    base, _ = api
    _, events = call(base, "GET", "/events?limit=1")
    event_id = events["events"][0]["event_id"]
    status, body = call(base, "GET", "/events/" + urllib.request.quote(event_id, safe=""))
    assert status == 200 and body["event"]["event_id"] == event_id
    _, calls = call(base, "GET", "/calls?limit=1")
    status, body = call(base, "GET", f"/calls/{calls['calls'][0]['id']}")
    assert status == 200 and body["call"]["code"].startswith("CALL-")


def test_simulation_run(api):
    base, _ = api
    status, job = call(base, "POST", "/simulations", {"preset": "balanced", "mode": "progressive",
                                                       "agents": 5, "borrowers": 100})
    assert status == 200
    for _ in range(120):
        _, job = call(base, "GET", f"/simulations/{job['id']}")
        if job["status"] in ("done", "failed"):
            break
        time.sleep(0.5)
    assert job["status"] == "done", job.get("error")
    assert job["result"]["calls_initiated"] > 0
    assert job["result"]["invariant_violations"] == []
