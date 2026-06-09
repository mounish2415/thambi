// script.js - Interactive Logic & Procedural Sound Synthesis for Thambi's Birthday Website

document.addEventListener('DOMContentLoaded', () => {
  // Birth Date for Thambi: June 9, 2005 (Dynamic Ticker Start)
  const birthDate = new Date('2005-06-09T00:00:00');

  // DOM Elements
  const loadingScreen = document.getElementById('loading-screen');
  const loaderProgress = document.getElementById('loader-progress');
  const loaderPercentage = document.querySelector('.loader-percentage');
  const startBtn = document.getElementById('start-btn');
  const app = document.getElementById('app');
  
  const musicToggle = document.getElementById('music-toggle');
  const nextButtons = document.querySelectorAll('.next-btn');
  const replayBtn = document.getElementById('replay');
  const pageProgress = document.getElementById('page-progress');
  
  // Lightbox Elements
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');
  const polaroids = document.querySelectorAll('.polaroid');

  // Envelope Elements
  const envelopeWrapper = document.querySelector('.envelope-wrapper');
  const messageNextBtn = document.getElementById('message-next-btn');

  // Timeline Progress Elements
  const timelineProgress = document.getElementById('timeline-progress-bar');
  const timelineEvents = document.querySelectorAll('.timeline-event');

  // Countdown Elements
  const yearsEl = document.getElementById('years');
  const monthsEl = document.getElementById('months');
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  // Active state variables
  let currentPage = 1;
  const totalPages = 6;

  // ==================== 1. LOADING SCREEN ANIMATION ====================
  let loadVal = 0;
  const loadInterval = setInterval(() => {
    loadVal += Math.floor(Math.random() * 8) + 2;
    if (loadVal >= 100) {
      loadVal = 100;
      clearInterval(loadInterval);
      // Reveal Start Button
      loaderProgress.style.width = '100%';
      loaderPercentage.textContent = '100% - Ready!';
      startBtn.classList.remove('hidden');
    } else {
      loaderProgress.style.width = `${loadVal}%`;
      loaderPercentage.textContent = `${loadVal}%`;
    }
  }, 100);

  // Click start to fade loading screen & init audio context safely
  startBtn.addEventListener('click', () => {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      app.classList.remove('hidden');
      initGlobalParticles();
      initPageSpecificActions(1);
      
      // Auto play music on enter
      birthdaySynth.start();
      musicToggle.classList.add('playing');
      musicToggle.querySelector('.music-text').textContent = 'MUTE SONG';
    }, 800);
  });

  // ==================== 2. PROCEDURAL SOUND SYNTH (WEB AUDIO API) ====================
  // Synthesizes elegant ambient background chords and a sweet music-box style "Happy Birthday" melody
  class AmbientBirthdaySynth {
    constructor() {
      this.audioCtx = null;
      this.isPlaying = false;
      this.melodyTimeout = null;
      this.chordTimeout = null;
      
      // Happy Birthday Melody in C Major
      // [noteName, octave, duration (beats), spacingAfter (beats)]
      // Note frequencies based on equal temperament A4 = 440Hz
      this.melodyNotes = [
        ['G', 4, 0.75, 0.75], ['G', 4, 0.25, 0.25], ['A', 4, 1, 1], ['G', 4, 1, 1], ['C', 5, 1, 1], ['B', 4, 2, 2],
        [null, 0, 0.5, 0.5], // Rest
        ['G', 4, 0.75, 0.75], ['G', 4, 0.25, 0.25], ['A', 4, 1, 1], ['G', 4, 1, 1], ['D', 5, 1, 1], ['C', 5, 2, 2],
        [null, 0, 0.5, 0.5], // Rest
        ['G', 4, 0.75, 0.75], ['G', 4, 0.25, 0.25], ['G', 5, 1, 1], ['E', 5, 1, 1], ['C', 5, 1, 1], ['B', 4, 1, 1], ['A', 4, 2, 2],
        [null, 0, 0.5, 0.5], // Rest
        ['F', 5, 0.75, 0.75], ['F', 5, 0.25, 0.25], ['E', 5, 1, 1], ['C', 5, 1, 1], ['D', 5, 1, 1], ['C', 5, 2.5, 3]
      ];
      this.melodyIndex = 0;
      this.tempo = 90; // Beats per minute
      this.beatDuration = 60 / this.tempo; // Duration of one beat in seconds

      // Chords for emotional backing: Cmaj7 - G6 - Am7 - Fmaj7
      this.chords = [
        [130.81, 164.81, 196.00, 246.94], // C3, E3, G3, B3 (Cmaj7)
        [98.00, 146.83, 196.00, 246.94],  // G2, D3, G3, B3 (G6)
        [110.00, 130.81, 164.81, 220.00], // A2, C3, E3, A3 (Am7)
        [87.31, 130.81, 174.61, 220.00]   // F2, C3, F3, A3 (Fmaj7)
      ];
      this.chordIndex = 0;
    }

    init() {
      if (this.audioCtx) return;
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Delay effect node for echo/reverb space
      this.delayNode = this.audioCtx.createDelay(1.0);
      this.delayGain = this.audioCtx.createGain();
      this.delayNode.delayTime.value = 0.4; // 400ms delay
      this.delayGain.gain.value = 0.35; // feedback volume

      // Reverb routing
      this.delayNode.connect(this.delayGain);
      this.delayGain.connect(this.delayNode);

      // Lowpass filter to warm the output
      this.filterNode = this.audioCtx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 1600;

      // Master Volume
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.25;

      // Connect nodes: Synth -> Filter -> Delay/Master -> Output
      this.delayNode.connect(this.masterGain);
      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    }

    getNoteFreq(note, octave) {
      const notes = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
      const step = notes[note];
      // Formula: f = 440 * 2^((n - 57)/12) where A4 (440Hz) is MIDI note 69
      const midi = (octave + 1) * 12 + step;
      return 440 * Math.pow(2, (midi - 69) / 12);
    }

    start() {
      this.init();
      if (this.isPlaying) return;
      this.isPlaying = true;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.playChordLoop();
      this.playMelodyLoop();
    }

    stop() {
      this.isPlaying = false;
      clearTimeout(this.melodyTimeout);
      clearTimeout(this.chordTimeout);
      if (this.audioCtx) {
        this.audioCtx.suspend();
      }
    }

    playChordLoop() {
      if (!this.isPlaying) return;
      const notes = this.chords[this.chordIndex];
      const now = this.audioCtx.currentTime;
      const duration = 6.0; // Chord changes every 6 seconds

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        // Soft warm triangle wave
        osc.type = 'triangle';
        osc.frequency.value = freq;

        // Slow Attack / Decay
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(idx === 0 ? 0.08 : 0.05, now + 2.0); // Bass note slightly louder
        gainNode.gain.setValueAtTime(idx === 0 ? 0.08 : 0.05, now + duration - 1.5);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gainNode);
        gainNode.connect(this.filterNode);
        
        osc.start(now);
        osc.stop(now + duration);
      });

      this.chordIndex = (this.chordIndex + 1) % this.chords.length;
      this.chordTimeout = setTimeout(() => this.playChordLoop(), duration * 1000);
    }

    playMelodyLoop() {
      if (!this.isPlaying) return;
      const noteInfo = this.melodyNotes[this.melodyIndex];
      const noteName = noteInfo[0];
      const octave = noteInfo[1];
      const durationBeats = noteInfo[2];
      const spacingBeats = noteInfo[3];

      const now = this.audioCtx.currentTime;
      const noteDuration = durationBeats * this.beatDuration;
      const nextNoteDelay = spacingBeats * this.beatDuration;

      if (noteName !== null) {
        const freq = this.getNoteFreq(noteName, octave);
        
        // Music box sound is composed of a clean Sine wave and a high sub-harmonics layer
        const osc = this.audioCtx.createOscillator();
        const subOsc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        // Sub oscillator adding crystalline texture (octave higher)
        subOsc.type = 'sine';
        subOsc.frequency.value = freq * 2;

        // Music Box style quick pluck & exponential decay envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration); // Long smooth decay

        osc.connect(gainNode);
        subOsc.connect(gainNode);
        
        // Connect to delay line for floating ambient echo
        gainNode.connect(this.filterNode);
        gainNode.connect(this.delayNode);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + noteDuration);
        subOsc.stop(now + noteDuration);
      }

      this.melodyIndex = (this.melodyIndex + 1) % this.melodyNotes.length;
      this.melodyTimeout = setTimeout(() => this.playMelodyLoop(), nextNoteDelay * 1000);
    }
  }

  const birthdaySynth = new AmbientBirthdaySynth();

  musicToggle.addEventListener('click', () => {
    if (birthdaySynth.isPlaying) {
      birthdaySynth.stop();
      musicToggle.classList.remove('playing');
      musicToggle.querySelector('.music-text').textContent = 'PLAY SONG';
    } else {
      birthdaySynth.start();
      musicToggle.classList.add('playing');
      musicToggle.querySelector('.music-text').textContent = 'MUTE SONG';
    }
  });

  // ==================== 3. PAGE NAVIGATION TRANSITIONS ====================
  const showPage = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    
    const activePage = document.querySelector('.page.active');
    const targetPage = document.getElementById(`page-${pageNum}`);
    
    if (activePage === targetPage) return;

    // Trigger exit animation on current page
    if (activePage) {
      activePage.classList.remove('active');
      activePage.classList.add('exit');
      
      // Cleanup previous page animation classes
      setTimeout(() => {
        activePage.classList.remove('exit');
      }, 1000);
    }

    // Trigger enter animation on target page
    targetPage.classList.add('active');
    currentPage = pageNum;

    // Update Progress Indicator Bar
    const progressPercent = (pageNum / totalPages) * 100;
    pageProgress.style.width = `${progressPercent}%`;

    // Execute page-specific scripts (e.g. starting canvas animations, timelines)
    initPageSpecificActions(pageNum);
  };

  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextVal = parseInt(btn.dataset.next);
      showPage(nextVal);
    });
  });

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      // Reset envelope, timelines, progress states
      envelopeWrapper.classList.remove('open');
      messageNextBtn.classList.add('hidden');
      timelineEvents.forEach(e => e.classList.remove('active'));
      timelineProgress.style.height = '0%';
      showPage(1);
    });
  }

  // ==================== 4. POLAROID LIGHTBOX SYSTEM ====================
  polaroids.forEach(polaroid => {
    polaroid.addEventListener('click', () => {
      const img = polaroid.querySelector('img');
      const caption = polaroid.dataset.caption;
      
      lightboxImg.src = img.src;
      lightboxCaption.textContent = caption;
      lightbox.classList.add('active');
    });
  });

  lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
  lightbox.addEventListener('click', (e) => {
    if (e.target !== lightboxImg && e.target !== lightboxCaption) {
      lightbox.classList.remove('active');
    }
  });

  // ==================== 5. INTERACTIVE 3D ENVELOPE (PAGE 5) ====================
  envelopeWrapper.addEventListener('click', () => {
    envelopeWrapper.classList.add('open');
    // Reveal final button after reading time delay
    setTimeout(() => {
      messageNextBtn.classList.remove('hidden');
      // Scroll letter container down a bit on mobile to ensure button is visible
      messageNextBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 2800);
  });

  // ==================== 6. PAGE-SPECIFIC INITIALIZATIONS ====================
  function initPageSpecificActions(pageNum) {
    if (pageNum === 2) {
      // Memories page gallery layout tilt re-stagger (gentle randomness)
      const wraps = document.querySelectorAll('.polaroid-wrapper');
      wraps.forEach((wrap, i) => {
        const rot = (i % 2 === 0 ? -1 : 1) * (Math.random() * 4 + 2);
        wrap.style.setProperty('--rotation', `${rot}deg`);
      });
    }
    else if (pageNum === 3) {
      // Growth Timeline Page - sequentially activate nodes
      timelineProgress.style.height = '0%';
      timelineEvents.forEach(e => e.classList.remove('active'));
      
      setTimeout(() => {
        timelineProgress.style.height = '100%';
        
        timelineEvents.forEach((ev, idx) => {
          setTimeout(() => {
            ev.classList.add('active');
          }, idx * 600 + 400); // Stagger animations
        });
      }, 300);
    }
    else if (pageNum === 5) {
      // Start floating hearts particle system
      initHeartParticles();
    }
    else if (pageNum === 6) {
      // Final Page - Start Confetti and Firework system
      initCelebrationScreen();
    }
  }

  // ==================== 7. GLOBAL PARTICLES (GOLD DUST & BALLOONS) ====================
  let bgCtx = null;
  let bgParticles = [];
  let bgAnimationId = null;

  function initGlobalParticles() {
    const canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    bgCtx = canvas.getContext('2d');
    
    const resizeBg = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeBg();
    window.addEventListener('resize', resizeBg);

    // Particle Classes
    class GoldDust {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height; // Stagger initial heights
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 50;
        this.size = Math.random() * 2.5 + 0.8;
        this.speedY = -(Math.random() * 0.6 + 0.3);
        this.swaySpeed = Math.random() * 0.02 + 0.005;
        this.swayDistance = Math.random() * 2 + 1;
        this.swayAngle = Math.random() * Math.PI * 2;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.alphaPulse = Math.random() * 0.01 + 0.005;
      }
      update() {
        this.y += this.speedY;
        this.swayAngle += this.swaySpeed;
        this.x += Math.sin(this.swayAngle) * (this.swayDistance * 0.2);
        
        // Pulse alpha glowing
        this.alpha += this.alphaPulse;
        if (this.alpha > 0.8 || this.alpha < 0.2) {
          this.alphaPulse = -this.alphaPulse;
        }

        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
          this.reset();
        }
      }
      draw() {
        bgCtx.save();
        bgCtx.globalAlpha = this.alpha;
        bgCtx.fillStyle = '#f3e5ab';
        bgCtx.shadowBlur = 8;
        bgCtx.shadowColor = '#d4af37';
        bgCtx.beginPath();
        bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.restore();
      }
    }

    class Balloon {
      constructor() {
        this.reset();
        this.y = canvas.height + Math.random() * canvas.height; // Distribute upward starts
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 200;
        this.radius = Math.random() * 15 + 15; // Balloon width
        this.speedY = -(Math.random() * 0.8 + 0.6);
        this.color = this.getRandomColor();
        this.swaySpeed = Math.random() * 0.01 + 0.005;
        this.swayWidth = Math.random() * 1.5 + 0.5;
        this.swayAngle = Math.random() * Math.PI;
      }
      getRandomColor() {
        const colors = [
          'rgba(212, 175, 55, 0.25)', // Translucent Gold
          'rgba(28, 48, 118, 0.2)',   // Translucent Navy
          'rgba(255, 255, 255, 0.15)'  // Translucent White
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.y += this.speedY;
        this.swayAngle += this.swaySpeed;
        this.x += Math.sin(this.swayAngle) * this.swayWidth * 0.3;

        if (this.y < -this.radius * 2) {
          this.reset();
        }
      }
      draw() {
        bgCtx.save();
        bgCtx.fillStyle = this.color;
        bgCtx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        bgCtx.lineWidth = 1.5;
        
        // Draw Balloon (oval shape)
        bgCtx.beginPath();
        bgCtx.ellipse(this.x, this.y, this.radius * 0.8, this.radius, 0, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.stroke();

        // Draw Balloon String
        bgCtx.beginPath();
        bgCtx.moveTo(this.x, this.y + this.radius);
        bgCtx.bezierCurveTo(
          this.x - 5, this.y + this.radius + 15,
          this.x + 5, this.y + this.radius + 30,
          this.x, this.y + this.radius + 45
        );
        bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        bgCtx.lineWidth = 1;
        bgCtx.stroke();

        bgCtx.restore();
      }
    }

    // Populate particles
    bgParticles = [];
    for (let i = 0; i < 70; i++) {
      bgParticles.push(new GoldDust());
    }
    for (let i = 0; i < 8; i++) {
      bgParticles.push(new Balloon());
    }

    // Animation Loop
    const animateBg = () => {
      bgCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw dark background color overlay gently
      bgCtx.fillStyle = 'rgba(2, 6, 23, 0.05)';
      bgCtx.fillRect(0, 0, canvas.width, canvas.height);

      bgParticles.forEach(p => {
        p.update();
        p.draw();
      });
      bgAnimationId = requestAnimationFrame(animateBg);
    };
    animateBg();
  }

  // ==================== 8. PAGE 5 HEART FLOATING SYSTEM ====================
  let heartCtx = null;
  let heartParticles = [];
  let heartAnimId = null;

  function initHeartParticles() {
    const canvas = document.getElementById('heart-particles');
    if (!canvas) return;
    heartCtx = canvas.getContext('2d');
    
    const resizeH = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeH();
    window.addEventListener('resize', resizeH);

    class HeartParticle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 50;
        this.size = Math.random() * 8 + 6;
        this.speedY = -(Math.random() * 0.7 + 0.4);
        this.swaySpeed = Math.random() * 0.02 + 0.01;
        this.swayAngle = Math.random() * Math.PI * 2;
        this.alpha = Math.random() * 0.4 + 0.2;
        this.scale = Math.random() * 0.5 + 0.5;
        this.color = Math.random() > 0.4 ? 'rgba(212, 175, 55, 0.3)' : 'rgba(239, 68, 68, 0.25)'; // Gold or Soft Red
      }
      update() {
        this.y += this.speedY;
        this.swayAngle += this.swaySpeed;
        this.x += Math.sin(this.swayAngle) * 0.25;

        if (this.y < -20) {
          this.reset();
        }
      }
      draw() {
        heartCtx.save();
        heartCtx.globalAlpha = this.alpha;
        heartCtx.fillStyle = this.color;
        
        // Draw elegant heart path
        heartCtx.translate(this.x, this.y);
        heartCtx.scale(this.scale, this.scale);
        heartCtx.beginPath();
        heartCtx.moveTo(0, 0);
        // Left curve
        heartCtx.bezierCurveTo(-this.size/2, -this.size/2, -this.size, -this.size/3, -this.size, 0);
        heartCtx.bezierCurveTo(-this.size, this.size/2, -this.size/3, this.size, 0, this.size * 1.3);
        // Right curve
        heartCtx.bezierCurveTo(this.size/3, this.size, this.size, this.size/2, this.size, 0);
        heartCtx.bezierCurveTo(this.size, -this.size/3, this.size/2, -this.size/2, 0, 0);
        
        heartCtx.closePath();
        heartCtx.fill();
        heartCtx.restore();
      }
    }

    // Populate hearts
    heartParticles = [];
    for (let i = 0; i < 20; i++) {
      heartParticles.push(new HeartParticle());
    }

    const animateHearts = () => {
      if (currentPage !== 5) {
        cancelAnimationFrame(heartAnimId);
        return; // Break loops if pages changed
      }
      heartCtx.clearRect(0, 0, canvas.width, canvas.height);
      heartParticles.forEach(h => {
        h.update();
        h.draw();
      });
      heartAnimId = requestAnimationFrame(animateHearts);
    };
    animateHearts();
  }

  // ==================== 9. PAGE 6: CELEBRATION (FIREWORKS & CONFETTI) ====================
  let fCtx = null;
  let fWidth = 0;
  let fHeight = 0;
  let activeFireworks = [];
  let activeConfetti = [];
  let celebrationAnimId = null;
  let autoFireworkTimer = null;

  function initCelebrationScreen() {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;
    fCtx = canvas.getContext('2d');
    
    const resizeF = () => {
      fWidth = canvas.width = window.innerWidth;
      fHeight = canvas.height = window.innerHeight;
    };
    resizeF();
    window.addEventListener('resize', resizeF);

    // CONFETTI CLASS
    class ConfettiPiece {
      constructor() {
        this.reset();
        this.y = Math.random() * -fHeight; // Spawn above screen
      }
      reset() {
        this.x = Math.random() * fWidth;
        this.y = -10 - Math.random() * 100;
        this.size = Math.random() * 7 + 6;
        this.speedY = Math.random() * 2 + 1.8;
        this.speedX = Math.random() * 2 - 1;
        this.color = this.getRandomColor();
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
      }
      getRandomColor() {
        const colors = ['#d4af37', '#f4e7c1', '#3b82f6', '#ffffff', '#ef4444', '#10b981'];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;

        if (this.y > fHeight + 10) {
          this.reset();
        }
      }
      draw() {
        fCtx.save();
        fCtx.translate(this.x, this.y);
        fCtx.rotate(this.rotation * Math.PI / 180);
        fCtx.fillStyle = this.color;
        fCtx.fillRect(-this.size/2, -this.size/4, this.size, this.size/2);
        fCtx.restore();
      }
    }

    // FIREWORKS PHYSICS
    class FireworkSpark {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 2.5 + 1.2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.012;
        this.gravity = 0.08;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.alpha -= this.decay;
      }
      draw() {
        fCtx.save();
        fCtx.globalAlpha = this.alpha;
        fCtx.fillStyle = this.color;
        fCtx.shadowBlur = 10;
        fCtx.shadowColor = this.color;
        fCtx.beginPath();
        fCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.restore();
      }
    }

    class FireworkRocket {
      constructor() {
        this.x = Math.random() * (fWidth - 200) + 100;
        this.y = fHeight;
        this.targetY = Math.random() * (fHeight * 0.4) + fHeight * 0.15;
        this.speed = Math.random() * 3 + 8;
        this.color = this.getRandomColor();
        this.exploded = false;
      }
      getRandomColor() {
        const colors = ['#d4af37', '#f4e7c1', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#10b981'];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.y -= this.speed;
        if (this.y <= this.targetY) {
          this.explode();
        }
      }
      explode() {
        this.exploded = true;
        // Trigger 60 sparks in a burst
        for (let i = 0; i < 60; i++) {
          activeFireworks.push(new FireworkSpark(this.x, this.y, this.color));
        }
      }
      draw() {
        if (this.exploded) return;
        fCtx.save();
        fCtx.fillStyle = '#fff';
        fCtx.shadowBlur = 6;
        fCtx.shadowColor = this.color;
        fCtx.beginPath();
        fCtx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.restore();
      }
    }

    // Populate confetti list
    activeConfetti = [];
    for (let i = 0; i < 110; i++) {
      activeConfetti.push(new ConfettiPiece());
    }

    // Interactive Click-to-launch Firework
    canvas.addEventListener('click', (e) => {
      // Launch a custom rocket targetting mouse click y coordinate
      const rocket = new FireworkRocket();
      rocket.x = e.clientX;
      rocket.y = fHeight;
      rocket.targetY = e.clientY;
      rocket.speed = 10;
      
      const animateCustomRocket = () => {
        if (rocket.exploded) return;
        rocket.update();
        requestAnimationFrame(animateCustomRocket);
      };
      animateCustomRocket();
    });

    // Auto launcher loop
    const triggerAutoFirework = () => {
      if (currentPage !== 6) return;
      const rocket = new FireworkRocket();
      const runRocket = () => {
        if (rocket.exploded) return;
        rocket.update();
        requestAnimationFrame(runRocket);
      };
      runRocket();
      
      // Schedule next launch
      autoFireworkTimer = setTimeout(triggerAutoFirework, Math.random() * 1500 + 800);
    };
    triggerAutoFirework();

    // Main animation loops
    const animateCelebration = () => {
      if (currentPage !== 6) {
        cancelAnimationFrame(celebrationAnimId);
        clearTimeout(autoFireworkTimer);
        return;
      }
      fCtx.clearRect(0, 0, fWidth, fHeight);

      // Draw confetti
      activeConfetti.forEach(c => {
        c.update();
        c.draw();
      });

      // Draw active sparks
      activeFireworks = activeFireworks.filter(s => s.alpha > 0);
      activeFireworks.forEach(s => {
        s.update();
        s.draw();
      });

      celebrationAnimId = requestAnimationFrame(animateCelebration);
    };
    animateCelebration();
  }

  // Countdown ticker has been removed as requested by the user.
});
