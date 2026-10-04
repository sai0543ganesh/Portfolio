// ==================== LOADER ====================
window.addEventListener('load', () => {
  let pct = 0;
  const bar = document.querySelector('.loader-bar');
  const pctEl = document.querySelector('.loader-pct');
  const loader = document.getElementById('loader');
  const interval = setInterval(() => {
    pct += Math.random() * 15;
    if (pct >= 100) {
      pct = 100;
      clearInterval(interval);
      setTimeout(() => {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.5s ease';
        setTimeout(() => loader.style.display = 'none', 500);
      }, 300);
    }
    if (bar) bar.style.width = pct + '%';
    if (pctEl) pctEl.textContent = Math.floor(pct) + '%';
  }, 80);
});

// ==================== CUSTOM CURSOR ====================
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
});

function animateCursor() {
  fx += (mx - fx) * 0.15;
  fy += (my - fy) * 0.15;
  if (follower) { follower.style.left = (fx - 18) + 'px'; follower.style.top = (fy - 18) + 'px'; }
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button, .skill-card, .project-card').forEach(el => {
  el.addEventListener('mouseenter', () => follower && follower.classList.add('hover'));
  el.addEventListener('mouseleave', () => follower && follower.classList.remove('hover'));
});

// ==================== NAVIGATION ====================
const navLinks = document.querySelectorAll('.nav-links a');
const pages = document.querySelectorAll('.page');
const navMenu = document.querySelector('.nav-links');
const navHamburger = document.querySelector('.nav-hamburger');
const activatedSections = new Set();

function setActiveNav(pageId) {
  const target = document.getElementById(pageId);
  if (!target) return;

  pages.forEach(p => p.classList.toggle('active', p.id === pageId));
  navLinks.forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
}

function runSectionAnimations(pageId) {
  if (pageId === 'skills') animateSkillBars();

  if (pageId === 'achievements' && !activatedSections.has(pageId)) {
    animateCounters();
  }

  if (pageId === 'internships' && !activatedSections.has(pageId)) {
    observeTimeline();
  }

  activatedSections.add(pageId);
}

function scrollToSection(pageId, pushHash = true) {
  const target = document.getElementById(pageId);
  if (!target) return;

  setActiveNav(pageId);
  runSectionAnimations(pageId);
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (pushHash) {
    history.pushState({ page: pageId }, '', '#' + pageId);
  }
}

window.showPage = scrollToSection;

navLinks.forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    scrollToSection(a.dataset.page);
    navMenu.classList.remove('open');
  });
});

if (navHamburger) {
  navHamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });
}

const sectionObserver = new IntersectionObserver((entries) => {
  const visibleEntries = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  if (!visibleEntries.length) return;

  const currentSection = visibleEntries[0].target.id;
  setActiveNav(currentSection);
  runSectionAnimations(currentSection);
}, {
  threshold: [0.3, 0.5, 0.7],
  rootMargin: '-20% 0px -35% 0px'
});

pages.forEach(page => sectionObserver.observe(page));

// Handle browser back/forward
window.addEventListener('popstate', e => {
  const page = (e.state && e.state.page) || 'home';
  scrollToSection(page, false);
});

// Navigate from hash on load
const hash = window.location.hash.replace('#', '');
setActiveNav('home');
runSectionAnimations('home');
if (hash) {
  setTimeout(() => scrollToSection(hash, false), 150);
}

// ==================== THREE.JS BACKGROUND ====================
let threeInit = false;
let threeAnimating = false;
let threeRenderer = null, threeScene = null, threeCamera = null, threeShapes = [], threeT = 0;
let threeMouseX = 0, threeMouseY = 0;

