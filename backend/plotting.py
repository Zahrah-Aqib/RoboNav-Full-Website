"""Real Matplotlib figures for the React website's Python Visualization tab.

Pygame and Tkinter are alternative desktop libraries in the proposal.
Matplotlib is the selected proposal-compliant Python visualization library.

The same from-scratch backend/algorithms/search.py provides search traces
for this page, the React simulator, and the Streamlit companion.
"""
from __future__ import annotations

import io
from typing import Any

import matplotlib
matplotlib.use("Agg")  # Needed on Render, CI and headless Linux hosts.
import matplotlib.pyplot as plt
from matplotlib.colors import BoundaryNorm, ListedColormap
from matplotlib.patches import Patch
import numpy as np


# No plots are hard-coded: colors are assigned from actual search frames.
COLORS = [
    "#101d30",  # empty cell
    "#556579",  # wall/obstacle
    "#137891",  # expanded cell
    "#c58a2b",  # live frontier
    "#22c7bf",  # discovered path
    "#65cb8a",  # start
    "#ef7180",  # goal
    "#ffe58b",  # moving robot
]
CMAP = ListedColormap(COLORS)
NORM = BoundaryNorm(np.arange(-0.5, len(COLORS) + 0.5), CMAP.N)

LEGEND = [
    Patch(facecolor=COLORS[1], label="Obstacle"),
    Patch(facecolor=COLORS[2], label="Explored"),
    Patch(facecolor=COLORS[3], label="Frontier"),
    Patch(facecolor=COLORS[4], label="Path"),
    Patch(facecolor=COLORS[5], label="Start"),
    Patch(facecolor=COLORS[6], label="Goal"),
    Patch(facecolor=COLORS[7], label="Robot"),
]


