# Context Loom – Public Pages

Öffentliches **Ausgabe-/Deploy-Repository** für mehrere statische Demos und fachliche Viewer. Die einzelnen Quellprojekte bleiben in ihren Entwicklungs-Repositories; nur ausdrücklich geprüfte, veröffentlichungsfähige Artefakte dürfen hierhin.

## Verzeichnisstruktur

| Ordner | Öffentlicher Einstieg | Führende Quelle |
| --- | --- | --- |
| `/` | Deep-Link-Router ohne öffentliches Anwendungsverzeichnis | Dieses Repository (`index.html`, `router.mjs`) |
| `pdf-review/` | `/pdf-review/` | `context-loom/pdf-review` → erzeugtes `dist/` |
| `compliance-traceability/` | `/compliance-traceability/` | `context-loom/compliance-traceability/viewer/index.html` und `examples/trbs-1115-teil-1-2026.json` |

GitHub Pages veröffentlicht `main` aus `/(root)`. Die Anwendungen verwenden relative URL-Pfade. Auf der Startseite werden keine Anwendungen offen verlinkt; ein vom Nutzer eingegebener Code entschlüsselt den relativen Zielpfad im Browser.

## Verbindliche Veröffentlichungsvorgaben

1. **Quell-Repositories sind führend.** Keine Entwicklung am PDF-Review- oder Traceability-Viewer innerhalb dieses Ausgabe-Repositories.
2. **Deploy nur in den jeweiligen Unterordner**, niemals wieder ein vollständiges `dist/` in den Root kopieren. Insbesondere darf ein neues PDF-Review-Deployment `compliance-traceability/` und `index.html` nicht überschreiben.
3. Vor Veröffentlichung öffentliche Inhalte auf Geheimnisse, personenbezogene Daten, Kunden-/Produktionsdaten und interne Konfigurationen prüfen. Keine gesamten privaten Repositories, `assessment`-Dateien oder unkontrolliert eingefügten Beispiele kopieren.
4. `pdf-review/` wird als kompletter, unveränderter statischer `dist/`-Build des Quellprojekts kopiert, einschließlich `vendor/`, Lizenztexten und synthetischem Test-PDF. Die letzte vorliegende Provenienzangabe im alten `pdf-review-demo`-README lautete `context-loom/pdf-review@dc164f4fe2b99e5b4706470b0502b9b2e89adc64`; dieser Quellabgleich wurde bei der Umstrukturierung nicht neu verifiziert.
5. `compliance-traceability/` enthält nur den öffentlichen HTML-Viewer und den TRBS-1115-Teil-1-Datensatz (Originaltext + modellierte Anforderungen, noch ohne Anlagen-Assessments). Der HinSchG-Datensatz und alle sonstigen privaten Quelldateien bleiben ausgeschlossen.
6. Veröffentlichungen sind durch Commit und Quellrevision nachvollziehbar zu halten; spätere Automatisierungen müssen diese Ordnergrenzen technisch durchsetzen.

## GitHub Pages

Das Repository heißt `context-loom/public-pages` und veröffentlicht die statischen Inhalte über GitHub Pages:

- [Startseite / Deep-Link-Router](https://context-loom.github.io/public-pages/)
- Die Anwendungen werden nicht öffentlich auf der Startseite verlinkt.

Die Publishing-Konfiguration in **Settings → Pages** nutzt `main` aus `/(root)`. Die neue URL muss nach Umbenennungen auf Erreichbarkeit geprüft werden.

## Code-Eingabe mit verschleierten Zielen

Unter [Public Pages](https://context-loom.github.io/public-pages/) erscheint ein einzelnes **Code-Eingabefeld**.
Jede Anwendung erhält einen eigenen zufällig erzeugten, 16-stelligen Code (Anzeige gruppiert als `XXXX-XXXX-XXXX-XXXX`).
Der Browser leitet daraus mittels PBKDF2 (SHA-256, 180.000 Iterationen) einen AES-256-GCM-Schlüssel ab,
versucht damit die Einträge in der öffentlichen `routes.json` zu entschlüsseln und öffnet bei einem Treffer
den relativen Zielpfad. Die Codes sind **nicht** in der Website oder im Repository hinterlegt.
Groß-/Kleinschreibung, Leerzeichen und Bindestriche werden bei der Eingabe ignoriert.

### Neuen Code für eine Anwendung erzeugen

```bash
node scripts/create_access_code.mjs pdf-review/
node scripts/create_access_code.mjs compliance-traceability/
```

Der Befehl gibt den Code **nur auf der Konsole** und den zugehörigen verschlüsselten JSON-Eintrag aus.
Nur das `route`-Objekt wird in `routes.json` ergänzt bzw. bei Rotation ersetzt.
Den Code ausschließlich an die vorgesehenen Empfänger übermitteln; **niemals ins öffentliche Repo committen**.

Lokaler Test (Node.js >= 20):

```bash
node scripts/test_access_code.mjs
```

Der vorherige Router mit langen `#go=...`-Links und das Skript `create_deep_link.mjs` wurden ersetzt.
Bereits erzeugte lange Links werden nicht mehr unterstützt.

### Sicherheitsgrenze

Dies ist **nur Zieladress-Verschleierung, keine Zugriffskontrolle**: Die Verzeichnisse und Dateien
bleiben bei GitHub Pages und im öffentlichen GitHub-Repository ohne Code direkt abrufbar.
Auch ein im Browser entschlüsselter Zielpfad wird nach der Weiterleitung in der Adresszeile sichtbar.
`noindex` ist lediglich eine Bitte an Suchmaschinen. Niemals vertrauliche Inhalte veröffentlichen.

## Veröffentlichungsprüfung

- Startseite zeigt das Eingabefeld; ein gültiger Code leitet zur zugeordneten Anwendung weiter, ein ungültiger zeigt eine verständliche Meldung.
- PDF-Review muss seine relativen `./vendor/`, Module und `test.pdf` laden.
- TRBS-Viewer muss `./data/trbs-1115-teil-1-2026.json` laden und Quelltext sowie die abgeleiteten Anforderungen anzeigen.
- Nach jedem Release stichprobenartig mindestens einen Originaltextabschnitt mit verknüpften Anforderungen öffnen.

PDF.js und gebündelte Fonts behalten ihre jeweiligen Lizenzen in `pdf-review/vendor/`.