function threeAnimate() {
  if (!threeRenderer || !threeScene || !threeCamera) {
    threeAnimating = false;
    return;
  }
  requestAnimationFrame(threeAnimate);
  threeT += 0.005;
  threeShapes.forEach(s => {
    s.rotation.x += s.userData.rotX;
    s.rotation.y += s.userData.rotY;
    s.position.y += Math.sin(threeT + s.userData.floatY) * s.userData.floatSpeed;
  });
  threeCamera.position.x += (threeMouseX * 10 - threeCamera.position.x) * 0.05;
  threeCamera.position.y += (-threeMouseY * 6 - threeCamera.position.y) * 0.05;
  threeRenderer.render(threeScene, threeCamera);
}

function initThreeJS() {
  if (typeof THREE === 'undefined') return;

  if (!threeInit) {
    threeInit = true;

    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    threeScene = new THREE.Scene();
    threeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    threeCamera.position.z = 30;

    const geometries = [
      new THREE.OctahedronGeometry(2, 0),
      new THREE.TetrahedronGeometry(2, 0),
      new THREE.IcosahedronGeometry(1.5, 0),
    ];
    const colors = [0x00f5ff, 0xff00ff, 0x00ff88, 0xff6b00];

    for (let i = 0; i < 20; i++) {
      const geo = geometries[Math.floor(Math.random() * geometries.length)];
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        wireframe: true,
        transparent: true,
        opacity: 0.15 + Math.random() * 0.1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 40
      );
      mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.01,
        rotY: (Math.random() - 0.5) * 0.01,
        floatY: Math.random() * Math.PI * 2,
        floatSpeed: 0.002 + Math.random() * 0.003
      };
      threeScene.add(mesh);
      threeShapes.push(mesh);
    }

    const ptCount = 500;
    const ptGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(ptCount * 3);
    for (let i = 0; i < ptCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const ptMat = new THREE.PointsMaterial({ color: 0x00f5ff, size: 0.15, transparent: true, opacity: 0.4 });
    threeScene.add(new THREE.Points(ptGeo, ptMat));

    document.addEventListener('mousemove', e => {
      threeMouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      threeMouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    });

    window.addEventListener('resize', () => {
      threeCamera.aspect = window.innerWidth / window.innerHeight;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // Restart animation loop if it has stopped
  if (!threeAnimating) {
    threeAnimating = true;
    threeAnimate();
  }
}

// ==================== PARTICLES BACKGROUND ====================
const pCanvas = document.getElementById('particles-canvas');
if (pCanvas) {
  const pCtx = pCanvas.getContext('2d');
  let stars = [];
  let shootingStars = [];
  let pointerOffsetX = 0;
  let pointerOffsetY = 0;

  function createStar(width, height) {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      speed: Math.random() * 0.2 + 0.03,
      alpha: Math.random() * 0.6 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      depth: Math.random() * 0.8 + 0.2
    };
  }

  function resetStarfield() {
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;

    const count = Math.max(120, Math.min(260, Math.floor((pCanvas.width * pCanvas.height) / 9000)));
    stars = Array.from({ length: count }, () => createStar(pCanvas.width, pCanvas.height));
    shootingStars = [];
  }

  function spawnShootingStar() {
    if (shootingStars.length >= 2 || Math.random() > 0.015) return;

    shootingStars.push({
      x: Math.random() * pCanvas.width * 0.7,
      y: Math.random() * pCanvas.height * 0.4,
      length: Math.random() * 120 + 90,
      speedX: Math.random() * 10 + 8,
      speedY: Math.random() * 5 + 3,
      alpha: 0.9
    });
  }

  function drawParticles() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

    stars.forEach(star => {
      star.y += star.speed;
      star.twinkle += 0.02;

      if (star.y > pCanvas.height + 2) {
        Object.assign(star, createStar(pCanvas.width, pCanvas.height), { y: -4 });
      }

      const alpha = star.alpha + Math.sin(star.twinkle) * 0.18;
      const x = star.x + pointerOffsetX * star.depth;
      const y = star.y + pointerOffsetY * star.depth;

      pCtx.beginPath();
      pCtx.arc(x, y, star.size, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(235, 245, 255, ${Math.max(0.15, alpha)})`;
      pCtx.fill();

      pCtx.beginPath();
      pCtx.arc(x, y, star.size * 4, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(0, 245, 255, ${Math.max(0, alpha - 0.25) * 0.18})`;
      pCtx.fill();
    });

    spawnShootingStar();
    shootingStars = shootingStars.filter(star => star.alpha > 0);

    shootingStars.forEach(star => {
      pCtx.beginPath();
      pCtx.moveTo(star.x, star.y);
      pCtx.lineTo(star.x - star.length, star.y - star.length * 0.35);
      pCtx.strokeStyle = `rgba(255, 255, 255, ${star.alpha})`;
      pCtx.lineWidth = 1.4;
      pCtx.stroke();

      star.x += star.speedX;
      star.y += star.speedY;
      star.alpha -= 0.02;
    });

    requestAnimationFrame(drawParticles);
  }

  document.addEventListener('mousemove', e => {
    pointerOffsetX = (e.clientX / window.innerWidth - 0.5) * 10;
    pointerOffsetY = (e.clientY / window.innerHeight - 0.5) * 6;
  });

  resetStarfield();
  drawParticles();

  window.addEventListener('resize', resetStarfield);
}

// ==================== TYPING ANIMATION ====================
const typingWords = ['Software Engineer', 'Competitive Programmer', 'AI Developer', 'IoT Developer', 'Blockchain Enthusiast'];
let wordIdx = 0, charIdx = 0, deleting = false;
const typingEl = document.querySelector('.typing-text');

function typeLoop() {
  if (!typingEl) return;
  const word = typingWords[wordIdx];
  if (!deleting) {
    typingEl.textContent = word.substring(0, ++charIdx);
    if (charIdx === word.length) { deleting = true; setTimeout(typeLoop, 2000); return; }
  } else {
    typingEl.textContent = word.substring(0, --charIdx);
    if (charIdx === 0) { deleting = false; wordIdx = (wordIdx + 1) % typingWords.length; }
  }
  setTimeout(typeLoop, deleting ? 50 : 90);
}
setTimeout(typeLoop, 2500);

// ==================== SKILL BARS ====================
function animateSkillBars() {
  document.querySelectorAll('.skill-level-bar').forEach(bar => {
    bar.style.width = bar.dataset.level + '%';
  });
}

// ==================== ANIMATED COUNTERS ====================
function animateCounters() {
  document.querySelectorAll('.counter-number[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let count = 0;
    const step = Math.ceil(target / 80);
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = count + (el.dataset.suffix || '');
      if (count >= target) clearInterval(timer);
    }, 20);
  });
}

