// Author: Chris Best


// Import the QuadTree class from your quad.js file
import { QuadTree, Rectangle, Point } from './quad.mjs';

// basic setup
const canvas = document.getElementById("screen");
canvas.width = innerWidth;
canvas.height = innerHeight;
const ctx = canvas.getContext("2d");
const MAX_PARTICLES = 1000;

// Variables for time control
let timeFactor = 1; // Initial time factor
let isPaused = false; // Flag to indicate if simulation is paused

// camera and zoom
let cameraX = 0;
let cameraY = 0;
let zoom = 1;
let showOrbits = false;
let spawnParticle = false;
let spawnDisk = false;

// show guides on particles
function toggleShowOrbits() {
  showOrbits = !showOrbits;
  render();
}

function drawButton(x, y, width, height, text) {
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(text, x + 10, y + height / 2 + 5);
}

const buttons = [
  { x: 10, y: 50, width: 100, height: 50, action: toggleShowOrbits },
  { x: 10, y: 110, width: 100, height: 50, action: resetSimulation },
  { x: 10, y: 170, width: 100, height: 50, action: () => { particles.length = 0; } },
  {x: 10 , y: 230, width: 50, height: 50, action: toggleParticleSpawn},
  {x: 70 , y: 230, width: 50, height: 50, action: toggleDiskSpawn},
  {x: 10, y: 290, width: 100, height: 50, action: () => { spawnDisk = false; spawnParticle = false; } },
  { x: 300, y: 10, width: 25, height: 25, action: () => { isPaused = !isPaused; console.log("pause"); } },
  { x: 270, y: 10, width: 25, height: 25, action: () => { timeFactor *= 0.1; console.log("slow down"); } },
  { x: 330, y: 10, width: 25, height: 25, action: () => { timeFactor *= 10; console.log("speed up"); } }
];

function toggleParticleSpawn() {
  spawnParticle = !spawnParticle;
  if (spawnParticle) {
    spawnDisk = false; // Turn off the other mode
  }
}

function toggleDiskSpawn() {
  spawnDisk = !spawnDisk;
  if (spawnDisk) {
    spawnParticle = false; // Turn off the other mode
  }
}


let panStartX = 0;
let panStartY = 0;
let isPanning = false;

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // Prevent the default context menu
});

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
  isPanning = true;
  panStartX = e.clientX;
  panStartY = e.clientY;
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isPanning) {
    const deltaX = e.clientX - panStartX;
    const deltaY = e.clientY - panStartY;

    cameraX += deltaX / zoom;
    cameraY += deltaY / zoom;

    panStartX = e.clientX;
    panStartY = e.clientY;

    render();
  }
});

canvas.addEventListener("mouseup", () => {
  isPanning = false;
});

canvas.addEventListener("mouseout", () => {
  isPanning = false;
});

canvas.addEventListener("click", (e) => {
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - canvasRect.left;
  const mouseY = e.clientY - canvasRect.top;
  const adjustedMouseX = (mouseX - cameraX) / zoom;
  const adjustedMouseY = (mouseY - cameraY) / zoom;

  for (const button of buttons) {
    if (
      mouseX >= button.x && mouseX <= button.x + button.width &&
      mouseY >= button.y && mouseY <= button.y + button.height
    ) {
      if (button.action === toggleParticleSpawn) {
        spawnParticle = true;
        spawnDisk = false; // Disable the other mode
        console.log("particle spawn on");
      } else if (button.action === toggleDiskSpawn) {
        spawnParticle = false; // Disable the other mode
        spawnDisk = true;
        console.log("disk spawn on");
      } else {
        button.action();
      }
      render();
      return; // Exit the loop and the rest of the event handling
    }
  }

  if (spawnParticle) {
    const particle = new Particle(
      adjustedMouseX,
      adjustedMouseY,
      0,
      0,
      1000,
      "blue"
    );
    particles.push(particle);
    render();
  }

  if (spawnDisk) {
   // Create particles using the quadtree
const numCircles = 15;
const particlesPerCircle = 50;
const circleRadius = 150;
const circleSpacing = 10;

const canvasRect = canvas.getBoundingClientRect();
const mouseX = e.clientX - canvasRect.left;
const mouseY = e.clientY - canvasRect.top;
const adjustedMouseX = (mouseX - cameraX) / zoom;
const adjustedMouseY = (mouseY - cameraY) / zoom;

for (let c = 0; c < numCircles; c++) {
  const currentRadius = circleRadius - (c * circleSpacing);

  for (let i = 0; i < particlesPerCircle; i++) {
    const angle = (i / particlesPerCircle) * Math.PI * 2;
    const distanceFromCenter = Math.sqrt(Math.random()) * currentRadius; // Randomize the distance for better distribution
    const particleScreenX = adjustedMouseX + Math.cos(angle) * distanceFromCenter;
    const particleScreenY = adjustedMouseY + Math.sin(angle) * distanceFromCenter;

    // Convert screen coordinates back to world coordinates
    const particleX = (particleScreenX * zoom) + cameraX;
    const particleY = (particleScreenY * zoom) + cameraY;

    const mass = 1;
    const color = "white";

    const particle = new Particle(particleX, particleY, 0, 0, mass, color);
    particles.push(particle);
    quadtree.insert(particle); // Insert the particle into the quadtree
  }
}


    render();
  }
});
canvas.addEventListener("wheel", (e) => {
  const zoomFactor = e.deltaY > 0 ? 1 / 1.1 : 1.1;
  zoom *= zoomFactor;

  render();
});

