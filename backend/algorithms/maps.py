"""Shared obstacle maps for both the Streamlit and React visualizations.

Maps use the same JSON format in every interface:
  rows, cols, obstacles (row * cols + col), start, goal.
A U-shaped obstacle map deliberately gives Greedy a tempting but long detour.
"""
from __future__ import annotations

from typing import Any


def make_u_trap() -> dict[str, Any]:
    """The known suboptimal Greedy case used for the project experiments.

    Start=(12,4), Goal=(5,10), shape=13x15.
    With 4-direction unit moves and Manhattan distance, A* cost=15 and
    the repository's deterministic Greedy search cost=39.
    """
    rows, cols = 13, 15
    top, bottom, left, right = 2, 10, 4, 11
    walls = (
        {(top, c) for c in range(left, right + 1)}
        | {(bottom, c) for c in range(left, right + 1)}
        | {(r, right) for r in range(top, bottom + 1)}
    )
    return {
        "rows": rows,
        "cols": cols,
        "obstacles": sorted(r * cols + c for r, c in walls),
        "start": {"row": 12, "col": 4},
        "goal": {"row": 5, "col": 10},
    }


def make_open_grid(rows: int = 10, cols: int = 10) -> dict[str, Any]:
    """An empty grid, with a start and goal on opposite sides."""
    if not (2 <= rows <= 100 and 2 <= cols <= 100):
        raise ValueError("Grid dimensions must be between 2 and 100.")
    return {
        "rows": rows, "cols": cols, "obstacles": [],
        "start": {"row": rows // 2, "col": 0},
        "goal": {"row": rows // 2, "col": cols - 1},
    }


def from_ascii(lines: list[str]) -> dict[str, Any]:
    """Load a hand-designed map: '#'=wall, '.'=free, S=start, G=goal."""
    if not lines or any(len(line) != len(lines[0]) for line in lines):
        raise ValueError("An ASCII map must have rectangular rows.")
    rows, cols = len(lines), len(lines[0])
    if not (2 <= rows <= 100 and 2 <= cols <= 100):
        raise ValueError("Map dimensions must be between 2 and 100.")
    obstacles = []
    start = goal = None
    for r, line in enumerate(lines):
        for c, token in enumerate(line):
            if token == "#":
                obstacles.append(r * cols + c)
            elif token == "S":
                if start is not None:
                    raise ValueError("Map contains multiple start cells.")
                start = {"row": r, "col": c}
            elif token == "G":
                if goal is not None:
                    raise ValueError("Map contains multiple goal cells.")
                goal = {"row": r, "col": c}
            elif token != ".":
                raise ValueError("Unrecognized ASCII map cell.")
    if start is None or goal is None:
        raise ValueError("The ASCII map needs one S and one G.")
    return {"rows": rows, "cols": cols, "obstacles": obstacles, "start": start, "goal": goal}
