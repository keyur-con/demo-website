// const isLoggedIn = localStorage.getItem("isLoggedIn");
// const user = localStorage.getItem("user");
// const role = localStorage.getItem("role");

// if (isLoggedIn !== "true" || !user || role !== "admin") {
//     window.location.href = "login.html";
// }

let ordersVisible = false;

const fetchOrdersBtn = document.getElementById("fetchOrdersBtn");
const ordersWrapper = document.getElementById("ordersWrapper");


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
    const stock = Number(document.getElementById("stock").value);

    
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
        body: JSON.stringify({ title, price, description, category, image, rating: { rate, count }, stock })
    });
    const data = await res.json();

    if (data.success) {
        document.getElementById("msg").innerText = "Product added successfully!";
        renderAdminProducts();
        ["title","price","description","category","image","rate","count","stock"]
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
    document.getElementById("stock").value = "";
});

const backButton = document.getElementById("backButton");
if (backButton) {
    backButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

async function renderAdminProducts() {
    const res = await fetch("http://localhost:3000/products/admin/all", {
        headers: { "Authorization": "Bearer " + token }
    });
    const products = await res.json();

    const wrapper = document.getElementById("adminWrapper");
    wrapper.innerHTML = "";

    
    const activeProducts = products.filter(p => !p.isDeleted);

    activeProducts.forEach(product => {
        const div = document.createElement("div");
        div.className = "admin-product-card";
        div.innerHTML = `

            <p class="product-title">
                <strong>${product.title}</strong>
            </p>

            <p>
                ₹${product.price}
            </p>

            <p>
                Stock: ${product.stock}
            </p>

            <input
                name="stock"
                type="number"
                min="0"
                
                class="stock-input"
                data-id="${product._id}"
            />

            <button
                class="update-stock-btn"
                data-id="${product._id}">
                Update Stock
            </button>

            <p>
                Status:
                <strong>${product.status}</strong>
            </p>

            ${
                product.stock <= 5 &&
                product.status === "active"

                ? `<p style="color:red;"> Only ${product.stock} left  </p>`

                : ""
            }

            <select class="status-select" data-id="${product._id}">
                <option value="active" ${product.status === "active" ? "selected" : ""}>
                    Active
                </option>

                <option value="out_of_stock" ${product.status === "out_of_stock" ? "selected" : ""}>
                    Out of Stock
                </option>

                <option value="unavailable" ${product.status === "unavailable" ? "selected" : ""}>
                    Unavailable
                </option>
            </select>

            <button 
                class="update-status-btn"
                data-id="${product._id}">
                Update Status
            </button>

            <button
                data-id="${product._id}"
                class="delete-btn">
                Delete
            </button>
        `;
        wrapper.appendChild(div);
    });
}


async function renderDeletedProducts() {
    const res = await fetch("http://localhost:3000/products/deleted", {
        headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    const products = data.products;

    const wrapper = document.getElementById("deletedWrapper");
    wrapper.innerHTML = "";

    if (!products || products.length === 0) {
        wrapper.innerHTML = `<p style="color:#888; padding:16px;">No deleted products.</p>`;
        return;
    }

    products.forEach(product => {
        const div = document.createElement("div");
        div.className = "admin-product-card deleted-product";

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; flex:1;">
                <img src="${product.image}" 
                     style="width:60px;height:60px;object-fit:contain;border-radius:8px;opacity:0.6;" />
                <div>
                    <p style="font-weight:600; color:#888;">${product.title}</p>
                    <p style="font-size:0.85rem; color:#aaa;">₹${product.price}</p>
                    <p style="font-size:0.78rem; color:#aaa;">
                        Category: ${product.category} | 
                        Stock was: ${product.stock}
                    </p>
                    <span style="
                        display:inline-block;
                        padding:2px 8px;
                        background:#f1f4fb;
                        color:#8898aa;
                        border-radius:10px;
                        font-size:0.75rem;
                        font-weight:600;
                        margin-top:4px;
                    ">Removed</span>
                </div>
            </div>
            <button 
                class="restore-btn" 
                data-id="${product._id}"
                style="
                    padding:8px 16px;
                    border:none;
                    border-radius:10px;
                    background:#e6f4ea;
                    color:#2d7a3a;
                    font-weight:600;
                    cursor:pointer;
                    font-size:0.85rem;
                ">
                Restore
            </button>
        `;
        wrapper.appendChild(div);
    });
}





document.addEventListener("DOMContentLoaded", () => {
    renderAdminProducts();
    renderDeletedProducts();
});

document.getElementById("deletedWrapper").addEventListener("click", async (e) => {
    if (!e.target.classList.contains("restore-btn")) return;

    const id = e.target.dataset.id;

    const res = await fetch(`http://localhost:3000/products/${id}/restore`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();

    if (data.success) {
        alert(`"${data.product.title}" restored successfully!`);
        
        renderAdminProducts();
        renderDeletedProducts();
    } else {
        alert(data.message || "Failed to restore");
    }
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

    if (e.target.classList.contains("update-status-btn")) {

        const id = e.target.dataset.id;

        const select = document.querySelector(
            `.status-select[data-id="${id}"]`
        );

        const status = select.value;

        const res = await fetch(
            `http://localhost:3000/products/${id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ status })
            }
        );

        const data = await res.json();

        if (data.success) {
            renderAdminProducts();
        }
    }

    if (e.target.classList.contains("update-stock-btn")) {

        const id = e.target.dataset.id;

        const input = document.querySelector(
            `.stock-input[data-id="${id}"]`
        );

        const stock = Number(input.value);

        if (isNaN(stock) || stock < 0) {
            alert("Invalid stock value");
            return;
        }

        const res = await fetch(
            `http://localhost:3000/products/${id}/quantity`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ stock })
            }
        );

        const data = await res.json();

        if (data.success) {
            renderAdminProducts();
        } else {
            alert(data.message || "Failed to update stock");
        }
    }

});

// document.getElementById("fetchOrdersBtn").addEventListener("click", () => {
//     //const role = localStorage.getItem("role");

//     fetch ("http://localhost:3000/orders", {
//         headers: {
//             "Authorization": "Bearer " + token
//         }
//     })
//     .then(res => res.json())
//     .then(data => {
//         const wrapper = document.getElementById("ordersWrapper");
//         wrapper.innerHTML = "";

//         if(data.error){
//             wrapper.innerHTML = `<p>${data.error}</p>`;
//             return;
//         }
//         if(data.length === 0){
//             wrapper.innerHTML = `<p>No orders found.</p>`;
//             return;
//         }

//         data.forEach(order => {
//             const div = document.createElement("div");
//             div.className = "order-card";
//             const itemsHTML = order.items.map(item => `
//                 <div class="order-item">
//                     <p><strong>${item.title}</strong></p>
//                     <p>Qty: ${item.qty}</p>
//                     <p>Price: ₹${item.price}</p>
//                     <p>Total: ₹${(item.price * item.qty).toFixed(2)}</p>
//                 </div>
//             `).join("");

//             div.innerHTML = `
//                 <p><strong>Order ID:</strong> ${order.orderId}</p>
//                 <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
//                 <p><strong>Account User:</strong> ${order.userName || "N/A" }</p>
//                 <p><strong>Deliver To:</strong> ${order.receiverName || order.name}</p>
//                 <p><strong>Email:</strong> ${order.email}</p>
//                 <p><strong>Mobile:</strong> ${order.mobile}</p>
//                 <p><strong>Address:</strong> ${order.address}</p>

//                 <p><strong>Items:</strong></p>
                
//                 ${itemsHTML}

//                 <hr>

//                 <p><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
//                 <p><strong>Discount:</strong> ${order.discount}%</p>
//                 <p><strong>Final Amount:</strong> ₹${order.finalAmount.toFixed(2)}</p>
//                 <hr/>
//             `;
//             wrapper.appendChild(div);
//         });
//     })
    
//     .catch(err => {
//         document.getElementById("ordersWrapper").innerHTML = 
//             `<p>Could not connect to server.</p>`;
//     });
// });

fetchOrdersBtn.addEventListener("click", () => {

    
    if (ordersVisible) {
        ordersWrapper.innerHTML = "";
        ordersVisible = false;
        fetchOrdersBtn.textContent = "View Orders";
        return;
    }

    
    fetch("http://localhost:3000/orders", {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(data => {

        ordersWrapper.innerHTML = "";

        if (data.error) {
            ordersWrapper.innerHTML = `<p>${data.error}</p>`;
            return;
        }

        if (data.length === 0) {
            ordersWrapper.innerHTML = `<p>No orders found.</p>`;
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
                <p><strong>Account User:</strong> ${order.userName || "N/A"}</p>
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

            ordersWrapper.appendChild(div);
        });

        
        ordersVisible = true;
        fetchOrdersBtn.textContent = "Hide Orders";
    })

    .catch(err => {
        ordersWrapper.innerHTML = `<p>Could not connect to server.</p>`;
    });
});