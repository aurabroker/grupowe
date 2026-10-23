# Identyfikacja grupowe.pro

Znak dziedziczy geometrię fasetowanej litery **U** z utratadochodu.pl (rodzina Aura): 28 trójkątów, pole 60×78.
U = **Ubezpieczenia**. Nowa paleta: granat `#1E294A` w ramionach, róż `#E11D48` w łuku (fundament).
Założenia: [DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md). Arkusz: [brand-sheet.png](brand-sheet.png) / [.pdf](brand-sheet.pdf).

| Plik | Użycie |
|---|---|
| `mark.svg` | sygnet na jasnym tle |
| `mark-on-dark.svg` | sygnet na granacie (jasne fasety + róż) |
| `mark-mono.svg`, `mark-white.svg` | jednokolorowe (druk, grawer, pieczęć) |
| `logo-horizontal.svg` / `-dark` / `-mono` | logo poziome – podstawowe |
| `logo-stacked.svg` | logo pionowe (social, kwadratowe pola) |
| `icon.svg`, `icon-light.svg`, `icon-rose.svg` | kafelki app/social |
| `favicon.svg` | favicon strony (kopia w `public/`) |
| `mockups/` | wizualizacje (Bloom): ikona aplikacji, wizytówki, szyld |

Wordmark to ścieżki (Inter Black, tracking −3,5 %), więc pliki nie wymagają fontu.
Tony: granat `A9B3D6 7F8BBB 5A6AA2 3E4F8A 2A3B69 1E294A`, róż `F7B3C1 F0849B E9557A E11D48 C3153E 9F1239`.
Generator: `node brand/build-logo.mjs` (wymaga `opentype.js` i `INTER_BLACK_TTF=ścieżka/do/Inter-Black.ttf`) – zmiana palety to zmiana jednej tablicy.
