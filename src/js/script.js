// Add background on scroll
window.addEventListener('scroll', function() {
  const navbar = document.getElementById('mainNav');
  if (!navbar) {
    return;
  }
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') {
      return;
    }
    const target = document.querySelector(href);
    if (!target) {
      return;
    }
    e.preventDefault();
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    const collapse = document.getElementById('navbarSupportedContent');
    if (collapse && collapse.classList.contains('show') && window.bootstrap) {
      window.bootstrap.Collapse.getOrCreateInstance(collapse).hide();
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    document.querySelectorAll('video[autoplay]').forEach((video) => {
      video.removeAttribute('autoplay');
      video.pause();
    });
    return;
  }

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }
      entry.target.classList.remove('fade-pending');
      entry.target.classList.add('fade-in-text');
      fadeObserver.unobserve(entry.target);
    });
  }, {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.18
  });

  document.querySelectorAll('section.section, footer').forEach((block) => {
    if (block.id === 'social-proof') {
      return;
    }
    block.classList.add('fade-pending');
    fadeObserver.observe(block);
  });
});
