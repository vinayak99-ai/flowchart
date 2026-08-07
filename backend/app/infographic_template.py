import io
import math
from typing import Callable

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

from app.infographic_models import (
    BULLET_MAX_COUNT,
    COMPARISON_MAX_COLUMNS,
    COMPARISON_POINT_COUNT,
    PYRAMID_MAX_PILLARS,
    PYRAMID_MIN_PILLARS,
    ROADMAP_COLUMN_COUNT,
    ROADMAP_ITEM_COUNT,
    TIMELINE_MAX_MILESTONES,
    BulletSummarySlide,
    InfographicComparison,
    InfographicDiagram,
    InfographicPyramid,
    InfographicRoadmap,
    InfographicTimeline,
    InfographicWheel,
    PyramidPillar,
    RoadmapColumn,
    WheelItem,
)

# Wedge colors, matching the artifact gallery's radial-wheel mockup.
WEDGE_COLORS = ["E8A33D", "6B9B52", "3D5A80", "C9457A", "2A9D8F"]
LIST_ACCENT_COLORS = ["C98626", "537B3D", "2C4160", "A3305F", "1E7C70"]
COLUMN_COLORS = ["3D5A80", "6B9B52", "C9457A", "E8A33D"]

SLIDE_W_IN = 13.333
SLIDE_H_IN = 7.5

WHEEL_CX_IN = 3.15
WHEEL_CY_IN = 3.9
R_OUT_IN = 2.35
R_IN_IN = 0.95
LABEL_RADIUS_IN = (R_OUT_IN + R_IN_IN) / 2

LIST_X_IN = 7.75
LIST_W_IN = 4.9
LIST_H_IN = 1.1
LIST_TOP_IN = 0.55
LIST_GAP_IN = 1.38

COMPARISON_TITLE_Y_IN = 0.55
COMPARISON_COL_TOP_IN = 1.35
COMPARISON_MARGIN_IN = 0.75
COMPARISON_COL_GAP_IN = 0.35
COMPARISON_BAR_H_IN = 0.7

ROADMAP_TITLE_Y_IN = 0.5
ROADMAP_RAIL_Y_IN = 1.2
ROADMAP_COL_TOP_IN = 1.6
ROADMAP_MARGIN_IN = 0.9
ROADMAP_COL_GAP_IN = 0.4
ROADMAP_BAR_H_IN = 0.65
# Same hue, fading light -- closer horizons read visually "stronger."
ROADMAP_COLORS = ["1F3A5F", "3D5A80", "9DB6D1"]
ROADMAP_TEXT_COLORS = ["FFFFFF", "FFFFFF", "1B1F1C"]

PYRAMID_HEADLINE_Y_IN = 1.0
PYRAMID_HEADLINE_H_IN = 1.5
PYRAMID_TOP_Y_IN = 2.35
PYRAMID_BOTTOM_Y_IN = 7.0
PYRAMID_CX_IN = SLIDE_W_IN / 2
PYRAMID_APEX_W_IN = 1.8
PYRAMID_BASE_W_IN = 8.5
PYRAMID_GAP_IN = 0.08

TIMELINE_TITLE_Y_IN = 0.5
TIMELINE_LINE_Y_IN = 3.9
TIMELINE_LEFT_IN = 1.1
TIMELINE_RIGHT_IN = 12.2
TIMELINE_CARD_W_IN = 1.95
TIMELINE_CARD_H_IN = 1.7
TIMELINE_CONNECTOR_H_IN = 0.35
TIMELINE_COLORS = ["3D5A80", "6B9B52", "C9457A", "E8A33D", "2A9D8F", "8859A3"]

BULLET_TITLE_Y_IN = 0.6
BULLET_LIST_TOP_IN = 1.7
BULLET_LIST_LEFT_IN = 1.5
BULLET_LIST_WIDTH_IN = 10.3
BULLET_ROW_H_IN = 0.85
BULLET_ACCENT_COLOR = "3D5A80"


def _new_presentation() -> Presentation:
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W_IN)
    prs.slide_height = Inches(SLIDE_H_IN)
    return prs


def _save_bytes(prs: Presentation) -> bytes:
    buffer = io.BytesIO()
    prs.save(buffer)
    return buffer.getvalue()


