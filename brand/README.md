# Identyfikacja grupowe.pro

Technika: **fasety low-poly** (wspólna z utratadochodu.pl – rodzina Aura). Znak jest abstrakcyjny: sześciobok o 36 fasetach,
komórka plastra (grupa, struktura) i kamień (trwałość, wartość). Wierzchołek bryły przesunięty ku światłu (apex 0.44 · 0.42),
dolne „V” w róży – fundament. Napis **grupowe.pro** wykonany tą samą techniką: każdy glif Inter Black pocięty na trójkąty.
Założenia: [DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md). Arkusz: [brand-sheet.png](brand-sheet.png) / [.pdf](brand-sheet.pdf).

| Plik | Użycie |
|---|---|
| `mark.svg` / `mark-on-dark.svg` | sygnet na jasnym / ciemnym tle |
| `mark-mono.svg`, `mark-white.svg` | sylwetka jednokolorowa (druk, grawer, pieczęć) |
| `wordmark.svg` / `wordmark-dark.svg` | sam fasetowany napis |
| `logo-horizontal.svg` / `-dark` | logo podstawowe (sygnet + fasetowany napis) |
| `logo-horizontal-flat.svg` | sygnet fasetowany + napis płaski – do bardzo małych rozmiarów |
| `logo-horizontal-mono.svg` | jednokolorowe |
| `logo-stacked.svg` | pionowe (social, kwadratowe pola) |
| `icon.svg`, `icon-light.svg`, `icon-rose.svg`, `favicon.svg` | kafelki app/social, favicon (kopia w `public/`) |
| `mockups/` | wizualizacje (Bloom) |

Tony: granat `A9B3D6 7F8BBB 5A6AA2 3E4F8A 2A3B69 1E294A`, róż `F7B3C1 F0849B E9557A E11D48 C3153E 9F1239`.
Pliki z fasetowanym napisem ważą ~120 KB (ok. 20 KB po gzip) – tysiące trójkątów; do druku bez znaczenia, na stronie plik jest cache'owany.

Generator: `INTER_BLACK_TTF=/ścieżka/Inter-Black.ttf node brand/build-logo.mjs` (wymaga `opentype.js`, `poly2tri`).
Cała geometria i cieniowanie w `facet.mjs`; zmiana palety to zmiana tablic `NAVY` / `ROSE`.
