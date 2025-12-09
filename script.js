/**
 * ============================================================================
 * CATS AND KITTENS SITTER - MAIN SCRIPT
 * ============================================================================
 *
 * This script handles:
 * - Form submission and validation
 * - Date picker constraints and validation
 * - Navigation menu interactions
 * - Checkbox group management
 * - Image gallery navigation
 * - Expandable content toggles
 */

/**
 * ============================================================================
 * SECTION 1: UTILITY FUNCTIONS
 * ============================================================================
 * Core helper functions used throughout the script
 */

/**
 * Converts a Date object to ISO string format (YYYY-MM-DD)
 * Used for HTML5 date input min/max attributes
 * @param {Date} date - The date to convert
 * @returns {string} Date in YYYY-MM-DD format
 */
const getDateString = (date) => date.toISOString().split("T")[0];

/**
 * Trims leading/trailing whitespace from common text inputs.
 * Keeps UX identical while preventing accidental spaces breaking validation.
 * @param {HTMLFormElement} form - The form being submitted
 */
const sanitizeTextInputs = (form) => {
  const fieldsToTrim = [
    "full-name",
    "email",
    "postcode",
    "how-hear",
    "message",
  ];
  fieldsToTrim.forEach((id) => {
    const el = form.querySelector(`#${id}`);
    if (el && typeof el.value === "string") {
      el.value = el.value.trim();
    }
  });
};

/**
 * Ensures there is a reusable inline status element per form.
 * Used for success/error feedback without modal alerts.
 * @param {HTMLFormElement} form - The form to attach status to
 * @returns {HTMLElement} The status element
 */
const getOrCreateStatusEl = (form) => {
  let statusEl = form.querySelector(".form-status");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.className = "form-status";
    statusEl.setAttribute("role", "status");
    statusEl.style.marginTop = "1em";
    statusEl.style.fontSize = "0.95rem";
    statusEl.style.fontWeight = "600";
    statusEl.style.textAlign = "center";
    form.append(statusEl);
  }
  return statusEl;
};

/**
 * Renders inline status messages near the form submit area.
 * @param {HTMLFormElement} form - Target form
 * @param {string} message - Message to display (empty to clear)
 * @param {"success"|"error"|"info"} type - Visual style hint
 */
const renderFormStatus = (form, message, type = "info") => {
  const statusEl = getOrCreateStatusEl(form);
  statusEl.textContent = message;

  const colorMap = {
    success: "#37c978",
    error: "#ff6b6b",
    info: "#d9d7c7",
  };
  statusEl.style.color = colorMap[type] || colorMap.info;
};

/**
 * Ensures phone number meets UK length (11 digits).
 * @param {HTMLFormElement} form - Target form
 * @returns {boolean} True if the phone number is complete
 */
const isPhoneComplete = (form) => {
  const telInput = form.querySelector("#tel");
  if (!telInput) return true; // If the field is absent, don't block submission
  const digits = telInput.value.replace(/\D+/g, "");
  return digits.length === 11;
};

/**
 * Validates that at least one time slot or "No Preference" is selected.
 * @returns {boolean} True if a selection exists, false otherwise.
 */
const hasTimeSlotSelection = () => {
  const hasSpecificSlot = timeSlots.some((slot) => slot?.checked);
  const hasNone = !!noneCheckbox?.checked;
  return hasSpecificSlot || hasNone;
};

/**
 * ============================================================================
 * SECTION 2: DOM ELEMENT CACHE
 * ============================================================================
 * Cached DOM references to avoid repeated DOM queries
 */

// Navigation elements
const hamburgerBtn = document.getElementById("hamburger");
const hamburgerMenu = document.getElementById("hamburger-menu");

// Form and input elements
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const timeSlotCheckboxes = document.querySelectorAll('input[name="time-slot"]');
const noneCheckbox = document.getElementById("none");

// UI component elements
const readMoreButtons = document.querySelectorAll(".read-more");

// Time slot checkbox references for easier access
const timeSlots = [
  document.getElementById("morning"),
  document.getElementById("afternoon"),
  document.getElementById("evening"),
];

