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
