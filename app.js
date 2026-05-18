// const isLoggedIn = localStorage.getItem("isLoggedIn");
// const user = localStorage.getItem("user");

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

let allProducts = [];

const filters = {
    search: "",
    minPrice: 0,
    maxPrice: Infinity,
    minRating: 0,
    categories: []     
};

// if (isLoggedIn !== "true" || !user) {
//     window.location.href = "login.html";
// }

const logoutBtn = document.createElement("button");
logoutBtn.classList.add("logout-btn");
logoutBtn.innerText = "Logout";

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    // localStorage.removeItem("isLoggedIn");
    // localStorage.removeItem("user");

    window.location.href = "login.html";
});

document.body.appendChild(logoutBtn);

// const role = localStorage.getItem("role");

// if (role === "admin") {
//     const adminBtn = document.createElement("button");

//     adminBtn.innerText = "Go to Admin Panel";
//     adminBtn.classList.add("admin-btn");

//     adminBtn.addEventListener("click", () => {
//         window.location.href = "admin.html";
//     });

//     document.body.appendChild(adminBtn);
// }

function applyFilters() {
    let filtered = [...allProducts];

    if(filters.search) {
        filtered = filtered.filter(p => p.title.toLowerCase().includes(filters.search.toLowerCase()));
    }
    if(filters.minPrice > 0) {
        filtered = filtered.filter(p => p.price >= filters.minPrice);
    }
    if(filters.maxPrice !== Infinity) {
        filtered = filtered.filter(p => p.price <= filters.maxPrice);
    }
    if(filters.minRating > 0) {
        filtered = filtered.filter(p => p.rating.rate >= filters.minRating);
    }
    if (filters.categories.length > 0) {
        filtered = filtered.filter(p => filters.categories.includes(p.category));
    }
    renderProducts(filtered);

    if(filtered.length === 0) { 
        productWrapper.innerHTML = `<div class="no-results">No products found matching the criteria.</div>`;
    }
}

function buildCategoryCheckboxes() {
    const categories = [...new Set(allProducts.map(p => p.category))];
    const container = document.getElementById("categoryButtons");
    container.innerHTML = "";

    categories.forEach(cat => {
        const label = document.createElement("label");
        label.className = "category-checkbox-label";

        label.innerHTML = `
            <input type="checkbox" value="${cat}" class="category-checkbox" />
            ${cat}
        `;

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
}

function setupFilterListeners() {

    // search — runs on every keystroke
    document.getElementById("searchInput").addEventListener("input", (e) => {
        filters.search = e.target.value.trim();
        applyFilters();
    });

    // min price
    document.getElementById("minPrice").addEventListener("input", (e) => {
        filters.minPrice = Number(e.target.value) || 0;
        applyFilters();
    });

    // max price
    document.getElementById("maxPrice").addEventListener("input", (e) => {
        filters.maxPrice = Number(e.target.value) || Infinity;
        applyFilters();
    });

    // min rating
    document.getElementById("minRating").addEventListener("change", (e) => {
        filters.minRating = Number(e.target.value);
        applyFilters();
    });

    // clear all filters
    document.getElementById("clearFilters").addEventListener("click", () => {
        filters.search = "";
        filters.minPrice = 0;
        filters.maxPrice = Infinity;
        filters.minRating = 0;
        filters.categories = [];

        // reset all UI inputs
        document.getElementById("searchInput").value = "";
        document.getElementById("minPrice").value = "";
        document.getElementById("maxPrice").value = "";
        document.getElementById("minRating").value = "0";
        document.querySelectorAll(".category-checkbox")
            .forEach(cb => cb.checked = false);

        applyFilters();
    });
}


function parseJwt(token) {
    return JSON.parse(atob(token.split('.')[1]));
}

const decoded = parseJwt(token);

if (decoded.role === "admin") {
    const adminBtn = document.createElement("button");

    adminBtn.innerText = "Go to Admin Panel";
    adminBtn.classList.add("admin-btn");

    adminBtn.addEventListener("click", () => {
        window.location.href = "admin.html";
    });

    document.body.appendChild(adminBtn);
}

const ordersBtn = document.createElement("button");
ordersBtn.innerText = "View Orders";
ordersBtn.classList.add("orders-btn");

ordersBtn.addEventListener("click", () => {
    window.location.href = "orders.html";
});

document.body.appendChild(ordersBtn);

// function parseJwt(token) {
//     return JSON.parse(atob(token.split('.')[1]));
// }

//const decoded = parseJwt(token);
const userId = decoded.id;

class Cart {
    constructor() {
        this.items = [];
        this.discount = 0;
    }

    async loadCart() {
        const res = await fetch("http://localhost:3000/cart", {
                        headers: {
                            Authorization: "Bearer " + token
                        }
                    });
        const data = await res.json();

        
        // this.items = data.items.map(item => {
        //     const product = allProducts.find(p => p._id.toString() === item.productId.toString());
        //     if (!product) return null;
        //     return { ...product, quantity: item.qty };
        // }).filter(Boolean); 

        
        this.items = data.items.map(item => {
            const product = allProducts.find(p => p._id.toString() === item.productId.toString());

            if (!product) {
                
                return {
                    _id:         item.productId,
                    title:       "Product No Longer Available",
                    price:       0,
                    image:       "",
                    quantity:    item.qty,
                    unavailable: true   
                };
            }

            return { ...product, quantity: item.qty };
        });
        
    }

    async addProduct(product) {
        await fetch("http://localhost:3000/cart", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ productId: product._id, qty: 1 }),
            
        });
        await this.loadCart();
    }

    async decreaseProduct(product) {
        const existing = this.items.find(i => i._id.toString() === product._id.toString());
        if (!existing) return;

        if (existing.quantity > 1) {
            await fetch("http://localhost:3000/cart", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ productId: product._id, qty: existing.quantity - 1 })
            });
        } else {
            await fetch("http://localhost:3000/cart", {
                method: "DELETE",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ productId: product._id })
            });
        }
        await this.loadCart();
    }

    async deleteProduct(product) {
        await fetch("http://localhost:3000/cart", {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ productId: product._id })
        });
        await this.loadCart();
    }

    getTotal() {
        const total = this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const discountAmount = (total * this.discount) / 100;
        return { total, discount: this.discount, discountAmount, finalAmount: total - discountAmount };
    }
}

