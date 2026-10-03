const revealSections = [
  document.querySelector(".hero"),
  document.querySelector(".experience"),
  document.querySelector(".projects"),
  document.querySelector(".certificates"),
  document.querySelector(".contact-section")
].filter(Boolean);
const technologiesSection = document.querySelector(".technologies");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealSections.forEach((section) => section.classList.add("is-visible"));
  if (technologiesSection) technologiesSection.classList.add("is-visible");
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        if (entry.target.matches(".certificates")) {
          entry.target.querySelectorAll(".certificate-card").forEach((card) => card.classList.add("is-visible"));
        }
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.05, rootMargin: "0px 0px 8% 0px" });

  revealSections.forEach((section) => {
    section.classList.add("has-reveal");
    if (section.matches(".certificates")) {
      section.querySelectorAll(".certificate-card").forEach((card) => card.classList.add("has-reveal"));
    }
    revealObserver.observe(section);
  });

  if (technologiesSection) {
    const technologiesObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.05) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.05, rootMargin: "0px" });

    technologiesSection.classList.add("has-reveal");
    technologiesObserver.observe(technologiesSection);
  }
}

const experienceCards = document.querySelectorAll(".experience-content");

if (!reducedMotion && "IntersectionObserver" in window && experienceCards.length) {
  const experienceObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.05, rootMargin: "0px 0px 8% 0px" });

  experienceCards.forEach((card) => {
    card.classList.add("has-reveal");
    experienceObserver.observe(card);
  });
}

const navLinks = [...document.querySelectorAll(".primary-nav a[href^='#']")];
const fixedHeader = document.querySelector(".header-row");
const navSections = navLinks
  .map((link) => {
    const targetSelector = link.getAttribute("href");
    if (!targetSelector || targetSelector === "#") return null;
    const section = document.querySelector(targetSelector);
    return section ? { link, section } : null;
  })
  .filter(Boolean);

const setActiveNavLink = (sectionId) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const getClosestSection = () => {
  if (!navSections.length) return null;

  const headerBottom = fixedHeader?.getBoundingClientRect().bottom ?? 0;
  const referenceOffset = Math.max(window.innerHeight * 0.35, headerBottom + 16);
  let closestSection = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  navSections.forEach(({ section }) => {
    const distance = Math.abs(section.getBoundingClientRect().top - referenceOffset);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestSection = section;
    }
  });

  return closestSection;
};

if (navSections.length) {
  const updateActiveNavFromScroll = () => {
    const activeSection = getClosestSection();
    if (activeSection) {
      setActiveNavLink(activeSection.id);
    }
  };

  updateActiveNavFromScroll();
  window.addEventListener("scroll", updateActiveNavFromScroll, { passive: true });
  window.addEventListener("resize", updateActiveNavFromScroll);
}
