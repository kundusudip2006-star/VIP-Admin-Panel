// ======================================================
// VIP PANEL - AUTH SYSTEM
// Email + User ID + Google Login
// ======================================================

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");


// ======================================================
// LOGIN
// ======================================================

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const loginInput =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        if (!loginInput || !password) {

            alert("Please enter User ID/Email and Password.");
            return;

        }

        try {

            let email = loginInput;

            // --------------------------------------------------
            // CHECK EMAIL OR USER ID
            // --------------------------------------------------

            const isEmail =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(loginInput);

            if (!isEmail) {

                // Remove @ if user enters @username
                const username =
                    loginInput
                        .replace(/^@/, "")
                        .trim()
                        .toLowerCase();

                if (!username) {

                    alert("Please enter a valid User ID.");
                    return;

                }

                // --------------------------------------------------
                // FIND EMAIL FROM USERNAME INDEX
                // --------------------------------------------------

                const usernameDoc =
                    await db
                        .collection("usernameIndex")
                        .doc(username)
                        .get();

                if (!usernameDoc.exists) {

                    alert("User ID not found!");
                    return;

                }

                const usernameData =
                    usernameDoc.data();

                if (!usernameData.email) {

                    alert("This User ID has no login email.");
                    return;

                }

                email =
                    usernameData.email;

            }

            // --------------------------------------------------
            // FIREBASE LOGIN
            // --------------------------------------------------

            await auth.signInWithEmailAndPassword(
                email,
                password
            );

            // --------------------------------------------------
            // ADMIN LOGIN
            // --------------------------------------------------

            if (
                window.location.pathname
                    .toLowerCase()
                    .includes("admin-login")
            ) {

                if (
                    email.toLowerCase()
                    !== "kundusudip011@gmail.com"
                ) {

                    alert("Access Denied! Admin only.");

                    await auth.signOut();

                    return;

                }

                window.location.href =
                    "dashboard.html";

                return;

            }

            // --------------------------------------------------
            // NORMAL USER LOGIN
            // --------------------------------------------------

            window.location.href =
                "shop.html";

        } catch (error) {

            console.error(
                "Login Error:",
                error
            );

            let message =
                "Login failed.";

            switch (error.code) {

                case "auth/user-not-found":
                    message = "Account not found.";
                    break;

                case "auth/wrong-password":
                    message = "Incorrect password.";
                    break;

                case "auth/invalid-credential":
                    message = "Invalid User ID/Email or password.";
                    break;

                case "auth/invalid-email":
                    message = "Invalid email address.";
                    break;

                case "auth/too-many-requests":
                    message =
                        "Too many login attempts. Please try again later.";
                    break;

                case "permission-denied":
                    message =
                        "Firestore permission denied.";
                    break;

                default:
                    message =
                        error.message || message;

            }

            alert(message);

        }

    });

}