def _polar(cx: float, cy: float, r: float, degrees: float) -> tuple[float, float]:
    rad = math.radians(degrees)
    return cx + r * math.cos(rad), cy + r * math.sin(rad)


def _set_fill(shape, hex_color: str) -> None:
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor.from_string(hex_color)
    shape.line.fill.background()


def _add_label(slide, x_in: float, y_in: float, w_in: float, text: str, *, size: int, bold: bool, color: str, align=PP_ALIGN.CENTER, h_in: float = 0.6):
    box = slide.shapes.add_textbox(Inches(x_in - w_in / 2), Inches(y_in - h_in / 2), Inches(w_in), Inches(h_in))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    run.font.name = "Arial"
    return box


def _add_background(slide, prs: Presentation) -> None:
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    _set_fill(bg, "FAF9F6")
    bg.shadow.inherit = False


def add_wheel_slide(prs: Presentation, data: InfographicWheel) -> None:
    """Populates the fixed 5-slot radial-wheel geometry with generated content.

    Deliberately built with PIE shapes (a solid slice from the true circle
    center, verified against python-pptx's own adjustment semantics) plus a
    covering hub circle drawn last, rather than a ring/donut autoshape --
    same final look, without relying on that shape type's angle-adjustment
    units, which don't follow the same convention as PIE's and are easy to
    get subtly wrong.
    """
    # This template's geometry is fixed at exactly 5 slots; anything short
    # is padded with blank cards rather than reflowing the wheel.
    items = data.items[:5]
    items += [WheelItem(label="", description="") for _ in range(5 - len(items))]

    slide = prs.slides.add_slide(prs.slide_layouts[6])
    _add_background(slide, prs)

    step = 36  # 180 degrees / 5 wedges
    start = -90
    wedge_size = Inches(2 * R_OUT_IN)
    wedge_left = Inches(WHEEL_CX_IN - R_OUT_IN)
    wedge_top = Inches(WHEEL_CY_IN - R_OUT_IN)

    for i, item in enumerate(items):
        a0 = start + i * step
        a1 = start + (i + 1) * step
        wedge = slide.shapes.add_shape(MSO_SHAPE.PIE, wedge_left, wedge_top, wedge_size, wedge_size)
        # PIE's adj1/adj2 are fractions of a full turn (verified: -0.25 -> a
        # -90 degree start), unlike some other arc-family autoshapes whose
        # angle adjustments use a different internal unit.
        wedge.adjustments[0] = a0 / 360
        wedge.adjustments[1] = a1 / 360
        _set_fill(wedge, WEDGE_COLORS[i])
        wedge.shadow.inherit = False

        mid = (a0 + a1) / 2
        lx, ly = _polar(WHEEL_CX_IN, WHEEL_CY_IN, LABEL_RADIUS_IN, mid)
        if item.label:
            _add_label(slide, lx, ly, 1.5, item.label.upper(), size=12, bold=True, color="FFFFFF")

    # Hub circle drawn last so it sits above the wedges' inner points,
    # producing the same donut-hole look as a ring-segment shape would.
    hub = slide.shapes.add_shape(
        MSO_SHAPE.OVAL,
        Inches(WHEEL_CX_IN - R_IN_IN), Inches(WHEEL_CY_IN - R_IN_IN),
        Inches(2 * R_IN_IN), Inches(2 * R_IN_IN),
    )
    _set_fill(hub, "FFFFFF")
    hub.line.color.rgb = RGBColor.from_string("BFE3D3")
    hub.line.width = Pt(3)
    hub.line.fill.solid()
    hub.line.fill.fore_color.rgb = RGBColor.from_string("BFE3D3")
    hub.shadow.inherit = False
    _add_label(slide, WHEEL_CX_IN, WHEEL_CY_IN, 2 * R_IN_IN - 0.3, data.title.upper(), size=15, bold=True, color="1B1F1C", h_in=1.3)

    # Right-side numbered list.
    for i, item in enumerate(items):
        y = LIST_TOP_IN + i * LIST_GAP_IN
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(LIST_X_IN), Inches(y), Inches(LIST_W_IN), Inches(LIST_H_IN))
        card.adjustments[0] = 0.08
        _set_fill(card, WEDGE_COLORS[i])
        card.shadow.inherit = False

        accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(LIST_X_IN + LIST_W_IN - 0.06), Inches(y), Inches(0.06), Inches(LIST_H_IN))
        _set_fill(accent, LIST_ACCENT_COLORS[i])
        accent.shadow.inherit = False

        num_box = slide.shapes.add_textbox(Inches(LIST_X_IN + 0.12), Inches(y), Inches(0.85), Inches(LIST_H_IN))
        tf = num_box.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = 0
        tf.margin_right = 0
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = f"{i + 1:02d}"
        run.font.size = Pt(26)
        run.font.bold = True
        run.font.color.rgb = RGBColor.from_string("FFFFFF")
        run.font.name = "Arial"

        text_box = slide.shapes.add_textbox(Inches(LIST_X_IN + 1.0), Inches(y + 0.08), Inches(LIST_W_IN - 1.15), Inches(LIST_H_IN - 0.14))
        tf = text_box.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        tf.margin_right = 0
        tf.margin_top = 0
        tf.margin_bottom = 0
        p_title = tf.paragraphs[0]
        run = p_title.add_run()
        run.text = item.label.upper()
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = RGBColor.from_string("FFFFFF")
        run.font.name = "Arial"

        p_desc = tf.add_paragraph()
        p_desc.space_before = Pt(2)
        run = p_desc.add_run()
        run.text = item.description
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor.from_string("FFF7EC")
        run.font.name = "Arial"


