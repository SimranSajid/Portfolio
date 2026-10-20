const themeToggle = document.querySelector(".theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

const applyTheme = (theme, persist = false) => {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  if (themeToggle) {
    const isLight = nextTheme === "light";
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} mode`);
    themeToggle.title = `Switch to ${isLight ? "dark" : "light"} mode`;
  }
  if (themeColorMeta) themeColorMeta.setAttribute("content", nextTheme === "light" ? "#FFEFC4" : "#071521");
  if (persist) {
    try {
      sessionStorage.setItem("portfolio-theme", nextTheme);
    } catch {
      // The current session can still use the selected theme when storage is unavailable.
    }
  }
  window.dispatchEvent(new Event("portfolio-theme-change"));
};

if (themeToggle) {
  applyTheme(document.documentElement.dataset.theme);
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(nextTheme, true);
  });
}

const particleCanvas = document.querySelector(".particle-background");

if (particleCanvas) {
  const particleContext = particleCanvas.getContext("2d", { alpha: true });
  if (particleContext) {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles = [];
    const readParticleTheme = () => {
      const themeStyles = getComputedStyle(document.documentElement);
      particleRgb = themeStyles.getPropertyValue("--particle-rgb").trim() || particleRgb;
      particleDotOpacityScale = Number.parseFloat(themeStyles.getPropertyValue("--particle-dot-opacity-scale")) || 1;
      particleLineOpacity = Number.parseFloat(themeStyles.getPropertyValue("--particle-line-opacity")) || 0.25;
    };
    let particleRgb = "124, 195, 255";
    let particleDotOpacityScale = 1;
    let particleLineOpacity = 0.25;
    readParticleTheme();
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
            particleContext.strokeStyle = `rgba(${particleRgb}, ${(1 - distance / maxConnectionDistance) * particleLineOpacity})`;
            particleContext.beginPath();
            particleContext.moveTo(first.x, first.y);
            particleContext.lineTo(second.x, second.y);
            particleContext.stroke();
          }
        }

        if (pointer.active) {
          const distance = Math.hypot(first.x - pointer.x, first.y - pointer.y);
          if (distance < pointerConnectionDistance) {
            particleContext.strokeStyle = `rgba(${particleRgb}, ${(1 - distance / pointerConnectionDistance) * particleLineOpacity})`;
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
        particleContext.fillStyle = `rgba(${particleRgb}, ${Math.min(1, particle.opacity * particleDotOpacityScale)})`;
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
    window.addEventListener("portfolio-theme-change", () => {
      readParticleTheme();
      requestDraw();
    });
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
const pendingIntroReveals = new Map();
const isIntroLoading = () => document.documentElement.classList.contains("intro-loading");
const revealAfterIntro = (element, observer) => {
  observer.unobserve(element);
  if (element.matches(".hero")) {
    requestAnimationFrame(() => {
      element.classList.add("is-animating");
      requestAnimationFrame(() => element.classList.add("is-visible"));
    });
  } else {
    element.classList.add("is-visible");
  }
  if (element.matches(".certificates")) {
    element.querySelectorAll(".certificate-card").forEach((card) => card.classList.add("is-visible"));
  }
};

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealSections.forEach((section) => section.classList.add("is-visible"));
  if (technologiesSection) technologiesSection.classList.add("is-visible");
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (isIntroLoading()) {
          pendingIntroReveals.set(entry.target, observer);
          continue;
        }
        if (entry.target.matches(".hero")) {
          requestAnimationFrame(() => {
            entry.target.classList.add("is-animating");
            requestAnimationFrame(() => entry.target.classList.add("is-visible"));
          });
        } else {
          entry.target.classList.add("is-visible");
        }
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
          if (isIntroLoading()) {
            pendingIntroReveals.set(entry.target, observer);
            continue;
          }
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
        if (isIntroLoading()) {
          pendingIntroReveals.set(entry.target, observer);
          continue;
        }
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
        if (isIntroLoading()) {
          pendingIntroReveals.set(entry.target, observer);
          continue;
        }
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

const projectCarousel = document.querySelector(".project-carousel");

if (projectCarousel) {
  const projectViewport = projectCarousel.querySelector(".project-viewport");
  const projectTrack = projectCarousel.querySelector(".project-list");
  const projectCounter = projectCarousel.querySelector(".project-carousel-counter");
  const projectPagination = projectCarousel.querySelector(".project-carousel-pagination");
  const carouselToggle = projectCarousel.querySelector(".project-carousel-toggle");
  const previousProject = projectCarousel.querySelector(".project-carousel-previous");
  const nextProject = projectCarousel.querySelector(".project-carousel-next");
  const originalProjects = Array.from(projectTrack?.querySelectorAll(":scope > .project-card") || []);

  if (projectViewport && projectTrack && projectCounter && projectPagination && carouselToggle && previousProject && nextProject && originalProjects.length) {
    const projectTotal = originalProjects.length;
    const firstOriginalIndex = 2;
    const lastOriginalIndex = projectTotal + 1;
    let activeTrackIndex = firstOriginalIndex;
    let manuallyPaused = false;
    let motionReduced = reducedMotion;
    let hovering = false;
    let focusWithin = false;
    let manualInteractionOverride = false;
    let navigationInProgress = false;
    let autoplayInterval = 0;
    let repositionFrame = 0;
    let touchStartX = null;

    const wrapProjectIndex = (index) => (index % projectTotal + projectTotal) % projectTotal;
    const markClone = (project, index) => {
      const clone = project.cloneNode(true);
      clone.classList.remove("has-reveal");
      clone.classList.add("is-visible", "project-card-clone");
      clone.dataset.carouselProjectIndex = String(wrapProjectIndex(index));
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("inert", "");
      clone.querySelectorAll("a, button, input, select, textarea, [tabindex]").forEach((element) => {
        element.setAttribute("tabindex", "-1");
      });
      return clone;
    };

    originalProjects.forEach((project, index) => {
      project.dataset.carouselProjectIndex = String(index);
    });
    const leadingClones = document.createDocumentFragment();
    leadingClones.append(
      markClone(originalProjects[projectTotal - 2] || originalProjects[0], projectTotal - 2),
      markClone(originalProjects[projectTotal - 1], projectTotal - 1)
    );
    projectTrack.prepend(leadingClones);
    projectTrack.append(
      markClone(originalProjects[0], 0),
      markClone(originalProjects[1] || originalProjects[0], 1)
    );

    const projectDots = originalProjects.map((project, index) => {
      const dot = document.createElement("button");
      dot.className = "project-pagination-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Show project ${index + 1} of ${projectTotal}: ${project.querySelector("h3")?.textContent.trim() || "Project"}`);
      dot.addEventListener("click", () => navigateTo(firstOriginalIndex + index, true));
      projectPagination.append(dot);
      return dot;
    });

    const canonicalIndex = (trackIndex) => {
      const card = projectTrack.children[trackIndex];
      return Number(card?.dataset.carouselProjectIndex || 0);
    };

    const updateActiveCard = () => {
      Array.from(projectTrack.children).forEach((card, index) => {
        const active = index === activeTrackIndex;
        card.classList.toggle("is-active", active);
        if (active) card.setAttribute("aria-current", "true");
        else card.removeAttribute("aria-current");
      });
      const selectedProject = canonicalIndex(activeTrackIndex);
      projectCounter.textContent = `${String(selectedProject + 1).padStart(2, "0")} / ${String(projectTotal).padStart(2, "0")}`;
      projectDots.forEach((dot, index) => {
        if (index === selectedProject) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    };

    const setTrackPosition = () => {
      const activeCard = projectTrack.children[activeTrackIndex];
      if (!activeCard) return;
      const cardWidth = activeCard.offsetWidth;
      const cardOffset = activeCard.offsetLeft;
      const translateX = (projectViewport.clientWidth - cardWidth) / 2 - cardOffset;
      projectTrack.style.transform = `translate3d(${translateX}px, 0, 0)`;
    };

    const clearAutoplay = () => {
      if (!autoplayInterval) return;
      window.clearInterval(autoplayInterval);
      autoplayInterval = 0;
    };

    const syncAutoplay = () => {
      clearAutoplay();
      const effectivelyPaused = manuallyPaused || motionReduced;
      if (!effectivelyPaused && ((!hovering && !focusWithin) || manualInteractionOverride) && !document.hidden && !isIntroLoading()) {
        autoplayInterval = window.setInterval(() => navigateTo(activeTrackIndex + 1), 3800);
      }
      carouselToggle.setAttribute("aria-pressed", String(effectivelyPaused));
      carouselToggle.setAttribute("aria-label", effectivelyPaused ? "Play project carousel" : "Pause project carousel");
      projectCarousel.classList.toggle("is-paused", effectivelyPaused);
    };

    function navigateTo(targetIndex, fromManualControl = false) {
      if (fromManualControl) manualInteractionOverride = true;
      if (navigationInProgress) {
        syncAutoplay();
        return;
      }
      const minimumIndex = 1;
      const maximumIndex = projectTotal + 2;
      const nextIndex = Math.max(minimumIndex, Math.min(maximumIndex, targetIndex));
      if (nextIndex === activeTrackIndex) {
        syncAutoplay();
        return;
      }
      activeTrackIndex = nextIndex;
      navigationInProgress = true;
      updateActiveCard();
      setTrackPosition();
      syncAutoplay();
    }

    projectTrack.addEventListener("transitionend", (event) => {
      if (event.target !== projectTrack || event.propertyName !== "transform" || !navigationInProgress) return;
      if (activeTrackIndex === 1) activeTrackIndex = lastOriginalIndex;
      else if (activeTrackIndex === projectTotal + 2) activeTrackIndex = firstOriginalIndex;
      projectTrack.classList.add("is-repositioning");
      updateActiveCard();
      setTrackPosition();
      projectTrack.offsetHeight;
      projectTrack.classList.remove("is-repositioning");
      navigationInProgress = false;
      syncAutoplay();
    });

    const navigateOne = (direction, fromManualControl = false) => {
      if (fromManualControl) manualInteractionOverride = true;
      if (navigationInProgress) {
        syncAutoplay();
        return;
      }
      const nextIndex = activeTrackIndex + direction;
      if (nextIndex < 1) navigateTo(lastOriginalIndex, fromManualControl);
      else if (nextIndex > projectTotal + 2) navigateTo(firstOriginalIndex, fromManualControl);
      else navigateTo(nextIndex, fromManualControl);
    };

    carouselToggle.addEventListener("click", () => {
      manuallyPaused = !manuallyPaused;
      if (!manuallyPaused) manualInteractionOverride = true;
      syncAutoplay();
    });
    previousProject.addEventListener("click", () => navigateOne(-1, true));
    nextProject.addEventListener("click", () => navigateOne(1, true));

    projectCarousel.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || hovering) return;
      hovering = true;
      manualInteractionOverride = false;
      syncAutoplay();
    });
    projectCarousel.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse" || !hovering) return;
      hovering = false;
      if (!focusWithin) manualInteractionOverride = false;
      syncAutoplay();
    });
    projectCarousel.addEventListener("focusin", (event) => {
      focusWithin = event.target instanceof Element && event.target.matches(":focus-visible");
      if (focusWithin) manualInteractionOverride = false;
      syncAutoplay();
    });
    projectCarousel.addEventListener("focusout", (event) => {
      focusWithin = event.relatedTarget instanceof Element
        && projectCarousel.contains(event.relatedTarget)
        && event.relatedTarget.matches(":focus-visible");
      if (!focusWithin && !hovering) manualInteractionOverride = false;
      syncAutoplay();
    });
    projectViewport.addEventListener("keydown", (event) => {
      if (event.target instanceof Element && event.target.closest("a, button, input, select, textarea")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        navigateOne(event.key === "ArrowRight" ? 1 : -1, true);
      }
    });
    projectViewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") touchStartX = event.clientX;
    });
    projectViewport.addEventListener("pointerup", (event) => {
      if (touchStartX === null) return;
      const swipeDistance = event.clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(swipeDistance) > 48) navigateOne(swipeDistance < 0 ? 1 : -1, true);
    });
    projectViewport.addEventListener("pointercancel", () => { touchStartX = null; });
    document.addEventListener("visibilitychange", syncAutoplay);

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionPreference.addEventListener("change", (event) => {
      motionReduced = event.matches;
      syncAutoplay();
    });

    const resizeObserver = "ResizeObserver" in window
      ? new ResizeObserver(() => {
        window.cancelAnimationFrame(repositionFrame);
        repositionFrame = window.requestAnimationFrame(() => {
          projectTrack.classList.add("is-repositioning");
          if (activeTrackIndex === 1) activeTrackIndex = lastOriginalIndex;
          else if (activeTrackIndex === projectTotal + 2) activeTrackIndex = firstOriginalIndex;
          updateActiveCard();
          setTrackPosition();
          projectTrack.offsetHeight;
          projectTrack.classList.remove("is-repositioning");
          navigationInProgress = false;
          syncAutoplay();
        });
      })
      : null;
    resizeObserver?.observe(projectViewport);
    if (!resizeObserver) window.addEventListener("resize", setTrackPosition, { passive: true });

    const loaderLifecycleObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === "class") && !isIntroLoading()) {
        syncAutoplay();
      }
    });
    loaderLifecycleObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("pageshow", syncAutoplay);
    syncAutoplay();

    projectTrack.classList.add("is-repositioning");
    updateActiveCard();
    setTrackPosition();
    projectTrack.offsetHeight;
    projectTrack.classList.remove("is-repositioning");
    syncAutoplay();
  }
}