/**
 * ============================================================================
 * SECTION 3: FORM HANDLING & SUBMISSION
 * ============================================================================
 * Manages enquiry form submission to Google Apps Script
 */

/**
 * Handles form submission with loading state feedback
 * Sends data to Google Apps Script for email delivery
 * Shows success/error messages and resets form on completion
 */
document.querySelectorAll("#enquiry-form").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn?.innerText || "Send";

    // Normalize text inputs before validation (prevents trailing-space failures)
    sanitizeTextInputs(form);

    // Clear any previous status message
    renderFormStatus(form, "", "info");

    // Require complete UK phone number (11 digits)
    if (!isPhoneComplete(form)) {
      renderFormStatus(
        form,
        "Please enter your full phone number (11 digits).",
        "error"
      );
      const telInput = form.querySelector("#tel");
      if (telInput) telInput.focus();
      return;
    }

    // Require at least one time slot or "No Preference"
    if (!hasTimeSlotSelection()) {
      renderFormStatus(
        form,
        "Please select at least one preferred time slot or choose No Preference.",
        "error"
      );
      return;
    }

    // Browser validity check (blocks submit if any constraint fails)
    if (!form.reportValidity()) return;

    // Display loading state
    if (submitBtn) {
      submitBtn.innerText = "Sending...";
      submitBtn.disabled = true;
    }

    // Send form data to Google Apps Script endpoint
    fetch(
      "https://script.google.com/macros/s/AKfycbyOEt3e98o0n9UF9hZJAUCtk-R43gZ0tOWo5r0fw9xXZ4t3VnNjDVd0y6RmWx94OTd1Vw/exec",
      {
        method: "POST",
        body: new FormData(form),
      }
    )
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok.");
        renderFormStatus(
          form,
          "Thank you! Your message has been sent.",
          "success"
        );
        form.reset();
      })
      .catch((error) => {
        console.error("Error!", error.message);
        renderFormStatus(
          form,
          "Something went wrong sending your message. Please try again.",
          "error"
        );
      })
      .finally(() => {
        // Restore button to original state
        if (submitBtn) {
          submitBtn.innerText = originalText;
          submitBtn.disabled = false;
        }
      });
  });
});

/**
 * ============================================================================
 * SECTION 4: DATE VALIDATION & CONSTRAINTS
 * ============================================================================
 * Ensures users can only select future dates and valid date ranges
 */

/**
 * Calculate tomorrow's date for minimum date constraints
 * Prevents users from selecting today or past dates
 */
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = getDateString(tomorrow);

// Set minimum date for start date input (prevents past date selection)
if (startDateInput) {
  startDateInput.setAttribute("min", tomorrowStr);

  // When start date changes, update end date constraints
  startDateInput.addEventListener("change", () => {
    const startDate = new Date(startDateInput.value);
    const minEndDate = new Date(startDate);
    minEndDate.setDate(minEndDate.getDate() + 1);
    const minEndDateStr = getDateString(minEndDate);

    // End date must be at least 1 day after start date
    endDateInput?.setAttribute("min", minEndDateStr);

    // Clear end date if it's now before the new minimum
    if (endDateInput?.value && new Date(endDateInput.value) < minEndDate) {
      endDateInput.value = "";
    }
  });
}

// Validate end date on change (prevent past dates)
if (endDateInput) {
  endDateInput.addEventListener("change", () => {
    if (new Date(endDateInput.value) < tomorrow) {
      endDateInput.value = "";
    }
  });
}

// Prevent inputs without a space character for id="full-name"

const fullNameInput = document.getElementById("full-name");
if (fullNameInput) {
  fullNameInput.addEventListener("input", () => {
    if (!fullNameInput.value.includes(" ")) {
      fullNameInput.setCustomValidity(
        "Please enter both your first and last name."
      );
    } else {
      fullNameInput.setCustomValidity("");
    }
  });
}

/**
 * ============================================================================
 * SECTION 5:  FORM NUMBER LENGTH MANAGEMENT
 * ============================================================================
 * Handles insanely long number inputs
 */

