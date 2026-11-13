"""FastAPI entry point for the RoboNav React website.

Start with: python -m uvicorn main:app --reload --port 8000
Run that command from the backend/ directory.
"""
from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from algorithms.search import run_search
from experiments import run_experiments
from plotting import grid_plot_png, comparison_plot_png, experiments_plot_png

app = FastAPI(title="RoboNav API", version="1.0.0")

# For local development the React site is normally served on port 5173.
# Set ROBONAV_ALLOWED_ORIGINS to a comma-separated list for deployed domains.
allowed = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    *[s.strip() for s in os.getenv("ROBONAV_ALLOWED_ORIGINS", "").split(",") if s.strip()],
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class Position(BaseModel):
    row: int
    col: int


class GridInput(BaseModel):
    rows: int = Field(ge=2, le=100)
    cols: int = Field(ge=2, le=100)
    obstacles: list[int] = Field(default_factory=list, max_length=10000)
    start: Position
    goal: Position


class RunRequest(BaseModel):
    map: GridInput
    algorithm: str = "astar"
    heuristic: str = "manhattan"
    movement: str = "4dir"


class CompareRequest(BaseModel):
    map: GridInput
    algorithms: list[str] = Field(default_factory=lambda: ["astar", "greedy"])
    heuristic: str = "manhattan"
    movement: str = "4dir"


class VisualizeRequest(BaseModel):
    map: GridInput
    algorithm: str = "astar"
    heuristic: str = "manhattan"
    mode: str = "single"
    step: int = Field(default=0, ge=0, le=20000)


class ExperimentRequest(BaseModel):
    gridSizes: list[int] = Field(default_factory=lambda: [10, 20, 50])
    densities: list[float] = Field(default_factory=lambda: [0.1, 0.2, 0.3])
    seeds: list[int] = Field(default_factory=lambda: [1, 2, 3])
    heuristic: str = "manhattan"
    includeUTrap: bool = True


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "RoboNav Python API"}


@app.post("/api/run")
def run_one(request: RunRequest) -> dict:
    try:
        return run_search(
            request.map.model_dump(),
            request.algorithm,
            request.heuristic,
            request.movement,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/compare")
def compare(request: CompareRequest) -> dict:
    try:
        if set(request.algorithms) != {"astar", "greedy"}:
            raise ValueError("Comparison must request both A* and Greedy.")
        grid = request.map.model_dump()
        astar = run_search(grid, "astar", request.heuristic, request.movement)
        greedy = run_search(grid, "greedy", request.heuristic, request.movement)
        return {
            "astar": astar,
            "greedy": greedy,
            "timings": {
                "astar": astar["stats"]["executionTimeMs"],
                "greedy": greedy["stats"]["executionTimeMs"],
            },
        }
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/visualize")
def visualize_python(request: VisualizeRequest) -> Response:
    """Generate a genuine Python Matplotlib PNG for the website's new tab."""
    try:
        if request.mode not in ("single", "comparison"):
            raise ValueError("View mode must be 'single' or 'comparison'.")
        if request.heuristic not in ("manhattan", "euclidean"):
            raise ValueError("Unsupported heuristic.")
        if request.algorithm not in ("astar", "greedy"):
            raise ValueError("Unsupported search algorithm.")
        grid = request.map.model_dump()
        # Reuse the exact same Python algorithms as the interactive simulator.
        if request.mode == "comparison":
            a = run_search(grid, "astar", request.heuristic)
            g = run_search(grid, "greedy", request.heuristic)
            picture = comparison_plot_png(grid, a, g, request.step, request.heuristic)
        else:
            result = run_search(grid, request.algorithm, request.heuristic)
            picture = grid_plot_png(
                grid, result, request.step, request.algorithm, request.heuristic
            )
        return Response(
            picture, media_type="image/png",
            headers={"Cache-Control": "no-store"},
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/visualize/experiments")
def visualize_experiments(request: ExperimentRequest) -> Response:
    """Generate four real performance charts in Matplotlib for React."""
    sizes, densities, seeds = request.gridSizes, request.densities, request.seeds
    if (
        not sizes or not densities or not seeds
        or len(sizes) > 5 or len(densities) > 5 or len(seeds) > 10
        or len(sizes) * len(densities) * len(seeds) > 90
        or any(not 2 <= size <= 100 for size in sizes)
        or any(not 0 <= density <= 0.8 for density in densities)
        or request.heuristic not in ("manhattan", "euclidean")
    ):
        raise HTTPException(status_code=422, detail="Invalid experiment configuration.")
    measured = run_experiments(
        sizes, densities, seeds, request.heuristic, request.includeUTrap
    )
    picture = experiments_plot_png(measured)
    return Response(
        picture, media_type="image/png",
        headers={"Cache-Control": "no-store"},
    )


@app.post("/api/experiments")
def experiments(request: ExperimentRequest) -> dict:
    # Keep expensive batch requests bounded on the free / student backend.
    sizes, densities, seeds = request.gridSizes, request.densities, request.seeds
    if (
        not sizes or not densities or not seeds
        or len(sizes) > 5 or len(densities) > 5 or len(seeds) > 10
        or len(sizes) * len(densities) * len(seeds) > 90
        or any(not 2 <= size <= 100 for size in sizes)
        or any(not 0 <= density <= 0.8 for density in densities)
        or request.heuristic not in ("manhattan", "euclidean")
    ):
        raise HTTPException(status_code=422, detail="Invalid or overly large experiment request.")
    return run_experiments(sizes, densities, seeds, request.heuristic, request.includeUTrap)