def build_wheel_pptx(data: InfographicWheel) -> bytes:
    prs = _new_presentation()
    add_wheel_slide(prs, data)
    return _save_bytes(prs)


def add_roadmap_slide(prs: Presentation, data: InfographicRoadmap) -> None:
    """A Now/Next/Later roadmap: 3 fixed columns rendered with decreasing
    visual weight (dark to light, same hue) so closer-term horizons read
    as visually "stronger", plus a connecting rail with a dot per column
    to reinforce left-to-right progression -- the roadmap's visual
    distinction from the otherwise-similar Comparison Columns template.
    """
    columns = data.columns[:ROADMAP_COLUMN_COUNT]
    fixed_headings = ["Now", "Next", "Later"]
    columns += [
        RoadmapColumn(heading=fixed_headings[len(columns) + i], items=[])
        for i in range(ROADMAP_COLUMN_COUNT - len(columns))
    ]

    slide = prs.slides.add_slide(prs.slide_layouts[6])
    _add_background(slide, prs)

    _add_label(
        slide, SLIDE_W_IN / 2, ROADMAP_TITLE_Y_IN, SLIDE_W_IN - 1.0, data.title.upper(),
        size=26, bold=True, color="1B1F1C", h_in=0.7,
    )

    count = ROADMAP_COLUMN_COUNT
    available_w = SLIDE_W_IN - 2 * ROADMAP_MARGIN_IN - ROADMAP_COL_GAP_IN * (count - 1)
    col_w = available_w / count
    col_top = ROADMAP_COL_TOP_IN
    col_h = SLIDE_H_IN - col_top - 0.5
    bar_h = ROADMAP_BAR_H_IN
    col_centers = [ROADMAP_MARGIN_IN + i * (col_w + ROADMAP_COL_GAP_IN) + col_w / 2 for i in range(count)]

    rail = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(col_centers[0]), Inches(ROADMAP_RAIL_Y_IN - 0.02),
        Inches(col_centers[-1] - col_centers[0]), Inches(0.04),
    )
    _set_fill(rail, "C9C4B6")
    rail.shadow.inherit = False

    for i, cx in enumerate(col_centers):
        dot = slide.shapes.add_shape(
            MSO_SHAPE.OVAL, Inches(cx - 0.08), Inches(ROADMAP_RAIL_Y_IN - 0.08), Inches(0.16), Inches(0.16)
        )
        _set_fill(dot, ROADMAP_COLORS[i])
        dot.shadow.inherit = False

    for i, col in enumerate(columns):
        color = ROADMAP_COLORS[i]
        text_color = ROADMAP_TEXT_COLORS[i]
        col_left = ROADMAP_MARGIN_IN + i * (col_w + ROADMAP_COL_GAP_IN)

        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(col_left), Inches(col_top), Inches(col_w), Inches(col_h)
        )
        card.adjustments[0] = 0.06
        _set_fill(card, "FFFFFF")
        card.line.color.rgb = RGBColor.from_string("E4E1D8")
        card.line.width = Pt(1)
        card.line.fill.solid()
        card.line.fill.fore_color.rgb = RGBColor.from_string("E4E1D8")
        card.shadow.inherit = False

        bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(col_left), Inches(col_top), Inches(col_w), Inches(bar_h)
        )
        _set_fill(bar, color)
        bar.shadow.inherit = False
        _add_label(
            slide, col_left + col_w / 2, col_top + bar_h / 2, col_w - 0.3, col.heading.upper(),
            size=16, bold=True, color=text_color, h_in=bar_h - 0.1,
        )

        items = col.items[:ROADMAP_ITEM_COUNT]
        body_top = col_top + bar_h + 0.22
        body_h = col_h - bar_h - 0.4
        row_h = body_h / ROADMAP_ITEM_COUNT

        for j, item in enumerate(items):
            row_y = body_top + j * row_h
            dot = slide.shapes.add_shape(
                MSO_SHAPE.OVAL,
                Inches(col_left + 0.28), Inches(row_y + row_h / 2 - 0.05),
                Inches(0.1), Inches(0.1),
            )
            _set_fill(dot, color)
            dot.shadow.inherit = False

            text_box = slide.shapes.add_textbox(
                Inches(col_left + 0.5), Inches(row_y), Inches(col_w - 0.75), Inches(row_h)
            )
            tf = text_box.text_frame
            tf.word_wrap = True
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.margin_left = 0
            tf.margin_right = 0
            tf.margin_top = 0
            tf.margin_bottom = 0
            p = tf.paragraphs[0]
            run = p.add_run()
            run.text = item
            run.font.size = Pt(12)
            run.font.color.rgb = RGBColor.from_string("2A2E29")
            run.font.name = "Arial"


