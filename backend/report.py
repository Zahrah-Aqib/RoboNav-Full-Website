"""Create the proposal's final-report PDF from REAL measured experiment data.

The Streamlit Experiment Lab calls this after running both Python algorithms.
Every table, percentage and comparison is derived from those actual results.
"""
from __future__ import annotations

import io
from datetime import datetime
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image,
)

DARK = colors.HexColor("#10263a")
CYAN = colors.HexColor("#0b7891")


def make_report_pdf(results: dict, chart_png: bytes | None = None) -> bytes:
    """Produce the final experimental analysis as a multi-page PDF.

    The group should review the generated interpretation and include original
    screenshots, conclusions and presentation notes before final submission.
    """
    buffer = io.BytesIO()
    document = SimpleDocTemplate(
        buffer, pagesize=(595, 842), rightMargin=43, leftMargin=43,
        topMargin=43, bottomMargin=48,
        title="RoboNav: Greedy and A* Experimental Analysis",
        author="RoboNav project team",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="RoboTitle", parent=styles["Title"], alignment=TA_CENTER,
        textColor=DARK, fontSize=20, leading=26, spaceAfter=16
    ))
    styles.add(ParagraphStyle(
        name="RoboHeading", parent=styles["Heading2"],
        textColor=CYAN, spaceBefore=15, spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="RoboBody", parent=styles["BodyText"],
        fontSize=9.2, leading=14, spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="SmallCell", parent=styles["BodyText"], fontSize=6.6, leading=9,
    ))
    story = []

    def para(text: str):
        story.append(Paragraph(escape(text), styles["RoboBody"]))

    def header(text: str):
        story.append(Paragraph(escape(text), styles["RoboHeading"]))

    def table(header_cells: list[str], data: list[list], widths: list[int] | None = None):
        matrix = [
            [Paragraph(escape(str(h)), styles["SmallCell"]) for h in header_cells]
        ]
        matrix += [
            [Paragraph(escape(str(v)), styles["SmallCell"]) for v in row]
            for row in data
        ]
        t = Table(matrix, colWidths=widths, repeatRows=1, hAlign="LEFT")
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.whitesmoke, colors.HexColor("#eaf5f8")]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#d9e2eb")),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        # Header text needs a white-on-dark paragraph style.
        head_style = ParagraphStyle(
            "PdfHeader", parent=styles["SmallCell"],
            textColor=colors.white, fontName="Helvetica-Bold"
        )
        for i, h in enumerate(header_cells):
            matrix[0][i] = Paragraph(escape(h), head_style)
        story.append(t)

    story.append(Paragraph(
        "Robot Navigation in an Obstacle-Filled Environment",
        styles["RoboTitle"]
    ))
    story.append(Paragraph(
        "A Comparative Study of Greedy Best-First Search and A* Search",
        styles["Heading2"],
    ))
    para("Group members: Humna Ilyas, Daniya Afzal and Zahrah Aqib.")
    para("Generated on " + datetime.now().strftime("%d %B %Y")
         + " using real Python algorithm measurements from the RoboNav simulator.")
    header("1. Introduction and problem")
    para("In the robot navigation problem, an agent moves from a start cell to a goal "
         "cell through a static two-dimensional grid while avoiding obstacles. "
         "This project compares two informed search methods on exactly the same maps.")
    header("2. Implementation and methodology")
    para("Both search algorithms are implemented in Python without ready-made "
         "pathfinding libraries. The actions are up, down, left and right, each "
         "with unit cost. Greedy Best-First Search prioritizes h(n). "
         "A* prioritizes g(n) + h(n). The implementation uses the standard "
         "heapq priority queue, parent links, frontier tracking and explored states.")
    para("The experiments generate repeatable obstacle maps using fixed seeds. "
         "Both algorithms receive identical start/goal positions and wall cells. "
         "We compare path cost, expanded nodes, maximum frontier size and Python "
         "execution time. Execution time excludes browser rendering and animation.")
    header("3. Overall results")
    overall = results["overall"]
    para("Matched maps tested: " + str(overall["mapsTested"])
         + "; solved by both algorithms: " + str(overall["comparableRuns"])
         + "; Greedy found a non-optimal path on "
         + str(overall["nonOptimalGreedyCount"]) + " matched maps.")
    rate = overall["greedyNonOptimalPct"]
    para("Greedy non-optimality percentage: "
         + (str(rate) + "%" if rate is not None else "not available")
         + ". The denominator contains only maps successfully solved by both. "
         "Maps with no route are not assigned an artificial path cost.")
    header("4. Average results across random grids")
    summary_rows = []
    for row in results["summary"]:
        summary_rows.append([
            str(row["size"]) + "x" + str(row["size"]),
            str(round(row["density"] * 100)) + "%",
            "A*" if row["algorithm"] == "astar" else "Greedy",
            str(row["successes"]) + "/" + str(row["runs"]),
            str(row["avgPathCost"]) if row["avgPathCost"] is not None else "N/A",
            str(row["avgNodesExpanded"]),
            str(row["avgMaxFrontier"]),
            str(row["avgExecutionTimeMs"]),
        ])
    table(
        ["Grid", "Walls", "Search", "Found", "Avg path", "Avg expanded",
         "Avg frontier", "Avg time ms"], summary_rows,
        [49, 40, 44, 41, 59, 78, 75, 82]
    )
    if chart_png:
        story.append(PageBreak())
        header("5. Matplotlib experimental graph")
        chart = Image(io.BytesIO(chart_png), width=490, height=250,
                      kind="proportional")
        story.append(chart)
    header("6. U-shaped obstacle experiment")
    u = next((r for r in results["comparisons"]
              if r["mapName"] == "U-shaped Greedy trap"), None)
    if u is None:
        para("The U-shaped map was not selected for this batch. "
             "It should be tested separately before submission.")
    else:
        para("On the hand-designed U-shaped test map, A* path cost was "
             + str(u["astarCost"]) + " and Greedy path cost was "
             + str(u["greedyCost"]) + "."
             + (" Greedy returned a longer path." if u["greedyNonOptimal"]
                else " The two algorithms returned equal-cost paths."))
    header("7. Interpretation and limitations")
    para("Greedy is guided only by its estimate of distance remaining, so walls "
         "can pull it toward a poor detour. A* accounts for both accumulated "
         "travel and estimated remaining travel. Under the static four-direction "
         "unit-cost assumption and admissible Manhattan or Euclidean distance, "
         "A* returns a shortest path. Algorithm execution time varies by device "
         "and run conditions, so timing should not be compared as an absolute "
         "hardware-independent value.")
    header("8. Conclusion")
    para("The simulator provides a repeatable and visual way to examine informed "
         "search. The measured tables show how the algorithms compare in cost, "
         "node expansion, live frontier size and processing time. For the final "
         "course report, the team should add a review of specific maps and "
         "screenshots from the deployed application.")
    header("9. Source code and demonstration")
    para("Source repository: https://github.com/Zahrah-Aqib/RoboNav-Full-Website")
    para("A live Streamlit URL and screenshots should be included when the "
         "application has been deployed by the group.")

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(43, 28, "RoboNav - measured experimental report")
        canvas.drawRightString(552, 28, str(doc.page))
        canvas.restoreState()

    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue()
