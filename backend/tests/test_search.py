"""Unit tests using unittest, included in the Python standard library."""
import sys
import unittest
from pathlib import Path

# Import the backend package without installing the project as a wheel.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from algorithms.search import make_random_map, run_search, validate_map


class TestAlgorithms(unittest.TestCase):
    def test_empty_grid_finds_shortest_path(self):
        grid = {
            "rows": 5, "cols": 5, "obstacles": [],
            "start": {"row": 2, "col": 0}, "goal": {"row": 2, "col": 4},
        }
        for name in ("astar", "greedy"):
            with self.subTest(name=name):
                out = run_search(grid, name)
                self.assertEqual(out["status"], "found")
                self.assertEqual(out["stats"]["pathCost"], 4)
                self.assertEqual(out["path"][0], grid["start"])
                self.assertEqual(out["path"][-1], grid["goal"])

    def test_astar_detours_around_wall(self):
        # The only gap in the middle wall is on the top edge.
        grid = {
            "rows": 5, "cols": 5,
            "obstacles": [r * 5 + 2 for r in range(1, 5)],
            "start": {"row": 2, "col": 0}, "goal": {"row": 2, "col": 4},
        }
        result = run_search(grid, "astar")
        self.assertEqual(result["stats"]["pathCost"], 8)

    def test_unreachable_goal(self):
        grid = {
            "rows": 5, "cols": 5,
            "obstacles": [r * 5 + 2 for r in range(5)],
            "start": {"row": 2, "col": 0}, "goal": {"row": 2, "col": 4},
        }
        for name in ("astar", "greedy"):
            result = run_search(grid, name)
            self.assertEqual(result["status"], "no_path")
            self.assertEqual(result["path"], [])
            self.assertIsNone(result["stats"]["pathCost"])

    def test_frontier_is_a_real_snapshot(self):
        grid = {
            "rows": 5, "cols": 5, "obstacles": [],
            "start": {"row": 2, "col": 0}, "goal": {"row": 2, "col": 4},
        }
        result = run_search(grid, "greedy")
        self.assertGreater(len(result["frames"][0]["frontier"]), 0)
        self.assertEqual(
            len(result["frames"][0]["frontier"]),
            len(result["frames"][0]["frontierDetails"]),
        )

    def test_start_equals_goal(self):
        grid = {
            "rows": 5, "cols": 5, "obstacles": [],
            "start": {"row": 1, "col": 1}, "goal": {"row": 1, "col": 1},
        }
        result = run_search(grid, "astar")
        self.assertEqual(result["stats"]["pathCost"], 0)
        self.assertEqual(result["stats"]["nodesExpanded"], 0)

    def test_reproducible_maps(self):
        self.assertEqual(make_random_map(10, 0.2, 41), make_random_map(10, 0.2, 41))
        self.assertNotEqual(make_random_map(10, 0.2, 41), make_random_map(10, 0.2, 42))

    def test_invalid_obstacle_is_rejected(self):
        grid = {
            "rows": 5, "cols": 5, "obstacles": [26],
            "start": {"row": 0, "col": 0}, "goal": {"row": 4, "col": 4},
        }
        with self.assertRaises(ValueError):
            validate_map(grid)


if __name__ == "__main__":
    unittest.main()