// ======================================================
// REGISTER
// ======================================================

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name =
            document.getElementById("name")
                .value
                .trim();

        const username =
            document.getElementById("username")
                .value
                .trim()
                .replace(/^@/, "")
                .toLowerCase();

        const email =
            document.getElementById("email")
                .value
                .trim()
                .toLowerCase();

        const password =
            document.getElementById("password")
                .value;

        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

        if (!name) {

            alert("Please enter your name.");
            return;

        }

        if (!username) {

            alert("Please enter a User ID.");
            return;

        }

        if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {

            alert(
                "User ID can contain only letters, numbers, dot, underscore and hyphen."
            );

            return;

        }

        if (!email) {

            alert("Please enter your email.");
            return;

        }

        if (password.length < 6) {

            alert(
                "Password must be at least 6 characters."
            );

            return;

        }

        try {

            // --------------------------------------------------
            // CHECK USERNAME
            // --------------------------------------------------

            const usernameRef =
                db
                    .collection("usernameIndex")
                    .doc(username);

            const usernameDoc =
                await usernameRef.get();

            if (usernameDoc.exists) {

                alert("User ID already exists!");
                return;

            }

            // ======================================================
// REGISTER
// ======================================================

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name =
            document.getElementById("name")
                .value.trim();

        const username =
            document.getElementById("username")
                .value.trim()
                .replace(/^@/, "")
                .toLowerCase();

        const email =
            document.getElementById("email")
                .value.trim()
                .toLowerCase();

        const password =
            document.getElementById("password")
                .value;

        // ==============================
        // VALIDATION
        // ==============================

        if (!name) {
            alert("Please enter your name.");
            return;
        }

        if (!username) {
            alert("Please enter a User ID.");
            return;
        }

        if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
            alert(
                "User ID must be 3-30 characters and can contain letters, numbers, dot, underscore or hyphen."
            );
            return;
        }

        if (!email) {
            alert("Please enter your email.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        try {

            // ==============================
            // CHECK USERNAME
            // ==============================

            const usernameRef =
                db.collection("usernameIndex")
                  .doc(username);

            const usernameDoc =
                await usernameRef.get();

            if (usernameDoc.exists) {

                alert("User ID already exists!");
                return;

            }

            // ==============================
            // CREATE FIREBASE AUTH ACCOUNT
            // ==============================

            const result =
                await auth.createUserWithEmailAndPassword(
                    email,
                    password
                );

            const user = result.user;

            console.log(
                "Firebase Auth created:",
                user.uid
            );

            // ==============================
            // UPDATE PROFILE
            // ==============================

            await user.updateProfile({
                displayName: name
            });

            // ==============================
            // CREATE CUSTOMER
            // ==============================

            await db
                .collection("customers")
                .doc(user.uid)
                .set({

                    uid: user.uid,

                    name: name,

                    username: username,

                    email: email,

                    phone: "",

                    balance: 0,

                    createdAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                });

            console.log(
                "Customer profile created."
            );

            // ==============================
            // CREATE USERNAME INDEX
            // ==============================

            await usernameRef.set({

                username: username,

                email: email,

                uid: user.uid,

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });

            console.log(
                "Username index created."
            );

            // ==============================
            // LOGOUT
            // ==============================

            await auth.signOut();

            alert(
                "Registration Successful! You can now login using your User ID."
            );

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Registration Error:",
                error
            );

            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                alert(
                    "This email is already registered."
                );

            } else if (
                error.code ===
                "auth/invalid-email"
            ) {

                alert(
                    "Invalid email address."
                );

            } else if (
                error.code ===
                "auth/weak-password"
            ) {

                alert(
                    "Password must be at least 6 characters."
                );

            } else if (
                error.code ===
                "permission-denied"
            ) {

                alert(
                    "Firestore permission denied. Please check Firestore Rules."
                );

            } else {

                alert(
                    error.message ||
                    "Registration failed."
                );

            }

        }

    });

}

            // --------------------------------------------------
            // CREATE FIREBASE AUTH USER
            // --------------------------------------------------

            const result =
                await auth
                    .createUserWithEmailAndPassword(
                        email,
                        password
                    );

            const user =
                result.user;

            // --------------------------------------------------
            // UPDATE DISPLAY NAME
            // --------------------------------------------------

            await user.updateProfile({

                displayName: name

            });

            // --------------------------------------------------
            // CREATE CUSTOMER PROFILE
            // --------------------------------------------------

            await db
                .collection("customers")
                .doc(user.uid)
                .set({

                    uid:
                        user.uid,

                    name:
                        name,

                    username:
                        username,

                    email:
                        email,

                    phone:
                        "",

                    balance:
                        0,

                    createdAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                });

            // --------------------------------------------------
            // CREATE USERNAME INDEX
            // --------------------------------------------------

            await usernameRef.set({

                username:
                    username,

                email:
                    email,

                uid:
                    user.uid,

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });

            // --------------------------------------------------
            // LOGOUT AFTER REGISTER
            // --------------------------------------------------

            await auth.signOut();

            alert(
                "Registration Successful! You can now login using your User ID or Email."
            );

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Registration Error:",
                error
            );

            let message =
                "Registration failed.";

            switch (error.code) {

                case "auth/email-already-in-use":
                    message =
                        "This email is already registered.";
                    break;

                case "auth/invalid-email":
                    message =
                        "Invalid email address.";
                    break;

                case "auth/weak-password":
                    message =
                        "Password is too weak.";
                    break;

                case "permission-denied":
                    message =
                        "Firestore permission denied.";
                    break;

                default:
                    message =
                        error.message || message;

            }

            alert(message);

        }

    });

}


