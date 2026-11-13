"""Test the real Matplotlib PNG endpoints using the same Python search data."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from main import app


class TestPythonVisualizations(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.grid = {
            "rows": 5, "cols": 5, "obstacles": [7, 12, 17],
            "start": {"row": 2, "col": 0},
            "goal": {"row": 2, "col": 4},
        }

    def test_matplotlib_single_map(self):
        response = self.client.post("/api/visualize", json={
            "map": self.grid, "mode": "single",
            "algorithm": "astar", "heuristic": "manhattan", "step": 4,
        })
        self.assertEqual(response.status_code, 200, response.text[:200])
        self.assertEqual(response.headers["content-type"], "image/png")
        self.assertTrue(response.content.startswith(b"\x89PNG\r\n\x1a\n"))
        self.assertGreater(len(response.content), 4000)

    def test_matplotlib_comparison(self):
        response = self.client.post("/api/visualize", json={
            "map": self.grid, "mode": "comparison",
            "algorithm": "greedy", "heuristic": "euclidean", "step": 7,
        })
        self.assertEqual(response.status_code, 200, response.text[:200])
        self.assertTrue(response.content.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_matplotlib_experiment_figures(self):
        response = self.client.post("/api/visualize/experiments", json={
            "gridSizes": [10], "densities": [0.1], "seeds": [1, 2],
            "heuristic": "manhattan", "includeUTrap": True,
        })
        self.assertEqual(response.status_code, 200, response.text[:200])
        self.assertTrue(response.content.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_reject_invalid_view_mode(self):
        response = self.client.post("/api/visualize", json={
            "map": self.grid, "mode": "not-supported"
        })
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
