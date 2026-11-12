"""Greedy Best-First Search and A* for a static two-dimensional grid.

Based on the Lab 5 search method:
  * Keep a frontier of discovered nodes waiting to be explored.
  * Select the node with the smallest evaluation value.
  * Greedy uses f(n) = h(n); A* uses f(n) = g(n) + h(n).
  * Record visited nodes, parent links, the frontier, and the final path.

The lab uses a Python list and loops to find the smallest value. This project
uses heapq as the priority queue, as specified by the approved proposal.
There are no imported pathfinding or machine-learning algorithms.
"""
from __future__ import annotations

import heapq
import math
import random
import time
from typing import Any

Cell = tuple[int, int]
# Explicit and deterministic neighbour order; useful for demonstrating ties.
DIRECTIONS: tuple[Cell, ...] = ((-1, 0), (1, 0), (0, -1), (0, 1))


def to_position(cell: Cell) -> dict[str, int]:
    """Convert a Python (row, col) tuple to the JSON format used by React."""
    return {"row": cell[0], "col": cell[1]}


def validate_map(grid: dict[str, Any]) -> tuple[Cell, Cell, set[Cell]]:
    """Reject invalid dimensions, obstacles, or start/goal coordinates."""
    rows, cols = grid["rows"], grid["cols"]
    if not isinstance(rows, int) or not isinstance(cols, int) or not 2 <= rows <= 100 or not 2 <= cols <= 100:
        raise ValueError("Grid dimensions must be between 2 and 100.")
    start = (grid["start"]["row"], grid["start"]["col"])
    goal = (grid["goal"]["row"], grid["goal"]["col"])
    if any(not isinstance(v, int) for p in (start, goal) for v in p):
        raise ValueError("Start and goal coordinates must be whole numbers.")
    if any(not (0 <= p[0] < rows and 0 <= p[1] < cols) for p in (start, goal)):
        raise ValueError("Start and goal must be inside the grid.")
    obstacles = set()
    for index in grid.get("obstacles", []):
        if not isinstance(index, int) or not (0 <= index < rows * cols):
            raise ValueError("An obstacle index is outside the grid.")
        obstacles.add((index // cols, index % cols))
    if start in obstacles or goal in obstacles:
        raise ValueError("Start and goal cells cannot contain obstacles.")
    return start, goal, obstacles


def heuristic_value(cell: Cell, goal: Cell, heuristic: str) -> float:
    """Compute Manhattan or Euclidean distance to the goal."""
    dr, dc = abs(cell[0] - goal[0]), abs(cell[1] - goal[1])
    if heuristic == "manhattan":
        return float(dr + dc)
    if heuristic == "euclidean":
        return math.sqrt(dr * dr + dc * dc)
    raise ValueError("Heuristic must be 'manhattan' or 'euclidean'.")


def make_random_map(size: int, density: float, seed: int) -> dict[str, Any]:
    """Create a repeatable N×N test map without any external dataset."""
    if not 2 <= size <= 100 or not 0 <= density <= 0.8:
        raise ValueError("Invalid map size or density.")
    rng = random.Random(seed)
    start = {"row": size // 2, "col": 0}
    goal = {"row": size // 2, "col": size - 1}
    obstacles = []
    for r in range(size):
        for c in range(size):
            if (r, c) in ((start["row"], start["col"]), (goal["row"], goal["col"])):
                continue
            if rng.random() < density:
                obstacles.append(r * size + c)
    return {"rows": size, "cols": size, "obstacles": obstacles, "start": start, "goal": goal}


def run_search(
    grid: dict[str, Any],
    algorithm: str,
    heuristic: str = "manhattan",
    movement: str = "4dir",
    record_frames: bool = True,
) -> dict[str, Any]:
    """Run either algorithm on exactly one grid and return a detailed trace.

    Every frontier snapshot is the actual pending priority queue, with stale
    heap entries excluded. Goal testing happens when a node is removed from
    the frontier; a goal is tested but not expanded, as in the lab examples.
    """
    if algorithm not in ("astar", "greedy"):
        raise ValueError("Algorithm must be 'astar' or 'greedy'.")
    if movement != "4dir":
        raise ValueError("Only 4-direction movement is supported in this version.")
    if heuristic not in ("manhattan", "euclidean"):
        raise ValueError("Unknown heuristic.")

    start, goal, walls = validate_map(grid)
    rows, cols = grid["rows"], grid["cols"]
    clock_start = time.perf_counter()

    # Priority queue elements: (f(n), insertion-order, cell, g(n)).
    # In Greedy, the priority f(n) contains only h(n).
    queue: list[tuple[float, int, Cell, float]] = []
    order = 0
    heapq.heappush(queue, (heuristic_value(start, goal, heuristic), order, start, 0.0))

    # 'pending' is the live frontier. heapq can also contain stale entries
    # when A* discovers a cheaper route to a previously discovered cell.
    pending: dict[Cell, float] = {start: 0.0}
    best_g: dict[Cell, float] = {start: 0.0}
    parent: dict[Cell, Cell] = {}
    visited: set[Cell] = set()
    frames: list[dict[str, Any]] = []
    nodes_expanded = 0
    nodes_tested = 0
    max_frontier = 1
    reached = False

    def score(cell: Cell, cost: float) -> float:
        estimate = heuristic_value(cell, goal, heuristic)
        return estimate if algorithm == "greedy" else cost + estimate

    def snapshot(current: Cell, current_cost: float) -> None:
        """Save the selected cell and the frontier AFTER its processing."""
        if not record_frames:
            return
        # Sorted snapshots match the frontier-list tables in the lecture.
        entries = sorted(pending.items(), key=lambda x: (score(x[0], x[1]), x[0]))
        details = []
        for cell, cost in entries:
            h = heuristic_value(cell, goal, heuristic)
            details.append({
                **to_position(cell),
                "g": round(cost, 5),
                "h": round(h, 5),
                "f": round(score(cell, cost), 5),
            })
        frames.append({
            "explored": to_position(current),
            "frontier": [to_position(cell) for cell, _ in entries],
            "frontierDetails": details,
            "g": round(current_cost, 5),
            "h": round(heuristic_value(current, goal, heuristic), 5),
            "f": round(score(current, current_cost), 5),
        })

    while queue:
        _, _, current, old_cost = heapq.heappop(queue)
        # Ignore an older queue entry superseded by a cheaper A* route.
        if current not in pending or old_cost != pending[current]:
            continue
        del pending[current]
        if current in visited:
            continue

        nodes_tested += 1
        if current == goal:
            reached = True
            snapshot(current, old_cost)
            break

        visited.add(current)
        nodes_expanded += 1

        for dr, dc in DIRECTIONS:
            neighbour = (current[0] + dr, current[1] + dc)
            nr, nc = neighbour
            if not (0 <= nr < rows and 0 <= nc < cols) or neighbour in walls:
                continue
            new_cost = old_cost + 1  # Every horizontal/vertical move costs 1.

            if algorithm == "greedy":
                # Greedy does not revisit a node already explored or pending.
                if neighbour in visited or neighbour in pending:
                    continue
            else:
                # A*: only keep a new route if it improves the known g(n).
                if new_cost >= best_g.get(neighbour, math.inf):
                    continue
                # Reopening is safe if an inconsistent heuristic is ever used.
                visited.discard(neighbour)

            best_g[neighbour] = new_cost
            parent[neighbour] = current
            pending[neighbour] = new_cost
            order += 1
            heapq.heappush(queue, (score(neighbour, new_cost), order, neighbour, new_cost))

        max_frontier = max(max_frontier, len(pending))
        snapshot(current, old_cost)

    path: list[Cell] = []
    if reached:
        node = goal
        path.append(node)
        while node != start:
            node = parent[node]
            path.append(node)
        path.reverse()

    # The timer excludes browser animation and network latency.
    elapsed_ms = (time.perf_counter() - clock_start) * 1000
    return {
        "frames": frames,
        "path": [to_position(cell) for cell in path],
        "status": "found" if reached else "no_path",
        "stats": {
            "pathCost": best_g[goal] if reached else None,
            "nodesExpanded": nodes_expanded,
            "nodesTested": nodes_tested,
            "maxFrontier": max_frontier,
            "executionTimeMs": round(elapsed_ms, 4),
        },
    }
