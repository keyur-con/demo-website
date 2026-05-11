// const isLoggedIn = localStorage.getItem("isLoggedIn");
// const user = localStorage.getItem("user");

// if (isLoggedIn === "true" && user) {
//     window.location.href = "index.html";
// }

const form = document.getElementById("loginForm");
const error = document.getElementById("error");



form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem("token", data.token); 
        window.location.href = "index.html";
    } else {
        alert(data.message);
    }
});