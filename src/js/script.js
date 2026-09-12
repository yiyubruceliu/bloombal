import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

// ScrollSmoother transforms #smooth-content — pins must use transforms, not position:fixed
ScrollTrigger.defaults({
  pinType: 'transform'
});

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
const isTablet = () => window.matchMedia('(max-width: 1024px)').matches;

const FULL_CLIP = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
const COLLAPSED_CLIP = 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)';

function waitForFonts() {
  if (document.fonts?.ready) {
    return document.fonts.ready.catch(() => undefined);
  }
  return Promise.resolve();
}

function initNavbarScroll() {
  const navbar = document.getElementById('mainNav');
  if (!navbar) return;

  const onScroll = () => {
    const y = ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initNavCollapse() {
  document.querySelectorAll('#mainNav a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const collapse = document.getElementById('navbarSupportedContent');
      if (collapse?.classList.contains('show') && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(collapse).hide();
      }

      const hash = anchor.getAttribute('href');
      const target = hash && hash !== '#' ? document.querySelector(hash) : null;
      const smoother = ScrollSmoother.get();
      if (target && smoother) {
        event.preventDefault();
        smoother.scrollTo(target, true, 'top 70px');
      }
    });
  });
}

function initReducedMedia() {
  // Keep the demo pin looping; only pause other decorative autoplay clips.
  document.querySelectorAll('video[autoplay]:not(.demo-video)').forEach((video) => {
    video.removeAttribute('autoplay');
    video.pause();
  });
}

