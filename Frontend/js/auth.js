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


// ===============================
// SIGN UP
// ===============================

signupForm.addEventListener("submit", function (event) {

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


    // Check if an account already exists
    const existingUser =
        JSON.parse(
            localStorage.getItem("busiVibesUser")
        );


    if (
        existingUser &&
        existingUser.email === email
    ) {

        showMessage(
            "An account with this email already exists. Please log in.",
            "error"
        );

        return;
    }


    // Create user
    const user = {

        fullName: fullName,
        email: email,
        password: password,
        accountType: accountType

    };


    // Save account
    localStorage.setItem(
        "busiVibesUser",
        JSON.stringify(user)
    );


    // Clear form
    signupForm.reset();


    // Switch to login
    setMode("login");


    // Show success message
    showMessage(
        "Account created successfully! Please log in.",
        "success"
    );


    // Automatically put email into login form
    loginForm.email.value = email;

});


// ===============================
// LOGIN
// ===============================

loginForm.addEventListener("submit", function (event) {

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


    // Get saved user
    const savedUser =
        JSON.parse(
            localStorage.getItem("busiVibesUser")
        );


    // No account
    if (!savedUser) {

        showMessage(
            "No account found. Please sign up first.",
            "error"
        );

        return;
    }


    // Check login details
    if (
        savedUser.email !== email ||
        savedUser.password !== password
    ) {

        showMessage(
            "Incorrect email or password.",
            "error"
        );

        return;
    }


    // Login successful
    localStorage.setItem(
        "busiVibesLoggedIn",
        "true"
    );


    localStorage.setItem(
        "busiVibesCurrentUser",
        JSON.stringify({
            fullName: savedUser.fullName,
            email: savedUser.email,
            accountType: savedUser.accountType || "fan"
        })
    );


    showMessage(
        `Welcome back, ${savedUser.fullName}!`,
        "success"
    );


    loginForm.reset();


       // Redirect after successful login
    setTimeout(() => {

        const userType =
            String(savedUser.accountType || "")
                .trim()
                .toLowerCase();


        if (userType === "artist") {

            window.location.href = "pages/artist-dashboard.html";

        } 
        else if (userType === "fan") {

            window.location.href = "fan-dashboard.html";

        } 
        else {

            window.location.href = "index.html";

        }

    }, 1200);

});