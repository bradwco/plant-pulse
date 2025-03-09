
if (window.location.pathname === "/home"){
    document.querySelectorAll(".drop-zone__input").forEach((inputElement) => {
        const dropZoneElement = inputElement.closest(".drop-zone");
      
        dropZoneElement.addEventListener("click", (e) => {
          inputElement.click();
        });
      
        inputElement.addEventListener("change", (e) => {
          if (inputElement.files.length) {
            updateThumbnail(dropZoneElement, inputElement.files[0]);
          }
        });
      
        dropZoneElement.addEventListener("dragover", (e) => {
          e.preventDefault();
          dropZoneElement.classList.add("drop-zone--over");
        });
      
        ["dragleave", "dragend"].forEach((type) => {
          dropZoneElement.addEventListener(type, (e) => {
            dropZoneElement.classList.remove("drop-zone--over");
          });
        });
      
        dropZoneElement.addEventListener("drop", (e) => {
          e.preventDefault();
      
          if (e.dataTransfer.files.length) {
            inputElement.files = e.dataTransfer.files;
            updateThumbnail(dropZoneElement, e.dataTransfer.files[0]);
          }
      
          dropZoneElement.classList.remove("drop-zone--over");
        });
      });
      
      /**
       * Updates the thumbnail on a drop zone element.
       *
       * @param {HTMLElement} dropZoneElement
       * @param {File} file
       */
      function updateThumbnail(dropZoneElement, file) {
        console.log("File selected:", file); // Debugging log
        let thumbnailElement = dropZoneElement.querySelector(".drop-zone__thumb");
      
        // Remove the prompt text if it exists
        if (dropZoneElement.querySelector(".drop-zone__prompt")) {
          dropZoneElement.querySelector(".drop-zone__prompt").remove();
        }
      
        // Create a thumbnail container if not present
        if (!thumbnailElement) {
          thumbnailElement = document.createElement("div");
          thumbnailElement.classList.add("drop-zone__thumb");
          dropZoneElement.appendChild(thumbnailElement);
        }
      
        // Display the file name as data-label
        thumbnailElement.dataset.label = file.name;
      
        // Check if the file is an image
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
      
          reader.readAsDataURL(file);
          reader.onload = () => {
            console.log("Image loaded:", reader.result); // Debugging log
            thumbnailElement.style.backgroundImage = `url('${reader.result}')`;
          };
        } else {
          thumbnailElement.style.backgroundImage = null;
        }
      }
      
      document.getElementById("fileInput").addEventListener("change", function () {
          console.log("File input changed", this.files);
        });
}
  
