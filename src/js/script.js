/**
 * Bloombal landing — below-fold scrub (problem/process) + looping demo video.
 * Demo stays full-frame autoplay/loop (no circle-pin; that read as “stuck”).
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function splitWords(el) {
  if (!el || el.dataset.split === "1") return [];
  const text = el.textContent.trim();
  el.textContent = "";
  el.dataset.split = "1";
  return text.split(/\s+/).map((word) => {
    const span = document.createElement("span");
    span.className = "scrub-word";
    span.textContent = word;
    el.appendChild(span);
    el.appendChild(document.createTextNode(" "));
    return span;
  });
}

(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const heroContent = document.querySelector(".hero-content");
  if (heroContent) heroContent.classList.add("is-ready");

  const video = document.querySelector(".demo-video");
  const demoSection = document.querySelector("#demo");
  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    const ensurePlaying = () => {
      if (reduce) return;
      if (document.hidden) return;
      if (!video.paused && video.currentTime > 0.15) {
        video.removeAttribute("poster");
        return;
      }
      video.muted = true;
      video
        .play()
        .then(() => {
          if (video.currentTime > 0.05) video.removeAttribute("poster");
        })
        .catch(() => {});
    };

    if (!reduce) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            window.setTimeout(ensurePlaying, 500);
            let tries = 0;
            const tick = window.setInterval(() => {
              tries += 1;
              ensurePlaying();
              if ((!video.paused && video.currentTime > 0.2) || tries > 20) {
                window.clearInterval(tick);
              }
            }, 500);
          });
        },
        { threshold: 0.2 }
      );
      io.observe(demoSection || video);
    }
  }

  if (reduce) {
    document.querySelectorAll(".process-title").forEach((el) => {
      el.style.clipPath = "none";
      el.style.opacity = "1";
    });
    return;
  }

  const ctx = gsap.context(() => {
    const problemTitle = document.querySelector("#problem-title");
    const words = splitWords(problemTitle);
    if (words.length) {
      gsap.set(words, { color: "#8a94a8" });
      gsap.to(words, {
        color: "#082848",
        ease: "none",
        stagger: 0.12,
        scrollTrigger: {
          trigger: ".band--problem",
          start: "top 70%",
          end: "center 45%",
          scrub: true,
        },
      });
    }

    gsap.utils.toArray(".process-title").forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(0 100% 0 0)", opacity: 0.25 },
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            end: "top 62%",
            scrub: 0.8,
          },
        }
      );
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    if (document.fonts?.ready) document.fonts.ready.then(refresh).catch(() => {});
    requestAnimationFrame(() => requestAnimationFrame(refresh));
  }, document.body);

  if (import.meta.webpackHot) {
    import.meta.webpackHot.accept();
    import.meta.webpackHot.dispose(() => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    });
  }
})();