def build_roadmap_pptx(data: InfographicRoadmap) -> bytes:
    prs = _new_presentation()
    add_roadmap_slide(prs, data)
    return _save_bytes(prs)


def add_pyramid_slide(prs: Presentation, data: InfographicPyramid) -> None:
    """A vision/strategy pyramid.

    The vision statement runs as a full-width headline above the graphic
    rather than being squeezed into the pyramid's narrow apex, where a
    full sentence wouldn't reliably fit without overflowing into the
    band below it. The pyramid itself is built from freeform trapezoid
    bands with literal corner coordinates computed directly (similar
    triangles), sidestepping autoshape angle-adjustment units entirely
    rather than risking another BLOCK_ARC-style unit mismatch.
    """
    pillars = data.pillars[:PYRAMID_MAX_PILLARS]
    if len(pillars) < PYRAMID_MIN_PILLARS:
        pillars += [
            PyramidPillar(label="", description="")
            for _ in range(PYRAMID_MIN_PILLARS - len(pillars))
        ]
    total_bands = 1 + len(pillars)

    slide = prs.slides.add_slide(prs.slide_layouts[6])
    _add_background(slide, prs)

    _add_label(
        slide, SLIDE_W_IN / 2, PYRAMID_HEADLINE_Y_IN, SLIDE_W_IN - 2.4, data.vision,
        size=24, bold=True, color="1B1F1C", h_in=PYRAMID_HEADLINE_H_IN,
    )

    band_h = (PYRAMID_BOTTOM_Y_IN - PYRAMID_TOP_Y_IN) / total_bands

    def width_at(j: int) -> float:
        return PYRAMID_APEX_W_IN + (PYRAMID_BASE_W_IN - PYRAMID_APEX_W_IN) * (j / total_bands)

    for i in range(total_bands):
        w0, w1 = width_at(i), width_at(i + 1)
        y0 = PYRAMID_TOP_Y_IN + i * band_h + (PYRAMID_GAP_IN / 2 if i > 0 else 0)
        y1 = PYRAMID_TOP_Y_IN + (i + 1) * band_h - (PYRAMID_GAP_IN / 2 if i < total_bands - 1 else 0)

        fb = slide.shapes.build_freeform(Inches(PYRAMID_CX_IN - w0 / 2), Inches(y0), scale=1)
        fb.add_line_segments(
            [
                (Inches(PYRAMID_CX_IN + w0 / 2), Inches(y0)),
                (Inches(PYRAMID_CX_IN + w1 / 2), Inches(y1)),
                (Inches(PYRAMID_CX_IN - w1 / 2), Inches(y1)),
            ],
            close=True,
        )
        band = fb.convert_to_shape()
        color = "1B1F1C" if i == 0 else COLUMN_COLORS[(i - 1) % len(COLUMN_COLORS)]
        _set_fill(band, color)
        band.shadow.inherit = False

        text_w = (w0 + w1) / 2 * 0.82
        cy = (y0 + y1) / 2

        if i == 0:
            _add_label(
                slide, PYRAMID_CX_IN, cy, text_w, "VISION",
                size=13, bold=True, color="FFFFFF", h_in=band_h - 0.15,
            )
            continue

        pillar = pillars[i - 1]
        box = slide.shapes.add_textbox(
            Inches(PYRAMID_CX_IN - text_w / 2), Inches(cy - (band_h - 0.2) / 2),
            Inches(text_w), Inches(band_h - 0.2),
        )
        tf = box.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = 0
        tf.margin_right = 0
        tf.margin_top = 0
        tf.margin_bottom = 0

        p_label = tf.paragraphs[0]
        p_label.alignment = PP_ALIGN.CENTER
        run = p_label.add_run()
        run.text = pillar.label.upper()
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = RGBColor.from_string("FFFFFF")
        run.font.name = "Arial"

        if pillar.description:
            p_desc = tf.add_paragraph()
            p_desc.alignment = PP_ALIGN.CENTER
            p_desc.space_before = Pt(2)
            run = p_desc.add_run()
            run.text = pillar.description
            run.font.size = Pt(11)
            run.font.color.rgb = RGBColor.from_string("F2EFE8")
            run.font.name = "Arial"


