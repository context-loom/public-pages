# Context Loom – Public Pages

Öffentliches **Ausgabe-/Deploy-Repository** für mehrere statische Demos und fachliche Viewer. Die einzelnen Quellprojekte bleiben in ihren Entwicklungs-Repositories; nur ausdrücklich geprüfte, veröffentlichungsfähige Artefakte dürfen hierhin.

## Verzeichnisstruktur

| Ordner | Öffentlicher Einstieg | Führende Quelle |
| --- | --- | --- |
| `/` | Übersicht mit gesperrten Links bis zur Entschlüsselung | Dieses Repository (`index.html`, `router.mjs`, `routes.json`) |
| `pdf-review/` | `/pdf-review/` | `context-loom/pdf-review` → erzeugtes `dist/` |
| `compliance-traceability/` | `/compliance-traceability/` | `context-loom/compliance-traceability/viewer/index.html` und `examples/trbs-1115-teil-1-2026.json` |

GitHub Pages veröffentlicht `main` aus `/(root)`. Die Anwendungen verwenden relative URL-Pfade. Die Anwendungen sind auf der Startseite benannt, aber ihre `href`-Ziele werden erst nach Eingabe des gemeinsamen Codes oder Aufruf mit `#secret=...` eingesetzt.

## Verbindliche Veröffentlichungsvorgaben

1. **Quell-Repositories sind führend.** Keine Entwicklung am PDF-Review- oder Traceability-Viewer innerhalb dieses Ausgabe-Repositories.
2. **Deploy nur in den jeweiligen Unterordner**, niemals wieder ein vollständiges `dist/` in den Root kopieren. Insbesondere darf ein neues PDF-Review-Deployment `compliance-traceability/` und `index.html` nicht überschreiben.
3. Vor Veröffentlichung öffentliche Inhalte auf Geheimnisse, personenbezogene Daten, Kunden-/Produktionsdaten und interne Konfigurationen prüfen. Keine gesamten privaten Repositories, `assessment`-Dateien oder unkontrolliert eingefügten Beispiele kopieren.
4. `pdf-review/` wird als kompletter, unveränderter statischer `dist/`-Build des Quellprojekts kopiert, einschließlich `vendor/`, Lizenztexten und synthetischem Test-PDF. Die letzte vorliegende Provenienzangabe im alten `pdf-review-demo`-README lautete `context-loom/pdf-review@dc164f4fe2b99e5b4706470b0502b9b2e89adc64`; dieser Quellabgleich wurde bei der Umstrukturierung nicht neu verifiziert.
5. `compliance-traceability/` enthält nur den öffentlichen HTML-Viewer und den TRBS-1115-Teil-1-Datensatz (Originaltext + modellierte Anforderungen, noch ohne Anlagen-Assessments). Der HinSchG-Datensatz und alle sonstigen privaten Quelldateien bleiben ausgeschlossen.
6. Veröffentlichungen sind durch Commit und Quellrevision nachvollziehbar zu halten; spätere Automatisierungen müssen diese Ordnergrenzen technisch durchsetzen.

## GitHub Pages

Das Repository heißt `context-loom/public-pages` und veröffentlicht die statischen Inhalte über GitHub Pages:

