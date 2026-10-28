import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).parent.parent / "scripts" / "load_test.py"


def test_load_test_small_run_is_clean(tmp_path):
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "--agents", "5", "--calls", "200", "--workers", "6",
         "--db", str(tmp_path / "load.db")],
        capture_output=True, text=True, timeout=120,
    )
    assert out.returncode == 0, out.stdout + out.stderr
    assert "double allocations     0" in out.stdout
    assert "errors                 0" in out.stdout
