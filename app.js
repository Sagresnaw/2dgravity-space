const canvas = document.getElementById("screen");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

let cameraX = canvas.width / 2;
let cameraY = canvas.height / 2;
let zoom = 1;
let showOrbits = false;

document.addEventListener("keydown", (e) => {
  if (e.key === "g" || e.key === "G") {
    showOrbits = !showOrbits;
    render();
  }
});

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

canvas.addEventListener("wheel", (e) => {
  if (e.deltaY < 0) {
    zoom *= 1.1;
  } else {
    zoom /= 1.1;
  }

  render();
});

let touchStartX = 0;
let touchStartY = 0;
let initialZoom = 1;

canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    initialZoom = zoom;
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
  } else if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    const distance = Math.sqrt(
      (touch2.clientX - touch1.clientX) ** 2 + (touch2.clientY - touch1.clientY) ** 2
    );

    zoom = initialZoom * (distance / initialDistance);

    render();
  }
});

canvas.addEventListener("touchend", () => {
  initialDistance = null;
});

let initialDistance = null;

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
    if (this.orbitPath.length > 900) {
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
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    const force = (G * this.mass * other.mass) / (distance * distance);
    const ax = (force * dx) / distance;
    const ay = (force * dy) / distance;

    this.vx += ax / this.mass;
    this.vy += ay / this.mass;
  }

  checkCollision(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius + other.radius) {
      this.mass += other.mass;
      this.radius = Math.min(Math.sqrt(this.mass) * 2, this.maxRadius);

      if (this.mass <= 20) {
        this.color = "white";
      } else if (this.mass <= 40) {
        this.color = "yellow";
      } else {
        this.color = "red";
      }

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

const particles = [];
for (let i = 0; i < 1000; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const vx = (Math.random() - 0.5) * 0.5;
  const vy = (Math.random() - 0.5) * 0.5;
  const mass = Math.random() * 2;
  const color = "white";

  particles.push(new Particle(x, y, vx, vy, mass, color));
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cameraX, -cameraY);

  for (const particle of particles) {
    for (const other of particles) {
      if (particle !== other) {
        particle.applyGravity(other);
        particle.checkCollision(other);
      }
    }
    particle.update();
    particle.draw();
    particle.drawOrbit();
  }

  ctx.restore();

  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(`Particles: ${particles.length}`, 10, 30);
}

function animate() {
  render();
  requestAnimationFrame(animate);
}

animate();