/** Ensure demo pin video keeps playing (browsers often block bare autoplay) */
function initDemoVideo() {
  const video = document.querySelector('.demo-video');
  if (!video) return;

  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');

  const tryPlay = () => {
    const play = video.play();
    if (play && typeof play.catch === 'function') {
      play.catch(() => undefined);
    }
  };

  tryPlay();
  video.addEventListener('loadeddata', tryPlay, { once: true });
  video.addEventListener('canplay', tryPlay, { once: true });

  ScrollTrigger.create({
    trigger: '.vd-pin-section',
    start: 'top 85%',
    onEnter: tryPlay,
    onEnterBack: tryPlay
  });
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCount(el, duration = 1200) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  if (!Number.isFinite(target)) return;

  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = `${Math.round(easeOutCubic(t) * target)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = `0${suffix}`;
  requestAnimationFrame(tick);
}

function showFinalMotionState() {
  document.documentElement.classList.add('reduce-motion', 'motion-settled', 'splyt-ready');
  document
    .querySelectorAll(
      '.hero-content, .hero-text-scroll, .msg-text-scroll, .clip-title, .video-box, .scroll-indicator, .hero-lede, .hero-cta, .proof-text-scroll, .hero-title-line, .balance-text-scroll, .balance-clip, .story-text-scroll, .partner-card, .footer-mega'
    )
    .forEach((el) => {
      el.style.clipPath = FULL_CLIP;
      el.style.opacity = '1';
      el.style.transform = '';
    });
  document.getElementById('home')?.classList.add('hero-ready');
}

/** Splyt HeroSection — enter + scrub fold */
function initHeroMotion() {
  const plate = document.querySelector('.hero-title-plate');
  if (!plate) return;

  const titleSplit = SplitText.create(plate, { type: 'chars', charsClass: 'split-char' });

  gsap.set('.hero-content', { opacity: 0, y: 100 });
  gsap.set('.hero-text-scroll', { clipPath: COLLAPSED_CLIP });
  gsap.set('.hero-title-line, .hero-lede, .hero-cta', { opacity: 0, y: 40 });
  gsap.set('.scroll-indicator', { opacity: 0, y: 24, xPercent: -50 });

  gsap
    .timeline({ delay: 0.8 })
    .to('.hero-content', { opacity: 1, y: 0, ease: 'power1.inOut', duration: 1 })
    .to('.hero-title-line', { opacity: 1, y: 0, stagger: 0.15, duration: 0.5 }, '-=0.35')
    .to('.hero-text-scroll', { duration: 1.1, clipPath: FULL_CLIP, ease: 'circ.out' }, '-=0.4')
    .from(
      titleSplit.chars,
      { yPercent: 200, stagger: 0.02, ease: 'power2.out', duration: 0.65 },
      '-=0.55'
    )
    .to('.hero-lede', { opacity: 1, y: 0, duration: 0.5 }, '-=0.15')
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.5 }, '-=0.28')
    .to('.scroll-indicator', { opacity: 1, y: 0, xPercent: -50, duration: 0.45 }, '-=0.1')
    .add(() => {
      document.getElementById('home')?.classList.add('hero-ready');
      document.documentElement.classList.add('motion-settled', 'splyt-ready');
    });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: '.hero-container',
        start: '1% top',
        end: 'bottom top',
        scrub: true
      }
    })
    .to('.hero-container', {
      rotate: 7,
      scale: 0.9,
      yPercent: 30,
      ease: 'power1.inOut'
    });
}

/** Splyt MessageSection — paint words + clip plate + rising copy */
function initMessageMotion() {
  const first = document.querySelector('.first-message');
  const second = document.querySelector('.second-message');
  const body = document.querySelector('.message-body');

  if (first) {
    const words = SplitText.create(first, { type: 'words', wordsClass: 'split-word' });
    gsap.set(words.words, { color: 'rgba(250, 234, 222, 0.06)' });
    gsap.to(words.words, {
      color: '#e8f0fb',
      ease: 'power1.in',
      stagger: 1,
      scrollTrigger: {
        trigger: '.message-content',
        start: 'top center',
        end: '30% center',
        scrub: true
      }
    });
  }

  if (second) {
    const words = SplitText.create(second, { type: 'words', wordsClass: 'split-word' });
    gsap.set(words.words, { color: 'rgba(250, 234, 222, 0.06)' });
    gsap.to(words.words, {
      color: '#77cafc',
      ease: 'power1.in',
      stagger: 1,
      scrollTrigger: {
        trigger: '.second-message',
        start: 'top center',
        end: 'bottom center',
        scrub: true
      }
    });
  }

  gsap.set('.msg-text-scroll', { clipPath: COLLAPSED_CLIP });
  gsap
    .timeline({
      scrollTrigger: {
        trigger: '.msg-text-scroll',
        start: 'top 60%'
      }
    })
    .to('.msg-text-scroll', {
      duration: 1,
      clipPath: FULL_CLIP,
      ease: 'circ.inOut'
    });

  if (body) {
    const para = SplitText.create(body, {
      type: 'words, lines',
      wordsClass: 'split-word',
      linesClass: 'paragraph-line'
    });
    gsap
      .timeline({
        scrollTrigger: {
          trigger: body,
          start: 'top center'
        }
      })
      .from(para.words, {
        yPercent: 300,
        rotate: 3,
        ease: 'power1.inOut',
        duration: 1,
        stagger: 0.01
      });
  }
}

/** FlavorSlider pattern — pinned horizontal proof */
function initProofSlider() {
  const section = document.querySelector('.proof-section');
  const slider = document.getElementById('proofSlider');
  if (!section || !slider) return;

  const firstSplitEl = document.querySelector('.first-text-split');
  if (firstSplitEl) {
    const chars = SplitText.create(firstSplitEl, { type: 'chars', charsClass: 'split-char' });
    gsap.from(chars.chars, {
      yPercent: 200,
      stagger: 0.02,
      ease: 'power1.inOut',
      scrollTrigger: {
        trigger: section,
        start: 'top 30%'
      }
    });
  }

  gsap.set('.proof-text-scroll', { clipPath: COLLAPSED_CLIP });
  gsap.to('.proof-text-scroll', {
    duration: 1,
    clipPath: FULL_CLIP,
    ease: 'circ.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 10%'
    }
  });

  if (!isTablet()) {
    const scrollAmount = Math.max(slider.scrollWidth - window.innerWidth, 800);

    gsap.to(slider, {
      x: -(scrollAmount + 400),
      ease: 'power1.inOut',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${scrollAmount + 1600}`,
        scrub: true,
        pin: true,
        pinType: 'transform',
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=120%',
          scrub: true
        }
      })
      .to('.first-text-split', { xPercent: -35, ease: 'power1.inOut' }, 0)
      .to('.proof-text-scroll', { xPercent: -22, ease: 'power1.inOut' }, 0);

    /* Depth layers inside panels (Splyt drink / elements feel) */
    gsap.to('.proof-drink', {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${scrollAmount + 1600}`,
        scrub: true
      }
    });
    gsap.to('.proof-elements', {
      yPercent: 12,
      xPercent: -4,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${scrollAmount + 1600}`,
        scrub: true
      }
    });
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 65%',
    once: true,
    onEnter: () => {
      section.querySelectorAll('.proof-number[data-count]').forEach((el) => animateCount(el));
    }
  });
}

