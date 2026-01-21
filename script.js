// DOM Elements
const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("file-input");
const browseLink = document.querySelector(".browse-link");
const imagesPreview = document.getElementById("images-preview");
const resizeBtn = document.getElementById("resize-btn");
const btnCount = document.querySelector(".btn-count");
const btnText = document.querySelector(".btn-text");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const qualityInput = document.getElementById("quality");
const qualityValue = document.getElementById("quality-value");
const formatSelect = document.getElementById("format");
const maintainAspect = document.getElementById("maintain-aspect");
const aspectLinkIcon = document.getElementById("aspect-link-icon");
const progressContainer = document.getElementById("progress-container");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progress-text");
const outputContainer = document.getElementById("output-container");
const outputImages = document.getElementById("output-images");
const downloadAllBtn = document.getElementById("download-all");
const presetChips = document.querySelectorAll(".preset-chip");
const emptyState = document.getElementById("empty-state");
const clearAllBtn = document.getElementById("clear-all-btn");
const imageCountBadge = document.getElementById("image-count");

// Variables
let selectedFiles = [];
let resizedImages = [];
let originalWidth, originalHeight;

// Event Listeners
dropArea.addEventListener("click", () => fileInput.click());
browseLink.addEventListener("click", (e) => {
  e.stopPropagation(); // Prevent triggering parent click
  fileInput.click();
});

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("highlight");
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("highlight");
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("highlight");

  if (e.dataTransfer.files.length) {
    handleFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    handleFiles(fileInput.files);
  }
});

qualityInput.addEventListener("input", () => {
  qualityValue.textContent = `${qualityInput.value}%`;
});

resizeBtn.addEventListener("click", processImages);

downloadAllBtn.addEventListener("click", downloadAll);

clearAllBtn.addEventListener("click", clearAllImages);

presetChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    // Remove active class from all
    presetChips.forEach(c => c.style.background = "");
    // Add active style to current
    chip.style.background = "#e5e7eb";
    
    widthInput.value = chip.dataset.width;
    heightInput.value = chip.dataset.height;
    
    // Update aspect ratio basis if we switch to manual afterwards
    if (selectedFiles.length > 0) {
      // Don't overwrite original dimensions, just let the user know they picked a preset
    }
  });
});

// Maintain aspect ratio functionality
maintainAspect.addEventListener("change", () => {
  if (maintainAspect.checked) {
    aspectLinkIcon.style.opacity = "1";
    aspectLinkIcon.title = "Aspect ratio locked";
    
    // Recalculate height based on current width immediately
    if (originalWidth && originalHeight) {
      const ratio = originalHeight / originalWidth;
      heightInput.value = Math.round(widthInput.value * ratio);
    }
  } else {
    aspectLinkIcon.style.opacity = "0.3";
    aspectLinkIcon.title = "Aspect ratio unlocked";
  }
});

widthInput.addEventListener("input", () => {
  if (maintainAspect.checked && originalWidth && originalHeight) {
    const ratio = originalHeight / originalWidth;
    heightInput.value = Math.round(widthInput.value * ratio);
  }
});

heightInput.addEventListener("input", () => {
  if (maintainAspect.checked && originalWidth && originalHeight) {
    const ratio = originalWidth / originalHeight;
    widthInput.value = Math.round(heightInput.value * ratio);
  }
});

// Functions
function handleFiles(files) {
  // Filter only image files
  const imageFiles = Array.from(files).filter((file) =>
    file.type.startsWith("image/")
  );

  if (imageFiles.length === 0) {
    alert("Please select image files only.");
    return;
  }

  // Add to selected files array
  selectedFiles = [...selectedFiles, ...imageFiles];

  // Update UI
  updateImagesPreview();
  updateUIState();

  // Get dimensions of the first image for aspect ratio
  if (selectedFiles.length > 0 && (!originalWidth || selectedFiles.length === imageFiles.length)) {
    // Only set original dimensions if it's the first batch or we reset
    const img = new Image();
    img.onload = () => {
      // Only set if user hasn't typed something custom yet (default is 1200)
      if (widthInput.value === "1200" && heightInput.value === "1200") {
         originalWidth = img.width;
         originalHeight = img.height;
         widthInput.value = img.width;
         heightInput.value = img.height;
      } else {
         // Just store them for ratio calculations later
         originalWidth = img.width;
         originalHeight = img.height;
      }
    };
    img.src = URL.createObjectURL(selectedFiles[0]);
  }
}

function updateImagesPreview() {
  imagesPreview.innerHTML = "";

  if (selectedFiles.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  
  emptyState.classList.add("hidden");

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;

      img.onload = () => {
        const imageItem = document.createElement("div");
        imageItem.className = "image-item";

        // Create container for img
        imageItem.appendChild(img);

        // Overlay with info
        const overlay = document.createElement("div");
        overlay.className = "image-overlay";
        
        const meta = document.createElement("div");
        meta.className = "image-meta";
        meta.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
        
        overlay.appendChild(meta);
        imageItem.appendChild(overlay);

        // Remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        removeBtn.title = "Remove image";
        
        removeBtn.addEventListener("click", () => {
          selectedFiles.splice(index, 1);
          updateImagesPreview();
          updateUIState();
        });

        imageItem.appendChild(removeBtn);
        imagesPreview.appendChild(imageItem);
      };
    };

    reader.readAsDataURL(file);
  });
}

