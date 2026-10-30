// 03 · Scheuer Kreis
// Ein kleiner Kreis, der auf die Maus reagiert – wie ein scheues Tier.
// Taste "d" blendet den aktuellen Zustand ein (zum Verstehen/Debuggen).

// --- Einstellungen -------------------------------------------------------
const SCHNELL = 18;          // ab dieser Mausgeschwindigkeit (Pixel/Frame) ist die Maus "zu schnell"
const SICHTWEITE = 350;      // so weit "sieht" der Kreis die Maus
const SPIELABSTAND = 120;    // so nah muss die Maus sein, damit er spielt
const BERUHIGEN = 2500;      // ms Mausruhe, bis er nach einer Flucht wieder zutraulich wird
const LANGEWEILE = 4000;     // ms ohne Mausbewegung, bis er von selbst herumstromert

// --- Zustand des Kreises -------------------------------------------------
let pos;                 // Position
let vel;                 // Geschwindigkeit
let groesse = 30;        // aktueller Durchmesser
let vertrauen = 0.5;     // 0 = ängstlich, 1 = ganz zutraulich
let zustand = "ruhe";    // ruhe | neugierig | spielen | flucht | angst | stehen
let zustandSeit = 0;     // Zeitpunkt des letzten Zustandswechsels

// --- Maus ----------------------------------------------------------------
let mausTempo = 0;                 // geglättete Mausgeschwindigkeit
let letzteMausbewegung = -100000;  // Zeitpunkt der letzten Bewegung
let spielWinkel = 0;               // Winkel für das Kreisen um die Maus
let zeigeDebug = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pos = createVector(width / 2, height / 2);
  vel = createVector(0, 0);
}

function draw() {
  background(200);

  // 1. Maus beobachten
  let bewegt = dist(mouseX, mouseY, pmouseX, pmouseY);
  mausTempo = lerp(mausTempo, bewegt, 0.3);
  if (bewegt > 0.5) letzteMausbewegung = millis();

  let maus = createVector(mouseX, mouseY);
  let abstand = p5.Vector.dist(pos, maus);
  // zeigt die Mausbewegung in Richtung Kreis? (Skalarprodukt > 0)
  let mausRichtung = createVector(mouseX - pmouseX, mouseY - pmouseY);
  let zumKreis = p5.Vector.sub(pos, maus);
  let naehertSich = mausRichtung.dot(zumKreis) > 0;
  let ruhezeit = millis() - letzteMausbewegung;

  // 2. Entscheiden, in welchem Zustand der Kreis ist
  entscheide(abstand, naehertSich, ruhezeit);

  // 3. Je nach Zustand eine Wunschgeschwindigkeit bestimmen
  let wunsch = createVector(0, 0);
  let wendigkeit = 0.08;   // wie schnell er seine Richtung ändert

  if (zustand === "ruhe") {
    // langsam zufällig umherwandern (Perlin-Noise statt random = weiche Bewegung)
    let winkel = noise(frameCount * 0.005) * TWO_PI * 4;
    wunsch = p5.Vector.fromAngle(winkel).mult(0.7);
    // vom Rand weg zur Mitte lenken
    if (pos.x < 80 || pos.x > width - 80 || pos.y < 80 || pos.y > height - 80) {
      wunsch.add(createVector(width / 2, height / 2).sub(pos).setMag(0.5));
    }
  } else if (zustand === "neugierig") {
    // vorsichtig auf die Maus zu – kurz vor ihr anhalten
    let richtung = p5.Vector.sub(maus, pos);
    let tempo = map(abstand, 60, 250, 0, 1.8, true);
    wunsch = richtung.setMag(tempo);
  } else if (zustand === "spielen") {
    // verspielt um die Maus kreisen, mit wechselndem Radius
    spielWinkel += 0.04 + 0.03 * sin(frameCount * 0.02);
    let radius = 55 + 25 * sin(frameCount * 0.05) + 15 * noise(frameCount * 0.03);
    let ziel = p5.Vector.add(maus, p5.Vector.fromAngle(spielWinkel).mult(radius));
    wunsch = p5.Vector.sub(ziel, pos).mult(0.12).limit(5);
    wendigkeit = 0.15;
  } else if (zustand === "flucht") {
    // schnell weg von der Maus
    wunsch = p5.Vector.sub(pos, maus).setMag(10);
    wendigkeit = 0.3;
  } else if (zustand === "angst") {
    // still halten und ein wenig zittern
    wunsch = createVector(random(-0.3, 0.3), random(-0.3, 0.3));
    wendigkeit = 0.2;
  } else if (zustand === "stehen") {
    // Maus ist schnell weg – er bleibt einfach stehen
    wendigkeit = 0.15;
  }

  vel.lerp(wunsch, wendigkeit);
  pos.add(vel);

  // im Fenster bleiben
  let r = groesse / 2;
  pos.x = constrain(pos.x, r, width - r);
  pos.y = constrain(pos.y, r, height - r);

  // 4. Vertrauen und Größe
  if (zustand === "flucht" || zustand === "angst") {
    vertrauen = 0;
  } else {
    vertrauen = min(1, vertrauen + 0.003);   // langsam zutraulicher
  }

  let zielGroesse = 14 + 56 * vertrauen;     // zutraulich = groß
  if (zustand === "ruhe") {
    zielGroesse *= 1 + 0.15 * sin(millis() * 0.002);   // langsames Pulsieren
  }
  // bei Flucht schnell schrumpfen, sonst gemächlich wachsen
  let groessenTempo = zustand === "flucht" ? 0.25 : 0.04;
  groesse = lerp(groesse, zielGroesse, groessenTempo);

  // 5. Zeichnen
  noStroke();
  fill(255, 80, 60);
  circle(pos.x, pos.y, groesse);

  if (zeigeDebug) {
    fill(80);
    textSize(14);
    text("Zustand: " + zustand + "   Maustempo: " + nf(mausTempo, 1, 1) +
         "   Vertrauen: " + nf(vertrauen, 1, 2), 16, 24);
  }
}

