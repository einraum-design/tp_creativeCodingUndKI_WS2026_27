// 02 · p5.js Grundlagen

// setup() läuft einmal beim Start
function setup() {
  createCanvas(400, 400);
}

// draw() läuft danach immer wieder (ca. 60-mal pro Sekunde)
function draw() {
  background(240);
  fill(255, 80, 60);
  noStroke();
  circle(width / 2, height / 2, 120);
}