def build_pyramid_pptx(data: InfographicPyramid) -> bytes:
    prs = _new_presentation()
    add_pyramid_slide(prs, data)
    return _save_bytes(prs)


def add_timeline_slide(prs: Presentation, data: InfographicTimeline) -> None:
    """4-6 dated milestones along a single horizontal line, with callout
    cards alternating above/below the line so neighboring cards don't
    overlap each other.
    """
    milestones = data.milestones[:TIMELINE_MAX_MILESTONES]
    n = max(len(milestones), 1)

    slide = prs.slides.add_slide(prs.slide_layouts[6])
    _add_background(slide, prs)

    _add_label(
        slide, SLIDE_W_IN / 2, TIMELINE_TITLE_Y_IN, SLIDE_W_IN - 1.0, data.title.upper(),
        size=26, bold=True, color="1B1F1C", h_in=0.7,
    )

    line = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(TIMELINE_LEFT_IN), Inches(TIMELINE_LINE_Y_IN - 0.02),
        Inches(TIMELINE_RIGHT_IN - TIMELINE_LEFT_IN), Inches(0.04),
    )
    _set_fill(line, "D8D3C4")
    line.shadow.inherit = False

    xs = (
        [TIMELINE_LEFT_IN + i * (TIMELINE_RIGHT_IN - TIMELINE_LEFT_IN) / (n - 1) for i in range(n)]
        if n > 1
        else [(TIMELINE_LEFT_IN + TIMELINE_RIGHT_IN) / 2]
    )

    for i, (milestone, x) in enumerate(zip(milestones, xs)):
        color = TIMELINE_COLORS[i % len(TIMELINE_COLORS)]
        above = i % 2 == 0

        dot = slide.shapes.add_shape(
            MSO_SHAPE.OVAL, Inches(x - 0.1), Inches(TIMELINE_LINE_Y_IN - 0.1), Inches(0.2), Inches(0.2)
        )
        _set_fill(dot, color)
        dot.shadow.inherit = False

        connector_top = TIMELINE_LINE_Y_IN - TIMELINE_CONNECTOR_H_IN if above else TIMELINE_LINE_Y_IN
        connector = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(x - 0.01), Inches(connector_top), Inches(0.02), Inches(TIMELINE_CONNECTOR_H_IN)
        )
        _set_fill(connector, color)
        connector.shadow.inherit = False

        card_left = x - TIMELINE_CARD_W_IN / 2
        card_left = max(0.2, min(SLIDE_W_IN - TIMELINE_CARD_W_IN - 0.2, card_left))
        card_top = (
            TIMELINE_LINE_Y_IN - TIMELINE_CONNECTOR_H_IN - TIMELINE_CARD_H_IN
            if above
            else TIMELINE_LINE_Y_IN + TIMELINE_CONNECTOR_H_IN
        )

        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(card_left), Inches(card_top), Inches(TIMELINE_CARD_W_IN), Inches(TIMELINE_CARD_H_IN)
        )
        card.adjustments[0] = 0.08
        _set_fill(card, "FFFFFF")
        card.line.color.rgb = RGBColor.from_string(color)
        card.line.width = Pt(1.5)
        card.line.fill.solid()
        card.line.fill.fore_color.rgb = RGBColor.from_string(color)
        card.shadow.inherit = False

        text_box = slide.shapes.add_textbox(
            Inches(card_left + 0.15), Inches(card_top + 0.12), Inches(TIMELINE_CARD_W_IN - 0.3), Inches(TIMELINE_CARD_H_IN - 0.24)
        )
        tf = text_box.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        tf.margin_right = 0
        tf.margin_top = 0
        tf.margin_bottom = 0

        p_period = tf.paragraphs[0]
        p_period.alignment = PP_ALIGN.CENTER
        run = p_period.add_run()
        run.text = milestone.period.upper()
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor.from_string(color)
        run.font.name = "Arial"

        p_label = tf.add_paragraph()
        p_label.alignment = PP_ALIGN.CENTER
        p_label.space_before = Pt(2)
        run = p_label.add_run()
        run.text = milestone.label
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = RGBColor.from_string("1B1F1C")
        run.font.name = "Arial"

        if milestone.description:
            p_desc = tf.add_paragraph()
            p_desc.alignment = PP_ALIGN.CENTER
            p_desc.space_before = Pt(3)
            run = p_desc.add_run()
            run.text = milestone.description
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor.from_string("5B5A52")
            run.font.name = "Arial"


