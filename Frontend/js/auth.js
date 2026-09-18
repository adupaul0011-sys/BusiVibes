const toggleButtons = document.querySelectorAll(".toggle-btn");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const formMessage = document.getElementById("formMessage");


// ===============================
// SHOW MESSAGE
// ===============================

function showMessage(message, type = "success") {
    formMessage.textContent = message;
    formMessage.className = "form-message";
    formMessage.classList.add(type);
}


// ===============================
// SWITCH LOGIN / SIGN UP
// ===============================

function setMode(mode) {

    const isLogin = mode === "login";

    toggleButtons.forEach((button) => {

        button.classList.toggle(
            "is-active",
            button.dataset.mode === mode
        );

    });

    loginForm.classList.toggle("is-visible", isLogin);
    signupForm.classList.toggle("is-visible", !isLogin);

    formMessage.textContent = "";
    formMessage.className = "form-message";
}


toggleButtons.forEach((button) => {

    button.addEventListener("click", () => {

        setMode(button.dataset.mode);

    });

});

// Apply the initial mode from the URL, e.g. ?mode=signup
const urlParams = new URLSearchParams(window.location.search);
const initialMode = urlParams.get("mode") === "signup" ? "signup" : "login";
setMode(initialMode);


const API_BASE = "http://localhost:4000/api";

async function requestAuth(path, body) {
    const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
    }
    return data;
}

function usernameFromEmail(email) {
    return email.split("@")[0].replace(/[^a-z0-9_]/g, "").slice(0, 24) || "listener";
}

function saveSession(data) {
    localStorage.setItem("bv_token", data.token);
    localStorage.setItem("busiVibesLoggedIn", "true");
    localStorage.setItem("busiVibesCurrentUser", JSON.stringify({
        id: data.user.id,
        fullName: data.user.displayName,
        email: data.user.username,
        accountType: data.user.type,
        userType: data.user.type,
        username: data.user.username
    }));
    localStorage.setItem("bv_current_user_id", String(data.user.id));
}

// ===============================
// SIGN UP
// ===============================

signupForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const fullName =
        signupForm.fullName.value.trim();

    const email =
        signupForm.email.value.trim().toLowerCase();

    const password =
        signupForm.password.value.trim();

    const accountType =
        signupForm.accountType.value.trim();

    const confirmPassword =
        signupForm.confirmPassword.value.trim();


    // Check empty fields
    if (
        !fullName ||
        !email ||
        !password ||
        !accountType ||
        !confirmPassword
    ) {

        showMessage(
            "Please complete all sign-up fields.",
            "error"
        );

        return;
    }


    // Check password length
    if (password.length < 6) {

        showMessage(
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }


    // Check passwords
    if (password !== confirmPassword) {

        showMessage(
            "Passwords do not match.",
            "error"
        );

        return;
    }


    try {
        const data = await requestAuth("/auth/signup", {
            username: usernameFromEmail(email),
            password,
            type: accountType,
            displayName: fullName
        });
        saveSession(data);
        showMessage("Account created successfully!", "success");
        setTimeout(() => {
            window.location.href = accountType === "artist" ? "pages/artist-dashboard.html" : "fan-dashboard.html";
        }, 500);
    } catch (error) {
        showMessage(error.message, "error");
    }

});


// ===============================
// LOGIN
// ===============================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const email =
        loginForm.email.value.trim().toLowerCase();

    const password =
        loginForm.password.value.trim();


    // Check fields
    if (!email || !password) {

        showMessage(
            "Please enter both email and password.",
            "error"
        );

        return;
    }


    try {
        const data = await requestAuth("/auth/login", {
            username: usernameFromEmail(email),
            password
        });
        saveSession(data);
        showMessage(`Welcome back, ${data.user.displayName}!`, "success");
        loginForm.reset();
        setTimeout(() => {
            window.location.href = data.user.type === "artist" ? "pages/artist-dashboard.html" : "fan-dashboard.html";
        }, 500);
    } catch (error) {
        showMessage(error.message, "error");
    }

});