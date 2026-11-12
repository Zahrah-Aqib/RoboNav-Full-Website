"""Repeatable matched-map experiments with Greedy nonoptimality statistics.

This module is shared by the Python Streamlit app and the FastAPI website.
No model training, Kaggle files, or database are involved.
"""
from __future__ import annotations

from collections import defaultdict
from statistics import mean
from typing import Any

from algorithms.maps import make_u_trap
from algorithms.search import make_random_map, run_search


def paired_runs(grid: dict, heuristic: str = "manhattan", record_frames: bool = True) -> dict:
    """Always use the exact same map for A* and Greedy."""
    return {
        "astar": run_search(grid, "astar", heuristic, record_frames=record_frames),
        "greedy": run_search(grid, "greedy", heuristic, record_frames=record_frames),
    }


def run_experiments(
    grid_sizes: list[int],
    densities: list[float],
    seeds: list[int],
    heuristic: str = "manhattan",
    include_u_trap: bool = True,
) -> dict[str, Any]:
    """Return individual runs, grouped averages and the non-optimal Greedy rate.

    The non-optimality percentage uses only matched maps solved by BOTH
    algorithms as the denominator. Missing paths are counted separately.
    A* is the optimal reference under the four-direction unit-cost assumptions.
    """
    rows: list[dict] = []
    group_records: dict[tuple[int, float, str], list[dict]] = defaultdict(list)
    comparisons: list[dict] = []

    def add_pair(grid: dict, name: str, density: float | None, seed: int | None) -> None:
        # Timing does not include generating browser animation frames.
        result = paired_runs(grid, heuristic, record_frames=False)
        astar_cost = result["astar"]["stats"]["pathCost"]
        greedy_cost = result["greedy"]["stats"]["pathCost"]
        comparable = astar_cost is not None and greedy_cost is not None
        nonoptimal = bool(comparable and greedy_cost > astar_cost)
        comparisons.append({
            "mapName": name,
            "density": density,
            "seed": seed,
            "rows": grid["rows"],
            "cols": grid["cols"],
            "comparable": comparable,
            "greedyNonOptimal": nonoptimal if comparable else None,
            "astarCost": astar_cost,
            "greedyCost": greedy_cost,
        })

        for algorithm in ("astar", "greedy"):
            run = result[algorithm]
            stat = run["stats"]
            row = {
                "id": len(rows) + 1,
                "mapName": name,
                "rows": grid["rows"], "cols": grid["cols"],
                "density": density, "seed": seed,
                "algorithm": algorithm, "heuristic": heuristic,
                "status": run["status"],
                "pathCost": stat["pathCost"],
                "nodesExpanded": stat["nodesExpanded"],
                "nodesTested": stat["nodesTested"],
                "maxFrontier": stat["maxFrontier"],
                "executionTimeMs": stat["executionTimeMs"],
                "greedyNonOptimal": nonoptimal if comparable else None,
            }
            rows.append(row)
            if density is not None:
                group_records[(grid["rows"], density, algorithm)].append(row)

    for size in grid_sizes:
        for density in densities:
            for seed in seeds:
                grid = make_random_map(size, density, seed)
                add_pair(grid, f"Random {size}x{size} (seed {seed})", density, seed)

    if include_u_trap:
        add_pair(make_u_trap(), "U-shaped Greedy trap", None, None)

    summary = []
    for (size, density, algorithm), records in sorted(group_records.items()):
        successes = [r for r in records if r["status"] == "found"]
        pairs = [
            p for p in comparisons
            if p["rows"] == size and p["density"] == density and p["comparable"]
        ]
        summary.append({
            "size": size,
            "density": density,
            "algorithm": algorithm,
            "runs": len(records),
            "successes": len(successes),
            "avgPathCost": round(mean(r["pathCost"] for r in successes), 4) if successes else None,
            "avgNodesExpanded": round(mean(r["nodesExpanded"] for r in records), 4),
            "avgMaxFrontier": round(mean(r["maxFrontier"] for r in records), 4),
            "avgExecutionTimeMs": round(mean(r["executionTimeMs"] for r in records), 4),
            "comparableRuns": len(pairs),
            "nonOptimalGreedyCount": sum(p["greedyNonOptimal"] for p in pairs),
            "greedyNonOptimalPct": (
                round(100 * sum(p["greedyNonOptimal"] for p in pairs) / len(pairs), 2)
                if pairs else None
            ),
        })
    valid = [p for p in comparisons if p["comparable"]]
    nonoptimal_count = sum(p["greedyNonOptimal"] for p in valid)
    return {
        "rows": rows,
        "summary": summary,
        "comparisons": comparisons,
        "overall": {
            "mapsTested": len(comparisons),
            "comparableRuns": len(valid),
            "nonOptimalGreedyCount": nonoptimal_count,
            "greedyNonOptimalPct": (
                round(100 * nonoptimal_count / len(valid), 2) if valid else None
            ),
        },
    }