const navLinks = [...document.querySelectorAll(".primary-nav a[href^='#']")];
const fixedHeader = document.querySelector(".header-row");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileMenuBackdrop = document.querySelector(".mobile-menu-backdrop");
const primaryNavigation = document.querySelector(".primary-nav");
const socialLinks = document.querySelector(".social-links");
const themeToggleHome = themeToggle?.parentElement;

if (mobileMenuToggle && mobileMenuBackdrop && primaryNavigation) {
  const mobileMenuQuery = window.matchMedia("(max-width: 700px)");
  let previousFocus = null;

  const updateThemeTogglePlacement = () => {
    if (!themeToggle || !themeToggleHome) return;
    if (mobileMenuQuery.matches && themeToggle.parentElement !== primaryNavigation) {
      primaryNavigation.prepend(themeToggle);
    } else if (!mobileMenuQuery.matches && themeToggle.parentElement !== themeToggleHome) {
      themeToggleHome.insertBefore(themeToggle, socialLinks);
    }
  };

  updateThemeTogglePlacement();

  const setMobileMenuOpen = (isOpen) => {
    document.documentElement.classList.toggle("mobile-menu-open", isOpen);
    mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
    mobileMenuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    primaryNavigation.setAttribute("aria-hidden", String(mobileMenuQuery.matches && !isOpen));
    if (isOpen) {
      previousFocus = document.activeElement;
      primaryNavigation.querySelector("a")?.focus({ preventScroll: true });
    } else if (previousFocus instanceof HTMLElement) {
      if (previousFocus.getClientRects().length) previousFocus.focus({ preventScroll: true });
      else previousFocus.blur();
      previousFocus = null;
    }
  };

  mobileMenuToggle.addEventListener("click", () => {
    setMobileMenuOpen(mobileMenuToggle.getAttribute("aria-expanded") !== "true");
  });
  mobileMenuBackdrop.addEventListener("click", () => setMobileMenuOpen(false));
  primaryNavigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setMobileMenuOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenuToggle.getAttribute("aria-expanded") === "true") {
      setMobileMenuOpen(false);
      mobileMenuToggle.focus({ preventScroll: true });
    }
  });
  mobileMenuQuery.addEventListener("change", (event) => {
    if (!event.matches) setMobileMenuOpen(false);
    updateThemeTogglePlacement();
    primaryNavigation.setAttribute("aria-hidden", String(event.matches));
  });
  primaryNavigation.setAttribute("aria-hidden", String(mobileMenuQuery.matches));
}

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

