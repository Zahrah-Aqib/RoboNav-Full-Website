"""HTTP endpoint tests: validate the actual React-to-Python API contract."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from main import app


class TestApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.grid = {
            "rows": 5,
            "cols": 5,
            "obstacles": [],
            "start": {"row": 2, "col": 0},
            "goal": {"row": 2, "col": 4},
        }

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_run_endpoint(self):
        response = self.client.post("/api/run", json={
            "map": self.grid, "algorithm": "astar",
            "heuristic": "manhattan", "movement": "4dir",
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["stats"]["pathCost"], 4)
        self.assertEqual(result["status"], "found")
        self.assertTrue(result["frames"][0]["frontierDetails"])

    def test_compare_endpoint(self):
        response = self.client.post("/api/compare", json={
            "map": self.grid, "algorithms": ["astar", "greedy"],
            "heuristic": "manhattan", "movement": "4dir",
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["astar"]["stats"]["pathCost"], 4)
        self.assertEqual(result["greedy"]["stats"]["pathCost"], 4)

    def test_invalid_start(self):
        bad = {**self.grid, "start": {"row": 5, "col": 0}}
        response = self.client.post("/api/run", json={
            "map": bad, "algorithm": "astar", "heuristic": "manhattan"
        })
        self.assertEqual(response.status_code, 422)

    def test_experiment_endpoint(self):
        response = self.client.post("/api/experiments", json={
            "gridSizes": [10], "densities": [0.1], "seeds": [1, 2],
            "heuristic": "euclidean",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["rows"]), 6)
        self.assertIn("greedyNonOptimalPct", response.json()["overall"])


if __name__ == "__main__":
    unittest.main()
