import io
import math

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt

from app.infographic_models import (
    COMPARISON_MAX_COLUMNS,
    COMPARISON_POINT_COUNT,
    InfographicComparison,
    InfographicWheel,
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


def build_wheel_pptx(data: InfographicWheel) -> bytes:
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

    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W_IN)
    prs.slide_height = Inches(SLIDE_H_IN)
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    # Background
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    _set_fill(bg, "FAF9F6")
    bg.shadow.inherit = False

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

    buffer = io.BytesIO()
    prs.save(buffer)
    return buffer.getvalue()


def build_comparison_pptx(data: InfographicComparison) -> bytes:
    """Populates a side-by-side comparison layout with 2-4 columns.

    Unlike the wheel's fixed 5-slot geometry, column count here is
    variable (driven by how many real options the source material
    describes), so column width/position is computed from the actual
    count rather than baked into fixed constants.
    """
    columns = data.columns[:COMPARISON_MAX_COLUMNS]
    count = max(len(columns), 1)

    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W_IN)
    prs.slide_height = Inches(SLIDE_H_IN)
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    _set_fill(bg, "FAF9F6")
    bg.shadow.inherit = False

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

    buffer = io.BytesIO()
    prs.save(buffer)
    return buffer.getvalue()
