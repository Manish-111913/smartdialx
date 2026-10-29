"""HTTP API for the web console, standard library only.

    python -m smartdialx.main serve            # http://127.0.0.1:8000/api/health

JSON in, JSON out, everything under /api. The Next.js frontend proxies /api to this
server, so there's no CORS to deal with. Reads go straight to SQLite (each request
thread has its own connection); writes go through the Console, which takes the
engine lock so an operator action never lands in the middle of a dialing tick.

Errors come back as {"error": "..."}: 404 for an unknown id, 400 for bad input,
409 when a state rule says no (e.g. pausing an agent who is on a call).
"""

import json
import logging
import re
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

from . import views
from .console import Console
from .state_machine import InvalidTransition

log = logging.getLogger(__name__)

DAY = 86400.0


class _Query:
    def __init__(self, raw: str):
        self._q = {k: v[-1] for k, v in parse_qs(raw).items()}

    def str(self, key: str, default=None):
        value = self._q.get(key, "").strip()
        return value or default

    def int(self, key: str, default=None):
        value = self.str(key)
        if value is None:
            return default
        try:
            return int(value)
        except ValueError:
            raise ValueError(f"{key} must be a whole number") from None

    def since(self, default: float = DAY) -> float:
        value = self.str("since")
        if value is None:
            return default
        try:
            seconds = float(value)
        except ValueError:
            raise ValueError("since must be a number of seconds") from None
        if not 60 <= seconds <= 30 * DAY:
            raise ValueError("since must be between 60 seconds and 30 days")
        return seconds

    def limit(self, default: int = 100, most: int = 500) -> int:
        return max(1, min(most, self.int("limit", default)))

    def bool(self, key: str) -> bool:
        return self.str(key, "").lower() in ("1", "true", "yes")


ROUTES: list[tuple[str, re.Pattern, str]] = []


def route(method: str, pattern: str):
    def register(fn):
        ROUTES.append((method, re.compile(f"^{pattern}$"), fn.__name__))
        return fn
    return register


class Api:
    """The handlers, one per route. Each takes (query, body, *path_args)."""

    def __init__(self, console: Console):
        self.c = console

    # system
    @route("GET", "/api/health")
    def health(self, q, body):
        return views.health(self.c)

    @route("POST", "/api/system/reset")
    def reset(self, q, body):
        self.c.reset()
        return views.health(self.c)

    # overview and live operations
    @route("GET", "/api/overview")
    def overview(self, q, body):
        return views.overview(self.c, q.int("campaign"), q.since())

    @route("GET", "/api/live")
    def live(self, q, body):
        return views.live(self.c, q.int("campaign"), q.since())

    # agents
    @route("GET", "/api/agents")
    def agents(self, q, body):
        return views.agents(self.c, q.since())

    @route("GET", r"/api/agents/(\d+)")
    def agent(self, q, body, agent_id):
        return views.agent(self.c, int(agent_id), q.since())

    @route("POST", "/api/agents")
    def add_agent(self, q, body):
        agent_id = self.c.add_agent(str(body.get("name", "")), body.get("state", "AVAILABLE"))
        return views.agent(self.c, agent_id, DAY)

    @route("POST", r"/api/agents/(\d+)/state")
    def agent_state(self, q, body, agent_id):
        self.c.set_agent_state(int(agent_id), str(body.get("state", "")))
        return views.agent(self.c, int(agent_id), DAY)

    @route("POST", r"/api/agents/(\d+)/pause-request")
    def agent_pause_request(self, q, body, agent_id):
        self.c.request_pause(int(agent_id), bool(body.get("on", True)))
        return views.agent(self.c, int(agent_id), DAY)

    # campaigns
    @route("GET", "/api/campaigns")
    def campaigns(self, q, body):
        return views.campaigns(self.c)

    @route("GET", r"/api/campaigns/(\d+)")
    def campaign(self, q, body, campaign_id):
        return views.campaign(self.c, int(campaign_id), q.since())

    @route("POST", "/api/campaigns")
    def create_campaign(self, q, body):
        return views.campaign(self.c, self.c.create_campaign(body), DAY)

    @route("PATCH", r"/api/campaigns/(\d+)")
    def update_campaign(self, q, body, campaign_id):
        self.c.update_campaign(int(campaign_id), body)
        return views.campaign(self.c, int(campaign_id), DAY)

    @route("POST", r"/api/campaigns/(\d+)/status")
    def campaign_status(self, q, body, campaign_id):
        self.c.set_campaign_status(int(campaign_id), str(body.get("status", "")).upper())
        return views.campaign(self.c, int(campaign_id), DAY)

    @route("POST", r"/api/campaigns/(\d+)/duplicate")
    def duplicate_campaign(self, q, body, campaign_id):
        return views.campaign(self.c, self.c.duplicate_campaign(int(campaign_id)), DAY)

    # calls
    @route("GET", "/api/calls")
    def calls(self, q, body):
        return views.calls(
            self.c, campaign_id=q.int("campaign"), state=q.str("state"), outcome=q.str("outcome"),
            provider=q.str("provider"), q=q.str("q"), scope=q.str("scope", "recent"),
            since=q.since(3600), limit=q.limit(),
        )

    @route("GET", r"/api/calls/(\d+)")
    def call(self, q, body, call_id):
        return views.call(self.c, int(call_id))

    # pacing and safety
    @route("GET", "/api/pacing")
    def pacing(self, q, body):
        return views.pacing(self.c, q.int("campaign"), q.since())

    @route("GET", "/api/decisions")
    def decisions(self, q, body):
        return views.decisions(
            self.c, campaign_id=q.int("campaign"), action=q.str("action"), since=q.since(3600),
            changes_only=q.bool("changes"), limit=q.limit(),
        )

    @route("GET", r"/api/decisions/(\d+)")
    def decision(self, q, body, decision_id):
        return views.decision(self.c, int(decision_id))

    # providers
    @route("GET", "/api/providers")
    def providers(self, q, body):
        return views.providers(self.c, q.since())

    @route("GET", r"/api/providers/([AB])")
    def provider(self, q, body, name):
        return views.provider(self.c, name, q.since())

    @route("POST", r"/api/providers/([AB])/fault")
    def provider_fault(self, q, body, name):
        duration = body.get("duration_s")
        if duration is not None:
            duration = float(duration)
            if not 10 <= duration <= 3600:
                raise ValueError("duration must be between 10 seconds and 1 hour")
        self.c.set_fault(name, str(body.get("kind", "")), duration)
        return views.provider(self.c, name, DAY)

    # events and recovery
    @route("GET", "/api/events")
    def events(self, q, body):
        return views.events(
            self.c, type_=q.str("type"), provider=q.str("provider"), campaign_id=q.int("campaign"),
            status=q.str("status"), q=q.str("q"), since=q.since(3600), limit=q.limit(),
        )

    @route("GET", r"/api/events/([^/]+)")
    def event(self, q, body, event_id):
        return views.event(self.c, unquote(event_id))

    @route("GET", "/api/recovery")
    def recovery(self, q, body):
        return views.recovery(self.c, q.since(), q.limit(50))

    @route("GET", r"/api/recovery/(\d+)")
    def recovery_item(self, q, body, recovery_id):
        return views.recovery_item(self.c, int(recovery_id))

    # settings
    @route("GET", "/api/settings")
    def settings(self, q, body):
        return views.settings(self.c)

    @route("PUT", "/api/settings")
    def update_settings(self, q, body):
        self.c.update_settings(body)
        return views.settings(self.c)

    @route("POST", "/api/settings/reset")
    def reset_settings(self, q, body):
        self.c.reset_settings()
        return views.settings(self.c)

    # simulation lab
    @route("GET", "/api/simulations")
    def simulations(self, q, body):
        lab = self.c.simulations
        return {"runs": lab.list(), "presets": lab.PRESETS, "audiences": views._audiences()}

    @route("POST", "/api/simulations")
    def start_simulation(self, q, body):
        return self.c.simulations.start(body)

    @route("GET", r"/api/simulations/(\d+)")
    def simulation(self, q, body, run_id):
        return self.c.simulations.get(int(run_id))


