"""
Build the studio glyph outline + advance table from the vendored SIL OFL fonts.

Why a precomputed table instead of a runtime font parser:
  - no parser dependency in the SPA bundle,
  - the table carries REAL advance widths (studio/text.ts currently estimates them),
  - export can outline text so a downloaded SVG never depends on installed fonts.

Run:  python scripts/build-font-outlines.py
Out:  src/engine/studio/fontOutlines.json   (lazy-loaded at export only)
"""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONT_DIR = os.path.join(ROOT, "assets", "fonts")
OUT = os.path.join(ROOT, "src", "engine", "studio", "fontOutlines.json")
# Advances only — small enough to bundle, because layout measures text on every generate.
OUT_METRICS = os.path.join(ROOT, "src", "engine", "studio", "fontMetrics.json")

# Keyed by what the exported markup actually carries: family + weight + style.
# The outliner resolves `font-family`/`font-weight`/`font-style` to one of these.
FACES = {
    "cormorant-500": "sub-Cormorant-500-normal.ttf",
    "cormorant-500i": "sub-Cormorant-500-italic.ttf",
    "cormorant-600": "sub-Cormorant-600-normal.ttf",
    "cormorant-700": "sub-Cormorant-700-normal.ttf",
    "montserrat-300": "sub-Montserrat-300-normal.ttf",
    "montserrat-500": "sub-Montserrat-500-normal.ttf",
    "montserrat-700": "sub-Montserrat-700-normal.ttf",
    "greatvibes-400": "sub-Great-400-normal.ttf",
    # Phase 4 (F-30): the four faces the reference set asked for and the repertoire lacked —
    # a condensed display serif, a condensed grotesk, a rounded display, a mono for spec copy.
    "instrumentserif-400": "sub-InstrumentSerif-400-normal.ttf",
    "instrumentserif-400i": "sub-InstrumentSerif-400-italic.ttf",
    "barlowcondensed-600": "sub-BarlowCondensed-600-normal.ttf",
    "barlowcondensed-700": "sub-BarlowCondensed-700-normal.ttf",
    "righteous-400": "sub-Righteous-400-normal.ttf",
    "ibmplexmono-400": "sub-IBMPlexMono-400-normal.ttf",
    "ibmplexmono-500": "sub-IBMPlexMono-500-normal.ttf",
}

# Latin + Turkish + the punctuation the copy bank actually uses.
KEEP = set(range(0x20, 0x7F)) | {0xA0, 0xA9, 0xAE, 0xB0, 0xB7, 0xD7}
KEEP |= set(range(0xC0, 0x100))
KEEP |= {0x11E, 0x11F, 0x130, 0x131, 0x15E, 0x15F, 0x152, 0x153, 0x160, 0x161, 0x178, 0x17D, 0x17E}
KEEP |= {0x2018, 0x2019, 0x201C, 0x201D, 0x2013, 0x2014, 0x2022, 0x2026, 0x20AC, 0x20BA, 0x212E, 0x2122}
KEEP |= {0x2264, 0x2265, 0x2212, 0x00B1, 0x2032, 0x2033}  # ≤ ≥ − ± ′ ″ — spec/legal copy

# All outlines are normalised to a 1000-unit em so the renderer scales by size/1000.
EM = 1000


def build_face(path):
    font = TTFont(path)
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    hmtx = font["hmtx"]
    scale = EM / upm
    out = {}
    for code, name in sorted(cmap.items()):
        if code not in KEEP:
            continue
        pen = SVGPathPen(glyphs, ntos=lambda v: str(int(round(v * scale))))
        glyphs[name].draw(pen)
        out[chr(code)] = [int(round(hmtx[name][0] * scale)), pen.getCommands()]
    return out


def main():
    table = {"em": EM, "faces": {}}
    for face, filename in FACES.items():
        path = os.path.join(FONT_DIR, filename)
        if not os.path.exists(path):
            raise SystemExit("missing font: " + path)
        table["faces"][face] = build_face(path)
        print(face, "->", filename, len(table["faces"][face]), "glyphs")
    blob = json.dumps(table, ensure_ascii=False, separators=(",", ":"))
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(blob)
    print("wrote", OUT, len(blob.encode("utf-8")), "bytes")

    metrics = {
        "em": EM,
        "faces": {face: {ch: g[0] for ch, g in glyphs.items()} for face, glyphs in table["faces"].items()},
    }
    mblob = json.dumps(metrics, ensure_ascii=False, separators=(",", ":"))
    with open(OUT_METRICS, "w", encoding="utf-8") as fh:
        fh.write(mblob)
    print("wrote", OUT_METRICS, len(mblob.encode("utf-8")), "bytes")


if __name__ == "__main__":
    main()