// Die "Gefühlslogik" des Kreises
function entscheide(abstand, naehertSich, ruhezeit) {
  let zuSchnell = mausTempo > SCHNELL;
  let dauer = millis() - zustandSeit;

  if (zustand === "flucht") {
    // genug Abstand oder lange genug gerannt → ängstlich abwarten
    if (abstand > SICHTWEITE || dauer > 1200) wechsle("angst");
    return;
  }

  if (zustand === "angst") {
    if (zuSchnell && naehertSich && abstand < SICHTWEITE) wechsle("flucht");
    else if (ruhezeit > BERUHIGEN) wechsle("ruhe");   // wieder zutraulich
    return;
  }

  // Maus kommt zu schnell auf ihn zu → Flucht!
  if (zuSchnell && naehertSich && abstand < SICHTWEITE) {
    wechsle("flucht");
    return;
  }

  // Maus entfernt sich zu schnell → stehen bleiben (nur wenn er gerade bei ihr war)
  if (zuSchnell && !naehertSich && (zustand === "neugierig" || zustand === "spielen")) {
    wechsle("stehen");
    return;
  }
  // stehen bleiben, bis die Maus langsam zurückkommt oder ihm langweilig wird
  if (zustand === "stehen" && (mausTempo > SCHNELL * 0.3 || abstand > SICHTWEITE) && ruhezeit < LANGEWEILE) return;

  // lange keine Mausbewegung → Langeweile, er wandert umher
  if (ruhezeit > LANGEWEILE) {
    wechsle("ruhe");
    return;
  }

  // Maus bewegt sich langsam und ist in Sichtweite → neugierig oder verspielt
  if (abstand < SPIELABSTAND) {
    wechsle("spielen");
  } else if (abstand < SICHTWEITE && ruhezeit < 500) {
    wechsle("neugierig");
  } else if (zustand === "spielen" && abstand < SPIELABSTAND * 1.5) {
    // etwas Spielraum, damit er nicht ständig hin- und herwechselt
  } else if (zustand !== "neugierig" || abstand > SICHTWEITE) {
    wechsle("ruhe");
  }
}

function wechsle(neuerZustand) {
  if (zustand !== neuerZustand) {
    zustand = neuerZustand;
    zustandSeit = millis();
  }
}

function keyPressed() {
  if (key === "d") zeigeDebug = !zeigeDebug;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