def build_timeline_pptx(data: InfographicTimeline) -> bytes:
    prs = _new_presentation()
    add_timeline_slide(prs, data)
    return _save_bytes(prs)


def add_comparison_slide(prs: Presentation, data: InfographicComparison) -> None:
    """Populates a side-by-side comparison layout with 2-4 columns.

    Unlike the wheel's fixed 5-slot geometry, column count here is
    variable (driven by how many real options the source material
    describes), so column width/position is computed from the actual
    count rather than baked into fixed constants.
    """
    columns = data.columns[:COMPARISON_MAX_COLUMNS]
    count = max(len(columns), 1)

    slide = prs.slides.add_slide(prs.slide_layouts[6])
    _add_background(slide, prs)

    _add_label(
        slide, SLIDE_W_IN / 2, COMPARISON_TITLE_Y_IN, SLIDE_W_IN - 1.0, data.title.upper(),
        size=26, bold=True, color="1B1F1C", h_in=0.8,
    )

    available_w = SLIDE_W_IN - 2 * COMPARISON_MARGIN_IN - COMPARISON_COL_GAP_IN * (count - 1)
    col_w = available_w / count
    col_top = COMPARISON_COL_TOP_IN
    col_h = SLIDE_H_IN - col_top - 0.5
    bar_h = COMPARISON_BAR_H_IN

    for i, col in enumerate(columns):
        color = COLUMN_COLORS[i % len(COLUMN_COLORS)]
        col_left = COMPARISON_MARGIN_IN + i * (col_w + COMPARISON_COL_GAP_IN)

        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(col_left), Inches(col_top), Inches(col_w), Inches(col_h)
        )
        card.adjustments[0] = 0.06
        _set_fill(card, "FFFFFF")
        card.line.color.rgb = RGBColor.from_string("E4E1D8")
        card.line.width = Pt(1)
        card.line.fill.solid()
        card.line.fill.fore_color.rgb = RGBColor.from_string("E4E1D8")
        card.shadow.inherit = False

        bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(col_left), Inches(col_top), Inches(col_w), Inches(bar_h)
        )
        _set_fill(bar, color)
        bar.shadow.inherit = False
        _add_label(
            slide, col_left + col_w / 2, col_top + bar_h / 2, col_w - 0.3, col.heading.upper(),
            size=16, bold=True, color="FFFFFF", h_in=bar_h - 0.1,
        )

        points = col.points[:COMPARISON_POINT_COUNT]
        body_top = col_top + bar_h + 0.25
        body_h = col_h - bar_h - 0.45
        row_h = body_h / COMPARISON_POINT_COUNT

        for j, point in enumerate(points):
            row_y = body_top + j * row_h
            dot = slide.shapes.add_shape(
                MSO_SHAPE.OVAL,
                Inches(col_left + 0.28), Inches(row_y + row_h / 2 - 0.05),
                Inches(0.1), Inches(0.1),
            )
            _set_fill(dot, color)
            dot.shadow.inherit = False

            text_box = slide.shapes.add_textbox(
                Inches(col_left + 0.5), Inches(row_y), Inches(col_w - 0.75), Inches(row_h)
            )
            tf = text_box.text_frame
            tf.word_wrap = True
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.margin_left = 0
            tf.margin_right = 0
            tf.margin_top = 0
            tf.margin_bottom = 0
            p = tf.paragraphs[0]
            run = p.add_run()
            run.text = point
            run.font.size = Pt(12)
            run.font.color.rgb = RGBColor.from_string("2A2E29")
            run.font.name = "Arial"


