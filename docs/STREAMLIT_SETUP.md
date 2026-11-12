# RoboNav Streamlit + Matplotlib

The approved proposal names a Python 3 simulator and Matplotlib/Pygame/Tkinter visualization. This companion app implements the Matplotlib option, using Streamlit for controls. The existing React/Three.js website remains intact.

## Run Streamlit locally

From the **repository root**, run these commands in PowerShell:

    py -m venv .streamlit-venv
    .\.streamlit-venv\Scripts\python.exe -m pip install -r requirements.txt
    .\.streamlit-venv\Scripts\python.exe -m streamlit run streamlit_app.py

Open the URL printed in the terminal (normally http://localhost:8501).

Streamlit imports the SAME Python Greedy and A* algorithms directly from backend/algorithms/search.py. It does not need the FastAPI server or Render to run.

## Deploy free on Streamlit Community Cloud

1. Visit https://share.streamlit.io and sign in with GitHub.
2. Click Create app, choose your repository Zahrah-Aqib/RoboNav-Full-Website.
3. Choose the branch main.
4. Set the main file path to streamlit_app.py.
5. Choose Python 3.12 in Advanced Settings when available.
6. Click Deploy and wait for its green Ready status.
7. Copy the real URL ending in .streamlit.app into your project submission.

Streamlit automatically installs root requirements.txt. The file backend/requirements.txt remains for FastAPI.

## Matplotlib and NumPy functionality

- Run A* or Greedy on a user-configurable obstacle grid.
- Draw the selected node, true frontier, explored nodes, final route and robot movement for any playback step.
- Define custom start/goal cells, manually edit obstacles, upload JSON maps or write an ASCII map.
- Compare both algorithms using exactly the same grid.
- Run matched seed/density/size experiments and download measured CSVs.
- Plot four metrics and download the Matplotlib chart as PNG.
- Download a generated experimental report PDF containing genuine measurements and Matplotlib charts.
- Measure Greedy nonoptimality against A* on successfully solved matched maps, including a reproducible U-shaped trap.
- Detect and report unsolvable maps.

## Hosting the original React website as well

- React/Three.js on Vercel is an optional polished website.
- Python FastAPI on Render is used only for the React website.
- Streamlit is the fully Python-native, standalone deployment recommended in the project-ideas document.
- Both use the same algorithms and share one GitHub repository.
- No external dataset or database is needed.

## Submission still requires human work

Screenshots of the live app, the final report PDF with measured experiment results, a presentation and an optional demonstration video need to be produced from actual finished runs. Do not present placeholders as experimental evidence.
