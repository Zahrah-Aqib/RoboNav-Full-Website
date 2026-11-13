# RoboNav Full Website

**Robot Navigation in an Obstacle-Filled Environment: A Comparative Study of Greedy Best-First Search and A* Search**

The FINAL RoboNav Website is an eight-page React/TypeScript/Three.js app using a real Python FastAPI backend. It includes a new Python Visualizations tab, whose figures and charts are rendered by Matplotlib and NumPy in Python. The instructor-recommended standalone Streamlit app will be maintained in a SEPARATE repository. Both algorithms are implemented from basic search concepts. No pathfinding library, machine learning, Kaggle dataset, login system, or database is required.

## Features

- Home page with an animated 3D robot and seven navigable website pages.
- Editable 2D grid: draw obstacles, set start/goal, choose a heuristic, generate random obstacles or select a preset map.
- Greedy Best-First Search chooses the smallest f(n) = h(n).
- A* chooses the smallest f(n) = g(n) + h(n), updates parent links and keeps the best discovered cost.
- Both support Manhattan and Euclidean heuristics on four-direction grids with cost 1 per move.
- The backend records actual explored nodes, frontier snapshots, the final path and performance metrics.
- Side-by-side comparison always uses the same obstacle grid.
- Experiment Lab tests 10x10, 20x20 and 50x50 grids, densities of 10%, 20%, 30%, and seeds 1, 2, 3.
- Real CSV export and averages, including the percentage of non-optimal Greedy paths.
- A documented U-shaped Greedy trap with a deliberately worse Greedy path.
- A dedicated React tab for genuine Python Matplotlib and NumPy figures.
- The Streamlit companion is distributed separately for Streamlit Community Cloud.

**Scope:** Static, fully known, 2D grids. The 3D robot is decorative; the navigation environment is intentionally 2D. Optional eight-direction movement is not included in this version.

## Requirements

- Node.js 22.12+ (or a supported newer release)
- Python 3.10+ (Python 3.12 recommended)
- VS Code or another editor

## Python Visualizations (Matplotlib in the website)

The eighth website tab at /python-visualizations renders actual Python Matplotlib images served by FastAPI. It supports a single algorithm, side-by-side Matplotlib plots, explored cells, frontier, path animation steps, and four performance graphs with downloadable PNG files.

- backend/plotting.py converts Python search outputs into Matplotlib/NumPy PNG files.
- POST /api/visualize generates a step-by-step 2D search image.
- POST /api/visualize/experiments generates real performance charts.
- src/pages/PythonVisualizations.tsx displays the PNGs and lets visitors control the experiment.

Matplotlib is the selected visualization alternative explicitly named in the proposal. Pygame and Tkinter are alternatives for DESKTOP GUI applications, not additional compulsory libraries. The separate Streamlit app uses the same search code, but is a distinct project/repository.

## Running the React website on Windows

Use TWO terminals in VS Code.

### Terminal 1: Python backend

Open a terminal in the project root, then run:

~~~powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
~~~

Check the API: http://127.0.0.1:8000/api/health  
API documentation: http://127.0.0.1:8000/docs

### Terminal 2: React frontend

Open a NEW terminal at the project root (not inside backend):

~~~powershell
npm.cmd install
npm.cmd run dev
~~~

Open: http://localhost:5173

The frontend defaults to http://127.0.0.1:8000. For a deployed Python service, create a .env.local file with:

~~~env
VITE_API_URL=https://your-python-host.example.com
~~~

Set the backend environment variable ROBONAV_ALLOWED_ORIGINS to your frontend's deployed URL.

## Testing

From the project root:

~~~powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
cd backend
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
~~~

The Python tests include HTTP API endpoint checks, plus shortest paths on open maps, detours, no-path maps, frontier snapshots, same start/goal, invalid inputs, repeatable seeds and paired experiments.

## Proposal-specific experiments

Use the U-shaped preset to show where Greedy makes a longer choice despite the admissible Manhattan heuristic. The Experiment Lab now reports non-optimal Greedy percentage using only identical maps solved by both algorithms. Both the React and Streamlit interfaces call backend/experiments.py. The Streamlit Experiment Lab can now download a measured experimental report PDF generated with ReportLab. Review this report, include original screenshots, discuss key cases, and add the live Streamlit link before submitting.

## API endpoints

- GET /api/health: health check
- POST /api/run: run either search on one grid
- POST /api/compare: compare both searches on the identical grid
- POST /api/experiments: repeatable batches, with individual rows and grouped averages

Example request for POST /api/run:

~~~json
{
  "map": {
    "rows": 5,
    "cols": 5,
    "obstacles": [7, 12, 17],
    "start": {"row": 2, "col": 0},
    "goal": {"row": 2, "col": 4}
  },
  "algorithm": "astar",
  "heuristic": "manhattan",
  "movement": "4dir"
}
~~~

An obstacle index equals row * number_of_columns + column. The response contains exploration frames, a live frontier with g(n), h(n), f(n) values, the final path, status, and measured statistics.

Nodes tested includes the selected goal; nodes expanded excludes that goal because its neighbours are not expanded. Maximum frontier counts unique waiting states (not stale queue entries). Execution time excludes browser animation. Batch experiments turn off detailed frame recording.

## Relation to the lab material

The Lab 5 solution keeps a frontier, chooses the smallest evaluation value, checks visited states, expands neighbours and prints the route. The website follows the SAME decisions. The adaptation is from letter-named graph nodes to row/column grid cells. Python's standard heapq is used as a priority queue, as specified by the submitted project proposal.

A* is shortest-path optimal for this four-direction uniform-cost grid under the supported heuristics. Greedy does not guarantee the shortest path. Failure is reported when no path exists.

## Team

- Humna Ilyas: A* and heuristic functions
- Daniya Afzal: Greedy search and grid generator
- Zahrah Aqib: visualization, experiments, tests, documentation and presentation

Every member should review and understand the code for the viva.

## Code structure

~~~text
RoboNav/
  streamlit_app.py             # Python-native visualization
  requirements.txt             # Streamlit Community Cloud
  backend/
    algorithms/
      search.py
    experiments.py
    main.py
    requirements.txt
    tests/
  src/
    components/
    lib/
    pages/
  sample_maps/
  docs/
  package.json
  README.md
~~~

## Limitations

- Static obstacle maps only; no real robot hardware or sensors.
- Four-direction movement only.
- Browser simulation uses a 2D grid, with a separate decorative 3D robot scene.
- Large grids are tested primarily in non-animated experiment batches.
- The backend requires a Python-capable host for public deployment. The standalone Streamlit site is maintained separately.
