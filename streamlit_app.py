"""RoboNav: Streamlit and Matplotlib companion to the React website.

Uses exactly the same backend/algorithms/search.py as the React FastAPI
frontend. Every figure and result comes from that Python search algorithm.
"""
from __future__ import annotations

import io
import json
import random
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import BoundaryNorm, ListedColormap
import numpy as np
import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "backend"))

from algorithms.maps import from_ascii, make_open_grid, make_u_trap
from algorithms.search import run_search, validate_map
from experiments import paired_runs, run_experiments
from report import make_report_pdf

st.set_page_config(page_title="RoboNav Python", page_icon="🤖", layout="wide")
PALETTE = ["#111d30", "#4a5670", "#126e86", "#aa7a29",
           "#19c7bf", "#6cca7c", "#f17c83", "#fff39b"]
CMAP = ListedColormap(PALETTE)
NORM = BoundaryNorm(np.arange(-0.5, 8.5, 1), 8)


def random_grid(rows: int, cols: int, density: float, seed: int) -> dict:
    """Generate a repeatable obstacle map from a fixed random seed."""
    grid = make_open_grid(rows, cols)
    rng = random.Random(seed)
    start = grid["start"]
    goal = grid["goal"]
    grid["obstacles"] = [
        r * cols + c for r in range(rows) for c in range(cols)
        if (r, c) not in (
            (start["row"], start["col"]),
            (goal["row"], goal["col"]),
        ) and rng.random() < density
    ]
    return grid


