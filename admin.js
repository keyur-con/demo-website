// const isLoggedIn = localStorage.getItem("isLoggedIn");
// const user = localStorage.getItem("user");
// const role = localStorage.getItem("role");

// if (isLoggedIn !== "true" || !user || role !== "admin") {
//     window.location.href = "login.html";
// }

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}


document.getElementById("addProduct").addEventListener("click", async () => {
    //const res = await fetch("http://localhost:3000/products");
    //localStorage.setItem("products_updated", Date.now());
    //const products = await res.json();

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

    
    //const newId =
    //    products.length > 0
    //        ? Math.max(...products.map(p => p.id)) + 1
    //        : 1;

    // const newProduct = {
    //     id: newId,
    //     title,
    //     price,
    //     description,
    //     category,
    //     image,
    //     rating: {
    //         rate: rate || 0,
    //         count: count || 0
    //     }
    // };

    
    //products.push(newProduct);

    
    const res = await fetch("http://localhost:3000/products", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ title, price, description, category, image, rating: { rate, count } })
    });
    const data = await res.json();

    if (data.success) {
        document.getElementById("msg").innerText = "Product added successfully!";
        renderAdminProducts();
        ["title","price","description","category","image","rate","count"]
            .forEach(id => document.getElementById(id).value = "");
    } else {
        alert(data.message || "Failed to add product");
    }
    //localStorage.setItem("products_updated", Date.now());
    
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
            <p>${product.title} — ₹${product.price}</p>
            <button data-id="${product._id}" class="delete-btn">Delete</button>
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
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        renderAdminProducts(); 
    }
});

document.getElementById("fetchOrdersBtn").addEventListener("click", () => {
    //const role = localStorage.getItem("role");

    fetch ("http://localhost:3000/orders", {
        headers: {
            "Authorization": "Bearer " + token
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
                    <p>Qty: ${item.qty}</p>
                    <p>Price: ₹${item.price}</p>
                    <p>Total: ₹${(item.price * item.qty).toFixed(2)}</p>
                </div>
            `).join("");

            div.innerHTML = `
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Account User:</strong> ${order.userName || "N/A" }</p>
                <p><strong>Deliver To:</strong> ${order.receiverName || order.name}</p>
                <p><strong>Email:</strong> ${order.email}</p>
                <p><strong>Mobile:</strong> ${order.mobile}</p>
                <p><strong>Address:</strong> ${order.address}</p>

                <p><strong>Items:</strong></p>
                
                ${itemsHTML}

                <hr>

                <p><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                <p><strong>Discount:</strong> ${order.discount}%</p>
                <p><strong>Final Amount:</strong> ₹${order.finalAmount.toFixed(2)}</p>
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