function updateUIState() {
  const count = selectedFiles.length;
  
  // Badge updates
  if (count > 0) {
    btnCount.textContent = count;
    btnCount.classList.remove("hidden");
    imageCountBadge.textContent = count;
    imageCountBadge.classList.remove("hidden");
    clearAllBtn.classList.remove("hidden");
    resizeBtn.disabled = false;
  } else {
    btnCount.classList.add("hidden");
    imageCountBadge.classList.add("hidden");
    clearAllBtn.classList.add("hidden");
    resizeBtn.disabled = true;
  }
  
  // Hide output if we change selection
  if (outputContainer.style.display === "block") {
     // Optional: hide output when modifying selection?
     // keeping it visible is fine too, but let's reset progress
     progressContainer.style.display = "none";
  }
}

function clearAllImages() {
  selectedFiles = [];
  resizedImages = [];
  fileInput.value = ""; // Reset input
  updateImagesPreview();
  updateUIState();
  outputContainer.style.display = "none";
  progressContainer.style.display = "none";
}

async function processImages() {
  if (selectedFiles.length === 0) return;

  // Reset output
  outputImages.innerHTML = "";
  resizedImages = [];

  // Get settings
  const width = parseInt(widthInput.value);
  const height = parseInt(heightInput.value);
  const quality = parseInt(qualityInput.value) / 100;
  const format = formatSelect.value;

  // UI Updates for processing state
  progressContainer.style.display = "block";
  outputContainer.style.display = "none";
  progress.style.width = "0%";
  progressText.textContent = "0%";
  
  resizeBtn.disabled = true;
  btnText.textContent = "Processing...";
  btnCount.classList.add("hidden");

  // Process each image
  for (let i = 0; i < selectedFiles.length; i++) {
    await resizeImage(selectedFiles[i], width, height, quality, format);

    // Update progress
    const progressPercent = Math.round(((i + 1) / selectedFiles.length) * 100);
    progress.style.width = `${progressPercent}%`;
    progressText.textContent = `${progressPercent}%`;
  }

  // Final UI updates
  progressContainer.style.display = "none"; // Hide progress when done
  outputContainer.style.display = "block";
  
  // Re-enable resize button
  resizeBtn.disabled = false;
  btnText.textContent = "Start Resizing";
  btnCount.classList.remove("hidden");
  
  // Scroll to results
  outputContainer.scrollIntoView({ behavior: 'smooth' });
}

function resizeImage(file, width, height, quality, format) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas
        const canvas = document.createElement("canvas");
        let newWidth = width;
        let newHeight = height;

        // Handle aspect ratio logic specifically for this image
        if (maintainAspect.checked) {
          const imgRatio = img.height / img.width;
          
          // Logic: We want to fit within the box defined by width/height
          // without stretching. 
          
          // However, the inputs act as "target dimensions".
          // If the user entered specific dimensions, we usually respect width
          // and calculate height, OR respect the bounding box.
          
          // Let's implement "Fit within box" logic which is standard
          const targetRatio = height / width;
          
          // Current logic in UI puts values in inputs. 
          // If inputs were calculated by ratio, they are exact.
          // If one input was changed, the other was updated.
          
          // For batch processing of mixed aspect ratios:
          // Usually you define a "Max Width" and "Max Height".
          
          // Let's stick to the user input values as rigid targets
          // BUT re-calculate one dimension if aspect is checked, based on THE IMAGE's ratio
          // utilizing the "width" input as the primary driver if both are present?
          // Actually, standard behavior for "Maintain Aspect Ratio" with inputs usually means:
          // "Resize to Width X, calculate Height automatically" OR 
          // "Resize to fit within X by Y".
          
          // Given the UI updates the inputs dynamically, we can assume the inputs
          // represent the desired target exactly for the *first* image or the specific values entered.
          
          // To be safe for batch (mixed) images:
          // We will use the defined Width as the anchor, and calculate height
          // proportional to THIS image's aspect ratio.
          newHeight = Math.round(width * imgRatio);
          newWidth = width;
          
          // Note: If the user specifically wanted a fixed height, this logic favors width.
          // A more advanced UI would have "Resize by: Width | Height | Longest Side".
          // For simplicity here, we stick to Width as anchor if aspect is maintained.
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw image on canvas
        const ctx = canvas.getContext("2d");
        
        // Better quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Get data URL
        let mimeType;
        switch (format) {
          case "png":
            mimeType = "image/png";
            break;
          case "webp":
            mimeType = "image/webp";
            break;
          default:
            mimeType = "image/jpeg";
        }

        const dataURL = canvas.toDataURL(mimeType, quality);

        // Create output image preview
        const outputImageDiv = document.createElement("div");
        outputImageDiv.className = "output-image";

        const outputImg = document.createElement("img");
        outputImg.src = dataURL;

        const downloadBtn = document.createElement("button");
        downloadBtn.className = "download-mini-btn";
        downloadBtn.textContent = "Download";
        downloadBtn.addEventListener("click", () => {
          downloadImage(dataURL, file.name);
        });

        outputImageDiv.appendChild(outputImg);
        outputImageDiv.appendChild(downloadBtn);
        outputImages.appendChild(outputImageDiv);

        // Add to resized images array
        resizedImages.push({
          dataURL,
          name: file.name,
        });

        resolve();
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

function downloadImage(dataURL, fileName) {
  const extension = formatSelect.value === "jpeg" ? "jpg" : formatSelect.value;
  const originalName =
    fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
  const newFileName = `${originalName}-resized.${extension}`;

  const link = document.createElement("a");
  link.href = dataURL;
  link.download = newFileName;
  link.click();
}

function downloadAll() {
  if (resizedImages.length > 1) {
    if (
      confirm(
        `Download all ${resizedImages.length} images? This will download them individually.`
      )
    ) {
      resizedImages.forEach((img) => {
        downloadImage(img.dataURL, img.name);
      });
    }
  } else if (resizedImages.length === 1) {
    downloadImage(resizedImages[0].dataURL, resizedImages[0].name);
  }
}