def build_comparison_pptx(data: InfographicComparison) -> bytes:
    prs = _new_presentation()
    add_comparison_slide(prs, data)
    return _save_bytes(prs)


def add_bullet_slide(prs: Presentation, data: BulletSummarySlide) -> None:
    """The flexible fallback slide: a plain title + bullet list, for content
    that doesn't fit any of the shaped templates. Bullets are hand-drawn as
    a colored dot + text row rather than PowerPoint's native bullet-list XML,
    matching the dot-bullet style already used by the comparison/roadmap
    list rows for visual consistency.
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    _add_background(slide, prs)

    _add_label(
        slide, SLIDE_W_IN / 2, BULLET_TITLE_Y_IN, SLIDE_W_IN - 1.0, data.title.upper(),
        size=26, bold=True, color="1B1F1C", h_in=0.7,
    )

    bullets = data.bullets[:BULLET_MAX_COUNT]
    for i, bullet in enumerate(bullets):
        row_y = BULLET_LIST_TOP_IN + i * BULLET_ROW_H_IN
        dot = slide.shapes.add_shape(
            MSO_SHAPE.OVAL,
            Inches(BULLET_LIST_LEFT_IN), Inches(row_y + BULLET_ROW_H_IN / 2 - 0.06),
            Inches(0.12), Inches(0.12),
        )
        _set_fill(dot, BULLET_ACCENT_COLOR)
        dot.shadow.inherit = False

        text_box = slide.shapes.add_textbox(
            Inches(BULLET_LIST_LEFT_IN + 0.4), Inches(row_y),
            Inches(BULLET_LIST_WIDTH_IN - 0.4), Inches(BULLET_ROW_H_IN),
        )
        tf = text_box.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = 0
        tf.margin_right = 0
        tf.margin_top = 0
        tf.margin_bottom = 0
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = bullet
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor.from_string("2A2E29")
        run.font.name = "Arial"


def build_bullets_pptx(data: BulletSummarySlide) -> bytes:
    prs = _new_presentation()
    add_bullet_slide(prs, data)
    return _save_bytes(prs)


_DECK_SLIDE_BUILDERS: dict[str, Callable[[Presentation, InfographicDiagram], None]] = {
    "radial_wheel": add_wheel_slide,
    "comparison_columns": add_comparison_slide,
    "now_next_later": add_roadmap_slide,
    "vision_pyramid": add_pyramid_slide,
    "quarterly_timeline": add_timeline_slide,
    "bullet_summary": add_bullet_slide,
}


def build_deck_pptx(slides: list[InfographicDiagram]) -> bytes:
    """Assembles every planned slide into a single deck, in order. Each
    slide keeps its own template's exact visual design -- this only changes
    the outer scaffolding from "one Presentation per template" to "one
    Presentation shared across all of them."
    """
    prs = _new_presentation()
    for slide_data in slides:
        _DECK_SLIDE_BUILDERS[slide_data.template](prs, slide_data)
    return _save_bytes(prs)
