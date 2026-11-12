# RoboNav viva guide

## Algorithm idea

Both are informed search algorithms. Greedy chooses the smallest h(n), an estimate from the current node to the goal. A* chooses the smallest g(n) + h(n), balancing the actual path travelled so far with the remaining estimate.

## What happens when we click Run?

1. React sends the start, goal, obstacle indices, grid dimensions and algorithm choice to Python.
2. The Python frontier begins with the start node.
3. The node with the smallest f(n) is removed from the frontier.
4. If that node is the goal, the final path is built by following stored parent links backwards.
5. Otherwise, its valid up/down/left/right neighbours are considered.
6. Each expansion records the explored cell and the true remaining frontier.
7. Python returns the trace and path to React; React only animates those results.

## Words to know

- Frontier: discovered nodes waiting to be expanded
- Explored/closed: already expanded nodes
- Parent: previous node on the path
- g(n): known cost from start to node
- h(n): estimate from node to goal
- f(n): the priority used to choose the next node
- Nodes tested: all nodes selected from the frontier, including the selected goal
- Nodes expanded: nodes whose neighbours are considered; goal is not expanded
- Max frontier: most unique waiting nodes at any moment

## Questions

**Why heapq?** Lab 5 scans a list for the smallest value. Using the Python standard priority queue makes the same selection more efficient.

**Why no Kaggle data?** No learning model is trained. The program creates obstacle-filled maps automatically with repeatable random seeds.

**Is Greedy optimal?** Not necessarily, because it ignores cost already travelled.

**Is A* optimal?** Yes for this project's four-direction, unit-cost grid with either Manhattan or Euclidean heuristic.

**What if no path exists?** The frontier empties, status becomes no_path and the path is empty.

**Does the 3D robot mean the project is 3D pathfinding?** No. The homepage robot is decorative, while the navigation problem remains a 2D grid.

**Why a database is unnecessary?** Every simulation runs from request data, and users can download the results as CSV.

## Where to find each part

- backend/algorithms/search.py: Greedy, A*, heuristics and frontier
- backend/main.py: HTTP endpoints
- backend/experiments.py: same-grid experiments
- src/lib/api.ts: frontend/back-end connection
- src/pages/GridSimulator.tsx: interactive map, frontier table
- src/pages/AlgorithmComparison.tsx: two simultaneous search animations
- src/pages/ExperimentLab.tsx: measured data, charts and CSV
