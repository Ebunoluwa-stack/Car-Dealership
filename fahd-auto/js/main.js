(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const header = $(".site-header");
  const menuToggle = $(".menu-toggle");
  const nav = $("#primary-nav");
  const toast = $("#toast");
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  }

  // Sticky header treatment
  const updateHeader = () =>
    header.classList.toggle("scrolled", window.scrollY > 24);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Accessible mobile navigation
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    menuToggle.setAttribute(
      "aria-label",
      expanded ? "Open navigation" : "Close navigation",
    );
    nav.classList.toggle("open", !expanded);
  });
  $$("#primary-nav a").forEach((link) =>
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    }),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.focus();
    }
  });

  // Inventory filters and search
  const cards = $$(".car-card");
  const filterButtons = $$(".filter-tab");
  const queryInput = $("#search-query");
  const typeSelect = $("#search-type");
  const budgetSelect = $("#search-budget");
  const count = $("#results-count");
  const empty = $("#empty-state");
  let activeType = "all";

  function filterInventory() {
    const query = queryInput.value.trim().toLowerCase();
    const type = activeType !== "all" ? activeType : typeSelect.value;
    const budget =
      budgetSelect.value === "all" ? Infinity : Number(budgetSelect.value);
    let visible = 0;
    cards.forEach((card) => {
      const matchesQuery = card.dataset.make.toLowerCase().includes(query);
      const matchesType = type === "all" || card.dataset.type === type;
      const matchesBudget = Number(card.dataset.price) <= budget;
      const show = matchesQuery && matchesType && matchesBudget;
      card.hidden = !show;
      if (show) visible++;
    });
    count.textContent = `Showing ${visible} vehicle${visible === 1 ? "" : "s"}`;
    empty.hidden = visible !== 0;
    $("#car-grid").hidden = visible === 0;
  }
  filterButtons.forEach((button) =>
    button.addEventListener("click", () => {
      activeType = button.dataset.filter;
      typeSelect.value = "all";
      filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      filterInventory();
    }),
  );
  $("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    activeType = "all";
    filterButtons.forEach((item) => {
      const selected = item.dataset.filter === "all";
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    filterInventory();
    $("#inventory").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  [queryInput, typeSelect, budgetSelect].forEach((input) =>
    input.addEventListener("change", () => {
      activeType = "all";
      filterButtons.forEach((item) => {
        const selected = item.dataset.filter === "all";
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      filterInventory();
    }),
  );
  $("#reset-search").addEventListener("click", () => {
    queryInput.value = "";
    typeSelect.value = "all";
    budgetSelect.value = "all";
    activeType = "all";
    filterButtons.forEach((item) => {
      const selected = item.dataset.filter === "all";
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    filterInventory();
  });

  // Save/favourite buttons
  $$(".save-car").forEach((button) =>
    button.addEventListener("click", () => {
      const saved = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!saved));
      button.textContent = saved ? "♡" : "♥";
      showToast(
        saved
          ? "Removed from your saved vehicles."
          : "Vehicle saved to your favourites.",
      );
    }),
  );

  // Vehicle cards prefill the enquiry form
  $$("[data-car]").forEach((button) =>
    button.addEventListener("click", () => {
      const interest = $('select[name="interest"]');
      interest.value = "Buying a vehicle";
      const message = $('textarea[name="message"]');
      message.value = `I'm interested in the ${button.dataset.car}. Please share more details.`;
      $("#contact").scrollIntoView({ behavior: "smooth" });
      setTimeout(
        () => $('input[name="firstName"]').focus({ preventScroll: true }),
        500,
      );
    }),
  );

  // Review carousel: native horizontal scroll, keyboard accessible buttons
  const reviewTrack = $("#review-track");
  let reviewIndex = 0;
  function moveReviews(direction) {
    const items = $$(".review-card", reviewTrack);
    const maxIndex = Math.max(
      0,
      items.length - (window.innerWidth <= 760 ? 1 : 3),
    );
    reviewIndex = Math.max(0, Math.min(maxIndex, reviewIndex + direction));
    const itemWidth =
      items[0].getBoundingClientRect().width +
      (window.innerWidth <= 760 ? 14 : 20);
    reviewTrack.style.transform = `translateX(${-reviewIndex * itemWidth}px)`;
    $("#review-prev").disabled = reviewIndex === 0;
    $("#review-next").disabled = reviewIndex === maxIndex;
  }
  $("#review-prev").addEventListener("click", () => moveReviews(-1));
  $("#review-next").addEventListener("click", () => moveReviews(1));
  window.addEventListener("resize", () => {
    reviewIndex = 0;
    reviewTrack.style.transform = "translateX(0)";
    $("#review-prev").disabled = true;
    $("#review-next").disabled = false;
  });
  $("#review-prev").disabled = true;

  // FAQ: keep one answer open at a time
  $$(".faq-list details").forEach((detail) =>
    detail.addEventListener("toggle", () => {
      if (detail.open)
        $$(".faq-list details").forEach((other) => {
          if (other !== detail) other.open = false;
        });
    }),
  );

  // Client-side form validation demo (no backend connected)
  const form = $("#contact-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const requiredFields = $$("[required]", form);
    let valid = true;
    requiredFields.forEach((field) => {
      const fieldValid = field.checkValidity();
      field.setAttribute("aria-invalid", String(!fieldValid));
      if (!fieldValid) valid = false;
    });
    const email = $('input[name="email"]', form);
    if (email.value && !email.checkValidity()) {
      email.setAttribute("aria-invalid", "true");
      valid = false;
    }
    if (!valid) {
      $("#form-status").textContent =
        "Please complete the required fields with valid information.";
      const firstInvalid = $('[aria-invalid="true"]', form);
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    $("#form-status").textContent =
      "Thanks — your details are ready. Connect this form to your email or CRM to receive real enquiries.";
    showToast(
      "Enquiry checked successfully. A website owner still needs to connect form delivery.",
    );
    form.reset();
    $$("[aria-invalid]", form).forEach((field) =>
      field.removeAttribute("aria-invalid"),
    );
  });
  $$("input,select,textarea", form).forEach((field) =>
    field.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid"))
        field.removeAttribute("aria-invalid");
    }),
  );

  $("#year").textContent = new Date().getFullYear();
})();
