function createImageGallery(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const images = Array.from(container.querySelectorAll(".gallery-img"));
  const prevBtn = container.querySelector(".gallery-left-arrow");
  const nextBtn = container.querySelector(".gallery-right-arrow");
  const galleryIndexEl = container.querySelector("#gallery-index");

  if (!images.length || !prevBtn || !nextBtn) return;

  // Determine the initial visible image (fallback to 0)
  let currentIndex = images.findIndex(
    (img) => !img.classList.contains("hidden-img")
  );
  if (currentIndex === -1) currentIndex = 0;

  // Ensure only the current image is visible on init
  images.forEach((img, index) => {
    if (index === currentIndex) {
      img.classList.remove("hidden-img");
    } else {
      img.classList.add("hidden-img");
    }
  });

  function showImage(newIndex) {
    if (newIndex < 0 || newIndex >= images.length) return;
    if (newIndex === currentIndex) return;

    images[currentIndex].classList.add("hidden-img");
    images[newIndex].classList.remove("hidden-img");
    currentIndex = newIndex;
    galleryIndexEl.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  prevBtn.addEventListener("click", () => {
    // Same behavior as your original: stop at the first image
    if (currentIndex > 0) {
      showImage(currentIndex - 1);
    }
  });

  nextBtn.addEventListener("click", () => {
    // Same behavior as your original: stop at the last image
    if (currentIndex < images.length - 1) {
      showImage(currentIndex + 1);
    }
  });
}

// Initialise gallery for your current markup
createImageGallery(".gallery-container");
