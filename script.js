/**
 * AUTOHUB® Global Vehicle Shipping & Logistics — Production UI Controller
 * Vanilla ES6 JavaScript (No Frameworks, No Build Step)
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------------------------
     1. SCROLL PROGRESS BAR & HEADER SCROLL CONTROLLER
     -------------------------------------------------------------------------- */
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  const topBar = document.getElementById('topBar');
  const siteHeader = document.getElementById('mainHeader');
  const backToTopBtn = document.getElementById('backToTopBtn');

  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
  let ticking = false;

  function handleScroll() {
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    // 1.1 Progress bar calculation
    if (scrollProgressBar && scrollHeight > 0) {
      const scrollPercent = Math.min(100, Math.max(0, (currentScrollY / scrollHeight) * 100));
      scrollProgressBar.style.width = `${scrollPercent}%`;
      scrollProgressBar.setAttribute('aria-valuenow', Math.round(scrollPercent));
    }

    // 1.2 Top bar & Header state
    if (currentScrollY > 40) {
      if (topBar && !topBar.classList.contains('top-bar--hidden')) {
        topBar.classList.add('top-bar--hidden');
      }
      if (siteHeader && !siteHeader.classList.contains('scrolled')) {
        siteHeader.classList.add('scrolled');
      }
    } else {
      if (topBar && topBar.classList.contains('top-bar--hidden')) {
        topBar.classList.remove('top-bar--hidden');
      }
      if (siteHeader && siteHeader.classList.contains('scrolled')) {
        siteHeader.classList.remove('scrolled');
      }
    }

    // 1.3 Back to top button visibility (threshold 600px)
    if (backToTopBtn) {
      if (currentScrollY > 600) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }

    // 1.4 Parallax Effect (throttled via rAF)
    if (!prefersReducedMotion) {
      updateParallax(currentScrollY);
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });

  // Smooth scroll to top
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  }

  /* --------------------------------------------------------------------------
     2. PARALLAX EFFECT FOR [data-parallax]
     -------------------------------------------------------------------------- */
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  function updateParallax(scrollTop) {
    parallaxElements.forEach((el) => {
      const speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      const rect = el.getBoundingClientRect();
      const offsetTop = rect.top + scrollTop;
      const visibleDistance = scrollTop - offsetTop;
      const yPos = visibleDistance * speed;
      el.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
  }

  /* --------------------------------------------------------------------------
     3. INTERSECTION OBSERVER FOR SCROLL REVEAL ANIMATIONS
     -------------------------------------------------------------------------- */
  const animatedElements = document.querySelectorAll('[data-animate]');

  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -10% 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');

        // Check if stats card entered view
        if (entry.target.classList.contains('stats-container') || entry.target.querySelector('.stat-counter')) {
          initCounters(entry.target);
        }

        // Check if map entered view
        if (entry.target.id === 'networkMapContainer' || entry.target.querySelector('.world-map-svg')) {
          const mapWrap = document.getElementById('networkMapContainer');
          if (mapWrap) mapWrap.classList.add('in-view');
        }

        // Check if process timeline entered view
        if (entry.target.id === 'processTimeline' || entry.target.querySelector('.timeline-step')) {
          const timeline = document.getElementById('processTimeline');
          if (timeline) timeline.classList.add('in-view');
        }

        // Once triggered, unobserve to avoid repeat triggers
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach((el) => {
    revealObserver.observe(el);
  });

  /* --------------------------------------------------------------------------
     4. COUNT-UP ANIMATION (easeOutCubic over 2 seconds)
     -------------------------------------------------------------------------- */
  let countersStarted = false;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function initCounters(container) {
    if (countersStarted) return;
    countersStarted = true;

    const counters = container.querySelectorAll('.stat-counter');
    const duration = 2000; // 2 seconds

    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-target'), 10) || 0;
      if (prefersReducedMotion) {
        counter.textContent = target.toLocaleString('en-US');
        return;
      }

      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const currentVal = Math.floor(easedProgress * target);

        counter.textContent = currentVal.toLocaleString('en-US');

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          counter.textContent = target.toLocaleString('en-US');
        }
      }

      window.requestAnimationFrame(step);
    });
  }

  /* --------------------------------------------------------------------------
     5. SCROLLSPY (Highlight active nav link)
     -------------------------------------------------------------------------- */
  const navLinks = document.querySelectorAll('[data-nav-link]');
  const trackedSections = document.querySelectorAll('section[id], footer[id]');

  const scrollspyObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    threshold: 0.35,
    rootMargin: '-80px 0px -50% 0px'
  });

  trackedSections.forEach((sec) => scrollspyObserver.observe(sec));

  /* --------------------------------------------------------------------------
     6. MOBILE HAMBURGER & DRAWER MENU
     -------------------------------------------------------------------------- */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  function openDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('active');
    drawerOverlay.classList.add('active');
    hamburgerBtn.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    drawerOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    drawerCloseBtn.focus();
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    drawerOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    hamburgerBtn.focus();
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.contains('active');
      if (isOpen) closeDrawer();
      else openDrawer();
    });
  }

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  // ESC key to close mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  /* --------------------------------------------------------------------------
     7. DROPDOWN MENUS KEYBOARD ACCESSIBILITY
     -------------------------------------------------------------------------- */
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  dropdownToggles.forEach((toggle) => {
    const parentDropdown = toggle.closest('.dropdown');
    const panel = parentDropdown.querySelector('.dropdown-panel');
    const items = panel.querySelectorAll('.dropdown-item');

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
    });

    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        toggle.setAttribute('aria-expanded', 'true');
        if (items.length > 0) items[0].focus();
      }
    });

    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  });

  /* --------------------------------------------------------------------------
     8. FAQ ACCORDION (Single item open, smooth height)
     -------------------------------------------------------------------------- */
  const faqItems = document.querySelectorAll('.faq-item');

  function setPanelHeight(item, open) {
    const panel = item.querySelector('.faq-panel');
    const trigger = item.querySelector('.faq-trigger');
    if (!panel || !trigger) return;

    if (open) {
      item.classList.add('active');
      trigger.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    } else {
      item.classList.remove('active');
      trigger.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = '0px';
    }
  }

  // Initialize open state (item 1 open by default)
  faqItems.forEach((item, index) => {
    if (item.classList.contains('active') || index === 0) {
      setPanelHeight(item, true);
    } else {
      setPanelHeight(item, false);
    }

    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // Close all other items (accordion behavior)
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            setPanelHeight(otherItem, false);
          }
        });

        // Toggle clicked item
        setPanelHeight(item, !isOpen);
      });
    }
  });

  // Recompute panel heights on window resize
  window.addEventListener('resize', () => {
    const activeItem = document.querySelector('.faq-item.active');
    if (activeItem) {
      const panel = activeItem.querySelector('.faq-panel');
      if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }, { passive: true });

  /* --------------------------------------------------------------------------
     9. TESTIMONIALS CAROUSEL (Touch/Drag, Autoplay, Dots, Prev/Next)
     -------------------------------------------------------------------------- */
  const carousel = document.getElementById('testimonialsCarousel');
  const track = document.getElementById('testimonialsTrack');
  const prevBtn = document.getElementById('carouselPrevBtn');
  const nextBtn = document.getElementById('carouselNextBtn');
  const dotsContainer = document.getElementById('carouselDots');

  if (carousel && track) {
    const cards = Array.from(track.querySelectorAll('.testimonial-card'));
    const totalCards = cards.length;
    let currentIndex = 0;
    let autoplayTimer = null;
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;

    // Determine how many cards visible depending on screen width
    function getVisibleCount() {
      const width = window.innerWidth;
      if (width <= 768) return 1;
      if (width <= 1200) return 2;
      return 3;
    }

    // Build pagination dots
    function renderDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, totalCards - visibleCount);

      for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${i === currentIndex ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to testimonial slide ${i + 1}`);
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
    }

    function updateCardClasses() {
      const visibleCount = getVisibleCount();
      cards.forEach((card, idx) => {
        const inView = idx >= currentIndex && idx < currentIndex + visibleCount;
        if (inView) {
          card.classList.remove('is-outer');
        } else {
          card.classList.add('is-outer');
        }
      });
    }

    function updateCarouselPosition() {
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, totalCards - visibleCount);

      if (currentIndex > maxIndex) currentIndex = maxIndex;
      if (currentIndex < 0) currentIndex = 0;

      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = 24; // 24px gap defined in CSS
      const moveDistance = currentIndex * (cardWidth + gap);

      currentTranslate = -moveDistance;
      prevTranslate = currentTranslate;
      track.style.transform = `translateX(${currentTranslate}px)`;

      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, idx) => {
          if (idx === currentIndex) {
            dot.classList.add('active');
            dot.setAttribute('aria-selected', 'true');
          } else {
            dot.classList.remove('active');
            dot.setAttribute('aria-selected', 'false');
          }
        });
      }

      updateCardClasses();
    }

    function goToSlide(index) {
      currentIndex = index;
      updateCarouselPosition();
    }

    function nextSlide() {
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, totalCards - visibleCount);
      if (currentIndex >= maxIndex) {
        currentIndex = 0; // Loop back
      } else {
        currentIndex++;
      }
      updateCarouselPosition();
    }

    function prevSlide() {
      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, totalCards - visibleCount);
      if (currentIndex <= 0) {
        currentIndex = maxIndex; // Loop to end
      } else {
        currentIndex--;
      }
      updateCarouselPosition();
    }

    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });

    // Autoplay (5 seconds)
    function startAutoplay() {
      if (prefersReducedMotion) return;
      stopAutoplay();
      autoplayTimer = setInterval(nextSlide, 5000);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // Pause autoplay on mouse enter / resume on leave
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('focusout', startAutoplay);

    // Touch & Pointer Drag Gestures
    function pointerDown(e) {
      isDragging = true;
      startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
      stopAutoplay();
      track.style.transition = 'none';
      animationID = requestAnimationFrame(animation);
    }

    function pointerMove(e) {
      if (!isDragging) return;
      const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
      const deltaX = currentX - startX;
      currentTranslate = prevTranslate + deltaX;
    }

    function pointerUp() {
      if (!isDragging) return;
      isDragging = false;
      cancelAnimationFrame(animationID);
      track.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';

      const movedBy = currentTranslate - prevTranslate;
      const threshold = 50;

      if (movedBy < -threshold) {
        nextSlide();
      } else if (movedBy > threshold) {
        prevSlide();
      } else {
        updateCarouselPosition();
      }

      startAutoplay();
    }

    function animation() {
      track.style.transform = `translateX(${currentTranslate}px)`;
      if (isDragging) requestAnimationFrame(animation);
    }

    // Attach pointer events for desktop drag and touch for mobile
    track.addEventListener('mousedown', pointerDown);
    window.addEventListener('mousemove', pointerMove);
    window.addEventListener('mouseup', pointerUp);

    track.addEventListener('touchstart', pointerDown, { passive: true });
    window.addEventListener('touchmove', pointerMove, { passive: true });
    window.addEventListener('touchend', pointerUp);

    window.addEventListener('resize', () => {
      renderDots();
      updateCarouselPosition();
    }, { passive: true });

    // Initial setup
    renderDots();
    updateCarouselPosition();
    startAutoplay();
  }

  /* --------------------------------------------------------------------------
     10. MAGNETIC BUTTON EFFECT (Desktop with fine pointer only)
     -------------------------------------------------------------------------- */
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (isFinePointer && !prefersReducedMotion) {
    const magneticButtons = document.querySelectorAll('.btn-primary');

    magneticButtons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - btnCenterX) * 0.22;
        const deltaY = (e.clientY - btnCenterY) * 0.22;

        // Clamp to max 6px
        const maxOffset = 6;
        const clampedX = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
        const clampedY = Math.max(-maxOffset, Math.min(maxOffset, deltaY));

        btn.style.transform = `translate3d(${clampedX}px, ${clampedY - 2}px, 0)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* --------------------------------------------------------------------------
     11. 3D TILT EFFECT FOR PROCURLY MOCKUP
     -------------------------------------------------------------------------- */
  const procurlyMockup = document.getElementById('procurlyMockup');

  if (procurlyMockup && isFinePointer && !prefersReducedMotion) {
    const portalSection = document.getElementById('procurly');
    if (portalSection) {
      portalSection.addEventListener('mousemove', (e) => {
        const rect = procurlyMockup.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        const rotateY = (x / (rect.width / 2)) * 8;
        const rotateX = -(y / (rect.height / 2)) * 6;

        procurlyMockup.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
      });

      portalSection.addEventListener('mouseleave', () => {
        procurlyMockup.style.transform = 'perspective(1000px) rotateY(-6deg) rotateX(2deg)';
      });
    }
  }

  /* --------------------------------------------------------------------------
     12. DYNAMIC TIMELINE & MAP INITIAL TRIGGER FALLBACK
     -------------------------------------------------------------------------- */
  // If user loads page scrolled down, trigger in-view elements immediately
  setTimeout(() => {
    handleScroll();
  }, 200);

});
