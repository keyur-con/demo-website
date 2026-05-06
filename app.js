const isLoggedIn = localStorage.getItem("isLoggedIn");
const user = localStorage.getItem("user");

let allProducts = [];

if (isLoggedIn !== "true" || !user) {
    window.location.href = "login.html";
}

const logoutBtn = document.createElement("button");
logoutBtn.classList.add("logout-btn");
logoutBtn.innerText = "Logout";

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    window.location.href = "login.html";
});

document.body.appendChild(logoutBtn);

const role = localStorage.getItem("role");

if (role === "admin") {
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

const userId = localStorage.getItem("userId");

class Cart {
    constructor() {
        this.items = [];
        this.discount = 0;
    }

    async loadCart() {
        const res = await fetch(`http://localhost:3000/cart/${userId}`);
        const data = await res.json();

        
        this.items = data.items.map(item => {
            const product = allProducts.find(p => p.id === item.productId);
            if (!product) return null;
            return { ...product, quantity: item.qty };
        }).filter(Boolean); // remove any nulls
    }

    async addProduct(product) {
        await fetch("http://localhost:3000/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, productId: product.id, qty: 1 })
        });
        await this.loadCart();
    }

    async decreaseProduct(product) {
        const existing = this.items.find(i => i.id === product.id);
        if (!existing) return;

        if (existing.quantity > 1) {
            await fetch("http://localhost:3000/cart", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, productId: product.id, qty: existing.quantity - 1 })
            });
        } else {
            await fetch("http://localhost:3000/cart", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, productId: product.id })
            });
        }
        await this.loadCart();
    }

    async deleteProduct(product) {
        await fetch("http://localhost:3000/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, productId: product.id })
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
            <h4>${product.title}</h4>
            <p>₹${product.price}</p>
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

    cart.items.forEach(item => {

        const exists = allProducts.find(p => p.id === item.id);

        const itemElement = document.createElement("div");
        itemElement.style.position = "relative";

        itemElement.innerHTML = `
            <div class="cart-item ${!exists ? "not-available" : ""}">
                <img src="${item.image}" class="cart-img" />
                
                <div class="cart-info ">
                    <h4>${item.title}</h4>

                    <div>
                        <button class="decrease" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="increase" data-id="${item.id}">+</button>
                    </div>

                    <p>₹${(item.price * item.quantity).toFixed(2)}</p>

                    
                </div>
                <button class="remove-btn" data-id="${item.id}">Remove</button>
            </div>

            ${
                !exists
                ? `<div class="overlay-text">Not Available</div>`
                : ""
            }
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
    const hasUnavailable = cart.items.some(item =>
        !allProducts.some(p => p.id === item.id)
    );
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

    const id = Number(button.dataset.id);
    const product = cart.items.find(i => i.id === id);
    if (!product) return;
    
    button.disabled = true;

    if (button.classList.contains("increase")) await cart.addProduct(product);
    if (button.classList.contains("decrease")) await cart.decreaseProduct(product);
    if (button.classList.contains("remove-btn")) await cart.deleteProduct(product);

    renderCart(cart);
});