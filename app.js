const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

let allProducts = [];

// const filters = {
//     search: "",
//     minPrice: 0,
//     maxPrice: Infinity,
//     minRating: 0,
//     categories: []
// };

// const filters = {
//     search:    "",
//     minPrice:  "",
//     maxPrice:  "",
//     minRating: 0,
//     category:  ""   
// };

const filters = {
    search:     "",
    minPrice:   "",
    maxPrice:   "",
    minRating:  0,
    categories: []    // back to array for multiple selection
};


let currentPage  = 1;
let isLoading    = false;
let hasMorePages = false;


function showToast(message, type = "info") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icons = { success: "✓", error: "✕", info: "→" };
    toast.innerHTML = `<span>${icons[type] || "→"}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastOut 0.3s ease both";
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}


function parseJwt(token) {
    return JSON.parse(atob(token.split('.')[1]));
}

const decoded = parseJwt(token);
const userId  = decoded.id;

const navActions = document.getElementById("navActions");
if (navActions) {
    if (decoded.role === "admin") {
        const adminBtn = document.createElement("button");
        adminBtn.className = "nav-btn nav-btn-admin";
        adminBtn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Admin`;
        adminBtn.addEventListener("click", () => { window.location.href = "admin.html"; });
        navActions.appendChild(adminBtn);
    }

    const ordersBtn = document.createElement("button");
    ordersBtn.className = "nav-btn";
    ordersBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
        </svg>
        Orders`;
    ordersBtn.addEventListener("click", () => { window.location.href = "orders.html"; });
    navActions.appendChild(ordersBtn);

    const logoutBtn = document.createElement("button");
    logoutBtn.className = "nav-btn nav-btn-danger";
    logoutBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout`;
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
    });
    navActions.appendChild(logoutBtn);
}

/* ─── FILTERS ─── */
// function applyFilters() {
//     let filtered = [...allProducts];

//     if (filters.search) {
//         filtered = filtered.filter(p =>
//             p.title.toLowerCase().includes(filters.search.toLowerCase()) || 
//             p.description.toLowerCase().includes(filters.search.toLowerCase()) ||
//             p.category.toLowerCase().includes(filters.search.toLowerCase())
//         );
//     }
//     if (filters.minPrice > 0) {
//         filtered = filtered.filter(p => p.price >= filters.minPrice);
//     }
//     if (filters.maxPrice !== Infinity) {
//         filtered = filtered.filter(p => p.price <= filters.maxPrice);
//     }
//     if (filters.minRating > 0) {
//         filtered = filtered.filter(p => p.rating.rate >= filters.minRating);
//     }
//     if (filters.categories.length > 0) {
//         filtered = filtered.filter(p => filters.categories.includes(p.category));
//     }

//     renderProducts(filtered);
// }

function applyFilters() {
    currentPage = 1;        // reset to page 1 on every filter change
    allProducts = [];       // clear existing products
    fetchProducts(1, false);
}

// function buildCategoryCheckboxes() {
//     const categories = [...new Set(allProducts.map(p => p.category))];
//     const container  = document.getElementById("categoryButtons");
//     container.innerHTML = "";

//     categories.forEach(cat => {
//         const label = document.createElement("label");
//         label.className = "category-checkbox-label";
//         label.innerHTML = `<input type="checkbox" value="${cat}" class="category-checkbox" />${cat}`;

//         // label.querySelector("input").addEventListener("change", (e) => {
//         //     if (e.target.checked) {
//         //         filters.categories.push(cat);
//         //     } else {
//         //         filters.categories = filters.categories.filter(c => c !== cat);
//         //     }
//         //     applyFilters();
//         // });

//         label.querySelector("input").addEventListener("change", (e) => {
//             // Uncheck all others first
//             document.querySelectorAll(".category-checkbox")
//                 .forEach(cb => {
//                     if (cb.value !== cat) cb.checked = false;
//                 });

//             // Set single category or clear if unchecked
//             filters.category = e.target.checked ? cat : "";
//             applyFilters();
//         });

//         container.appendChild(label);
//     });
// }

