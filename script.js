// DOM Elements
const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("file-input");
const imagesPreview = document.getElementById("images-preview");
const resizeBtn = document.getElementById("resize-btn");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const qualityInput = document.getElementById("quality");
const qualityValue = document.getElementById("quality-value");
const formatSelect = document.getElementById("format");
const maintainAspect = document.getElementById("maintain-aspect");
const progressContainer = document.getElementById("progress-container");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progress-text");
const outputContainer = document.getElementById("output-container");
const outputImages = document.getElementById("output-images");
const downloadAllBtn = document.getElementById("download-all");
const presetBtns = document.querySelectorAll(".preset-btn");

// Variables
let selectedFiles = [];
let resizedImages = [];

// Event Listeners
dropArea.addEventListener("click", () => fileInput.click());

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

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    widthInput.value = btn.dataset.width;
    heightInput.value = btn.dataset.height;
  });
});

// Maintain aspect ratio functionality
let originalWidth, originalHeight;
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

  // Update button text
  resizeBtn.textContent = `Resize ${selectedFiles.length} Image${
    selectedFiles.length !== 1 ? "s" : ""
  }`;
  resizeBtn.disabled = selectedFiles.length === 0;

  // Get dimensions of the first image for aspect ratio
  if (selectedFiles.length > 0 && !originalWidth) {
    const img = new Image();
    img.onload = () => {
      originalWidth = img.width;
      originalHeight = img.height;

      // Update height based on width to maintain aspect ratio
      if (maintainAspect.checked) {
        const ratio = originalHeight / originalWidth;
        heightInput.value = Math.round(widthInput.value * ratio);
      }
    };
    img.src = URL.createObjectURL(selectedFiles[0]);
  }
}

function updateImagesPreview() {
  imagesPreview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;

      img.onload = () => {
        const imageItem = document.createElement("div");
        imageItem.className = "image-item";

        imageItem.appendChild(img);

        const imageInfo = document.createElement("div");
        imageInfo.className = "image-info";
        imageInfo.textContent = `${img.naturalWidth}×${img.naturalHeight}`;

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => {
          selectedFiles.splice(index, 1);
          updateImagesPreview();
          resizeBtn.textContent = `Resize ${selectedFiles.length} Image${
            selectedFiles.length !== 1 ? "s" : ""
          }`;
          resizeBtn.disabled = selectedFiles.length === 0;
        });

        imageItem.appendChild(imageInfo);
        imageItem.appendChild(removeBtn);
        imagesPreview.appendChild(imageItem);
      };
    };

    reader.readAsDataURL(file);
  });
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

  // Show progress
  progressContainer.style.display = "block";
  progress.style.width = "0%";
  progressText.textContent = "0%";

  // Disable resize button
  resizeBtn.disabled = true;
  resizeBtn.textContent = "Processing...";

  // Process each image
  for (let i = 0; i < selectedFiles.length; i++) {
    await resizeImage(selectedFiles[i], width, height, quality, format);

    // Update progress
    const progressPercent = Math.round(((i + 1) / selectedFiles.length) * 100);
    progress.style.width = `${progressPercent}%`;
    progressText.textContent = `${progressPercent}%`;
  }

  // Show output container
  outputContainer.style.display = "block";
  downloadAllBtn.style.display = "block";

  // Re-enable resize button
  resizeBtn.disabled = false;
  resizeBtn.textContent = `Resize ${selectedFiles.length} Image${
    selectedFiles.length !== 1 ? "s" : ""
  }`;
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

        // Handle aspect ratio if needed
        if (maintainAspect.checked) {
          const imgRatio = img.height / img.width;
          const targetRatio = height / width;

          if (imgRatio > targetRatio) {
            // Height is the constraining dimension
            newWidth = Math.round(height / imgRatio);
          } else {
            // Width is the constraining dimension
            newHeight = Math.round(width * imgRatio);
          }
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw image on canvas
        const ctx = canvas.getContext("2d");
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
        downloadBtn.className = "download-btn";
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
  // Create a zip file if more than one image
  if (resizedImages.length > 1) {
    // Since we can't use external libraries, we'll offer individual downloads
    // In a real app, you'd use JSZip or similar to package them
    if (
      confirm(
        `Do you want to download all ${resizedImages.length} images individually?`
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