// ==================== TIMELINE INTERSECTION OBSERVER ====================
function observeTimeline() {
  const items = document.querySelectorAll('.timeline-item');
  if (!items.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.2 });
  items.forEach(i => obs.observe(i));
}

// ==================== TILT EFFECT ====================
document.querySelectorAll('.project-card, .achievement-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-8px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s ease';
  });
});

// ==================== CONTACT FORM ====================
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const msg = document.getElementById('form-msg');
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'TRANSMITTING...';
    btn.disabled = true;
    setTimeout(() => {
      msg.style.display = 'block';
      msg.className = 'form-msg success';
      msg.textContent = '✓ MESSAGE TRANSMITTED SUCCESSFULLY. WILL RESPOND SHORTLY.';
      btn.textContent = 'SEND MESSAGE';
      btn.disabled = false;
      contactForm.reset();
      setTimeout(() => msg.style.display = 'none', 5000);
    }, 1500);
  });
}

// ==================== PROJECT FILTER ====================
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.style.display = '';
        card.style.animation = 'pageFadeIn 0.4s ease forwards';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// ==================== SCROLL REVEAL ====================
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.animation = 'pageFadeIn 0.6s ease forwards';
      e.target.style.opacity = '1';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.glass-card, .skill-card, .cert-card, .achievement-card').forEach(el => {
  el.style.opacity = '0';
  revealObs.observe(el);
});

initThreeJS();
observeTimeline();
