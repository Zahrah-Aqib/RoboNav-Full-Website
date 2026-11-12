"""Headless checks for Streamlit's default screen and generated PDF report."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from streamlit.testing.v1 import AppTest
from experiments import run_experiments
from report import make_report_pdf


def main():
    # Run the app in the test harness without opening a browser.
    app = AppTest.from_file(str(ROOT / "streamlit_app.py"), default_timeout=90)
    app.run()
    if app.exception:
        raise AssertionError("The Streamlit app raised an exception: " + str(app.exception))
    print("Streamlit default simulator loaded successfully.")

    # The generated report must use real computed Python measurements.
    result = run_experiments([10], [0], [1], include_u_trap=True)
    document = make_report_pdf(result)
    assert document.startswith(b"%PDF"), "The experimental report is not a valid PDF."
    assert len(document) > 2000, "Report PDF appears unexpectedly small."
    print("Measured experimental report produced successfully.")


if __name__ == "__main__":
    main()