/** BenefitSection clip titles */
function initBenefitMotion() {
  const section = document.querySelector('.benefit-section');
  if (!section) return;

  gsap.set('.clip-title', { opacity: 0, clipPath: COLLAPSED_CLIP });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 55%',
        end: 'top top',
        scrub: 1.5
      }
    })
    .to('.benefit-section .first-title', {
      duration: 1,
      opacity: 1,
      clipPath: FULL_CLIP,
      ease: 'circ.out'
    })
    .to('.benefit-section .second-title', {
      duration: 1,
      opacity: 1,
      clipPath: FULL_CLIP,
      ease: 'circ.out'
    })
    .to('.benefit-section .third-title', {
      duration: 1,
      opacity: 1,
      clipPath: FULL_CLIP,
      ease: 'circ.out'
    })
    .to('.benefit-section .fourth-title', {
      duration: 1,
      opacity: 1,
      clipPath: FULL_CLIP,
      ease: 'circ.out'
    });
}

/** VideoPinSection — circle expand */
function initVideoPin() {
  const box = document.querySelector('.video-box');
  const section = document.querySelector('.vd-pin-section');
  if (!box || !section) return;

  if (isMobile()) {
    gsap.set(box, { clipPath: 'circle(100% at 50% 50%)' });
    return;
  }

  gsap.set(box, { clipPath: 'circle(6% at 50% 50%)' });
  gsap.to(box, {
    clipPath: 'circle(100% at 50% 50%)',
    ease: 'power1.inOut',
    scrollTrigger: {
      trigger: section,
      start: '-15% top',
      end: '200% top',
      scrub: 1.5,
      pin: true,
      pinType: 'transform',
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });
}

/** Extra depth: scrub sky / wash harder than data-speed alone */
function initHeroParallaxLayers() {
  gsap.to('.hero-sky', {
    yPercent: 35,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero-container',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
  gsap.to('.hero-wash', {
    yPercent: 18,
    opacity: 0.55,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero-container',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
}

/** Nutrition-style balance section */
function initBalanceMotion() {
  const section = document.querySelector('.balance-section');
  if (!section) return;

  const line = section.querySelector('.balance-line');
  if (line) {
    const chars = SplitText.create(line, { type: 'chars', charsClass: 'split-char' });
    gsap.from(chars.chars, {
      yPercent: 110,
      stagger: 0.02,
      ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 70%' }
    });
  }

  gsap.to('.balance-text-scroll', {
    duration: 1,
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    ease: 'power1.inOut',
    scrollTrigger: { trigger: section, start: 'top 75%' }
  });

  gsap.to('.balance-big-img', {
    yPercent: -12,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 55%',
        end: 'top 15%',
        scrub: 1.2
      }
    })
    .to('.balance-clip--pos', { opacity: 1, clipPath: FULL_CLIP, ease: 'circ.out' })
    .to('.balance-clip--neg', { opacity: 1, clipPath: FULL_CLIP, ease: 'circ.out' }, '-=0.35');
}

/** Story beats — scrub titles + rising media */
function initStoryMotion() {
  document.querySelectorAll('.story-section').forEach((section) => {
    const plate = section.querySelector('.story-text-scroll');
    if (plate) {
      gsap.to(plate, {
        duration: 1,
        clipPath: FULL_CLIP,
        ease: 'circ.out',
        scrollTrigger: { trigger: section, start: 'top 70%' }
      });
    }

    const scrubA = section.querySelector('.story-scrub--a');
    const scrubB = section.querySelector('.story-scrub--b');
    const scrubTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
    if (scrubA) {
      const startRot =
        section.id === 'urgency' ? -1.5 :
        section.id === 'about' ? -2 :
        section.id === 'services' ? 2 : 0;
      scrubTl.fromTo(
        scrubA,
        { xPercent: 0, rotation: startRot },
        { xPercent: 18, rotation: startRot, ease: 'none' },
        0
      );
    }
    if (scrubB) {
      scrubTl.fromTo(
        scrubB,
        { xPercent: 0, rotation: 1.5 },
        { xPercent: -12, rotation: 1.5, ease: 'none' },
        0
      );
    }
    if (plate) {
      scrubTl.fromTo(
        plate,
        { xPercent: 0, rotation: 2 },
        { xPercent: 8, rotation: 2, ease: 'none' },
        0
      );
    }

    const media = section.querySelector('.story-float');
    if (media) {
      gsap.fromTo(
        media,
        { yPercent: 28, opacity: 0.65 },
        {
          yPercent: -6,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'center center',
            scrub: true
          }
        }
      );
    }

    const copyBits = section.querySelectorAll('.story-copy p, .story-copy li');
    if (copyBits.length) {
      gsap.from(copyBits, {
        y: 36,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 55%' }
      });
    }
  });
}

/** Partners — scrub titles + rising cards (testimonial energy) */
function initPartnersMotion() {
  const section = document.querySelector('.partners-section');
  if (!section) return;

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'center top',
        scrub: true
      }
    })
    .to('.partners-scrub--a', { xPercent: 40, ease: 'none' }, 0)
    .to('.partners-scrub--b', { xPercent: -18, ease: 'none' }, 0)
    .to('.partners-scrub--c', { xPercent: 28, ease: 'none' }, 0);

  const rotations = [-4, 2, -2];
  const cards = gsap.utils.toArray('.partner-card');

  if (!isTablet()) {
    const rise = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 15%',
        end: '+=110%',
        scrub: 1.4,
        pin: true,
        pinType: 'transform',
        anticipatePin: 1
      }
    });

    cards.forEach((card, i) => {
      const rot = rotations[i] ?? 0;
      rise.fromTo(
        card,
        { yPercent: 140, rotation: rot },
        { yPercent: i === 1 ? -3 : 0, rotation: rot, ease: 'power1.inOut' },
        i * 0.12
      );
    });
  } else {
    cards.forEach((card, i) => {
      gsap.from(card, {
        y: 80,
        opacity: 0,
        rotation: rotations[i] ?? 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 65%' }
      });
    });
  }
}

