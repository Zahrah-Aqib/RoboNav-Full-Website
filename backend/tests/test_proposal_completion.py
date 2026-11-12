"""Proposal-specific regression checks for the U-shaped map and Greedy nonoptimality."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from algorithms.maps import from_ascii, make_u_trap
from algorithms.search import run_search
from experiments import paired_runs, run_experiments


class TestProposalExperiments(unittest.TestCase):
    def test_u_trap_demonstrates_greedy_suboptimality(self):
        grid = make_u_trap()
        a = run_search(grid, "astar", "manhattan", record_frames=False)
        g = run_search(grid, "greedy", "manhattan", record_frames=False)
        self.assertEqual(a["stats"]["pathCost"], 15)
        self.assertEqual(g["stats"]["pathCost"], 39)
        self.assertGreater(g["stats"]["pathCost"], a["stats"]["pathCost"])

    def test_same_map_for_both_searches(self):
        runs = paired_runs(make_u_trap(), record_frames=False)
        self.assertEqual(set(runs), {"astar", "greedy"})
        self.assertTrue(all("stats" in run for run in runs.values()))

    def test_non_optimal_percentage(self):
        result = run_experiments([10], [0], [1], "manhattan", include_u_trap=True)
        self.assertEqual(result["overall"]["mapsTested"], 2)
        self.assertEqual(result["overall"]["comparableRuns"], 2)
        self.assertEqual(result["overall"]["nonOptimalGreedyCount"], 1)
        self.assertEqual(result["overall"]["greedyNonOptimalPct"], 50.0)
        self.assertEqual(len(result["rows"]), 4)
        self.assertEqual(len(result["comparisons"]), 2)

    def test_ascii_map_parsing(self):
        grid = from_ascii(["S..", ".#.", "..G"])
        self.assertEqual(grid["obstacles"], [4])
        self.assertEqual(grid["goal"], {"row": 2, "col": 2})

    def test_no_path_excluded_from_nonoptimal_rate(self):
        # With a fully closed wall, no algorithm can find the route.
        blocked = {
            "rows": 5, "cols": 5,
            "obstacles": [2, 7, 12, 17, 22],
            "start": {"row": 2, "col": 0},
            "goal": {"row": 2, "col": 4},
        }
        result = paired_runs(blocked, "manhattan", record_frames=False)
        self.assertEqual(result["astar"]["status"], "no_path")
        self.assertEqual(result["greedy"]["status"], "no_path")


if __name__ == "__main__":
    unittest.main()