- [Startseite](https://context-loom.github.io/public-pages/) (ohne Code: Linkziele gesperrt).
- Der öffentliche [`INDEX.md`](https://github.com/context-loom/.github/blob/main/INDEX.md) enthält **keinen Schlüssel**. Einstieg mit `#secret=...` nur aus den privaten Quell-Repository-READMEs.

Die Publishing-Konfiguration in **Settings → Pages** nutzt `main` aus `/(root)`. Die neue URL muss nach Umbenennungen auf Erreichbarkeit geprüft werden.

## Gemeinsamer Code für alle Projekte

Die Startseite zeigt die Projektnamen PDF Review und TRBS 1115 Teil 1, jedoch zunächst **keine `href`-Attribute**.
Ein einheitlicher 16-stelliger Code kann auf zwei Wegen geliefert werden:

- manuell über das Eingabefeld (anschließend wird `#secret=...` in die URL geschrieben);
- unmittelbar in der Start-URL `https://context-loom.github.io/public-pages/#secret=<CODE>`.

JavaScript leitet per **PBKDF2-HMAC-SHA-256 (180.000 Iterationen)** aus dem Code einen Schlüssel ab.
Mit **AES-256-GCM** wird der gesamte Zielkatalog in `routes.json` entschlüsselt und je Projekt das `href` gesetzt.
Es erfolgt **keine automatische Weiterleitung** mehr. Ein Klick auf einen freigeschalteten Link öffnet das
jeweilige Projekt; die Ziel-URLs bleiben dabei am gleichen Pages-Ursprung.
Diese Lösung ist symmetrische Verschlüsselung und **kein PGP**, das zusätzlich eine asymmetrische Schlüsselverwaltung erfordern würde.

### Konfiguration und Rotation

Mit Node.js >= 20 einen neuen gemeinsamen Code und verschlüsselten Index erzeugen:

```bash
node scripts/create_shared_index.mjs \
  pdf-review=pdf-review/ \
  trbs-1115=compliance-traceability/
```

Die Ausgabe enthält `secret` sowie `manifest`. Ausschließlich das `manifest`-Objekt wird in `routes.json` gespeichert.
Bei einem neuen Projekt oder einer Code-Rotation **alle Projekte** im Generator-Aufruf aufnehmen.
Für dieselbe Code-Kennung kann `PUBLIC_PAGES_SECRET` gesetzt werden; die verschlüsselte Manifestdatei wird trotzdem neu erzeugt.
Bei Code-Rotation die geheimhaltungsbedürftigen Einstiegslinks in den privaten `README.md` von `context-loom/pdf-review` und `context-loom/compliance-traceability` aktualisieren. Den Code niemals in öffentlichen Index, README oder Quellcode übernehmen.

Prüfung:

```bash
node scripts/test_shared_index.mjs
```

Ein optional gesetztes `PUBLIC_PAGES_SECRET` erlaubt dem Test zusätzlich die Entschlüsselung des veröffentlichten Manifests.
Die bisherigen einzelnen Anwendungscodes und `create_access_code.mjs` sind nicht mehr gültig.

### Indexierung und Sicherheitsgrenze

**Kein Zugangsschutz:** Alle statischen Dateien und Repositoryinhalte bleiben direkt öffentlich erreichbar.
Der gemeinsame Code liegt ausschließlich in den READMEs der **privaten Quell-Repositories**. Er steht nicht im öffentlichen Index, im öffentlichen Repository oder im Client-JavaScript. Trotzdem ist dies keine Zugriffskontrolle, denn die öffentlichen Zielpfade bleiben direkt erreichbar.
`noindex,nofollow` auf den HTML-Seiten erschwert regelkonformen Suchmaschinen die Indexierung, verhindert sie
aber nicht zuverlässig und betrifft nicht automatisch die öffentliche GitHub-Repository-Ansicht.
**Keine vertraulichen Daten auf dieser Plattform veröffentlichen.**

## Veröffentlichungsprüfung

- Startseite zeigt die Projektübersicht ohne `href`; gültiger Code (Eingabe oder `#secret`) aktiviert beide Links, ungültiger Code belässt sie gesperrt.
- PDF-Review muss seine relativen `./vendor/`, Module und `test.pdf` laden.
- TRBS-Viewer muss `./data/trbs-1115-teil-1-2026.json` laden und Quelltext sowie die abgeleiteten Anforderungen anzeigen.
- Nach jedem Release stichprobenartig mindestens einen Originaltextabschnitt mit verknüpften Anforderungen öffnen.

PDF.js und gebündelte Fonts behalten ihre jeweiligen Lizenzen in `pdf-review/vendor/`.
