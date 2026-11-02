/**
 * Complete Digital Vetting - Client-side Interactive Logic
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Header Scroll Shadow
  const header = document.querySelector(".site-header");
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 8) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  // 2. Desktop Dropdowns & Solutions MegaMenu
  const megaMenuBtn = document.querySelector("[data-mega-toggle]");
  const megaMenu = document.getElementById("mega-menu");
  const dropdownToggles = document.querySelectorAll("[data-dropdown-toggle]");

  function closeAllDropdowns() {
    closeMegaMenu();
    dropdownToggles.forEach((btn) => {
      const targetId = `${btn.getAttribute("data-dropdown-toggle")}-dropdown`;
      const menu = document.getElementById(targetId);
      if (menu) menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      const chevron = btn.querySelector(".chevron-icon");
      if (chevron) chevron.style.transform = "rotate(0deg)";
    });
  }

  function closeMegaMenu() {
    if (megaMenu && megaMenu.classList.contains("is-open")) {
      megaMenu.classList.remove("is-open");
      if (megaMenuBtn) {
        megaMenuBtn.setAttribute("aria-expanded", "false");
        const chevron = megaMenuBtn.querySelector(".chevron-icon");
        if (chevron) chevron.style.transform = "rotate(0deg)";
      }
    }
  }

  if (megaMenuBtn && megaMenu) {
    megaMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !megaMenu.classList.contains("is-open");
      closeAllDropdowns();
      if (willOpen) {
        megaMenu.classList.add("is-open");
        megaMenuBtn.setAttribute("aria-expanded", "true");
        const chevron = megaMenuBtn.querySelector(".chevron-icon");
        if (chevron) chevron.style.transform = "rotate(180deg)";
      }
    });
  }

  dropdownToggles.forEach((btn) => {
    const targetId = `${btn.getAttribute("data-dropdown-toggle")}-dropdown`;
    const menu = document.getElementById(targetId);
    if (!menu) return;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !menu.classList.contains("is-open");
      closeAllDropdowns();
      if (willOpen) {
        menu.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        const chevron = btn.querySelector(".chevron-icon");
        if (chevron) chevron.style.transform = "rotate(180deg)";
      }
    });
  });

  document.addEventListener("click", (e) => {
    const isInsideDropdown = Array.from(dropdownToggles).some((btn) => {
      const targetId = `${btn.getAttribute("data-dropdown-toggle")}-dropdown`;
      const menu = document.getElementById(targetId);
      return (menu && menu.contains(e.target)) || btn.contains(e.target);
    });
    const isInsideMega = megaMenu && (megaMenu.contains(e.target) || (megaMenuBtn && megaMenuBtn.contains(e.target)));

    if (!isInsideDropdown && !isInsideMega) {
      closeAllDropdowns();
    }
  });

  // 3. Mobile Navigation Drawer
  const mobileToggleBtn = document.querySelector("[data-mobile-toggle]");
  const mobileDrawer = document.getElementById("mobile-drawer");

  if (mobileToggleBtn && mobileDrawer) {
    mobileToggleBtn.addEventListener("click", () => {
      const isOpen = mobileDrawer.classList.toggle("is-open");
      mobileToggleBtn.setAttribute("aria-expanded", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";

      // Swap icons inside button
      const menuIcon = mobileToggleBtn.querySelector(".menu-icon");
      const closeIcon = mobileToggleBtn.querySelector(".close-icon");
      if (menuIcon && closeIcon) {
        menuIcon.style.display = isOpen ? "none" : "block";
        closeIcon.style.display = isOpen ? "block" : "none";
      }
    });
  }

  function closeMobileDrawer() {
    if (mobileDrawer && mobileDrawer.classList.contains("is-open")) {
      mobileDrawer.classList.remove("is-open");
      document.body.style.overflow = "";
      if (mobileToggleBtn) {
        mobileToggleBtn.setAttribute("aria-expanded", "false");
        const menuIcon = mobileToggleBtn.querySelector(".menu-icon");
        const closeIcon = mobileToggleBtn.querySelector(".close-icon");
        if (menuIcon && closeIcon) {
          menuIcon.style.display = "block";
          closeIcon.style.display = "none";
        }
      }
    }
  }

  // Global Keyboard Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDropdowns();
      closeMobileDrawer();
    }
  });

  // 4. Scroll Reveal via IntersectionObserver
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length > 0 && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  // 5. Contact Form Validation & Mailto Action
  const contactForm = document.getElementById("cdv-contact-form");
  if (contactForm) {
    const startedAt = Date.now();

    // Check if URL specifies a default topic
    const urlParams = new URLSearchParams(window.location.search);
    const topicParam = urlParams.get("topic");
    const topicSelect = contactForm.querySelector("#topic");
    if (topicParam && topicSelect) {
      for (const opt of topicSelect.options) {
        if (opt.value.toLowerCase() === topicParam.toLowerCase()) {
          opt.selected = true;
          break;
        }
      }
    }

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Clear existing errors
      contactForm.querySelectorAll(".form-error").forEach((el) => {
        el.classList.remove("visible");
        el.textContent = "";
      });

      const fd = new FormData(contactForm);
      const honeypot = fd.get("website");
      // Spam protection: honeypot or submitted under 2.5s
      if (honeypot || (Date.now() - startedAt < 2500)) {
        return;
      }

      const name = (fd.get("name") || "").toString().trim();
      const company = (fd.get("company") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const phone = (fd.get("phone") || "").toString().trim();
      const topic = (fd.get("topic") || "").toString().trim();
      const message = (fd.get("message") || "").toString().trim();

      let hasError = false;

      function showError(id, msg) {
        const errEl = document.getElementById(`${id}-err`);
        if (errEl) {
          errEl.textContent = msg;
          errEl.classList.add("visible");
        }
        hasError = true;
      }

      if (!name) showError("name", "Please enter your name");
      if (!company) showError("company", "Please enter your company");
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("email", "Please enter a valid email");
      }
      if (!topic) showError("topic", "Please choose a topic");
      if (!message || message.length < 10) {
        showError("message", "Please tell us a little more (at least 10 characters)");
      }

      if (hasError) return;

      const bodyText = `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nTelephone: ${phone || "-"}\nTopic: ${topic}\n\n${message}`;
      const mailtoUrl = `mailto:team@cdvetting.com?subject=${encodeURIComponent(`Website enquiry: ${topic}`)}&body=${encodeURIComponent(bodyText)}`;

      const statusMsg = document.getElementById("contact-status");
      if (statusMsg) {
        statusMsg.textContent = "Your email app should now open with your message ready to send.";
        statusMsg.style.color = "var(--foreground)";
      }

      window.location.href = mailtoUrl;
    });
  }

  // 6. Referral Form Validation & Mailto Action
  const referralForm = document.getElementById("cdv-referral-form");
  if (referralForm) {
    const startedAt = Date.now();

    referralForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Clear existing errors
      referralForm.querySelectorAll(".form-error").forEach((el) => {
        el.classList.remove("visible");
        el.textContent = "";
      });

      const fd = new FormData(referralForm);
      const honeypot = fd.get("website");
      // Spam protection: honeypot or submitted under 2.5s
      if (honeypot || (Date.now() - startedAt < 2500)) {
        return;
      }

      const referrerAgency = (fd.get("referrer-agency") || "").toString().trim();
      const referrerName = (fd.get("referrer-name") || "").toString().trim();
      const referrerEmail = (fd.get("referrer-email") || "").toString().trim();
      const referredAgency = (fd.get("referred-agency") || "").toString().trim();
      const referredContact = (fd.get("referred-contact") || "").toString().trim();
      const notes = (fd.get("referral-notes") || "").toString().trim();

      let hasError = false;

      function showRefError(id, msg) {
        const errEl = document.getElementById(`${id}-err`);
        if (errEl) {
          errEl.textContent = msg;
          errEl.classList.add("visible");
        }
        hasError = true;
      }

      if (!referrerAgency) showRefError("referrer-agency", "Please enter your agency name");
      if (!referrerName) showRefError("referrer-name", "Please enter your contact name");
      if (!referrerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(referrerEmail)) {
        showRefError("referrer-email", "Please enter a valid work email");
      }
      if (!referredAgency) showRefError("referred-agency", "Please enter the name of the agency you are referring");

      if (hasError) return;

      const bodyText = [
        "CDV AGENCY REFERRAL SUBMISSION",
        "------------------------------------",
        `Referring Agency: ${referrerAgency}`,
        `Referring Contact: ${referrerName}`,
        `Referring Email: ${referrerEmail}`,
        "",
        `Referred Agency: ${referredAgency}`,
        `Referred Contact Details: ${referredContact || "Not provided (contact via team)"}`,
        "",
        `Additional Comments:\n${notes || "None"}`
      ].join("\n");

      const mailtoUrl = `mailto:team@cdvetting.com?subject=${encodeURIComponent(`Agency Referral: ${referredAgency} (from ${referrerAgency})`)}&body=${encodeURIComponent(bodyText)}`;

      const statusMsg = document.getElementById("referral-status");
      if (statusMsg) {
        statusMsg.textContent = "Thank you! Your email app should now open with your referral details ready to send.";
        statusMsg.style.color = "var(--foreground)";
      }

      // Backend Integration Note:
      // When an API endpoint is configured, replace window.location.href with:
      // await fetch('/api/referrals', { method: 'POST', body: JSON.stringify({...}) });
      window.location.href = mailtoUrl;
    });
  }
});
