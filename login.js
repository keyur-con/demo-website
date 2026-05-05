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
        { username: "admin", password: "1234" , role: "admin" , userId: 0},
        { username: "user1", password: "1234@user1" , role: "user" , userId: 1 },
        { username: "user2", password: "1234@user2" , role: "user" , userId: 2 },
    ];
    
    const validUser = users.find(
        (u) => u.username === username && u.password === password
    );

    if (validUser) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", username);
        localStorage.setItem("role", validUser.role);
        localStorage.setItem("userId", validUser.userId);

        window.location.href = "index.html";
    }
    
    else {
        
        error.innerText = "Invalid credentials. Please try again.";
    }
});