async function buildCategoryCheckboxes() {
    try {
        // Fetch all products just for category list (no pagination)
        const res        = await fetch("http://localhost:3000/products?limit=1000");
        const data       = await res.json();
        const categories = [...new Set(data.products.map(p => p.category))];

        const container  = document.getElementById("categoryButtons");
        container.innerHTML = "";

        categories.forEach(cat => {
            const label       = document.createElement("label");
            label.className   = "category-checkbox-label";
            label.innerHTML   = `
                <input type="checkbox" value="${cat}" 
                       class="category-checkbox" />${cat}
            `;

            // label.querySelector("input").addEventListener("change", (e) => {
            //     document.querySelectorAll(".category-checkbox")
            //         .forEach(cb => {
            //             if (cb.value !== cat) cb.checked = false;
            //         });
            //     filters.category = e.target.checked ? cat : "";
            //     applyFilters();
            // });

            label.querySelector("input").addEventListener("change", (e) => {
                if (e.target.checked) {
                    filters.categories.push(cat);
                } else {
                    filters.categories = filters.categories.filter(c => c !== cat);
                }
                applyFilters();
            });

            container.appendChild(label);
        });
    } catch (err) {
        console.log("Could not load categories");
    }
}


function setupFilterListeners() {
    // document.getElementById("searchInput").addEventListener("input", (e) => {
    //     filters.search = e.target.value.trim();
    //     applyFilters();
    // });

    const searchInput = document.getElementById("searchInput");
    const searchClear = document.getElementById("searchClear");

    // searchInput.addEventListener("input", (e) => {
    //     filters.search = e.target.value.trim();
    //     searchClear.style.display = filters.search ? "flex" : "none";
    //     applyFilters();
    // });

    let searchDebounceTimer = null;

    searchInput.addEventListener("input", (e) => {
        filters.search = e.target.value.trim();
        searchClear.style.display = filters.search ? "flex" : "none";

        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            applyFilters();
        }, 300);
    });

    searchClear.addEventListener("click", () => {
        searchInput.value = "";
        filters.search = "";
        searchClear.style.display = "none";
        searchInput.focus();
        applyFilters();
    });
    document.getElementById("minPrice").addEventListener("input", (e) => {
        filters.minPrice = Number(e.target.value) || 0;
        applyFilters();
    });
    document.getElementById("maxPrice").addEventListener("input", (e) => {
        filters.maxPrice = Number(e.target.value) || Infinity;
        applyFilters();
    });
    document.getElementById("minRating").addEventListener("change", (e) => {
        filters.minRating = Number(e.target.value);
        applyFilters();
    });
    // document.getElementById("clearFilters").addEventListener("click", () => {
    //     filters.search = "";
    //     filters.minPrice = 0;
    //     filters.maxPrice = Infinity;
    //     filters.minRating = 0;
    //     filters.categories = [];

    //     document.getElementById("searchInput").value = "";
    //     document.getElementById("searchClear").style.display = "none";
    //     document.getElementById("minPrice").value = "";
    //     document.getElementById("maxPrice").value = "";
    //     document.getElementById("minRating").value = "0";
    //     document.querySelectorAll(".category-checkbox").forEach(cb => cb.checked = false);

    //     applyFilters();
    // });
        document.getElementById("clearFilters").addEventListener("click", () => {
            filters.search    = "";
            filters.minPrice  = "";
            filters.maxPrice  = "";
            filters.minRating = 0;
            filters.categories = [];

            document.getElementById("searchInput").value  = "";
            document.getElementById("searchClear").style.display = "none";
            document.getElementById("minPrice").value     = "";
            document.getElementById("maxPrice").value     = "";
            document.getElementById("minRating").value    = "0";
            document.querySelectorAll(".category-checkbox")
                .forEach(cb => cb.checked = false);

            applyFilters();
        });
}

/* ─── PRODUCT RENDERING ─── */
const productWrapper = document.getElementById("productWrapper");

function starRating(rate) {
    const full  = Math.round(rate);
    return "★".repeat(full) + "☆".repeat(5 - full);
}

