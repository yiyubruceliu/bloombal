/**
 * Bloombal Flagship Lookbook — quiet look-to-look motion
 */
(() => {
  const indices = Array.from(document.querySelectorAll(".look-index"));
  const looks = ["#home", "#problem", "#solution"]
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);

  const setActive = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let active = 0;
    looks.forEach((el, i) => {
      if (el.offsetTop <= y) active = i;
    });
    indices.forEach((link, i) => {
      link.classList.toggle("is-active", i === active);
    });
  };

  window.addEventListener("scroll", setActive, { passive: true });
  setActive();

  // Soft fade-up for subsequent looks (one authored moment family)
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const targets = document.querySelectorAll(".look:not(.look--hero) .look-inner");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    targets.forEach((el) => {
      el.classList.add("will-fade");
      io.observe(el);
    });
  }
})();
