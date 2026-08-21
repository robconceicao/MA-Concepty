"""Recria a identidade MARCO Concept Beauty em SVG (paths, sem dependencia de fonte)."""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = TTFont(os.path.join(HERE, "PlayfairDisplay-Regular.ttf"))
GLYPHSET = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
UPEM = FONT["head"].unitsPerEm


def glyph_name(ch):
    return CMAP[ord(ch)]


def path_of(ch):
    pen = SVGPathPen(GLYPHSET)
    GLYPHSET[glyph_name(ch)].draw(pen)
    return pen.getCommands()


def advance(ch):
    return FONT["hmtx"][glyph_name(ch)][0]


def bounds(ch):
    pen = BoundsPen(GLYPHSET)
    GLYPHSET[glyph_name(ch)].draw(pen)
    return pen.bounds  # (xMin, yMin, xMax, yMax)


def group(ch, dx=0.0, dy=0.0, scale=1.0):
    """Glifo como <path>, ja no sistema de coordenadas SVG (y para baixo)."""
    t = f"translate({dx:.2f} {dy:.2f}) scale({scale:.4f} {-scale:.4f})"
    return f'<path transform="{t}" d="{path_of(ch)}"/>'


# -----------------------------------------------------------------------------
# Monograma MA: o A cavalga a diagonal direita do M e a travessa do A cruza a
# haste do M — e o que cria a leitura de "ligadura" da marca.
# -----------------------------------------------------------------------------
OVERLAP = 0.46  # fracao da largura do A que entra no M


def monogram(size=1024, fg="#000000", bg=None, margin_ratio=0.16):
    m_w, a_w = advance("M"), advance("A")
    shift = m_w - a_w * OVERLAP
    total_w = shift + a_w
    cap = bounds("M")[3]  # altura de capitular

    # escala para caber na area util
    usable = size * (1 - 2 * margin_ratio)
    scale = min(usable / total_w, usable / cap)
    draw_w, draw_h = total_w * scale, cap * scale
    ox = (size - draw_w) / 2
    oy = (size + draw_h) / 2  # baseline

    parts = []
    if bg:
        parts.append(f'<rect width="{size}" height="{size}" fill="{bg}"/>')
    parts.append(f'<g fill="{fg}">')
    parts.append(group("M", ox, oy, scale))
    parts.append(group("A", ox + shift * scale, oy, scale))
    parts.append("</g>")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 {size} {size}">' + "".join(parts) + "</svg>"
    )


# -----------------------------------------------------------------------------
# Assinatura completa: monograma MA + RCO + "Concept Beauty"
# -----------------------------------------------------------------------------
def wordmark(width=1600, fg="#FFFFFF", bg=None, tagline=True):
    m_w, a_w = advance("M"), advance("A")
    shift = m_w - a_w * OVERLAP
    cap = bounds("M")[3]

    # posicoes de MARCO com o A sobreposto ao M
    letters = [("M", 0.0), ("A", shift)]
    x = shift + a_w
    for ch in "RCO":
        letters.append((ch, x))
        x += advance(ch)
    logo_w = x

    scale = width * 0.86 / logo_w
    logo_px_w = logo_w * scale
    cap_px = cap * scale
    ox = (width - logo_px_w) / 2
    oy = cap_px * 1.18  # baseline do MARCO

    tag = "Concept Beauty"
    tag_scale = scale * 0.30
    tag_track = 0.055 * UPEM  # espacamento entre letras
    tag_w = sum(advance(c) for c in tag) * tag_scale + tag_track * tag_scale * (len(tag) - 1)
    tag_y = oy + cap_px * 0.62

    height = int(tag_y + cap_px * 0.55) if tagline else int(oy + cap_px * 0.22)

    parts = []
    if bg:
        parts.append(f'<rect width="{width}" height="{height}" fill="{bg}"/>')
    parts.append(f'<g fill="{fg}">')
    for ch, dx in letters:
        parts.append(group(ch, ox + dx * scale, oy, scale))
    if tagline:
        tx = (width - tag_w) / 2
        for ch in tag:
            if ch != " ":
                parts.append(group(ch, tx, tag_y, tag_scale))
            tx += advance(ch) * tag_scale + tag_track * tag_scale
    parts.append("</g>")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}">' + "".join(parts) + "</svg>"
    )


if __name__ == "__main__":
    out = os.path.join(HERE, "out")
    os.makedirs(out, exist_ok=True)
    files = {
        # icone do app: monograma preto sobre branco
        "monogram-black.svg": monogram(1024, fg="#0E0E0E", bg="#FFFFFF", margin_ratio=0.17),
        # adaptive icon (Android): so o monograma, com a zona segura de 66%
        "monogram-foreground.svg": monogram(1024, fg="#0E0E0E", bg=None, margin_ratio=0.28),
        "monogram-white.svg": monogram(1024, fg="#FFFFFF", bg=None, margin_ratio=0.17),
        # assinatura completa
        "logo-full-white.svg": wordmark(1600, fg="#FFFFFF", bg=None),
        "logo-full-black.svg": wordmark(1600, fg="#0E0E0E", bg=None),
        "logo-preview-dark.svg": wordmark(1600, fg="#FFFFFF", bg="#0E0E0E"),
    }
    for name, svg in files.items():
        with open(os.path.join(out, name), "w") as fh:
            fh.write(svg)
        print("ok", name)
