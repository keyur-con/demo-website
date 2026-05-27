const ordersWrapper = document.getElementById("ordersWrapper");
const backBtn       = document.getElementById("backBtn");
const token         = localStorage.getItem("token");

if (!token) { window.location.href = "login.html"; }

backBtn.addEventListener("click", () => { window.location.href = "index.html"; });

async function fetchOrders() {
    ordersWrapper.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--ink-20);font-size:0.9rem;">
            Loading your orders…
        </div>
    `;
    try {
        const res    = await fetch("http://localhost:3000/orders/my", { headers: { Authorization: "Bearer " + token } });
        const orders = await res.json();
        renderOrders(orders);
    } catch {
        ordersWrapper.innerHTML = `<div style="text-align:center;padding:60px;color:var(--red);">Failed to load orders.</div>`;
    }
}

function renderOrders(orders) {
    ordersWrapper.innerHTML = "";

    if (!orders.length) {
        ordersWrapper.innerHTML = `
            <div style="text-align:center;padding:80px 20px;">
                <div style="font-size:3rem;margin-bottom:16px;">📦</div>
                <div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:var(--ink);margin-bottom:8px;">No orders yet</div>
                <div style="font-size:0.88rem;color:var(--ink-40);margin-bottom:24px;">Start shopping to see your orders here.</div>
                <a href="index.html" style="display:inline-flex;align-items:center;gap:6px;padding:11px 24px;background:var(--ink);color:var(--cream);border-radius:var(--radius-pill);font-size:0.88rem;font-weight:600;">Shop Now →</a>
            </div>
        `;
        return;
    }

    orders.forEach((order, idx) => {
        const card = document.createElement("div");
        card.className = "order-card";
        card.style.animationDelay = `${idx * 0.06}s`;

        // Header
        const dateStr = new Date(order.createdAt).toLocaleString("en-IN", {
            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });

        card.innerHTML = `
            <div class="order-header">
                <div>
                    <div class="order-header-id">Order ID <span>#${order.orderId || order._id?.toString().slice(-8).toUpperCase()}</span></div>
                </div>
                <div class="order-header-meta">${dateStr}</div>
            </div>
            <div class="order-body"></div>
            <div class="order-address-row">
                <div>
                    <strong>Receiver</strong>
                    ${order.receiverName}
                </div>
                <div>
                    <strong>Mobile</strong>
                    ${order.mobile}
                </div>
                <div>
                    <strong>Delivery Address</strong>
                    ${order.address}
                </div>
            </div>
        `;

        const body = card.querySelector(".order-body");

        order.items.forEach(item => {
            const itemEl = document.createElement("div");
            itemEl.className = "order-item";
            itemEl.innerHTML = `
                <img src="${item.image || 'https://placehold.co/56x56/f7f4ee/9898a6?text=?'}" class="order-img" alt="${item.title}" />
                <div class="order-info">
                    <h4>${item.title}</h4>
                    <p>Qty: ${item.qty}</p>
                </div>
                <div class="order-item-price">₹${item.total.toFixed(2)}</div>
            `;
            body.appendChild(itemEl);
        });

        const summary = document.createElement("div");
        summary.className = "order-summary";
        summary.innerHTML = `
            <div class="order-summary-details">
                <p>Subtotal: ₹${order.totalAmount.toFixed(2)}</p>
                ${order.discount > 0 ? `<p style="color:var(--sage)">Discount: ${order.discount}% (−₹${((order.totalAmount * order.discount) / 100).toFixed(2)})</p>` : ""}
            </div>
            <div class="order-summary-final">₹${order.finalAmount.toFixed(2)}</div>
        `;
        body.appendChild(summary);

        ordersWrapper.appendChild(card);
    });
}

fetchOrders();