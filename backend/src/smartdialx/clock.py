"""Clocks. Real time for workers, a manual clock for simulations and tests."""

import threading
import time
from typing import Protocol


class Clock(Protocol):
    def now(self) -> float: ...


class SystemClock:
    def now(self) -> float:
        return time.time()


class SimClock:
    def __init__(self, start: float = 0.0):
        self._now = start
        self._lock = threading.Lock()

    def now(self) -> float:
        with self._lock:
            return self._now

    def advance(self, seconds: float) -> float:
        with self._lock:
            self._now += seconds
            return self._now

    def set(self, value: float) -> None:
        with self._lock:
            self._now = value
