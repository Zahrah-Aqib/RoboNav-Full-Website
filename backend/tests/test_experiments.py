"""Experiment tests: both algorithms must see matched generated grids."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from experiments import run_experiments


class TestExperiments(unittest.TestCase):
    def test_matched_runs(self):
        result = run_experiments([10], [0.1], [7, 8])
        self.assertEqual(len(result["rows"]), 4)
        self.assertEqual({r["algorithm"] for r in result["rows"]}, {"astar", "greedy"})
        self.assertEqual(len(result["summary"]), 2)
        self.assertTrue(all(r["seed"] in (7, 8) for r in result["rows"]))


if __name__ == "__main__":
    unittest.main()