// ======================================================
// SHOW / HIDE PASSWORD
// ======================================================

const togglePassword =
    document.getElementById("togglePassword");

const passwordField =
    document.getElementById("password");

if (
    togglePassword &&
    passwordField
) {

    togglePassword.addEventListener(
        "click",
        () => {

            if (
                passwordField.type ===
                "password"
            ) {

                passwordField.type =
                    "text";

                togglePassword.classList
                    .remove("fa-eye");

                togglePassword.classList
                    .add("fa-eye-slash");

            } else {

                passwordField.type =
                    "password";

                togglePassword.classList
                    .remove("fa-eye-slash");

                togglePassword.classList
                    .add("fa-eye");

            }

        }
    );

}


// ======================================================
// GOOGLE LOGIN
// ======================================================

const googleLogin =
    document.getElementById("googleLogin");

if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        async () => {

            try {

                const provider =
                    new firebase.auth
                        .GoogleAuthProvider();

                const result =
                    await auth
                        .signInWithPopup(
                            provider
                        );

                const user =
                    result.user;

                // --------------------------------------------------
                // CHECK CUSTOMER
                // --------------------------------------------------

                const customerRef =
                    db
                        .collection("customers")
                        .doc(user.uid);

                const customerDoc =
                    await customerRef.get();

                // --------------------------------------------------
                // CREATE CUSTOMER IF NEW
                // --------------------------------------------------

                if (!customerDoc.exists) {

                    let baseUsername =
                        (
                            user.email
                            ? user.email
                                .split("@")[0]
                            : "user"
                        )
                        .toLowerCase()
                        .replace(
                            /[^a-z0-9._-]/g,
                            ""
                        );

                    if (
                        baseUsername.length < 3
                    ) {

                        baseUsername =
                            "user" +
                            Date.now()
                                .toString()
                                .slice(-5);

                    }

                    let finalUsername =
                        baseUsername;

                    let counter = 1;

                    // --------------------------------------------------
                    // FIND AVAILABLE USERNAME
                    // --------------------------------------------------

                    while (true) {

                        const check =
                            await db
                                .collection(
                                    "usernameIndex"
                                )
                                .doc(finalUsername)
                                .get();

                        if (!check.exists) {
                            break;
                        }

                        finalUsername =
                            baseUsername +
                            counter;

                        counter++;

                    }

                    // --------------------------------------------------
                    // CUSTOMER
                    // --------------------------------------------------

                    await customerRef.set({

                        uid:
                            user.uid,

                        name:
                            user.displayName ||
                            "Customer",

                        username:
                            finalUsername,

                        email:
                            user.email || "",

                        phone:
                            "",

                        balance:
                            0,

                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    });

                    // --------------------------------------------------
                    // USERNAME INDEX
                    // --------------------------------------------------

                    await db
                        .collection(
                            "usernameIndex"
                        )
                        .doc(finalUsername)
                        .set({

                            username:
                                finalUsername,

                            email:
                                user.email || "",

                            uid:
                                user.uid,

                            createdAt:
                                firebase.firestore
                                    .FieldValue
                                    .serverTimestamp()

                        });

                }

                window.location.href =
                    "shop.html";

            } catch (error) {

                console.error(
                    "Google Login Error:",
                    error
                );

                alert(
                    error.message ||
                    "Google login failed."
                );

            }

        }
    );

}