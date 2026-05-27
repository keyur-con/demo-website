let isProcessing = false;
const token = localStorage.getItem("token");

if (!token) { window.location.href = "login.html"; }

const checkoutWrapper = document.getElementById("checkoutWrapper");
const finalSummary    = document.getElementById("finalSummary");
const placeOrderBtn   = document.getElementById("placeOrder");

function parseJwt(t) { return JSON.parse(atob(t.split('.')[1])); }
const decoded = parseJwt(token);
const userId  = decoded.userId;

let cartData    = [];
let allProducts = [];
let discount    = 0;

async function loadCheckoutData() {
    // const prodRes   = await fetch("http://localhost:3000/products");
    // allProducts     = await prodRes.json();

    const prodRes   = await fetch("http://localhost:3000/products?limit=1000");
    const prodData  = await prodRes.json();
    allProducts     = prodData.products;

    const cartRes   = await fetch("http://localhost:3000/cart", { headers: { Authorization: "Bearer " + token } });
    const cart      = await cartRes.json();

    cartData = cart.items.map(item => {
        const product = allProducts.find(p => p._id.toString() === item.productId.toString());
        if (!product) return null;
        return { ...product, quantity: item.qty };
    }).filter(Boolean);

    renderCheckout();
}

function renderCheckout() {
    checkoutWrapper.innerHTML = "";

    if (cartData.length === 0) {
        checkoutWrapper.innerHTML = `<p style="color:var(--ink-40);font-size:0.9rem;text-align:center;padding:24px;">Your cart is empty. <a href="index.html" style="color:var(--amber)">Go shopping →</a></p>`;
        return;
    }

    cartData.forEach(item => {
        const div = document.createElement("div");
        div.innerHTML = `
            <div class="checkout-item">
                <img src="${item.image}" alt="${item.title}" class="checkout-img" />
                <div class="checkout-item-info">
                    <div class="checkout-item-title">${item.title}</div>
                    <div class="checkout-item-qty">Qty: ${item.quantity}</div>
                </div>
                <div class="checkout-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
        checkoutWrapper.appendChild(div);
    });

    updateSummary();
}

function updateSummary() {
    const subtotal       = cartData.reduce((a, i) => a + i.price * i.quantity, 0);
    const discountAmount = (subtotal * discount) / 100;
    const total          = subtotal - discountAmount;

    finalSummary.innerHTML = `
        <h3>Order Summary</h3>
        <div class="final-summary-row">
            <span>Subtotal</span>
            <span>₹${subtotal.toFixed(2)}</span>
        </div>
        ${discount > 0 ? `
        <div class="final-summary-row discount">
            <span>Coupon (${discount}% off)</span>
            <span>−₹${discountAmount.toFixed(2)}</span>
        </div>` : ""}
        <div class="final-summary-divider"></div>
        <div class="final-summary-total">
            <span class="label">Total</span>
            <span class="amount">₹${total.toFixed(2)}</span>
        </div>
        ${discount === 0 ? `<p style="font-size:0.75rem;color:var(--ink-20);margin-top:12px;">Have a coupon? Enter it on the left.</p>` : ""}
    `;
}

document.getElementById("applyCoupon").addEventListener("click", () => {
    const code = document.getElementById("couponInput").value.trim().toUpperCase();

    if (code === "SAVE10") {
        discount = 10;
        showToast("Coupon applied! 10% off ✓", "success");
    } else {
        discount = 0;
        showToast("Invalid coupon code", "error");
    }
    updateSummary();
});

function showToast(message, type = "info") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icons = { success: "✓", error: "✕", info: "→" };
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "toastOut 0.3s ease both";
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

placeOrderBtn.addEventListener("click", async () => {
    if (isProcessing) return;

    const receiverName = document.getElementById("receiverName").value.trim();
    const email        = document.getElementById("email").value.trim();
    const mobile       = document.getElementById("mobile").value.trim();
    const address      = document.getElementById("address").value.trim();
    const formError    = document.getElementById("formError");

    formError.textContent = "";

    if (!receiverName || !email || !mobile || !address) {
        formError.textContent = "Please fill in all shipping details.";
        return;
    }
    if (!/^\d{10}$/.test(mobile)) {
        formError.textContent = "Enter a valid 10-digit mobile number.";
        return;
    }

    isProcessing         = true;
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Placing order…";

    try {
        const subtotal       = cartData.reduce((a, i) => a + i.price * i.quantity, 0);
        const discountAmount = (subtotal * discount) / 100;
        const finalAmount    = subtotal - discountAmount;

        const res = await fetch("http://localhost:3000/orders/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({
                items: cartData.map(i => ({
                    productId: i._id,
                    title: i.title,
                    image: i.image,
                    qty: i.quantity,
                    price: i.price,
                    total: i.price * i.quantity
                })),
                receiverName, email, mobile, address,
                totalAmount: subtotal,
                discount,
                discountAmount,
                finalAmount
            })
        });

        if (res.ok) {
            showToast("Order placed successfully! 🎉", "success");
            setTimeout(() => { window.location.href = "orders.html"; }, 1200);
        } else {
            const err = await res.json();
            formError.textContent = err.message || "Failed to place order.";
            isProcessing = false;
            placeOrderBtn.disabled   = false;
            placeOrderBtn.innerHTML  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Place Order`;
        }
    } catch {
        formError.textContent = "Network error. Please try again.";
        isProcessing = false;
        placeOrderBtn.disabled   = false;
        placeOrderBtn.innerHTML  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Place Order`;
    }
});

loadCheckoutData();