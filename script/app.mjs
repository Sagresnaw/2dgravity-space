// Author: Chris Best


// Import the QuadTree class from your quad.js file
import { QuadTree, Rectangle, Point } from './quad.mjs';

// basic setup
const canvas = document.getElementById("screen");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");
const MAX_PARTICLES = 1000;

// Variables for time control
let timeFactor = 1; // Initial time factor
let isPaused = false; // Flag to indicate if simulation is paused

// camera and zoom
let cameraX = canvas.width / 2;
let cameraY = canvas.height / 2;
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
// Create a densely packed circle of particles at the clicked position
const numCircles = 5; // Adjust the number of circles as needed
const particlesPerCircle = 30; // Adjust the number of particles per circle as needed
const circleRadius = 50; // Adjust the radius of the outer circle as needed
const circleSpacing = 10; // Adjust the spacing between circles as needed
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

    particles.push(new Particle(particleX, particleY, 0, 0, mass, color));
  }
}

render();

  }

  
});



// prevent right click menu and drag to pan
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    cameraX -= deltaX / zoom;
    cameraY -= deltaY / zoom;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    render();
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});
// zoom in and out
canvas.addEventListener("wheel", (e) => {
  if (e.deltaY < 0) {
    zoom *= 1.1;
  } else {
    zoom /= 1.1;
  }

  render();
});

// attempt at touch controls
let touchStartX = 0;
let touchStartY = 0;
let initialZoom = 1;

// 
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  } 
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();

  if (e.touches.length === 1) {
    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;

    cameraX -= deltaX / zoom;
    cameraY -= deltaY / zoom;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

    render();
  } 
});

canvas.addEventListener("touchend", () => {
  initialDistance = null;
});

let initialDistance = null;

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
    this.radius = Math.min(Math.sqrt(this.mass) * 0.5, this.maxRadius);
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
      const totalMass = this.mass + other.mass;

      const averageVx = (this.vx * this.mass + other.vx * other.mass) / totalMass;
      const averageVy = (this.vy * this.mass + other.vy * other.mass) / totalMass;

      this.mass = totalMass;
      this.radius = Math.min(Math.sqrt(this.mass) * 2, this.maxRadius);

      if (this.mass <= 200) {
        this.color = "white";
      } else if (this.mass <= 400) {
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
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2;
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
  const mass = Math.random() * 2;
  const color = "white";

  particles.push(new Particle(x, y, vx, vy, mass, color));
  quadtree.insert(particles[particles.length - 1]); // Insert the newly created particle into the quadtree
}

// reset simulation
function resetSimulation() {
  particles.length = 0;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = (Math.random() - 0.5) * 0.5;
    const mass = Math.random() * 2;
    const color = "white";

    particles.push(new Particle(x, y, vx, vy, mass, color));
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply canvas transformations for particle rendering
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cameraX, -cameraY);

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