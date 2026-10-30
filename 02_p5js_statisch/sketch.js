function setup() {
  createCanvas(400, 400);
  background(255, 0, 0);

  // setzte den Refernzpunkt von Rechtecken auf CENTER
  // rectMode(CENTER); // CORNER
  rect(100, 200, 120, 80); 
  fill(0, 0, 255);
  stroke(255, 255, 0);
  strokeWeight(3);
  ellipse(100, 200, 120, 80);
  ellipseMode(CORNER);

  // Füllfarbe mit 4. Wert für Transparenz
  // fill(255, 255, 255, 0);
  // keine Füllfarbe
  noFill();
  ellipse(100, 200, 120, 80);

  fill(0);
  noStroke();
  triangle(300, 50, 350, 150, 200, 180);

}

function draw() {

}
