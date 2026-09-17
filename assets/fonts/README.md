# Studio fonts (vendored)

Latin + Turkish subsets of the three studio faces. They exist so `scripts/build-font-outlines.py`
can generate `src/engine/studio/fontOutlines.json` — the glyph table the exporter uses to convert
text to outlines. A downloaded print file must not depend on fonts being installed on the machine
that opens it.

| File | Family | Used as |
|---|---|---|
| `sub-Cormorant-500-normal.ttf` | Cormorant Garamond 500 | `serif-medium` |
| `sub-Cormorant-500-italic.ttf` | Cormorant Garamond 500 italic | `serif-italic` |
| `sub-Cormorant-600-normal.ttf` | Cormorant Garamond 600 | `serif` |
| `sub-Cormorant-700-normal.ttf` | Cormorant Garamond 700 | `serif-bold` |
| `sub-Montserrat-300-normal.ttf` | Montserrat 300 | `sans-light` |
| `sub-Montserrat-500-normal.ttf` | Montserrat 500 | `sans` |
| `sub-Montserrat-700-normal.ttf` | Montserrat 700 | `sans-heavy` |
| `sub-Great-400-normal.ttf` | Great Vibes 400 | `script` |

## Licence

All three families are licensed under the **SIL Open Font License 1.1**, which permits bundling,
subsetting, embedding and redistribution (including inside documents). See `OFL.txt`.

- Cormorant Garamond — Christian Thalmann, Catharsis Fonts
- Montserrat — Julieta Ulanovsky et al.
- Great Vibes — TypeSETit

## Regenerating

Subsets were produced from the Google Fonts TTFs with:

```
python -m fontTools.subset <font>.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+0100-017F,U+0192,U+2000-206F,U+20AC,U+20BA,U+2122,U+212E,U+2212" --layout-features='*' --no-hinting --output-file=sub-<font>.ttf
```

Then rebuild the glyph table:

```
python scripts/build-font-outlines.py
```
