/*
  Batwing-Heckspoiler – eigenes, parametrisches LEGO-kompatibles Modell
  FDM-Druck auf Bambu Lab A1 mit 0,2-mm-Duese
  Einheit: mm | Lizenz: CC0

  Annahme: vier freiliegende LEGO-Noppen im 2x2-Raster (8 mm Abstand)
  Befestigung per Steckpassung; keinerlei Aenderung an Originalteilen.

  Wenn die Passung zu locker ist: socket_d reduzieren (z.B. 5.05)
  Wenn sie zu stramm ist: socket_d erhoehen (z.B. 5.20)
  Nicht mit Gewalt auf LEGO-Noppen druecken.
*/
$fn = 56;

pitch          = 8.0;
socket_d       = 5.10; // nomineller Noppendurchmesser ca. 4,8 mm
socket_depth   = 2.20; // nominelle Noppenhoehe ca. 1,8 mm
body_width     = 20;
body_length    = 20;
body_height    = 4.40;
wing_height    = 2.20;
edge_radius    = 2.0;

// Rechte Fledermausfluegel-Kontur: Vorderkante -> Spitze -> Hinterkante
front = [[0,-6],[8,-8],[17,-9],[26,-12],[39,-16]];
back  = [[37,-4],[30,2],[25,6],[23,0],[19,1],[16,10],[10,7],[7,3],[0,7]];
wing_outline = concat(
    front,
    back,
    [for(i = [len(back)-2:-1:0]) [-back[i][0],back[i][1]]],
    [for(i = [len(front)-1:-1:1]) [-front[i][0],front[i][1]]]
);

module rounded_rectangle(w, h, r) {
    offset(r=r) square([w-2*r,h-2*r],center=true);
}

module wing() {
    linear_extrude(height=wing_height)
        polygon(points=wing_outline);
}

module central_body() {
    linear_extrude(height=body_height)
        rounded_rectangle(body_width,body_length,edge_radius);
}

module stud_sockets() {
    for (x = [-pitch/2, pitch/2], y = [-pitch/2, pitch/2])
        translate([x,y,-0.02])
            cylinder(h=socket_depth+0.02,d=socket_d);
}

// Zwei flache Versteifungen auf der Oberseite der Fluegel (keine Stuetze noetig)
module decorative_ribs() {
    for (side=[-1,1]) {
        translate([side*19,-5,wing_height])
            linear_extrude(height=0.60)
                offset(r=0.50)
                    polygon(points=[[0,0],[side*12,-6],[side*9,-4]]);
    }
}

// Fluegelform und Stecksockel starten beide auf dem Druckbett.
difference() {
    union() {
        wing();
        central_body();
        // Zierversteifungen bewusst weggelassen: ebene, leichter druckbare Oberseite.
    }
    stud_sockets();
}
