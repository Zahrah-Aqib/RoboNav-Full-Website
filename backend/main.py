"""FastAPI entry point for the RoboNav React website.

Start with: python -m uvicorn main:app --reload --port 8000
Run that command from the backend/ directory.
"""
from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from algorithms.search import run_search
from experiments import run_experiments

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


class ExperimentRequest(BaseModel):
    gridSizes: list[int] = Field(default_factory=lambda: [10, 20, 50])
    densities: list[float] = Field(default_factory=lambda: [0.1, 0.2, 0.3])
    seeds: list[int] = Field(default_factory=lambda: [1, 2, 3])
    heuristic: str = "manhattan"


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
    return run_experiments(sizes, densities, seeds, request.heuristic)
