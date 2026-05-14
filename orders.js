//const userId = localStorage.getItem("userId");
const ordersWrapper = document.getElementById("ordersWrapper");

const backBtn = document.getElementById("backBtn");

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
});

async function fetchOrders() {
    try {
        const res = await fetch(`http://localhost:3000/orders/my`, {
            headers: {
                Authorization: "Bearer " + token
            }
        });
        const orders = await res.json();

        renderOrders(orders);
    } catch (err) {
        console.log("Error fetching orders");
    }
}

function renderOrders(orders) {
    ordersWrapper.innerHTML = "";

    if (!orders.length) {
        ordersWrapper.innerHTML = "<p>No Orders Found</p>";
        return;
    }

    orders.forEach(order => {
        const orderDiv = document.createElement("div");
        orderDiv.className = "order-card";

        const header = document.createElement("div");
        header.className = "order-header";

        header.innerHTML = `
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Name:</strong> ${order.receiverName}</p>
            <p><strong>Mobile:</strong> ${order.mobile}</p>
            <p><strong>Address:</strong> ${order.address}</p>
        `;

        orderDiv.appendChild(header);

        order.items.forEach(item => {
            const itemEl = document.createElement("div");
            itemEl.className = "order-item";

            itemEl.innerHTML = `
                <img src="${item.image || 'https://via.placeholder.com/60'}" class="order-img" />

                <div class="order-info">
                    <h4>${item.title}</h4>
                    <p>Qty: ${item.qty}</p>
                    <p>₹${item.total.toFixed(2)}</p>
                </div>
            `;

            orderDiv.appendChild(itemEl);
        });

        const summary = document.createElement("div");
        summary.className = "order-summary";

        summary.innerHTML = `
            <hr>
            <p>Total: ₹${order.totalAmount.toFixed(2)}</p>
            <p>Discount: ${order.discount}%</p>
            <p><strong>Final: ₹${order.finalAmount.toFixed(2)}</strong></p>
        `;

        orderDiv.appendChild(summary);

        ordersWrapper.appendChild(orderDiv);
    });
}

fetchOrders();