def _board(grid: dict[str, Any], result: dict[str, Any], step: int) -> tuple[np.ndarray, str]:
    """Convert the search result's actual frames into a colored NumPy grid.

    The first N steps show node expansion and live frontier positions.
    Later steps animate the robot moving along the computed final path.
    """
    rows, cols = grid["rows"], grid["cols"]
    pixels = np.zeros((rows, cols), dtype=np.uint8)
    for i in grid["obstacles"]:
        pixels[i // cols, i % cols] = 1

    frames = result["frames"]
    path = result["path"]
    expanded_count = min(max(step, 0), len(frames))
    for frame in frames[:expanded_count]:
        p = frame["explored"]
        pixels[p["row"], p["col"]] = 2

    state = "Ready"
    if expanded_count and step <= len(frames):
        current = frames[expanded_count - 1]
        for p in current["frontier"]:
            pixels[p["row"], p["col"]] = 3
        p = current["explored"]
        state = f'Expanded ({p["row"]}, {p["col"]}) | g={current["g"]} h={current["h"]} f={current["f"]}'

    travelled = min(max(step - len(frames), 0), len(path))
    if travelled:
        for p in path[:travelled]:
            pixels[p["row"], p["col"]] = 4
        robot = path[travelled - 1]
        pixels[robot["row"], robot["col"]] = 7
        state = f'Robot travelled {travelled}/{len(path)} path cells'
    elif step > len(frames) and not path:
        state = "No path found"
    elif step == len(frames) and frames:
        state += " | Search complete"

    start, goal = grid["start"], grid["goal"]
    pixels[start["row"], start["col"]] = 5
    pixels[goal["row"], goal["col"]] = 6
    return pixels, state


def _draw(
    axis: Any, grid: dict[str, Any], result: dict[str, Any],
    step: int, title: str,
) -> None:
    pixels, status = _board(grid, result, step)
    rows, cols = grid["rows"], grid["cols"]
    axis.imshow(pixels, cmap=CMAP, norm=NORM, interpolation="nearest")
    axis.set_facecolor(COLORS[0])
    axis.set_xticks(np.arange(-0.5, cols, 1), minor=True)
    axis.set_yticks(np.arange(-0.5, rows, 1), minor=True)
    axis.grid(which="minor", color="#8798af", alpha=0.3, linewidth=0.55)
    axis.tick_params(which="minor", bottom=False, left=False)
    axis.set_xticks(np.arange(cols) if cols <= 22 else np.arange(0, cols, 5))
    axis.set_yticks(np.arange(rows) if rows <= 22 else np.arange(0, rows, 5))
    axis.tick_params(colors="#dde8ef", labelsize=8)
    axis.set_xlabel("Column", color="#dcecf5", fontsize=9)
    axis.set_ylabel("Row", color="#dcecf5", fontsize=9)
    axis.set_title(title, fontsize=13, color="#eaffff", pad=18, weight="semibold")
    axis.text(grid["start"]["col"], grid["start"]["row"], "S",
              color="#081320", ha="center", va="center", weight="bold")
    axis.text(grid["goal"]["col"], grid["goal"]["row"], "G",
              color="#081320", ha="center", va="center", weight="bold")
    axis.text(0.0, -0.10, status, transform=axis.transAxes,
              color="#cddde7", fontsize=8, va="top", clip_on=False)


def _png(fig: Any) -> bytes:
    memory = io.BytesIO()
    fig.savefig(memory, format="png", dpi=125, facecolor=fig.get_facecolor(),
                bbox_inches="tight", pad_inches=0.27)
    plt.close(fig)
    return memory.getvalue()


def grid_plot_png(
    grid: dict[str, Any], run: dict[str, Any], step: int,
    algorithm: str, heuristic: str
) -> bytes:
    """Return a ready-to-display PNG for the requested algorithm and step."""
    fig, ax = plt.subplots(figsize=(max(6, min(12, grid["cols"] * 0.55)),
                                    max(5, min(10, grid["rows"] * 0.55))))
    fig.patch.set_facecolor("#091726")
    _draw(ax, grid, run, step,
          ("A* Search" if algorithm == "astar" else "Greedy Best-First") + " | " + heuristic.title())
    fig.legend(handles=LEGEND, loc="lower center", ncol=4,
               bbox_to_anchor=(0.5, -0.075), fontsize=8,
               facecolor="#132438", edgecolor="#526276", labelcolor="white")
    fig.subplots_adjust(bottom=0.18, top=0.91)
    return _png(fig)


def comparison_plot_png(
    grid: dict[str, Any], astar: dict[str, Any],
    greedy: dict[str, Any], step: int, heuristic: str
) -> bytes:
    """Display matched A* and Greedy search figures side by side."""
    width = max(10, min(17, grid["cols"] * 0.9))
    fig, axes = plt.subplots(1, 2, figsize=(width, max(5.3, grid["rows"] * 0.46)))
    fig.patch.set_facecolor("#091726")
    _draw(axes[0], grid, astar, step, "A*: f(n) = g(n) + h(n)")
    _draw(axes[1], grid, greedy, step, "Greedy: f(n) = h(n)")
    fig.suptitle(
        "Same grid, same start/goal, same " + heuristic.title() + " heuristic",
        fontsize=13, color="#f3fbff", y=0.98,
    )
    fig.legend(handles=LEGEND, loc="lower center", ncol=7,
               bbox_to_anchor=(0.5, -0.04), fontsize=8,
               facecolor="#132438", edgecolor="#526276", labelcolor="white")
    fig.subplots_adjust(left=0.06, right=0.96, bottom=0.20,
                        top=0.87, wspace=0.30)
    return _png(fig)


def experiments_plot_png(results: dict[str, Any]) -> bytes:
    """Four real performance graphs generated from matched Python runs."""
    fig, axes = plt.subplots(2, 2, figsize=(14, 9))
    fig.patch.set_facecolor("#091726")
    mapping = [
        ("avgPathCost", "Average successful path cost"),
        ("avgNodesExpanded", "Average nodes expanded"),
        ("avgMaxFrontier", "Average maximum frontier"),
        ("avgExecutionTimeMs", "Average execution time (ms)"),
    ]
    summary = results["summary"]
    sizes = sorted({r["size"] for r in summary})
    for ax, (key, title) in zip(axes.flat, mapping):
        ax.set_facecolor("#15253a")
        for size in sizes:
            for algo, color, style in (
                ("astar", "#2bbcd5", "-o"),
                ("greedy", "#f6b44c", "--s"),
            ):
                series = sorted(
                    (r for r in summary
                     if r["size"] == size and r["algorithm"] == algo
                     and r[key] is not None),
                    key=lambda r: r["density"],
                )
                if not series:
                    continue
                ax.plot(
                    [100 * r["density"] for r in series],
                    [r[key] for r in series],
                    style, color=color, lw=1.75, markersize=5,
                    label=f'{size}×{size} {algo.upper()}',
                )
        ax.set_title(title, fontsize=12, color="white")
        ax.set_xlabel("Obstacle density (%)", color="#dfebf5")
        ax.tick_params(colors="#d5e2ec")
        ax.grid(alpha=0.2)
        ax.legend(fontsize=7, loc="best", framealpha=0.75)
    fig.suptitle(
        "RoboNav | Measured experiment results (not demo data)",
        fontsize=17, weight="bold", color="#f4fdff",
    )
    fig.subplots_adjust(hspace=0.36, wspace=0.24, top=0.9)
    return _png(fig)