/**
 * Ensures that a number >= 99 cannot be entered into id="cat-num" input
 */

const catNumInput = document.getElementById("cat-num");
if (catNumInput) {
  catNumInput.addEventListener("input", () => {
    const value = parseInt(catNumInput.value, 10);
    if (Number.isNaN(value)) return;
    if (value < 1) catNumInput.value = "1";
    if (value >= 99) catNumInput.value = "99";
  });
}

/**
 * Ensures that a number > 3 cannot be entered into id="visits-per-day" input
 */

const visitsPerDayInput = document.getElementById("visits-per-day");
if (visitsPerDayInput) {
  visitsPerDayInput.addEventListener("input", () => {
    const value = parseInt(visitsPerDayInput.value, 10);
    if (Number.isNaN(value)) return;
    if (value < 1) visitsPerDayInput.value = "1";
    if (value > 3) visitsPerDayInput.value = "3";
  });
}

/**
 * Ensures phone number input is 12 characters and includes a space after first 5 characters (UK format) - id="tel"
 *
 */

const phoneInput = document.getElementById("tel");
if (phoneInput) {
  phoneInput.addEventListener("input", () => {
    // Keep digits-only string, then format with a single space after 5 chars (UK style)
    let digits = phoneInput.value.replace(/\D+/g, "");
    if (digits.length > 11) digits = digits.slice(0, 11);

    if (digits.length > 5) {
      phoneInput.value = `${digits.slice(0, 5)} ${digits.slice(5)}`;
    } else {
      phoneInput.value = digits;
    }

    // Set validity so submit can surface inline error when incomplete
    if (digits.length === 0) {
      phoneInput.setCustomValidity("");
    } else if (digits.length < 11) {
      phoneInput.setCustomValidity(
        "Please enter your full phone number (11 digits)."
      );
    } else {
      phoneInput.setCustomValidity("");
    }
  });
}

/**
 * Adds "@gmail.com" suffix if user types "@" at the end of the email input - id="email"
 */

const emailInput = document.getElementById("email");
if (emailInput) {
  emailInput.addEventListener("input", () => {
    const value = emailInput.value.trim();
    if (value.endsWith("@")) {
      emailInput.value = `${value}gmail.com`;
      return;
    }

    // Prevent accidental trailing spaces which fail native email validation
    emailInput.value = value;
  });
}

// Ensures postcode is uppercase, 8 characters total, with 1 being a space character between each 3 characters - id="postcode"

const postcodeInput = document.getElementById("postcode");

if (postcodeInput) {
  postcodeInput.addEventListener("input", () => {
    // 1. Remove all spaces and convert to uppercase to get the "raw" value
    let rawValue = postcodeInput.value.toUpperCase().replace(/\s+/g, "");

    // 2. Limit to 7 characters (the maximum length of a raw UK postcode without space)
    if (rawValue.length > 7) {
      rawValue = rawValue.slice(0, 7);
    }

    // 3. If the length is 5, 6, or 7, insert the space before the last 3 characters
    if (rawValue.length > 4) {
      const splitIndex = rawValue.length - 3;
      postcodeInput.value =
        rawValue.slice(0, splitIndex) + " " + rawValue.slice(splitIndex);
    } else {
      // If less than 5 characters, just show the raw value
      postcodeInput.value = rawValue;
    }
  });
}

/**
 * ============================================================================
 * SECTION 6: CHECKBOX MANAGEMENT
 * ============================================================================
 * Handles mutually exclusive checkbox groups for form fields
 */

/**
 * Time slot selection with "No Preference" fallback
 * - Selecting any time slot unchecks "No Preference"
 * - Selecting all three time slots automatically switches to "No Preference"
 * - Selecting "No Preference" clears all time slot selections
 */

document.querySelectorAll(".only-one").forEach((checkbox) => {
  checkbox.addEventListener("change", function () {
    if (this.checked) {
      // Uncheck all other checkboxes in the group
      document.querySelectorAll(".only-one").forEach((cb) => {
        if (cb !== this) cb.checked = false;
      });
    }
  });
});

timeSlotCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", function () {
    // Clear "No Preference" if selecting a specific time slot
    if (this.checked && this.id !== "none") {
      noneCheckbox.checked = false;
    }

    // Switch to "No Preference" if all time slots are selected
    if (timeSlots.every((slot) => slot.checked)) {
      timeSlots.forEach((slot) => (slot.checked = false));
      noneCheckbox.checked = true;
    }
  });
});

// Handle "No Preference" checkbox selection
noneCheckbox.addEventListener("change", function () {
  if (this.checked) {
    // Clear all time slot selections when "No Preference" is chosen
    timeSlots.forEach((slot) => (slot.checked = false));
  }
});

/**
 * ============================================================================
 * SECTION 7: NAVIGATION & UI INTERACTIONS
 * ============================================================================
 * Handles menu toggles and expandable content
 */

/**
 * Mobile hamburger menu toggle
 * Shows/hides navigation menu on small screens
 */
if (hamburgerBtn && hamburgerMenu) {
  hamburgerBtn.addEventListener("click", () => {
    hamburgerMenu.classList.toggle("display-none-hamburger");
  });
}

/**
 * Read more button toggle
 * Hides button when clicked to reveal additional content
 */
readMoreButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.style.display = "none";
  });
});

/**
 * ============================================================================
 * SECTION 8: IMAGE GALLERY
 * ============================================================================
 * Interactive carousel for displaying cat client photos
 */

/**
 * Creates and initializes an image gallery carousel
 * Features:
 * - Navigation between images with prev/next buttons
 * - Display counter (e.g., "1 / 7")
 * - Image captions with cat names
 *
 * @param {string} containerSelector - CSS selector for gallery container
 */
function createImageGallery(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Gallery element references
  const images = Array.from(container.querySelectorAll(".gallery-img"));
  const prevBtn = container.querySelector(".gallery-left-arrow");
  const nextBtn = container.querySelector(".gallery-right-arrow");
  const galleryIndexEl = container.querySelector("#gallery-index");
  const galleryCaption = container.querySelector(".gallery-caption");

  // Cat names for image captions (must match image count)
  const catNames = [
    "Oliver",
    "Zizi",
    "Nancy",
    "Sophia",
    "Mr Onions",
    "DaFu",
    "Bertie",
  ];

  // Exit if required elements are missing
  if (!images.length || !prevBtn || !nextBtn) return;

  // Determine initial visible image (default to first)
  let currentIndex = Math.max(
    images.findIndex((img) => !img.classList.contains("hidden-img")),
    0
  );

  /**
   * Initialize gallery visibility state
   * Show current image, hide all others
   */
  images.forEach((img, index) => {
    img.classList.toggle("hidden-img", index !== currentIndex);
  });

  /**
   * Updates the gallery caption with the current cat's name
   * @param {number} [index=currentIndex] - Image index to caption
   */
  const updateCaption = (index = currentIndex) => {
    if (galleryCaption) {
      galleryCaption.textContent = `Meet ${catNames[index] ?? ""}`;
    }
  };

  /**
   * Transitions to a new image in the gallery
   * Updates visibility, counter, and caption
   * @param {number} newIndex - Index of image to display
   */
  const showImage = (newIndex) => {
    // Validate index and prevent redundant updates
    if (newIndex < 0 || newIndex >= images.length || newIndex === currentIndex)
      return;

    // Hide current image, show new image
    images[currentIndex].classList.add("hidden-img");
    images[newIndex].classList.remove("hidden-img");
    currentIndex = newIndex;

    // Update display counter
    galleryIndexEl.textContent = `${currentIndex + 1} / ${images.length}`;

    // Update caption
    updateCaption();
  };

  // Initialize caption display
  updateCaption();

  // Attach navigation event listeners
  prevBtn.addEventListener(
    "click",
    () => currentIndex > 0 && showImage(currentIndex - 1)
  );
  nextBtn.addEventListener(
    "click",
    () => currentIndex < images.length - 1 && showImage(currentIndex + 1)
  );
}

// Initialize gallery on page load
createImageGallery(".gallery-container");