/** Footer mega title rise */
function initFooterMotion() {
  const footer = document.querySelector('.footer-section');
  if (!footer) return;

  const mega = footer.querySelector('.footer-mega');
  if (mega) {
    const chars = SplitText.create(mega, { type: 'chars', charsClass: 'split-char' });
    gsap.from(chars.chars, {
      yPercent: 120,
      stagger: 0.02,
      ease: 'power2.out',
      scrollTrigger: { trigger: footer, start: 'top 70%' }
    });
  }
}

async function initSplytMotion() {
  document.documentElement.classList.add('has-splyt');
  await waitForFonts();

  const smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 3,
    effects: true,
    normalizeScroll: true,
    ignoreMobileResize: true
  });

  window.ScrollSmoother = ScrollSmoother;
  window.ScrollTrigger = ScrollTrigger;
  window.__bloombalMotion = { smoother, triggers: () => ScrollTrigger.getAll().length };

  const root = document.getElementById('smooth-content') || document.body;

  gsap.context(() => {
    initHeroMotion();
    initHeroParallaxLayers();
    initMessageMotion();
    initProofSlider();
    initBenefitMotion();
    initVideoPin();
    initDemoVideo();
    initBalanceMotion();
    initStoryMotion();
    initPartnersMotion();
    initFooterMotion();
  }, root);

  requestAnimationFrame(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  window.setTimeout(() => {
    document.documentElement.classList.add('motion-settled', 'splyt-ready');
    ScrollTrigger.refresh();
  }, 3000);

  return smoother;
}

function markReducedMotionBanner() {
  // no-op: scroll cinema is JS-driven and no longer gated on OS reduce-motion
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initNavCollapse();

  // Splyt-grade scroll cinema always runs in JS (reference site does not gate on
  // prefers-reduced-motion). Soften only autoplay media when reduce is set.
  if (prefersReducedMotion()) {
    initReducedMedia();
  }

  initSplytMotion().catch((err) => {
    console.error('[Bloombal] motion init failed', err);
    showFinalMotionState();
  });
});
