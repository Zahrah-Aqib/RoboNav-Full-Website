"""Repeatable experiments for the RoboNav report; no Kaggle data or database."""
from __future__ import annotations

from collections import defaultdict
from statistics import mean
from typing import Any

from algorithms.search import make_random_map, run_search


def run_experiments(
    grid_sizes: list[int],
    densities: list[float],
    seeds: list[int],
    heuristic: str = "manhattan",
) -> dict[str, Any]:
    """Run both algorithms on the SAME grid for every setting and seed."""
    rows = []
    groups: dict[tuple[int, float, str], list[dict[str, Any]]] = defaultdict(list)
    for size in grid_sizes:
        for density in densities:
            for seed in seeds:
                grid = make_random_map(size, density, seed)
                # Both planners receive the exact same generated map.
                for algorithm in ("astar", "greedy"):
                    run = run_search(grid, algorithm, heuristic, record_frames=False)
                    stats = run["stats"]
                    result = {
                        "id": len(rows) + 1,
                        "mapName": f"Random {size}x{size} (seed {seed})",
                        "rows": size, "cols": size,
                        "density": density, "seed": seed,
                        "algorithm": algorithm, "heuristic": heuristic,
                        "status": run["status"],
                        "pathCost": stats["pathCost"],
                        "nodesExpanded": stats["nodesExpanded"],
                        "nodesTested": stats["nodesTested"],
                        "maxFrontier": stats["maxFrontier"],
                        "executionTimeMs": stats["executionTimeMs"],
                    }
                    rows.append(result)
                    groups[(size, density, algorithm)].append(result)

    summary = []
    for (size, density, algorithm), records in sorted(groups.items()):
        successes = [r for r in records if r["status"] == "found"]
        summary.append({
            "size": size, "density": density, "algorithm": algorithm,
            "runs": len(records), "successes": len(successes),
            # Average successful path cost; null when all runs failed.
            "avgPathCost": round(mean(r["pathCost"] for r in successes), 4) if successes else None,
            "avgNodesExpanded": round(mean(r["nodesExpanded"] for r in records), 4),
            "avgMaxFrontier": round(mean(r["maxFrontier"] for r in records), 4),
            "avgExecutionTimeMs": round(mean(r["executionTimeMs"] for r in records), 4),
        })
    return {"rows": rows, "summary": summary}
