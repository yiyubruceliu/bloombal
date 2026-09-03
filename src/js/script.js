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

document.querySelectorAll('#mainNav a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function() {
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
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.12
  });

  document.querySelectorAll('header, section.section, footer').forEach((block) => {
    if (block.id === 'social-proof') {
      return;
    }

    const elements = block.querySelectorAll(
      'h1, h2, h3, p, img, video, ul, .cta-button, .stat-box, .footer-logo, .footer-email, .social-links, .footer-legal'
    );

    elements.forEach((element, index) => {
      if (element.closest('.scroll-indicator') || element.closest('nav')) {
        return;
      }
      element.style.setProperty('--fade-delay', `${Math.min(index, 5) * 0.07}s`);
      element.classList.add('fade-pending');
      fadeObserver.observe(element);
    });
  });
});
