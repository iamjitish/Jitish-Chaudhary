|document.addEventListener("DOMContentLoaded", () => {

    // Custom Header Initialize
    document.querySelectorAll(".custom-header").forEach((header) => {

      // Query Selector Elements 
      const toggle = header.querySelector(".custom-header__toggle");
      const content = header.querySelector(".custom-header__mobile-content");
      const icon = header.querySelector(".custom-header__toggle-icon");

      if (!toggle || !content || !icon) return;

      // mobile Toogle
      toggle.addEventListener("click", () => {

        //  Dropdown toggle
        content.classList.toggle("active");

        // Change Menu Icon 
        if (content.classList.contains("active")) {

          // Show Close Icon
          icon.src = icon.dataset.close;
          icon.style.width = "13px";
          icon.style.height = "13px";

        } else {

          // Show Hamburger Icon
          icon.src = icon.dataset.open;
          icon.style.width = "18px";
          icon.style.height = "18px";

        }
      });
    });
  });