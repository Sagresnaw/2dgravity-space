// Author: Chris Best


// Import the QuadTree class from your quad.js file
import { QuadTree, Rectangle, Point } from './quad.mjs';

// basic setup
const canvas = document.getElementById("screen");
canvas.width = innerWidth;
canvas.height = innerHeight;
const virtualCanvasWidth = 10000;
const virtualCanvasHeight = 10000;
const ctx = canvas.getContext("2d");
const MAX_PARTICLES = 2500;

// Variables for time control
let timeFactor = 1; // Initial time factor
let isPaused = false; // Flag to indicate if simulation is paused

// camera and zoom
let cameraX = virtualCanvasWidth / 2;
let cameraY = virtualCanvasHeight / 2;
let zoom = 1;
let showOrbits = false;

// show guides on particles
function toggleShowOrbits() {
  showOrbits = !showOrbits;
  render();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "q" || e.key === "Q") {
    isPaused = !isPaused;
  } else if (e.key === "w" || e.key === "W") {
    timeFactor = 0.5;
  } else if (e.key === "e" || e.key === "E") {
    timeFactor = 10;
  } else if (e.key === "g" || e.key === "G") {
    toggleShowOrbits();
  }
});

// mouse event for buttons
canvas.addEventListener("click", (e) => {
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - canvasRect.left;
  const mouseY = e.clientY - canvasRect.top;

  // guide button
  if (mouseX >= 10 && mouseX <= 110 && mouseY >= 50 && mouseY <= 100) {
    toggleShowOrbits();
  }
  // reset button
  else if (mouseX >= 10 && mouseX <= 110 && mouseY >= 110 && mouseY <= 150) {
    resetSimulation();
  }
  // remove all particles button
  else if (mouseX >= 10 && mouseX <= 110 && mouseY >= 170 && mouseY <= 210) {
    particles.length = 0;
    render();
  }

  // pause button
  else if (mouseX >= 300 && mouseX <= 325 && mouseY >= 10 && mouseY <= 35) {
    isPaused = !isPaused;
    console.log("pause");
  }
  // slow down button
  else if (mouseX >= 270 && mouseX <= 295 && mouseY >= 10 && mouseY <= 35) {
    timeFactor *= 0.1;
    console.log("slow down");
  }
  // speed up button
  else if (mouseX >= 330 && mouseX <= 355 && mouseY >= 10 && mouseY <= 35) {
    timeFactor *= 10;
    console.log("speed up");
  }  
  else {
 // Create particles using the quadtree
 const numCircles = 15;
 const particlesPerCircle = 50;
 const circleRadius = 150;
 const circleSpacing = 10;
 const centerX = ((mouseX - cameraX) / zoom) + cameraX;
 const centerY = ((mouseY - cameraY) / zoom) + cameraY;

 for (let c = 0; c < numCircles; c++) {
   const currentRadius = circleRadius - (c * circleSpacing);

   for (let i = 0; i < particlesPerCircle; i++) {
     const angle = (i / particlesPerCircle) * Math.PI * 2;
     const particleX = centerX + Math.cos(angle) * currentRadius;
     const particleY = centerY + Math.sin(angle) * currentRadius;
     const mass = 1;
     const color = "white";

     const particle = new Particle(particleX, particleY, 0,0, mass, color);
     particles.push(particle);
     quadtree.insert(particle); // Insert the particle into the quadtree
   }
 }

 //render(); // Render the scene after adding particles

  }

  
});
// prevent right click menu and drag to pan
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Pan the camera using mouse drag
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const deltaX = (e.clientX - lastMouseX) / zoom;
    const deltaY = (e.clientY - lastMouseY) / zoom;

    cameraX -= deltaX;
    cameraY -= deltaY;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    render();
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

// Zoom using the mouse wheel
canvas.addEventListener("wheel", (e) => {
  const zoomFactor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
  zoom *= zoomFactor;

  render();
});

// particle class and functions "planets"
class Particle {
  constructor(x, y, vx, vy, mass, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.mass = mass;
    this.color = color;
    this.orbitPath = []; // Store positions for orbit path
    this.maxRadius = 10; // Maximum radius for particles
    this.radius = Math.min(Math.sqrt(this.mass) * 0.75, this.maxRadius);
  }

