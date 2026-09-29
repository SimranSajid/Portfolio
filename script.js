const revealSections = [
  document.querySelector(".hero"),
  document.querySelector(".technologies"),
  document.querySelector(".experience"),
  document.querySelector(".projects")
].filter(Boolean);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealSections.forEach((section) => section.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.1 });

  revealSections.forEach((section) => {
    section.classList.add("has-reveal");
    revealObserver.observe(section);
  });
}