def make_handler(api: Api):
    class Handler(BaseHTTPRequestHandler):
        server_version = "SmartDialX"

        def do_GET(self):
            self._dispatch("GET")

        def do_POST(self):
            self._dispatch("POST")

        def do_PUT(self):
            self._dispatch("PUT")

        def do_PATCH(self):
            self._dispatch("PATCH")

        def _dispatch(self, method: str) -> None:
            url = urlparse(self.path)
            path = url.path.rstrip("/") or "/"
            allowed = False
            for verb, pattern, name in ROUTES:
                m = pattern.match(path)
                if not m:
                    continue
                allowed = True
                if verb != method:
                    continue
                try:
                    body = self._body() if method != "GET" else {}
                    result = getattr(api, name)(_Query(url.query), body, *m.groups())
                    self._send(HTTPStatus.OK, result)
                except KeyError as e:
                    self._send(HTTPStatus.NOT_FOUND, {"error": str(e.args[0]) if e.args else "not found"})
                except InvalidTransition as e:
                    self._send(HTTPStatus.CONFLICT, {"error": str(e)})
                except ValueError as e:
                    self._send(HTTPStatus.BAD_REQUEST, {"error": str(e)})
                except Exception:
                    log.exception("%s %s failed", method, self.path)
                    self._send(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "internal error, see server log"})
                return
            if allowed:
                self._send(HTTPStatus.METHOD_NOT_ALLOWED, {"error": f"{method} not allowed here"})
            else:
                self._send(HTTPStatus.NOT_FOUND, {"error": f"no route for {path}"})

        def _body(self) -> dict:
            length = int(self.headers.get("Content-Length") or 0)
            if not length:
                return {}
            if length > 1_000_000:
                raise ValueError("request body too large")
            try:
                data = json.loads(self.rfile.read(length))
            except json.JSONDecodeError:
                raise ValueError("request body must be JSON") from None
            if not isinstance(data, dict):
                raise ValueError("request body must be a JSON object")
            return data

        def _send(self, status: HTTPStatus, payload) -> None:
            data = json.dumps(payload, default=str, allow_nan=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, fmt, *args):
            log.debug("%s %s", self.address_string(), fmt % args)

    return Handler


def serve(console: Console, host: str = "127.0.0.1", port: int = 8000) -> None:
    server = ThreadingHTTPServer((host, port), make_handler(Api(console)))
    server.daemon_threads = True
    console.start()
    print(f"SmartDialX console API on http://{host}:{port}/api  (database: {console.path})")
    print("mock providers only; press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        console.close()
