const isLoggedIn = localStorage.getItem("isLoggedIn");
const user = localStorage.getItem("user");
const role = localStorage.getItem("role");

if (isLoggedIn !== "true" || !user || role !== "admin") {
    window.location.href = "login.html";
}

async function initializeProductsIfNeeded() {
    let products = JSON.parse(localStorage.getItem("products"));

    if (!products) {
        const res = await fetch("./products.json");
        products = await res.json();

        localStorage.setItem("products", JSON.stringify(products));
    }

    return products;
}

document.getElementById("addProduct").addEventListener("click", async () => {
    const res = await fetch("http://localhost:3000/products");
    localStorage.setItem("products_updated", Date.now());
    const products = await res.json();

    const title = document.getElementById("title").value.trim();
    const price = Number(document.getElementById("price").value);
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value.trim();
    const image = document.getElementById("image").value.trim();

    const rate = Number(document.getElementById("rate").value);
    const count = Number(document.getElementById("count").value);

    
    if (!title || isNaN(price) || price <= 0 || !description || !category || !image) {
        alert("All fields are required");
        return;
    }

    
    const newId =
        products.length > 0
            ? Math.max(...products.map(p => p.id)) + 1
            : 1;

    const newProduct = {
        id: newId,
        title,
        price,
        description,
        category,
        image,
        rating: {
            rate: rate || 0,
            count: count || 0
        }
    };

    
    products.push(newProduct);

    
    await fetch("http://localhost:3000/products", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newProduct)
    });
    localStorage.setItem("products_updated", Date.now());
    
    document.getElementById("msg").innerText = " Product added successfully!";

   
    if (typeof renderAdminProducts === "function") {
        renderAdminProducts();
    }

    
    document.getElementById("title").value = "";
    document.getElementById("price").value = "";
    document.getElementById("description").value = "";
    document.getElementById("category").value = "";
    document.getElementById("image").value = "";
    document.getElementById("rate").value = "";
    document.getElementById("count").value = "";
});

const backButton = document.getElementById("backButton");
if (backButton) {
    backButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

async function renderAdminProducts() {
    const res = await fetch("http://localhost:3000/products");
    const products = await res.json();

    const wrapper = document.getElementById("adminWrapper");
    wrapper.innerHTML = "";

    products.forEach(product => {
        const div = document.createElement("div");
        div.className = "admin-product-card";

        div.innerHTML = `
            <p> ${product.id}. ${product.title} — ₹${product.price}</p>
            <button data-id="${product.id}" class="delete-btn"> Delete </button>
        `;

        wrapper.appendChild(div);
    });
}



document.addEventListener("DOMContentLoaded", () => {
    renderAdminProducts();
});

document.getElementById("adminWrapper").addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;

        await fetch(`http://localhost:3000/products/${id}`, {
            method: "DELETE"
        });

        renderAdminProducts(); // refresh after delete
    }
});

document.getElementById("fetchOrdersBtn").addEventListener("click", () => {
    const role = localStorage.getItem("role");

    fetch ("http://localhost:3000/orders", {
        headers: {
            "role": role
        }
    })
    .then(res => res.json())
    .then(data => {
        const wrapper = document.getElementById("ordersWrapper");
        wrapper.innerHTML = "";

        if(data.error){
            wrapper.innerHTML = `<p>${data.error}</p>`;
            return;
        }
        if(data.length === 0){
            wrapper.innerHTML = `<p>No orders found.</p>`;
            return;
        }

        data.forEach(order => {
            const div = document.createElement("div");
            div.className = "order-card";
            const itemsHTML = order.items.map(item => `
                <div class="order-item">
                    <p><strong>${item.title}</strong></p>
                    <p>Qty: ${item.quantity}</p>
                    <p>Price: ₹${item.price}</p>
                    <p>Total: ₹${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            `).join("");

            div.innerHTML = `
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Name:</strong> ${order.name}</p>
                <p><strong>Email:</strong> ${order.email}</p>
                <p><strong>Mobile:</strong> ${order.mobile}</p>
                <p><strong>Address:</strong> ${order.address}</p>

                <p><strong>Items:</strong></p>
                ${itemsHTML}
                <hr/>
            `;
            wrapper.appendChild(div);
        });
    })
    
    .catch(err => {
        document.getElementById("ordersWrapper").innerHTML = 
            `<p>Could not connect to server.</p>`;
    });
});