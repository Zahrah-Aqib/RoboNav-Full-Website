# RoboNav Streamlit | AI Lab Project

Robot Navigation in an Obstacle-Filled Environment: A Comparative Study of Greedy Best-First Search and A* Search

This is the standalone Python Streamlit + NumPy + Matplotlib project for free Streamlit Community Cloud hosting. The React/Three.js version is a separate project, Final RoboNav Website.

## Features

- From-scratch Python 3 A* and Greedy Best-First Search, priority frontier (heapq), visited tracking, Manhattan/Euclidean heuristics.
- Configurable 2D obstacle map, custom start/goal, random seed and obstacle density, JSON/ASCII input and manual obstacle editor.
- Matplotlib step-by-step frontier, explored-node, route, and moving-robot visualizations.
- Matched algorithm comparison and experiments at 10x10, 20x20, 50x50, densities 10%, 20%, 30%, several random seeds.
- U-shaped Greedy trap and percentage of non-optimal Greedy routes.
- Real CSV, PNG, and measured PDF experimental report downloads.
- No Kaggle dataset, ML training, database, JavaScript build or separate API server.

## Windows setup

Open PowerShell in the project root:

    py -3.12 -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r requirements.txt
    .\.venv\Scripts\python.exe -m streamlit run streamlit_app.py

Open http://localhost:8501.

## Free Streamlit deployment

1. Create a GitHub repository named RoboNav-Streamlit and push this project to its main branch.
2. Sign in at https://share.streamlit.io with GitHub.
3. Choose Create app, your RoboNav-Streamlit repository, branch main.
4. Set main file path to streamlit_app.py.
5. Use Python 3.12 if offered, then deploy.
6. Use the resulting public Streamlit app link in the final submission.

## Project files

    streamlit_app.py
    requirements.txt
    .streamlit/config.toml
    backend/algorithms/search.py
    backend/algorithms/maps.py
    backend/experiments.py
    backend/report.py
    backend/tests/
    sample_maps/
    scripts/check_streamlit.py
    docs/
    README.md

## Tests

    .\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
    .\.venv\Scripts\python.exe scripts/check_streamlit.py

## Proposal and limitations

The submitted proposal names Python 3, a 2D static grid, Greedy and A* implemented from scratch, a priority-queue frontier, Manhattan and Euclidean heuristics, graphical search tracing and measured experiments. It proposes Matplotlib/Pygame/Tkinter as alternative Python visualization libraries; this project uses Matplotlib.

Navigation allows four-direction movements costing 1 per step. Eight-direction movement is optional in the proposal and is not implemented. Execution time excludes plotting. The final report PDF should be reviewed and supplemented with the team's interpretation, working app screenshots, live URL, and a demonstration video if requested.

See docs/STREAMLIT_SETUP.md and docs/VIVA_GUIDE.md.
