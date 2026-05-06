if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

const checkoutWrapper = document.getElementById("checkoutWrapper");
const finalSummary = document.getElementById("finalSummary");

const userName = localStorage.getItem("user");
const userId = localStorage.getItem("userId");
let cartData = [];
let allProducts = [];
let discount = 0;

async function loadCheckoutData() {
    
    const prodRes = await fetch("http://localhost:3000/products");
    allProducts = await prodRes.json();

    
    const cartRes = await fetch(`http://localhost:3000/cart/${userId}`);
    const cart = await cartRes.json();

    
    cartData = cart.items.map(item => {
        const product = allProducts.find(p => p.id === item.productId);
        if (!product) return null;
        return { ...product, quantity: item.qty };
    }).filter(Boolean);

    renderCheckout();
}

function renderCheckout(){
    checkoutWrapper.innerHTML = "";

    if(cartData.length === 0){
        checkoutWrapper.innerHTML = "<p>Cart is empty</p>";
        return;
    }

    cartData.forEach(item => {
        const div = document.createElement("div");
        div.innerHTML = `
            <div class="checkout-item">
                <img src="${item.image}" alt="${item.title}" class="checkout-img" />
                <p>${item.title} x ${item.quantity}</p>
                <p>₹${item.price * item.quantity}</p>
            </div>
        `;
        checkoutWrapper.appendChild(div);
    });

    updateSummary();
}


document.getElementById("applyCoupon").addEventListener("click", () => {
    const code = document.getElementById("couponInput").value.trim().toUpperCase();

    if(code === "SAVE10"){
        discount = 10;
    } 
    else if(code === "SAVE20"){
        discount = 20;
    }
    else if(code === "SAVE30"){
        discount = 30;
    }
    else if(code === "SAVE50"){
        discount = 50;
    }
    else if(code === "FLASH40"){
        discount = 40;
    }
    else if(code === "BONUS15"){
        discount = 15;
    }
    else if(code === "SPECIAL25"){
        discount = 25;
    }
    else if(code === "DEAL35"){
        discount = 35;
    }
    else {
        alert("Invalid Coupon");
        discount = 0;
    }

    updateSummary();
});


function updateSummary(){
    const total = cartData.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const discountAmount = (total * discount) / 100;
    const finalAmount = total - discountAmount;

    finalSummary.innerHTML = `
        <div class="final-summary">
            <p>Total: ₹${total.toFixed(2)}</p>
            <p>Discount: ${discount}%</p>
            <p>Final Amount: ₹${finalAmount.toFixed(2)}</p>
        </div>
    `;
}


loadCheckoutData();

document.getElementById("placeOrder").addEventListener("click", async () => {

    const name = document.getElementById("receiverName").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const address = document.getElementById("address").value.trim();
    const error1 = document.getElementById("formError");

    error1.textContent = "";

    if(!receiverName || !email || !mobile || !address){
        error1.textContent = "Please fill in all the fields.";
        return;
    }

    if(!email.includes("@") || !email.includes(".")){
        error1.textContent = "Please enter a valid email.";
        return;
    }

    if(mobile.length !== 10 || isNaN(mobile)){
        error1.textContent = "Please enter a valid 10-digit mobile number.";
        return;
    }
    console.log("All good! Ready to save the order.");

    const order = {
        userId,
        userName,              
        receiverName: name,    
        email,
        mobile,
        address,
        discount,
        items: cartData.map(item => ({
            productId: item.id,
            qty: item.quantity
        }))
    };

    try {
        const res = await fetch("http://localhost:3000/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(order)
        });

        const data = await res.json();

        if (data.success) {
            await fetch(`http://localhost:3000/cart/clear/${userId}`, {
                method: "DELETE"
            });

            alert("Order placed! Your Order ID is: " + data.order.orderId);
            window.location.href = "index.html";
        } else {
            document.getElementById("formError").innerText = data.message;
        }

    } catch (err) {
        document.getElementById("formError").innerText =
            "Could not connect to server. Make sure backend is running.";
    }
    

    
});