const particleCanvas = document.querySelector(".particle-background");

if (particleCanvas) {
  const particleContext = particleCanvas.getContext("2d", { alpha: true });
  if (particleContext) {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles = [];
    const maxConnectionDistance = 120;
    const pointerConnectionDistance = 140;
    const pointer = { x: 0, y: 0, active: false };
    let viewportWidth = 0;
    let viewportHeight = 0;
    let pixelRatio = 1;
    let frameId = 0;
    let resizeFrameId = 0;
    let disposed = false;

    const randomBetween = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);

    const populateParticles = () => {
      const isSmallScreen = window.innerWidth <= 700;
      const targetCount = Math.round((viewportWidth * viewportHeight) / 14000);
      const particleCount = isSmallScreen
        ? Math.min(35, Math.max(25, targetCount))
        : Math.min(80, Math.max(60, targetCount));

      particles.length = 0;
      for (let index = 0; index < particleCount; index += 1) {
        const direction = randomBetween(0, Math.PI * 2);
        const speed = randomBetween(0.2, 0.5);
        particles.push({
          x: randomBetween(0, viewportWidth),
          y: randomBetween(0, viewportHeight),
          radius: randomBetween(1, 2.5),
          opacity: randomBetween(0.2, 0.6),
          velocityX: Math.cos(direction) * speed,
          velocityY: Math.sin(direction) * speed
        });
      }
    };

    const resizeCanvas = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      particleCanvas.width = Math.round(viewportWidth * pixelRatio);
      particleCanvas.height = Math.round(viewportHeight * pixelRatio);
      particleContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      populateParticles();
      requestDraw();
    };

    const drawConnections = () => {
      particleContext.lineWidth = 0.75;
      for (let firstIndex = 0; firstIndex < particles.length; firstIndex += 1) {
        const first = particles[firstIndex];
        for (let secondIndex = firstIndex + 1; secondIndex < particles.length; secondIndex += 1) {
          const second = particles[secondIndex];
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          if (distance < maxConnectionDistance) {
            particleContext.strokeStyle = `rgba(124, 195, 255, ${(1 - distance / maxConnectionDistance) * 0.25})`;
            particleContext.beginPath();
            particleContext.moveTo(first.x, first.y);
            particleContext.lineTo(second.x, second.y);
            particleContext.stroke();
          }
        }

        if (pointer.active) {
          const distance = Math.hypot(first.x - pointer.x, first.y - pointer.y);
          if (distance < pointerConnectionDistance) {
            particleContext.strokeStyle = `rgba(124, 195, 255, ${(1 - distance / pointerConnectionDistance) * 0.25})`;
            particleContext.beginPath();
            particleContext.moveTo(first.x, first.y);
            particleContext.lineTo(pointer.x, pointer.y);
            particleContext.stroke();
          }
        }
      }
    };

    function requestDraw() {
      if (!disposed && !document.hidden && !frameId) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    }

    function drawFrame() {
      frameId = 0;
      if (disposed || document.hidden) return;

      particleContext.clearRect(0, 0, viewportWidth, viewportHeight);
      particles.forEach((particle) => {
        if (!motionPreference.matches) {
          particle.x += particle.velocityX;
          particle.y += particle.velocityY;

          if (particle.x < 0 || particle.x > viewportWidth) particle.velocityX *= -1;
          if (particle.y < 0 || particle.y > viewportHeight) particle.velocityY *= -1;
          particle.x = Math.max(0, Math.min(viewportWidth, particle.x));
          particle.y = Math.max(0, Math.min(viewportHeight, particle.y));
        }
      });

      drawConnections();

      particles.forEach((particle) => {

        particleContext.beginPath();
        particleContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        particleContext.fillStyle = `rgba(124, 195, 255, ${particle.opacity})`;
        particleContext.fill();
      });

      if (!motionPreference.matches) requestDraw();
    }

    const handleResize = () => {
      if (!resizeFrameId) {
        resizeFrameId = window.requestAnimationFrame(() => {
          resizeFrameId = 0;
          resizeCanvas();
        });
      }
    };
    const handleMouseMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      requestDraw();
    };
    const resetPointer = () => {
      pointer.active = false;
      requestDraw();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) requestDraw();
    };
    const handleMotionPreferenceChange = () => {
      if (motionPreference.matches && frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      requestDraw();
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", resetPointer);
    window.addEventListener("blur", resetPointer);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionPreference.addEventListener("change", handleMotionPreferenceChange);
    resizeCanvas();

    window.addEventListener("pagehide", () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(resizeFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", resetPointer);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionPreference.removeEventListener("change", handleMotionPreferenceChange);
    }, { once: true });
  }
}

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

const projectCards = document.querySelectorAll(".projects .project-card");

if (!reducedMotion && "IntersectionObserver" in window && projectCards.length) {
  const projectCardObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.1, rootMargin: "0px" });

  projectCards.forEach((card) => {
    card.classList.add("has-reveal");
    projectCardObserver.observe(card);
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
