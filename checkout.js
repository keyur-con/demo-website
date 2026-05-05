if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

const checkoutWrapper = document.getElementById("checkoutWrapper");
const finalSummary = document.getElementById("finalSummary");

const currentUser = localStorage.getItem("user");
let cartData = JSON.parse(localStorage.getItem(`cart_${currentUser}`)) || [];
let discount = 0;

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


renderCheckout();

document.getElementById("placeOrder").addEventListener("click", () => {

    const name = document.getElementById("receiverName").value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const address = document.getElementById("address").value.trim();
    const error1 = document.getElementById("formError");

    error1.textContent = "";

    if(!name || !email || !mobile || !address){
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
        name,
        email,
        mobile,
        address,
        items: cartData
    };

    fetch("http://localhost:3000/checkout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.removeItem(`cart_${currentUser}`);
            alert("Order placed! Your Order ID is: " + data.order.orderId);
            window.location.href = "index.html";
        } else {
            document.getElementById("formError").innerText = data.message;
        }
    })
    .catch(err => {
        document.getElementById("formError").innerText = "Could not connect to server. Make sure backend is running.";
    });

    // const order = {
    //     orderId: "ORD-" + Date.now(),
    //     placedBy: currentUser,
    //     name,
    //     email,
    //     mobile,
    //     address,
    //     items: cartData,
    //     total: cartData.reduce((acc, item) => acc + item.price * item.quantity, 0)
    // };

    // const existingOrders = JSON.parse(localStorage.getItem("orders")) || [];
    // existingOrders.push(order);
    // localStorage.setItem("orders", JSON.stringify(existingOrders));
    // localStorage.removeItem(`cart_${currentUser}`);
    // alert("Order placed! Order ID: " + order.orderId);
    // window.location.href = "index.html";
});