class Particle {
  constructor(x, y, vx, vy, mass, color) {
    Object.assign(this, { x, y, vx, vy, mass, color });
    this.orbitPath = [];
    this.maxRadius = 10;
    this.radius = Math.min(Math.sqrt(this.mass) * 0.25, this.maxRadius);
  }

  update() {
    this.orbitPath.push({ x: this.x, y: this.y });
    if (this.orbitPath.length > 5000) this.orbitPath.shift();
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
    const deltaTime = timeFactor;
    this.vx += ax * deltaTime;
    this.vy += ay * deltaTime;
  }

  checkCollision(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared < (this.radius + other.radius) ** 2) {
      const totalMass = this.mass + other.mass * 0.75;
      const averageVx = (this.vx * this.mass + other.vx * other.mass) / totalMass;
      const averageVy = (this.vy * this.mass + other.vy * other.mass) / totalMass;

      Object.assign(this, {
        mass: totalMass,
        radius: Math.min(Math.sqrt(totalMass) * 0.75, this.maxRadius),
        color: this.mass <= 1000 ? "white" : this.mass <= 5000 ? "yellow" : "red",
        vx: averageVx,
        vy: averageVy,
      });
      particles.splice(particles.indexOf(other), 1);
    }
  }

  drawOrbit() {
    if (showOrbits) {
      ctx.beginPath();
      ctx.moveTo(this.orbitPath[0].x, this.orbitPath[0].y);
      for (const pos of this.orbitPath) ctx.lineTo(pos.x, pos.y);
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

function spawnParticles() {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = (Math.random() - 0.5) * 0.5;
    const mass = Math.random() * 25;
    const color = "white";
  
    particles.push(new Particle(x, y, vx, vy, mass, color));
    quadtree.insert(particles[particles.length - 1]); // Insert the newly created particle into the quadtree
  }
}

spawnParticles();

// reset simulation
function resetSimulation() {
  quadtree.clear();
  particles.length = 0;
  spawnParticles();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply canvas transformations for particle rendering
  ctx.save();
  ctx.translate(window.innerWidth / 2, window.innerHeight / 2)
  ctx.scale(zoom, zoom);
  ctx.translate(-window.innerWidth / 2 + cameraX, -window.innerHeight / 2 + cameraY);


  // Update particle positions and apply gravity
  for (const particle of particles) {
    for (const other of particles) {
      if (particle !== other) {
        particle.applyGravity(other);
      }
    }
    particle.update();
  }

  // Clear and update the QuadTree with new particle positions
  quadtree.clear();
  for (const particle of particles) {
    quadtree.insert(particle);
  }

  // Collision checks
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

  // Render particles
  for (const particle of particles) {
    particle.drawOrbit();
    particle.draw();
  }

  // Restore the original transformation for rendering UI elements
  ctx.restore();
  

  
  // particle count
  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(`Particles: ${particles.length}`, 10, 30);
  
  // draw buttons
  drawButton(10, 50, 100, 50, "Guide");
  drawButton(10, 110, 100, 50, "Reset");
  drawButton(10, 170, 100, 50, "Remove");
  drawButton(10, 230, 50, 50, "⭐️");
  drawButton(70, 230, 50, 50, "💫");
  drawButton(10, 290, 100, 50, "off");
  drawButton(300, 10, 25, 25, "||");
  drawButton(270, 10, 25, 25, "-");
  drawButton(330, 10, 25, 25, "+");
}  

// Initialize quadtree and insert particles
//const quadtree = new QuadTree(new Rectangle(0, 0, canvas.width, canvas.height), 4);
for (const particle of particles) {
  quadtree.insert(new Point(particle.x, particle.y));
}

// Animation loop
function animate(timestamp) {
  let lastTimestamp = null;
  if (isPaused) {
    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
    }
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
