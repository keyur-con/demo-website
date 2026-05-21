document.getElementById("signupBtn").addEventListener("click", () => {
    console.log("Signup clicked");
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) return;
    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Signup successful!");
            window.location.href = "login.html";
        } else {
            alert(data.message);
        }
    });
});