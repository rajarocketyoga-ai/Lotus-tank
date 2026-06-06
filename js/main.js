/* =============================================
   LotusTank — Main JavaScript
   ============================================= */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  // --- Navigation scroll effect ---
  const nav = document.querySelector('.nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  function handleScroll() {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check

  // --- Mobile nav toggle ---
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close nav when a link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Email form handling ---
  const emailForm = document.getElementById('email-form');
  const formMessage = document.getElementById('form-message');

  if (emailForm) {
    emailForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = this.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      const submitBtn = this.querySelector('button[type="submit"]');

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        showFormMessage('Please enter your email address.', 'error');
        return;
      }

      if (!emailRegex.test(email)) {
        showFormMessage('Please enter a valid email address.', 'error');
        return;
      }

      // Determine API URL - use relative path for production
      const apiUrl = '/api/waitlist';

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Joining...';

      // Send to backend API
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          showFormMessage(data.message || "You're on the list! We'll let you know when we launch. 🧘", 'success');
          emailInput.value = '';
        } else {
          showFormMessage(data.message || 'Something went wrong. Please try again.', 'error');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Join the Waitlist';
      })
      .catch(function (err) {
        console.error('Waitlist API error:', err);
        showFormMessage('Something went wrong. Please try again later.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Join the Waitlist';
      });

      // Also store in localStorage as a fallback
      try {
        const subscribers = JSON.parse(localStorage.getItem('lotustank_subscribers') || '[]');
        subscribers.push({ email: email, date: new Date().toISOString() });
        localStorage.setItem('lotustank_subscribers', JSON.stringify(subscribers));
      } catch (e) {
        // localStorage not available, silently fail
      }
    });
  }

  function showFormMessage(message, type) {
    if (!formMessage) return;
    formMessage.textContent = message;
    formMessage.className = 'form-message ' + type;
    formMessage.style.display = 'block';

    // Auto-hide success after 5 seconds
    if (type === 'success') {
      setTimeout(function () {
        formMessage.style.display = 'none';
      }, 5000);
    }
  }

  // --- Scroll-triggered fade-in animations ---
  const fadeElements = document.querySelectorAll('.fade-in');

  function checkFadeIn() {
    fadeElements.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.top < windowHeight * 0.85) {
        el.classList.add('visible');
      }
    });
  }

  if (fadeElements.length > 0) {
    window.addEventListener('scroll', checkFadeIn, { passive: true });
    window.addEventListener('resize', checkFadeIn, { passive: true });
    checkFadeIn(); // Initial check
  }

  // --- Active nav link highlighting ---
  const navLinkItems = navLinks.querySelectorAll('a[href^="#"]');

  function updateActiveNavLink() {
    const scrollPos = window.scrollY + 120;

    navLinkItems.forEach(function (link) {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const targetSection = document.querySelector(targetId);
      if (!targetSection) return;

      const sectionTop = targetSection.offsetTop;
      const sectionBottom = sectionTop + targetSection.offsetHeight;

      if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  if (navLinkItems.length > 0) {
    window.addEventListener('scroll', updateActiveNavLink, { passive: true });
    updateActiveNavLink();
  }

  // --- Smooth scroll for anchor links (fallback for older browsers) ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('🧘 LotusTank — breathe. move. flow.');
});