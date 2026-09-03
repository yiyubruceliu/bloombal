// Add background on scroll
window.addEventListener('scroll', function() {
  const navbar = document.getElementById('mainNav');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Smooth scroll for navigation links
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
      behavior: 'smooth'
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

  document.querySelectorAll('header, section, footer').forEach((section) => {
    section.querySelectorAll('h1, h2, p, img, video, ul, .logos, .cta-button, a:not(.navbar *)').forEach((element) => {
      if (element.classList.contains('scroll-indicator')) {
        return;
      }
      element.classList.add('fade-pending');
      fadeObserver.observe(element);
    });
  });
});
