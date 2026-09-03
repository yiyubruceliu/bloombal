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

// Fade in elements on scroll
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-text');
            fadeObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Initialize fade effects
document.addEventListener('DOMContentLoaded', () => {
    // Select all content within main sections, excluding navbar
    const sections = document.querySelectorAll('header, section, footer');
    
    sections.forEach(section => {
        // Select all elements within each section except background images
        const elements = section.querySelectorAll('h1, h2, p, img, video, ul, .logos, .cta-button, a:not(.navbar *)');
        
        elements.forEach(element => {
            // Don't apply to background-related elements
            if (!element.classList.contains('background') && 
                !element.classList.contains('scroll-indicator')) {
                // Instead of adding class directly, observe the element
                fadeObserver.observe(element);
            }
        });
    });
});