const pageIntro = document.querySelector(".page-intro");
if (pageIntro) {
  const progressFill = pageIntro.querySelector(".page-intro__progress-fill");
  const progressValue = pageIntro.querySelector(".page-intro__progress-value");
  const progressTrack = pageIntro.querySelector(".page-intro__progress-track");
  const progressDuration = reducedMotion ? 300 : 2200;
  let introFinished = false;
  const finishIntro = () => {
    if (introFinished) return;
    pageIntro.classList.add("is-exiting");
    const unlockPage = () => {
      if (introFinished) return;
      introFinished = true;
      pageIntro.removeEventListener("transitionend", handleTransitionEnd);
      pageIntro.remove();
      document.documentElement.classList.remove("intro-loading");
      pendingIntroReveals.forEach((observer, element) => revealAfterIntro(element, observer));
      pendingIntroReveals.clear();
    };
    const handleTransitionEnd = (event) => {
      if (event.target === pageIntro && event.propertyName === "opacity") unlockPage();
    };
    pageIntro.addEventListener("transitionend", handleTransitionEnd);
    window.setTimeout(unlockPage, reducedMotion ? 200 : 650);
  };

  if (progressFill && progressValue && progressTrack) {
    let progressStartedAt = 0;
    const animateProgress = (timestamp) => {
      if (!progressStartedAt) progressStartedAt = timestamp;
      const elapsed = timestamp - progressStartedAt;
      const linearProgress = Math.min(elapsed / progressDuration, 1);
      const progress = linearProgress === 1 ? 1 : 1 - (1 - linearProgress) ** 1.65;
      const percentage = Math.round(progress * 100);
      progressFill.style.transform = `scaleX(${progress})`;
      progressValue.textContent = `${percentage}%`;
      progressTrack.setAttribute("aria-valuenow", String(percentage));

      if (linearProgress < 1) {
        window.requestAnimationFrame(animateProgress);
      } else {
        window.setTimeout(finishIntro, reducedMotion ? 100 : 180);
      }
    };
    window.requestAnimationFrame(animateProgress);
  } else {
    finishIntro();
  }
}