def map_plot(grid: dict, result: dict | None = None,
             step: int = 0, title: str = "Robot navigation"):
    """Draw exploration, frontier, path and moving robot on the 2D grid."""
    rows, cols = grid["rows"], grid["cols"]
    board = np.zeros((rows, cols), dtype=np.uint8)
    for index in grid["obstacles"]:
        board[index // cols, index % cols] = 1

    if result is not None and step:
        frames = result["frames"]
        for frame in frames[:min(step, len(frames))]:
            p = frame["explored"]
            board[p["row"], p["col"]] = 2

        if 0 < step <= len(frames):
            for p in frames[step - 1]["frontier"]:
                board[p["row"], p["col"]] = 3

        walked = max(0, step - len(frames))
        if walked and result["path"]:
            for p in result["path"][:walked]:
                board[p["row"], p["col"]] = 4
            robot = result["path"][min(walked - 1, len(result["path"]) - 1)]
            board[robot["row"], robot["col"]] = 7

    start, goal = grid["start"], grid["goal"]
    board[start["row"], start["col"]] = 5
    board[goal["row"], goal["col"]] = 6

    fig, ax = plt.subplots(
        figsize=(min(11, max(5, cols * 0.46)),
                 min(9, max(4, rows * 0.46))), dpi=105
    )
    fig.patch.set_facecolor("#091626")
    ax.set_facecolor("#091626")
    ax.imshow(board, cmap=CMAP, norm=NORM, interpolation="nearest")
    ax.set_xticks(np.arange(-0.5, cols, 1), minor=True)
    ax.set_yticks(np.arange(-0.5, rows, 1), minor=True)
    ax.grid(which="minor", color="#64748b", alpha=0.35)
    ax.tick_params(which="minor", bottom=False, left=False)
    ax.set_xticks(np.arange(cols) if cols <= 20 else np.arange(0, cols, 5))
    ax.set_yticks(np.arange(rows) if rows <= 20 else np.arange(0, rows, 5))
    ax.tick_params(colors="#cbd5e1", labelsize=8)
    ax.set_xlabel("Column", color="#cbd5e1")
    ax.set_ylabel("Row", color="#cbd5e1")
    ax.set_title(title, color="white", fontsize=12, pad=10)
    ax.text(start["col"], start["row"], "S", ha="center",
            va="center", color="#04111d", fontweight="bold")
    ax.text(goal["col"], goal["row"], "G", ha="center",
            va="center", color="#04111d", fontweight="bold")
    fig.tight_layout()
    return fig


def display_plot(grid, result=None, step=0, title="Robot navigation"):
    """Display a Matplotlib figure and close it to avoid memory leaks."""
    fig = map_plot(grid, result, step, title)
    st.pyplot(fig, use_container_width=True)
    plt.close(fig)


def sidebar_map():
    """A fully configurable 2D map, including checkbox obstacle editing."""
    st.sidebar.subheader("Grid map")
    source = st.sidebar.selectbox(
        "Map source",
        ["Random", "Empty", "U-shaped trap", "Upload JSON", "ASCII map"]
    )
    if source == "U-shaped trap":
        grid = make_u_trap()
        st.sidebar.caption("Known case: A* cost 15, Greedy cost 39 (Manhattan).")
    elif source == "Upload JSON":
        uploaded = st.sidebar.file_uploader("Choose a grid JSON", type="json")
        if uploaded is None:
            grid = make_open_grid()
        else:
            try:
                grid = json.load(uploaded)
                validate_map(grid)
            except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
                st.sidebar.error("Invalid JSON map: " + str(error))
                st.stop()
    elif source == "ASCII map":
        text = st.sidebar.text_area(
            "S=start, G=goal, #=wall, .=empty",
            "S.....\n..##..\n......\n..##..\n.....G",
            height=150
        )
        try:
            grid = from_ascii([s.strip() for s in text.splitlines() if s.strip()])
        except ValueError as error:
            st.sidebar.error(str(error))
            st.stop()
    else:
        rows = int(st.sidebar.number_input("Rows", 2, 100, 12))
        cols = int(st.sidebar.number_input("Columns", 2, 100, 16))
        if source == "Empty":
            grid = make_open_grid(rows, cols)
        else:
            density = st.sidebar.slider("Obstacle density", 0, 60, 20, 5) / 100
            seed = int(st.sidebar.number_input("Random seed", 0, 100000, 12))
            grid = random_grid(rows, cols, density, seed)

    if st.sidebar.checkbox("Customize start and goal", False):
        for label, key in [("Start", "start"), ("Goal", "goal")]:
            row = st.sidebar.number_input(
                label + " row", 0, grid["rows"] - 1, int(grid[key]["row"])
            )
            col = st.sidebar.number_input(
                label + " column", 0, grid["cols"] - 1, int(grid[key]["col"])
            )
            grid[key] = {"row": int(row), "col": int(col)}

    # A native Streamlit checkbox table acts as a direct wall editor.
    if grid["rows"] <= 25 and grid["cols"] <= 25:
        if st.sidebar.checkbox("Manually edit obstacle cells", False):
            st.sidebar.caption("Check or uncheck cells to place or erase walls.")
            matrix = np.zeros((grid["rows"], grid["cols"]), dtype=bool)
            for index in grid["obstacles"]:
                matrix[index // grid["cols"], index % grid["cols"]] = True
            data = pd.DataFrame(
                matrix,
                index=["R" + str(r) for r in range(grid["rows"])],
                columns=["C" + str(c) for c in range(grid["cols"])],
            )
            edited = st.data_editor(
                data, use_container_width=True, height=min(560, 80 + grid["rows"] * 35),
                key="map_editor_" + source
            )
            grid["obstacles"] = [
                r * grid["cols"] + c
                for r in range(grid["rows"]) for c in range(grid["cols"])
                if bool(edited.iloc[r, c])
            ]

    # Make sure start/goal cells are never obstacles.
    forbidden = {
        grid["start"]["row"] * grid["cols"] + grid["start"]["col"],
        grid["goal"]["row"] * grid["cols"] + grid["goal"]["col"],
    }
    grid["obstacles"] = sorted(set(grid["obstacles"]) - forbidden)
    try:
        validate_map(grid)
    except (ValueError, KeyError, TypeError) as error:
        st.sidebar.error(str(error))
        st.stop()
    st.sidebar.download_button(
        "Save this map as JSON", json.dumps(grid, indent=2),
        file_name="robonav-map.json", mime="application/json",
        use_container_width=True,
    )
    return grid


def stats_cards(result):
    """Display actual backend measurements, never placeholder values."""
    stat = result["stats"]
    c = st.columns(4)
    c[0].metric("Path cost", stat["pathCost"] if stat["pathCost"] is not None else "No path")
    c[1].metric("Nodes expanded", stat["nodesExpanded"])
    c[2].metric("Maximum frontier", stat["maxFrontier"])
    c[3].metric("Time (ms)", f'{stat["executionTimeMs"]:.3f}')


def step_control(result, key):
    """Select a search step or one step of robot travel."""
    search_frames = len(result["frames"])
    max_step = search_frames + len(result["path"])
    st.caption(
        "First " + str(search_frames) + " frames show frontier exploration; "
        "subsequent frames move the robot along the discovered path."
    )
    step = st.slider("Animation step", 0, max_step, 0, key=key)
    if 0 < step <= search_frames:
        frame = result["frames"][step - 1]
        p = frame["explored"]
        st.caption(
            "Selected (" + str(p["row"]) + "," + str(p["col"]) + ")"
            " | g=" + str(frame["g"]) + " | h=" + str(frame["h"])
            + " | f=" + str(frame["f"])
        )
        st.markdown("**Actual frontier list after this expansion**")
        details = pd.DataFrame(frame["frontierDetails"])
        if details.empty:
            st.info("Frontier is empty.")
        else:
            st.dataframe(details, hide_index=True, use_container_width=True)
    return step


def simulator():
    st.header("2D Grid Simulator")
    st.write("Configure obstacles and see real frontier and final route visualizations.")
    grid = sidebar_map()
    algo = st.selectbox("Algorithm", ["A* Search", "Greedy Best-First Search"])
    heuristic = st.selectbox("Heuristic", ["manhattan", "euclidean"])
    signature = json.dumps(grid, sort_keys=True) + algo + heuristic
    if st.session_state.get("sim_signature") != signature:
        st.session_state["sim_result"] = None
        st.session_state["sim_signature"] = signature
        st.session_state.pop("sim_step", None)

    if st.button("Run navigation", type="primary"):
        key = "astar" if algo == "A* Search" else "greedy"
        st.session_state["sim_result"] = run_search(grid, key, heuristic)
        st.session_state.pop("sim_step", None)

    result = st.session_state.get("sim_result")
    if result:
        stats_cards(result)
        if result["status"] != "found":
            st.warning("No route exists. The frontier was exhausted.")
        step = step_control(result, "sim_step")
        display_plot(grid, result, step, algo)
    else:
        display_plot(grid, title="Input map (S=start, G=goal)")


def comparison():
    st.header("A* vs Greedy: same grid, fair comparison")
    grid = sidebar_map()
    heuristic = st.selectbox("Shared heuristic", ["manhattan", "euclidean"])
    signature = json.dumps(grid, sort_keys=True) + heuristic
    if st.session_state.get("comparison_signature") != signature:
        st.session_state["comparison_result"] = None
        st.session_state["comparison_signature"] = signature
        st.session_state.pop("compare_step", None)
    if st.button("Run both algorithms", type="primary"):
        st.session_state["comparison_result"] = paired_runs(grid, heuristic)
        st.session_state.pop("compare_step", None)
    result = st.session_state.get("comparison_result")
    if not result:
        display_plot(grid, title="Shared grid")
        return
    a, g = result["astar"], result["greedy"]
    length = max(len(a["frames"]) + len(a["path"]),
                 len(g["frames"]) + len(g["path"]))
    step = st.slider("Shared animation step", 0, length, 0, key="compare_step")
    left, right = st.columns(2)
    for col, name, run in [
        (left, "A* | f(n)=g(n)+h(n)", a),
        (right, "Greedy | f(n)=h(n)", g)
    ]:
        with col:
            st.subheader(name)
            display_plot(grid, run, step, name)
            stats_cards(run)
    ac, gc = a["stats"]["pathCost"], g["stats"]["pathCost"]
    if ac is not None and gc is not None:
        difference = gc - ac
        st.info("Greedy cost - A* cost = " + str(difference)
                + (" (Greedy is non-optimal)." if difference > 0 else " (equal costs)."))
    else:
        st.warning("No path was found by one or both algorithms.")


def experiment_lab():
    st.header("Experiment Lab")
    st.write("Matched maps with reproducible random seeds, plus a U-shaped trap.")
    sizes = st.multiselect("Grid sizes", [10, 20, 50, 100], [10, 20, 50])
    densities = st.multiselect("Obstacle density (%)", [0, 10, 20, 30, 40], [10, 20, 30])
    nseeds = st.slider("Number of seeds", 1, 8, 3)
    heuristic = st.selectbox("Heuristic", ["manhattan", "euclidean"], key="lab_heuristic")
    include_trap = st.checkbox("Add U-shaped Greedy trap", value=True)
    if st.button("Run real experiments", type="primary"):
        if not sizes or not densities:
            st.error("Choose at least one size and one obstacle density.")
        else:
            with st.spinner("Running measured Python searches..."):
                st.session_state["batch_result"] = run_experiments(
                    sizes, [d / 100 for d in densities],
                    list(range(1, nseeds + 1)), heuristic, include_trap
                )
    data = st.session_state.get("batch_result")
    if not data:
        st.info("Choose settings and run the experiment batch.")
        return
    overall = data["overall"]
    c = st.columns(3)
    c[0].metric("Maps tested", overall["mapsTested"])
    c[1].metric("Solved by both", overall["comparableRuns"])
    rate = overall["greedyNonOptimalPct"]
    c[2].metric("Non-optimal Greedy %", str(rate) + "%" if rate is not None else "N/A")
    st.caption(
        "Non-optimal Greedy % = 100 × (maps where Greedy cost > A* cost)"
        " / (maps solved by both algorithms). Unsolved maps are reported separately."
    )
    summary = pd.DataFrame(data["summary"])
    rows = pd.DataFrame(data["rows"])
    st.subheader("Group averages")
    st.dataframe(summary, hide_index=True, use_container_width=True)
    st.subheader("Every measured run")
    st.dataframe(rows, hide_index=True, use_container_width=True, height=320)
    st.download_button("Download all runs (CSV)", rows.to_csv(index=False),
                       "robonav_runs.csv", "text/csv")
    st.download_button("Download group averages (CSV)", summary.to_csv(index=False),
                       "robonav_summary.csv", "text/csv")

    metrics = ["avgNodesExpanded", "avgPathCost", "avgMaxFrontier",
               "avgExecutionTimeMs"]
    metric = st.selectbox("Graph metric", metrics)
    fig, ax = plt.subplots(figsize=(9, 4.5))
    for size in sizes:
        for algo, color in (("astar", "#1ab6d2"), ("greedy", "#e9a52c")):
            samples = sorted(
                (r for r in data["summary"] if r["size"] == size
                 and r["algorithm"] == algo and r[metric] is not None),
                key=lambda r: r["density"],
            )
            if samples:
                ax.plot([100 * r["density"] for r in samples],
                        [r[metric] for r in samples], marker="o",
                        color=color, label=str(size) + "x" + str(size) + " " + algo)
    ax.set_title("Search performance vs obstacle density")
    ax.set_xlabel("Obstacle density (%)")
    ax.set_ylabel(metric)
    ax.grid(alpha=0.25)
    ax.legend(fontsize=8, ncol=2)
    fig.tight_layout()
    st.pyplot(fig, use_container_width=True)
    png = io.BytesIO()
    fig.savefig(png, format="png", dpi=180, bbox_inches="tight")
    st.download_button("Download Matplotlib chart (PNG)", png.getvalue(),
                       "robonav_chart.png", "image/png")
    # Build a real PDF report from the same measured rows and chart.
    pdf = make_report_pdf(data, png.getvalue())
    st.download_button("Download experimental report (PDF)", pdf,
                       "RoboNav_Experimental_Report.pdf", "application/pdf")
    plt.close(fig)
    if include_trap:
        st.subheader("Hand-designed U-shaped obstacle test")
        case = [p for p in data["comparisons"]
                if p["mapName"] == "U-shaped Greedy trap"]
        st.dataframe(pd.DataFrame(case), hide_index=True, use_container_width=True)


def methodology():
    st.header("Project methodology")
    st.markdown("""
    **State:** current (row, column); **start/goal:** designated free cells;
    **actions:** up, down, left, right; **transition cost:** 1 per move;
    **goal test:** selected cell equals destination.

    **Greedy Best-First Search:** f(n) = h(n), expanding the frontier node
    with the lowest estimated remaining cost.

    **A* Search:** f(n) = g(n) + h(n), including known travel cost.
    Its path is optimal on this static, four-direction, unit-cost grid
    under Manhattan or Euclidean heuristics.

    Both use Python heapq and a visited/explored set, with cost updates in A*.
    Actual search traces are visualized in Streamlit using Matplotlib and NumPy.

    **Experimental methodology:** Both algorithms use identical grids for
    every size, obstacle density and random seed. Compare path costs,
    nodes expanded, maximum frontier size and execution time.
    Separately test a U-shaped obstacle trap and unsolvable grids.
    Report the rate of non-optimal Greedy paths using successful matched runs
    as the denominator.

    **Final submission:** GitHub code, requirements, sample inputs,
    PDF project report with actual graphs/results, deployed app link,
    screenshots and a short demo video if requested.
    """)
    st.markdown(
        "Code repository: https://github.com/Zahrah-Aqib/RoboNav-Full-Website"
    )


st.sidebar.title("RoboNav")
st.sidebar.caption("Python-native robot navigation simulator")
page = st.sidebar.radio(
    "Pages", ["Grid Simulator", "Algorithm Comparison",
              "Experiment Lab", "Methodology"]
)
st.sidebar.divider()
st.sidebar.caption("Greedy Best-First Search and A* | AI Lab proposal")
st.title("RoboNav | Python Navigation")
st.caption("Streamlit + NumPy + Matplotlib • Real A* and Greedy search")

if page == "Grid Simulator":
    simulator()
elif page == "Algorithm Comparison":
    comparison()
elif page == "Experiment Lab":
    experiment_lab()
else:
    methodology()
