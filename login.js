const isLoggedIn = localStorage.getItem("isLoggedIn");
const user = localStorage.getItem("user");

if (isLoggedIn === "true" && user) {
    window.location.href = "index.html";
}

const form = document.getElementById("loginForm");
const error = document.getElementById("error");



form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const users = [
        { username: "admin", password: "1234" , role: "admin" },
        { username: "user1", password: "1234@user1" , role: "user" },
        { username: "user2", password: "1234@user2" , role: "user" }
    ];
    
    const validUser = users.find(
        (u) => u.username === username && u.password === password
    );

    if (validUser) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", username);
        localStorage.setItem("role", validUser.role);

        window.location.href = "index.html";
    }
    
    else {
        
        error.innerText = "Invalid credentials. Please try again.";
    }
});