document.addEventListener("DOMContentLoaded", () => {

    // Custom Header Initialize
    document.querySelectorAll(".custom-header").forEach((header) => {

      // Query Selector Elements 
      const toggle = header.querySelector(".custom-header__toggle");
      const content = header.querySelector(".custom-header__mobile-content");
      const icon = header.querySelector(".custom-header__toggle-icon");

      if (!toggle || !content || !icon) return;

      // mobile Toogle
      toggle.addEventListener("click", () => {

        // Dropdown toggle
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

  // Hotspot Product — grid popup & add to cart
document.addEventListener("DOMContentLoaded", () => {

    function normalizeOption(value) {
        return String(value || "").trim().toLowerCase();
    }

    function variantMatchesTrigger(variant, triggerColor, triggerSize) {
        if (!variant?.options?.length) return false;
        const opts = variant.options.map(normalizeOption);
        const color = normalizeOption(triggerColor);
        const size = normalizeOption(triggerSize);
        return opts.includes(color) && opts.includes(size);
    }

    async function addLineItemsToCart(items) {
        const response = await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items })
        });
        return response;
    }

    document.querySelectorAll(".vision-gallery").forEach((gallery) => {
        const popup = gallery.querySelector(".vision-popup");
        const overlay = gallery.querySelector(".vision-popup__overlay");
        const closeBtn = gallery.querySelector(".vision-popup__close");
        const image = gallery.querySelector(".popup-image");
        const title = gallery.querySelector(".popup-title");
        const price = gallery.querySelector(".popup-price");
        const description = gallery.querySelector(".popup-description");
        const colorContainer = gallery.querySelector(".popup-colors");
        const sizeSelect = gallery.querySelector(".popup-size");
        const addCartBtn = gallery.querySelector(".popup-cart");
        const messageEl = gallery.querySelector(".popup-cart-message");

        const bonusVariantId = gallery.dataset.hotspotBonusVariantId;
        const triggerColor = gallery.dataset.hotspotTriggerColor || "Black";
        const triggerSize = gallery.dataset.hotspotTriggerSize || "Medium";
        const currencyCode =
            gallery.dataset.currency ||
            (typeof Shopify !== "undefined" && Shopify.currency?.active) ||
            "USD";
        const locale =
            gallery.dataset.locale ||
            (typeof Shopify !== "undefined" && Shopify.locale) ||
            document.documentElement.lang ||
            "en";

        function formatMoney(cents) {
            return new Intl.NumberFormat(locale, {
                style: "currency",
                currency: currencyCode
            }).format(cents / 100);
        }

        if (!popup) return;

        let selectedVariant = null;
        let currentProduct = null;
        let selectedColor = null;
        let selectedSize = "";
        let colorIndex = null;
        let sizeIndex = null;

        gallery.querySelectorAll(".vision-gallery__hotspot").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const handle = btn.dataset.handle;
                if (!handle) return;

                try {
                    const response = await fetch(`/products/${handle}.js`);
                    const product = await response.json();
                    currentProduct = product;
                    openPopup(product);
                } catch (err) {
                    console.error("Product load error:", err);
                }
            });
        });

        function openPopup(product) {
            popup.classList.add("active");
            document.body.classList.add("vision-popup-open");

            image.src = product.featured_image || "";
            image.alt = product.title;
            title.textContent = product.title;
            description.innerHTML = product.description || "";

            price.innerHTML = formatMoney(product.price);

            colorContainer.innerHTML = "";
            sizeSelect.innerHTML = `<option value="">Choose your size</option>`;

            colorIndex = null;
            sizeIndex = null;

            if (Array.isArray(product.options)) {
                product.options.forEach((opt, index) => {
                    const name = (typeof opt === "string" ? opt : (opt.name || "")).toLowerCase().trim();
                    if (name.includes("color") || name.includes("colour") || name.includes("shade")) {
                        colorIndex = index;
                    }
                    if (name.includes("size") || name.includes("fit")) {
                        sizeIndex = index;
                    }
                });
            }

            if ((colorIndex === null || sizeIndex === null) && product.variants?.length) {
                product.options.forEach((_, index) => {
                    const values = product.variants.map((v) => v.options?.[index]).filter(Boolean);
                    const isSizeLike = values.some((v) =>
                        /^(xxs|xs|s|m|l|xl|xxl|xxxl|\d+)$/i.test(String(v).trim())
                    );
                    if (isSizeLike && sizeIndex === null) sizeIndex = index;
                    else if (!isSizeLike && colorIndex === null) colorIndex = index;
                });
            }

            if (colorIndex === null && sizeIndex === null) {
                sizeIndex = 0;
                colorIndex = 1;
            } else if (sizeIndex === null) {
                sizeIndex = 0;
            } else if (colorIndex === null) {
                colorIndex = 1;
            }

            const colors = [];
            const sizes = [];

            product.variants.forEach((v) => {
                if (colorIndex !== null && v.options?.[colorIndex]) {
                    const val = v.options[colorIndex];
                    if (!colors.includes(val)) colors.push(val);
                }
                if (sizeIndex !== null && v.options?.[sizeIndex]) {
                    const val = v.options[sizeIndex];
                    if (!sizes.includes(val)) sizes.push(val);
                }
            });

            selectedColor = colors[0] || null;
            selectedSize = "";

            const colorGroup = gallery.querySelector(".popup-group--color");
            const sizeGroup = gallery.querySelector(".popup-group--size");
            if (colorGroup) colorGroup.style.display = colors.length ? "" : "none";
            if (sizeGroup) sizeGroup.style.display = sizes.length ? "" : "none";

            colors.forEach((color, i) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "popup-color";
                btn.dataset.color = color;
                btn.innerHTML = `
        <span class="popup-color__swatch" style="background:${color.toLowerCase()}"></span>
        <span class="popup-color__text">${color}</span>
    `;
                if (i === 0) btn.classList.add("active");
                colorContainer.appendChild(btn);
            });

            sizes.forEach((size) => {
                const opt = document.createElement("option");
                opt.value = size;
                opt.textContent = size;
                sizeSelect.appendChild(opt);
            });

            function updateVariant() {
                if (!currentProduct) return;

                const variant = currentProduct.variants.find((v) => {
                    let match = true;
                    if (colorIndex !== null && selectedColor) {
                        match = match && v.options[colorIndex] === selectedColor;
                    }
                    if (sizeIndex !== null && selectedSize) {
                        match = match && v.options[sizeIndex] === selectedSize;
                    }
                    return match;
                });

                if (!variant) {
                    selectedVariant = null;
                    return;
                }

                selectedVariant = variant.id;

                price.innerHTML = formatMoney(variant.price);

                if (variant.featured_image) {
                    image.src = variant.featured_image.src;
                }
            }

            colorContainer.querySelectorAll("button").forEach((btn) => {
                btn.addEventListener("click", function () {
                    colorContainer.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
                    this.classList.add("active");
                    selectedColor = this.dataset.color;
                    updateVariant();
                });
            });

            const popupSelect = sizeSelect.closest(".popup-select");
            if (popupSelect) {
                sizeSelect.addEventListener("mousedown", () => popupSelect.classList.add("open"));
                sizeSelect.addEventListener("blur", () => popupSelect.classList.remove("open"));
                sizeSelect.addEventListener("change", () => popupSelect.classList.remove("open"));
            }

            sizeSelect.onchange = function () {
                selectedSize = this.value;
                updateVariant();
            };

            updateVariant();
        }

        function closePopup() {
            popup.classList.remove("active");
            document.body.classList.remove("vision-popup-open");
            selectedVariant = null;
        }

        if (closeBtn) closeBtn.onclick = closePopup;
        if (overlay) overlay.onclick = closePopup;

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && popup.classList.contains("active")) closePopup();
        });

        if (addCartBtn) {
            addCartBtn.addEventListener("click", async () => {
                const needsSize = sizeSelect.options.length > 1;

                if (!selectedVariant || (needsSize && !selectedSize)) {
                    if (messageEl) {
                        messageEl.textContent = needsSize ? "Please select your size" : "Please choose available options";
                        messageEl.className = "popup-cart-message show error";
                    } else {
                        alert("Please select your size");
                    }
                    return;
                }

                const variant = currentProduct?.variants?.find((v) => v.id === selectedVariant);
                const includeBonus =
                    bonusVariantId &&
                    variant &&
                    variantMatchesTrigger(variant, triggerColor, triggerSize) &&
                    String(bonusVariantId) !== String(selectedVariant);

                const items = [{ id: selectedVariant, quantity: 1 }];
                if (includeBonus) {
                    items.push({ id: Number(bonusVariantId), quantity: 1 });
                }

                addCartBtn.disabled = true;
                addCartBtn.style.opacity = "0.7";

                try {
                    const response = await addLineItemsToCart(items);

                    if (response.ok) {
                        if (messageEl) {
                            messageEl.textContent = "Added to cart successfully!";
                            messageEl.className = "popup-cart-message show success";
                        }

                        document.dispatchEvent(new CustomEvent("cart:refresh"));

                        setTimeout(() => {
                            closePopup();
                            if (messageEl) {
                                messageEl.className = "popup-cart-message";
                                messageEl.textContent = "";
                            }
                        }, 1500);
                    } else if (messageEl) {
                        messageEl.textContent = "Could not add to cart. Try again.";
                        messageEl.className = "popup-cart-message show error";
                    }
                } catch (err) {
                    console.error(err);
                    if (messageEl) {
                        messageEl.textContent = "Something went wrong.";
                        messageEl.className = "popup-cart-message show error";
                    }
                } finally {
                    addCartBtn.disabled = false;
                    addCartBtn.style.opacity = "1";
                }
            });
        }
    });
});