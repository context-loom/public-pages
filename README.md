# Context Loom – Public Pages

Öffentliches **Ausgabe-/Deploy-Repository** für mehrere statische Demos und fachliche Viewer. Die einzelnen Quellprojekte bleiben in ihren Entwicklungs-Repositories; nur ausdrücklich geprüfte, veröffentlichungsfähige Artefakte dürfen hierhin.

## Verzeichnisstruktur

| Ordner | Öffentlicher Einstieg | Führende Quelle |
| --- | --- | --- |
| `/` | Öffentliche Startseite mit Projektlinks | Dieses Repository (`index.html`) |
| `informationsmodell/` | `/informationsmodell/` | `context-loom/pdf-review/docs/informationsmodell/README.md` → `scripts/build-information-model.mjs` |
| `pdf-review/` | `/pdf-review/` | `context-loom/pdf-review` → erzeugtes `dist/` |
| `compliance-traceability/` | `/compliance-traceability/` | `context-loom/compliance-traceability/viewer/index.html` und `examples/trbs-1115-teil-1-2026.json` |

GitHub Pages veröffentlicht `main` aus `/(root)`. Die Startseite verlinkt die veröffentlichten statischen Anwendungen direkt. Die Anwendungen verwenden relative URL-Pfade.

## Verbindliche Veröffentlichungsvorgaben

1. **Quell-Repositories sind führend.** Keine Entwicklung am PDF-Review- oder Traceability-Viewer innerhalb dieses Ausgabe-Repositories.
2. **Deploy nur in den jeweiligen Unterordner**, niemals wieder ein vollständiges `dist/` in den Root kopieren. Insbesondere darf ein neues PDF-Review-Deployment `compliance-traceability/` und `index.html` nicht überschreiben.
3. Vor Veröffentlichung öffentliche Inhalte auf Geheimnisse, personenbezogene Daten, Kunden-/Produktionsdaten und interne Konfigurationen prüfen. Keine gesamten privaten Repositories, `assessment`-Dateien oder unkontrolliert eingefügten Beispiele kopieren.
4. `pdf-review/` wird als kompletter, unveränderter statischer `dist/`-Build des Quellprojekts kopiert, einschließlich `vendor/`, Lizenztexten und synthetischem Test-PDF. Die letzte vorliegende Provenienzangabe im alten `pdf-review-demo`-README lautete `context-loom/pdf-review@dc164f4fe2b99e5b4706470b0502b9b2e89adc64`; dieser Quellabgleich wurde bei der Umstrukturierung nicht neu verifiziert.
5. `compliance-traceability/` enthält nur den öffentlichen HTML-Viewer und den TRBS-1115-Teil-1-Datensatz (Originaltext + modellierte Anforderungen, noch ohne Anlagen-Assessments). Der HinSchG-Datensatz und alle sonstigen privaten Quelldateien bleiben ausgeschlossen.
6. Veröffentlichungen sind durch Commit und Quellrevision nachvollziehbar zu halten; spätere Automatisierungen müssen diese Ordnergrenzen technisch durchsetzen.

## GitHub Pages

Das Repository `context-loom/public-pages` veröffentlicht ausschließlich ausdrücklich für die Öffentlichkeit bestimmte, statische Artefakte. Einstieg und direkte Links:

- [Startseite](https://context-loom.github.io/public-pages/)
- [PDF Review](https://context-loom.github.io/public-pages/pdf-review/)
- [TRBS 1115 Teil 1](https://context-loom.github.io/public-pages/compliance-traceability/)

Die Publishing-Konfiguration unter **Settings → Pages** verwendet `main` aus `/(root)`.

Es gibt keine Linkverschleierung, Eingabecodes oder clientseitige Zugriffskontrolle. Die Anwendungen sind öffentlich und direkt erreichbar. Vertrauliche Daten gehören nicht in dieses Repository.

## Veröffentlichungsprüfung

- Startseite verlinkt PDF Review und den TRBS-Viewer direkt; beide Aufrufe funktionieren ohne JavaScript-Router oder Eingabecode.
- PDF-Review muss seine relativen `./vendor/`, Module und `test.pdf` laden.
- TRBS-Viewer muss `./data/trbs-1115-teil-1-2026.json` laden und Quelltext sowie die abgeleiteten Anforderungen anzeigen.
- Nach jedem Release stichprobenartig mindestens einen Originaltextabschnitt mit verknüpften Anforderungen öffnen.

PDF.js und gebündelte Fonts behalten ihre jeweiligen Lizenzen in `pdf-review/vendor/`.

## Fachliches Informationsmodell

[Informationsmodell öffnen](https://context-loom.github.io/public-pages/informationsmodell/).
Führende Quelle: `context-loom/pdf-review`, Branch `refactor/vue-frontend`,
`docs/informationsmodell/README.md`. Generator: `scripts/build-information-model.mjs`.
Veröffentlicht aus Quellcommit `f7c97820f4fd20666b652878c64688708752e944`.
Reproduktion im Quellrepository: `node scripts/build-information-model.mjs`;
nur `dist-information-model/index.html` nach `informationsmodell/index.html` übernehmen.

Veröffentlicht wird eine konzeptionelle Arbeitsfassung mit generischen Beispielen,
keine realen GOM-Messdaten, Kundenunterlagen oder Zugangsdaten.
HTML/SVG/CSS und Tabellenfilter sind eigenständig; keine externen Skripte oder Fonts.
Syntax und Navigationsanker wurden geprüft. Ein visueller Browserlauf war in der
Erstellungsumgebung mangels installiertem Chromium nicht ausführbar.