function renderProducts(products) {
    productWrapper.innerHTML = "";

    if (products.length === 0) {
        productWrapper.innerHTML = `<div class="no-results">No products match your filters.</div>`;
        return;
    }

    products.forEach((product, i) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.style.animationDelay = `${Math.min(i * 0.03, 0.3)}s`;

        const outOfStock = !product.inStock || product.stock === 0 || product.status === "out_of_stock";
        const unavailable = product.status === "unavailable";
        const lowStock = product.stock <= 5 && product.stock > 0 && !outOfStock && !unavailable;

        let stockBadge = "";
        if (product.status === "unavailable") {
            stockBadge = `<p class="out-stock-text">Currently Unavailable</p>`;
        } else if (outOfStock) {
            stockBadge = `<p class="out-stock-text">Out of Stock</p>`;
        } else if (lowStock) {
            stockBadge = `<p class="low-stock-text">Only ${product.stock} left!</p>`;
        }

        card.innerHTML = `
            <div class="product-img-wrap">
                <img src="${product.image}" alt="${product.title}" class="product-img" loading="lazy" />
                ${outOfStock || unavailable ? `<div class="product-overlay">${unavailable ? "Unavailable" : "Out of Stock"}</div>` : ""}
                ${lowStock ? `<div class="product-badge">Low Stock</div>` : ""}
            </div>
            <div class="product-body">
                <span class="product-category">${product.category || ""}</span>
                <div class="product-title">${product.title}</div>
                ${!unavailable ? `<div class="product-price">₹${product.price.toFixed(2)}</div>` : ""}
                <div class="rating">
                    <span class="rating-stars">${starRating(product.rating.rate)}</span>
                    <span class="rating-value">${product.rating.rate}</span>
                    <span class="rating-count">(${product.rating.count})</span>
                </div>
                ${stockBadge}
                <button class="add-btn" ${unavailable || outOfStock ? "disabled" : ""}>
                    ${unavailable ? "Unavailable" : outOfStock ? "Out of Stock" : `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Add to Cart`}
                </button>
            </div>
        `;

        const btn = card.querySelector(".add-btn");
        if (!unavailable && !outOfStock) {
            btn.addEventListener("click", async () => {
                btn.disabled = true;
                btn.innerHTML = `<span style="opacity:0.6">Adding…</span>`;
                await cart.addProduct(product);
                renderCart(cart);
                showToast(`${product.title.slice(0, 30)}… added to cart`, "success");
                btn.disabled = false;
                btn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Add to Cart`;
            });
        }

        productWrapper.appendChild(card);
    });
}

function renderLoadMoreButton() {
    // Remove existing button if any
    const existing = document.getElementById("loadMoreBtn");
    if (existing) existing.remove();

    if (!hasMorePages) return;  // no more pages, no button needed

    const btn = document.createElement("button");
    btn.id        = "loadMoreBtn";
    btn.innerHTML = `
        Load More
        <svg width="14" height="14" viewBox="0 0 24 24" 
             fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
        </svg>
    `;
    btn.style.cssText = `
        grid-column: 1 / -1;
        margin: 24px auto 0;
        padding: 12px 36px;
        background: white;
        border: 1.5px solid var(--cream-dark);
        border-radius: var(--radius-pill);
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--ink);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: var(--transition);
    `;

    btn.addEventListener("mouseenter", () => {
        btn.style.background    = "var(--ink)";
        btn.style.color         = "var(--cream)";
        btn.style.borderColor   = "var(--ink)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.background    = "white";
        btn.style.color         = "var(--ink)";
        btn.style.borderColor   = "var(--cream-dark)";
    });

    btn.addEventListener("click", async () => {
        btn.textContent = "Loading…";
        btn.disabled    = true;
        await fetchProducts(currentPage + 1, true);  // append = true
    });

    // Append button INSIDE the product grid
    // grid-column: 1/-1 makes it span full width inside the grid
    productWrapper.appendChild(btn);
}

/* ─── CART CLASS ─── */
// async function fetchProducts() {
//     try {
//         const res = await fetch("http://localhost:3000/products");
//         allProducts = await res.json();
//         renderProducts(allProducts);
//     } catch (err) {
//         console.log("Error fetching products");
//     }
// }

async function fetchProducts(page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;

    // Show skeleton loader on fresh load, not on append
    if (!append) {
        productWrapper.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;
                        padding:60px 20px;color:var(--ink-20);
                        font-size:0.9rem;">
                Loading products…
            </div>
        `;
    }

    // Build query string from current filters
    const params = new URLSearchParams();
    params.set("page",  page);
    params.set("limit", 20);

    if (filters.search)    params.set("search",    filters.search);
    if (filters.minPrice)  params.set("minPrice",  filters.minPrice);
    if (filters.maxPrice)  params.set("maxPrice",  filters.maxPrice);
    if (filters.minRating) params.set("minRating", filters.minRating);
    // if (filters.category)  params.set("category",  filters.category);

    if (filters.categories.length > 0) {
        params.set("categories", filters.categories.join(","));
    }

    try {
        const res  = await fetch(`http://localhost:3000/products?${params}`);
        const data = await res.json();

        // data.products = current page results
        // data.hasMore  = whether more pages exist
        allProducts  = append
            ? [...allProducts, ...data.products]   // Load More — add to existing
            : data.products;                        // Fresh load — replace

        hasMorePages = data.hasMore;
        currentPage  = data.currentPage;

        renderProducts(allProducts);
        renderLoadMoreButton();

    } catch (err) {
        productWrapper.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;
                        padding:60px 20px;color:var(--red);
                        font-size:0.9rem;">
                Failed to load products. Please try again.
            </div>
        `;
    } finally {
        isLoading = false;
    }
}

class Cart {
    constructor() {
        this.items    = [];
        this.discount = 0;
    }

    async loadCart() {
        // const res  = await fetch("http://localhost:3000/cart", {
        //     headers: { Authorization: "Bearer " + token }
        // });
        // const data = await res.json();

        // this.items = data.items.map(item => {
        //     const product = allProducts.find(p => p._id.toString() === item.productId.toString());

        const res  = await fetch("http://localhost:3000/cart", {
            headers: { Authorization: "Bearer " + token }
        });
        const data = await res.json();

        // Fetch ALL products for cart matching — not just current page
        let cartProducts = allProducts;
        if (data.items && data.items.length > 0) {
            const prodRes    = await fetch("http://localhost:3000/products?limit=1000");
            const prodData   = await prodRes.json();
            cartProducts     = prodData.products;
        }

        this.items = data.items.map(item => {
            const product = cartProducts.find(p => p._id.toString() === item.productId.toString());


            if (!product) {
                return {
                    _id: item.productId,
                    title: "Product No Longer Available",
                    price: 0, image: "",
                    quantity: item.qty,
                    unavailable: true,
                    unavailableReason: "removed",
                    status: "not_available"
                };
            }

            const unavailable = !product.inStock || product.stock === 0 || product.status !== "active";

            return {
                ...product,
                quantity: item.qty,
                unavailable,
                unavailableReason:
                    product.status === "not_available"   ? "not_available" :
                    product.status === "out_of_stock"    ? "out_of_stock"  : null
            };
        });
    }

    // async addProduct(product) {
    //     await fetch("http://localhost:3000/cart", {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    //         body: JSON.stringify({ productId: product._id, qty: 1 }),
    //     });
    //     await this.loadCart();
    // }

    async addProduct(product) {
        try {
            const response = await fetch("http://localhost:3000/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    productId: product._id,
                    qty: 1
                }),
            });

            const data = await response.json();

               
            if (response.status === 400) {
                alert(data.message);
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            await this.loadCart();

        } catch (err) {
            console.error("Cart Error:", err);
            alert(err.message);
        }
    }



    async decreaseProduct(product) {
        const existing = this.items.find(i => i._id.toString() === product._id.toString());
        if (!existing) return;

        if (existing.quantity > 1) {
            await fetch("http://localhost:3000/cart", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ productId: product._id, qty: existing.quantity - 1 })
            });
        } else {
            await fetch("http://localhost:3000/cart", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ productId: product._id })
            });
        }
        await this.loadCart();
    }

    async deleteProduct(product) {
        await fetch("http://localhost:3000/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ productId: product._id })
        });
        await this.loadCart();
    }

    getTotal() {
        const total          = this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const discountAmount = (total * this.discount) / 100;
        return { total, discount: this.discount, discountAmount, finalAmount: total - discountAmount };
    }
}

const cart        = new Cart();
const cartWrapper = document.getElementById("cartWrapper");

(async () => {
    await fetchProducts(1, false);
    buildCategoryCheckboxes();
    setupFilterListeners();
    await cart.loadCart();
    renderCart(cart);
})();

/* ─── CART RENDERING ─── */
async function renderCart(cart) {
    cartWrapper.innerHTML = "";

    // Header
    const header = document.createElement("div");
    header.className = "cart-header-row";
    const itemCount = cart.items.reduce((a, i) => a + i.quantity, 0);
    header.innerHTML = `
        <div class="cart-header-title">
            <svg style="display:inline;vertical-align:-2px;margin-right:6px" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Your Cart
        </div>
        ${itemCount > 0 ? `<span class="cart-count-chip">${itemCount}</span>` : ""}
    `;
    cartWrapper.appendChild(header);

    if (!cart.items || cart.items.length === 0) {
        cartWrapper.innerHTML += `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <div class="empty-cart-text">Your cart is empty</div>
                <div style="font-size:0.78rem;color:var(--ink-20);text-align:center;">Add products to get started</div>
            </div>
        `;
        return;
    }

    const scrollEl = document.createElement("div");
    scrollEl.className = "cart-items-scroll";

    cart.items.forEach(item => {
        const unavailable = item.unavailable;

        let overlayText = "";
        if      (item.unavailableReason === "removed")       overlayText = "Not Available";
        else if (item.unavailableReason === "not_available") overlayText = "Unavailable";
        else if (item.unavailableReason === "out_of_stock")  overlayText = "Out of Stock";

        const el = document.createElement("div");
        el.style.position = "relative";
        el.innerHTML = `
            <div class="cart-item ${unavailable ? "not-available" : ""}">
                <img src="${item.image || ''}" class="cart-img" />
                <div class="cart-info">
                    <h4>${item.title}</h4>
                    ${unavailable ? "" : `
                        <div class="cart-qty-controls">
                            <button class="decrease" data-id="${item._id}">−</button>
                            <span>${item.quantity}</span>
                            <button class="increase" data-id="${item._id}">+</button>
                        </div>
                        <div class="cart-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                    `}
                </div>
                <button class="remove-btn" data-id="${item._id}">✕</button>
            </div>
            ${unavailable ? `<div class="overlay-text">${overlayText}</div>` : ""}
        `;
        scrollEl.appendChild(el);
    });

    cartWrapper.appendChild(scrollEl);

    // Summary
    const totals  = cart.getTotal();
    const summary = document.createElement("div");
    summary.className = "cart-summary";
    summary.innerHTML = `
        <div class="cart-summary-row">
            <span>Subtotal</span>
            <span>₹${totals.total.toFixed(2)}</span>
        </div>
        ${totals.discount > 0 ? `
        <div class="cart-summary-row" style="color:var(--sage)">
            <span>Discount (${totals.discount}%)</span>
            <span>−₹${totals.discountAmount.toFixed(2)}</span>
        </div>` : ""}
        <div class="cart-summary-row total">
            <span>Total</span>
            <span>₹${totals.finalAmount.toFixed(2)}</span>
        </div>
    `;
    cartWrapper.appendChild(summary);

    const hasUnavailable = cart.items.some(i => i.unavailable);
    const checkoutBtn    = document.createElement("button");
    checkoutBtn.className = "checkout-btn";

    if (hasUnavailable) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = "Remove unavailable items first";
    } else {
        checkoutBtn.innerHTML = `
            Proceed to Checkout
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
        `;
        checkoutBtn.addEventListener("click", () => { window.location.href = "checkout.html"; });
    }

    cartWrapper.appendChild(checkoutBtn);
}

/* ─── CART EVENTS ─── */
cartWrapper.addEventListener("click", async (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const id      = button.dataset.id;
    if (!id) return;
    const product = cart.items.find(i => i._id.toString() === id.toString());
    if (!product) return;

    button.disabled = true;

    if (button.classList.contains("increase"))   await cart.addProduct(product);
    if (button.classList.contains("decrease"))   await cart.decreaseProduct(product);
    if (button.classList.contains("remove-btn")) {
        await cart.deleteProduct(product);
        showToast("Item removed from cart", "info");
    }

    renderCart(cart);
});