  update() {
    this.orbitPath.push({ x: this.x, y: this.y }); // Store position for orbit path
    if (this.orbitPath.length > 5000) {
      this.orbitPath.shift(); // Keep a limited number of stored positions
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  applyGravity(other) {
    const G = 0.1;
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared === 0) return;

    const force = (G * this.mass * other.mass) / distanceSquared;
    const angle = Math.atan2(dy, dx);

    const forceX = force * Math.cos(angle);
    const forceY = force * Math.sin(angle);

    const ax = forceX / this.mass;
    const ay = forceY / this.mass;

    const deltaTime = 1;
    const impulseX = ax * deltaTime;
    const impulseY = ay * deltaTime;

    this.vx += impulseX;
    this.vy += impulseY;
  }

  checkCollision(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < (this.radius + other.radius) ** 2) {
      const totalMass = this.mass + other.mass * 0.9;

      const averageVx = (this.vx * this.mass + other.vx * other.mass) / totalMass;
      const averageVy = (this.vy * this.mass + other.vy * other.mass) / totalMass;

      this.mass = totalMass;
      this.radius = Math.min(Math.sqrt(this.mass) * 1.5, this.maxRadius);

      if (this.mass <= 5000) {
        this.color = "white";
      } else if (this.mass <= 10000) {
        this.color = "yellow";
      } else {
        this.color = "red";
      }

      this.vx = averageVx;
      this.vy = averageVy;

      particles.splice(particles.indexOf(other), 1);
    }
  }

  drawOrbit() {
    if (showOrbits) {
      ctx.beginPath();
      ctx.moveTo(this.orbitPath[0].x, this.orbitPath[0].y);
      for (const pos of this.orbitPath) {
        ctx.lineTo(pos.x, pos.y);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}
// spawn particles
const particles = [];

// Create a boundary for the quadtree
const boundary = new Rectangle(0, 0, canvas.width, canvas.height);

// Create the quadtree with an appropriate capacity
const quadtree = new QuadTree(boundary, 4);

for (let i = 0; i < MAX_PARTICLES; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const vx = (Math.random() - 0.5) * 0.5;
  const vy = (Math.random() - 0.5) * 0.5;
  const mass = Math.random() * 20;
  const color = "white";

  particles.push(new Particle(x, y, vx, vy, mass, color));
  quadtree.insert(particles[particles.length - 1]); // Insert the newly created particle into the quadtree
}

// reset simulation
function resetSimulation() {
  quadtree.clear();
  particles.length = 0;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = (Math.random() - 0.5) * 0.5;
    const mass = Math.random() * 20;
    const color = "white";

    particles.push(new Particle(x, y, vx, vy, mass, color));
    quadtree.insert(particles[particles.length - 1]); // Insert the newly created particle into the quadtree
  }
}

function render() {
  ctx.clearRect(0, 0, virtualCanvasWidth, virtualCanvasHeight);

  // Apply canvas transformations for particle rendering
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cameraX, -cameraY);
  ctx.restore();

  quadtree.clear();
  for (const particle of particles) {
    quadtree.insert(particle);
  }

  for (const particle of particles) {
    const range = new Rectangle(
      particle.x - particle.radius,
      particle.y - particle.radius,
      particle.radius * 2,
      particle.radius * 2
    );
    const nearbyParticles = quadtree.query(range);

    for (const other of nearbyParticles) {
      if (particle !== other) {
        particle.checkCollision(other);
      }
    }
  }

  

  // Restore the original transformation for rendering UI elements
  ctx.restore();

  
  // particle count
  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(`Particles: ${particles.length}`, 10, 30);

  // guide button
  ctx.beginPath();
  ctx.rect(10, 50, 100, 50);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Guide", 20, 80);

  // reset button
  ctx.beginPath();
  ctx.rect(10, 110, 100, 50);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Reset", 20, 140);

  // remove all particles button
  ctx.beginPath();
  ctx.rect(10, 170, 100, 50);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Remove", 20, 200);


  // pause button
  ctx.beginPath();
  ctx.rect(300, 10, 25, 25);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("||", 305, 28);

  // slow down button
  ctx.beginPath();
  ctx.rect(270, 10, 25, 25);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("-", 277, 28);

  // speed up button
  ctx.beginPath();
  ctx.rect(330, 10, 25, 25);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("+", 337, 28);

  for (const particle of particles) {
    particle.drawOrbit();
    particle.draw();
  }

}
  

// Initialize quadtree and insert particles
//const quadtree = new QuadTree(new Rectangle(0, 0, canvas.width, canvas.height), 4);
for (const particle of particles) {
  quadtree.insert(new Point(particle.x, particle.y));
}

// Animation loop
function animate(timestamp) {
  if (isPaused) {
    lastTimestamp = timestamp; // Update lastTimestamp to avoid sudden jumps when resuming
    requestAnimationFrame(animate);
    return;
  }


  for (const particle of particles) {
    for (const other of particles) {
      if (particle !== other) {
        particle.applyGravity(other);
      }
    }
    particle.update();
  }

  render(); // Render particles and other elements on the canvas
  requestAnimationFrame(animate);
}

animate();
