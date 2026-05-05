const isLoggedIn = localStorage.getItem("isLoggedIn");
const user = localStorage.getItem("user");

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

class Cart{
    constructor(){
        let savedCart;

        try {
            const currentUser = localStorage.getItem("user");
            savedCart = JSON.parse(localStorage.getItem(`cart_${currentUser}`));
        } catch (err) {
            savedCart = null;
        }

        this.items = Array.isArray(savedCart) ? savedCart : [];
        this.discount = 0;
    }
  
    async addProduct(product){
        try{
            
            const existing = this.items.find(item => item.id === product.id);
            if(existing){
                existing.quantity += 1;
            }
            else{
                this.items.push({...product,quantity : 1});
            }
            console.log("Product id : " + product.id + " added in the cart.");
        }
        catch(err){
            console.log("Error ; ",err);
        }

        this.saveCart();
    }
    
    decreaseProduct(product){
        const item = this.items.find(i => i.id === product.id);
        if(!item){
            console.log("product is not in the cart.");
            return;
        }
        if (item.quantity > 1){
            item.quantity -= 1;
        }
        else{
            this.items = this.items.filter(i => i.id !== product.id);
        }
        console.log("Product id : " + item.id + " removed from the cart.");

        this.saveCart();
    }

    deleteProduct(product){
        this.items = this.items.filter(i => i.id !== product.id);
        console.log("Product id : " + product.id + " deleted from the cart.");
        this.saveCart();
        
    }
    
    applyDiscount(percent){
        if(percent < 0 || percent > 100){
            console.log("Invalid discount");
            return;
        }
        this.discount = percent ;
        console.log(`Discount applied : ${percent}%`);
    }
    
    getTotal(){
        const total = this.items.reduce((acc,item) => acc + item.price * item.quantity,0);
        const discountAmount = (total * this.discount)/100;
        return {
            total,
            discount: this.discount,
            discountAmount,
            finalAmount: total - discountAmount
        };
    }
    
    getItemcount(){
        return this.items.reduce((acc,item) => acc + item.quantity,0);
    }
    
    clearCart() {
        this.items = [];
        this.discount = 0;
        
        const currentUser = localStorage.getItem("user");
        localStorage.removeItem(`cart_${currentUser}`);
    }
    saveCart(){
        const currentUser = localStorage.getItem("user");
        localStorage.setItem(`cart_${currentUser}`, JSON.stringify(this.items));
    }
}

const productWrapper = document.getElementById("productWrapper");

async function fetchProducts() {
    try {
        const res = await fetch("http://localhost:3000/products");
        const data = await res.json();

        renderProducts(data);
    } catch (err) {
        console.log("Error fetching products");
    }
}

window.addEventListener("storage", (e) => {
    if (e.key === "products_updated") {
        fetchProducts(); // auto refresh products
    }
});

fetchProducts();

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
            cart.addProduct(product);
            renderCart(cart);
        });

        productWrapper.appendChild(card);
    });
}


const cart = new Cart();


const cartWrapper = document.getElementById("cartWrapper");

window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("cart_")) {
        const currentUser = localStorage.getItem("user");
        cart.items = JSON.parse(localStorage.getItem(`cart_${currentUser}`)) || [];
        
        renderCart(cart);
    }
});

renderCart(cart);

async function renderCart(cart) {
    cartWrapper.innerHTML = "";

    const res = await fetch("http://localhost:3000/products");
    const products = await res.json();

    if (!cart.items || cart.items.length === 0) {
        cartWrapper.innerHTML = `<div class="empty-cart">Your Cart is Empty</div>`;
        return;
    }

    cart.items.forEach(item => {

        const exists = products.find(p => p.id === item.id);

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

    checkoutBtn.addEventListener("click", async () => {
        const res = await fetch("http://localhost:3000/products");
        const products = await res.json();

        const hasUnavailable = cart.items.some(item =>
            !products.some(p => p.id === item.id)
        );

        if (hasUnavailable) {
            alert("Cart has items that are not available.");
            return;
        }

        window.location.href = "checkout.html";
    });

    cartWrapper.appendChild(checkoutBtn);
}

cartWrapper.addEventListener("click", (e) => {
    const button = e.target.closest("button"); 

    if (!button) return;

    const id = Number(button.dataset.id);

    const product = cart.items.find(i => i.id === id);

    if (!product) return;

    if (button.classList.contains("increase")) {
        cart.addProduct(product);
    }

    if (button.classList.contains("decrease")) {
        cart.decreaseProduct(product);
    }

    if (button.classList.contains("remove-btn")) {
        cart.deleteProduct(product);
    }

    renderCart(cart);
});