const productWrapper = document.getElementById("productWrapper");

async function fetchProducts() {
    try {
        const res = await fetch("http://localhost:3000/products");
        allProducts = await res.json();
        renderProducts(allProducts);
    } catch (err) {
        console.log("Error fetching products");
    }
}



//fetchProducts();

function renderProducts(products){
    productWrapper.innerHTML = "";

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="product-img" />
            <h4 style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.title}</h4>
            <p>₹${product.price}</p>
            
            <div class="rating">
                <p class="rating-value">${product.rating.rate}</p>
                <p class="rating-count">(${product.rating.count})</p>
            </div>

            <button class="add-btn">Add to Cart</button>
        `;
        
        const button = card.querySelector(".add-btn");

        button.addEventListener("click", async () => {
            await cart.addProduct(product);
            renderCart(cart);
        });

        productWrapper.appendChild(card);
    });
}


const cart = new Cart();


const cartWrapper = document.getElementById("cartWrapper");

(async () => {
    await fetchProducts();     
    buildCategoryCheckboxes();   
    setupFilterListeners();     
    await cart.loadCart();
    renderCart(cart);
})();



//renderCart(cart);

async function renderCart(cart) {
    cartWrapper.innerHTML = "";

    

    if (!cart.items || cart.items.length === 0) {
        cartWrapper.innerHTML = `<div class="empty-cart">Your Cart is Empty</div>`;
        return;
    }

    // cart.items.forEach(item => {

    //     const exists = allProducts.find(p => p._id.toString() === item._id.toString());

    //     const itemElement = document.createElement("div");
    //     itemElement.style.position = "relative";

    //     itemElement.innerHTML = `
    //         <div class="cart-item ${!exists ? "not-available" : ""}">
    //             <img src="${item.image}" class="cart-img" />                
    //             <div class="cart-info ">
    //                 <h4 style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; ">${item.title}</h4>

    //                 <div>
    //                     <button class="decrease" data-id="${item._id}">-</button>
    //                     <span>${item.quantity}</span>
    //                     <button class="increase" data-id="${item._id}">+</button>
    //                 </div>

    //                 <p>₹${(item.price * item.quantity).toFixed(2)}</p>

                    
    //             </div>
    //             <button class="remove-btn" data-id="${item._id}">Remove</button>
    //         </div>

    //         ${
    //             !exists
    //             ? `<div class="overlay-text">Not Available</div>`
    //             : ""
    //         }
    //     `;

    //     cartWrapper.appendChild(itemElement);
    // });

    cart.items.forEach(item => {
        const exists = !item.unavailable;   // ← simpler check using our flag

        const itemElement = document.createElement("div");
        itemElement.style.position = "relative";

        itemElement.innerHTML = `
            <div class="cart-item ${!exists ? "not-available" : ""}">
                <img src="${item.image || ''}" class="cart-img" />
                <div class="cart-info">
                    <h4 style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                        ${item.title}
                    </h4>
                    <div>
                        <button class="decrease" data-id="${item._id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase" data-id="${item._id}">+</button>
                    </div>
                    <p>₹${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button class="remove-btn" data-id="${item._id}">Remove</button>
            </div>
            ${!exists ? `<div class="overlay-text">Not Available</div>` : ""}
        `;

        cartWrapper.appendChild(itemElement);
    });


    const total = cart.getTotal();

    const summary = document.createElement("div");
    summary.innerHTML = `
        <div class="cart-summary">
            <hr>
            <p>Total: ₹${total.total.toFixed(2)}</p>
            <p>Discount: ${total.discount}%</p>
            <p>Final Amount: ₹${total.finalAmount.toFixed(2)}</p>
        </div>
    `;
    cartWrapper.appendChild(summary);


    const checkoutBtn = document.createElement("button");
    checkoutBtn.innerText = "Proceed to Checkout";
    checkoutBtn.className = "checkout-btn";

    checkoutBtn.addEventListener("click", () => {
    const hasUnavailable = cart.items.some(item => item.unavailable);
    if (hasUnavailable) {
        alert("Cart has items that are not available.");
        return;
    }
    window.location.href = "checkout.html";
});

    cartWrapper.appendChild(checkoutBtn);
}

cartWrapper.addEventListener("click", async (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const id = button.dataset.id;
    const product = cart.items.find(i => i._id.toString() === id.toString());
    if (!product) return;
    
    button.disabled = true;

    if (button.classList.contains("increase")) await cart.addProduct(product);
    if (button.classList.contains("decrease")) await cart.decreaseProduct(product);
    if (button.classList.contains("remove-btn")) await cart.deleteProduct(product);

    renderCart(cart);
});