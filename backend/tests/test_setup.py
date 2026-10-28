"""Sanity checks for the dev environment."""

import sqlite3
import sys

import smartdialx


def test_package_imports():
    assert smartdialx.__version__ == "0.1.0"


def test_python_version():
    assert sys.version_info >= (3, 11)


def test_sqlite_has_returning():
    # reservations will use UPDATE ... RETURNING, which needs sqlite 3.35+
    assert sqlite3.sqlite_version_info >= (3, 35, 0)

    conn = sqlite3.connect(":memory:")
    try:
        conn.execute("CREATE TABLE t (id INTEGER PRIMARY KEY, state TEXT)")
        conn.execute("INSERT INTO t (state) VALUES ('AVAILABLE')")
        row = conn.execute(
            "UPDATE t SET state = 'RESERVED' WHERE state = 'AVAILABLE' RETURNING id"
        ).fetchone()
        assert row == (1,)
    finally:
        conn.close()
