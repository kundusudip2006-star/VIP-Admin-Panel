// =====================================================
// AUTH.JS
// VIP PANEL - LOGIN / REGISTER / GOOGLE LOGIN
// =====================================================


// =====================================================
// CONFIG
// =====================================================

const ADMIN_EMAIL = "kundusudip011@gmail.com";


// =====================================================
// HELPERS
// =====================================================

function getElement(id) {
    return document.getElementById(id);
}


// =====================================================
// LOGIN
// =====================================================

const loginForm = getElement("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const loginInput = getElement("email");
        const passwordInput = getElement("password");

        if (!loginInput || !passwordInput) {
            alert("Login form is incomplete.");
            return;
        }

        const login = loginInput.value.trim();
        const password = passwordInput.value;

        if (!login || !password) {
            alert("Please enter User ID/Email and Password.");
            return;
        }

        try {

            let email = "";

            // =================================================
            // EMAIL LOGIN
            // =================================================

            const isEmail =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login);

            if (isEmail) {

                email = login.toLowerCase();

            }

            // =================================================
            // USERNAME LOGIN
            // =================================================
            // Username is searched from customers collection.
            // IMPORTANT:
            // This requires the user to already be authenticated.
            // Therefore username login is handled through the
            // username mapping collection if available.
            // =================================================

            else {

                const username = login
                    .replace("@", "")
                    .trim()
                    .toLowerCase();

                // ---------------------------------------------
                // First try usernames collection
                // ---------------------------------------------

                let usernameDoc = null;

                try {

                    const usernameRef =
                        await db.collection("usernames")
                            .doc(username)
                            .get();

                    if (usernameRef.exists) {

                        usernameDoc =
                            usernameRef.data();

                    }

                } catch (error) {

                    console.warn(
                        "Username collection lookup failed:",
                        error
                    );

                }

                // ---------------------------------------------
                // Username mapping found
                // ---------------------------------------------

                if (usernameDoc && usernameDoc.email) {

                    email =
                        String(usernameDoc.email)
                            .trim()
                            .toLowerCase();

                }

                // ---------------------------------------------
                // Fallback to customers collection
                // ---------------------------------------------

                else {

                    try {

                        const snap =
                            await db.collection("customers")
                                .where(
                                    "username",
                                    "==",
                                    username
                                )
                                .limit(1)
                                .get();

                        if (!snap.empty) {

                            const customer =
                                snap.docs[0].data();

                            if (customer.email) {

                                email =
                                    String(customer.email)
                                        .trim()
                                        .toLowerCase();

                            }

                        }

                    } catch (error) {

                        console.error(
                            "Username lookup error:",
                            error
                        );

                    }

                }

                if (!email) {

                    alert(
                        "User ID not found. Please use your registered Email."
                    );

                    return;
                }

            }


            // =================================================
            // FIREBASE LOGIN
            // =================================================

            await auth.signInWithEmailAndPassword(
                email,
                password
            );


            // =================================================
            // ADMIN LOGIN
            // =================================================

            const isAdminPage =
                window.location.pathname
                    .toLowerCase()
                    .includes("admin-login.html");


            if (isAdminPage) {

                if (
                    email.toLowerCase() !==
                    ADMIN_EMAIL.toLowerCase()
                ) {

                    alert(
                        "❌ Access Denied! Admin only."
                    );

                    await auth.signOut();

                    return;
                }

                window.location.href =
                    "dashboard.html";

                return;
            }


            // =================================================
            // NORMAL USER LOGIN
            // =================================================

            if (
                email.toLowerCase() ===
                ADMIN_EMAIL.toLowerCase()
            ) {

                // Admin should normally use admin-login.html
                window.location.href =
                    "dashboard.html";

            } else {

                window.location.href =
                    "shop.html";

            }

        } catch (error) {

            console.error(
                "Login Error:",
                error
            );

            let message =
                "Login failed.";

            switch (error.code) {

                case "auth/invalid-credential":
                    message =
                        "❌ Invalid Email/User ID or Password.";
                    break;

                case "auth/user-not-found":
                    message =
                        "❌ Account not found.";
                    break;

                case "auth/wrong-password":
                    message =
                        "❌ Incorrect password.";
                    break;

                case "auth/invalid-email":
                    message =
                        "❌ Invalid email address.";
                    break;

                case "auth/too-many-requests":
                    message =
                        "⚠️ Too many login attempts. Please try again later.";
                    break;

                case "auth/user-disabled":
                    message =
                        "❌ This account has been disabled.";
                    break;

                case "permission-denied":
                    message =
                        "❌ Database permission denied.";
                    break;

                default:
                    message =
                        "❌ " +
                        (error.message || "Unable to login.");

            }

            alert(message);

        }

    });

}


// =====================================================
// REGISTER
// =====================================================

const registerForm =
    getElement("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const nameInput =
                getElement("name");

            const usernameInput =
                getElement("username");

            const emailInput =
                getElement("email");

            const passwordInput =
                getElement("password");

            if (
                !nameInput ||
                !usernameInput ||
                !emailInput ||
                !passwordInput
            ) {

                alert(
                    "Registration form is incomplete."
                );

                return;
            }


            const name =
                nameInput.value.trim();

            const username =
                usernameInput.value
                    .trim()
                    .replace("@", "")
                    .toLowerCase();

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;


            // =================================================
            // VALIDATION
            // =================================================

            if (!name) {

                alert(
                    "Please enter your name."
                );

                return;
            }

            if (!username) {

                alert(
                    "Please enter a User ID."
                );

                return;
            }

            if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {

                alert(
                    "User ID must contain 3-30 letters, numbers, dot, underscore or hyphen."
                );

                return;
            }

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(email)
            ) {

                alert(
                    "Please enter a valid email."
                );

                return;
            }

            if (password.length < 6) {

                alert(
                    "Password must be at least 6 characters."
                );

                return;
            }


            try {

                // =================================================
                // CHECK USERNAME
                // =================================================

                let usernameExists = false;


                // First check username mapping

                try {

                    const usernameDoc =
                        await db.collection("usernames")
                            .doc(username)
                            .get();

                    if (usernameDoc.exists) {

                        usernameExists = true;

                    }

                } catch (error) {

                    console.warn(
                        "Username mapping check failed:",
                        error
                    );

                }


                // Fallback customers check

                if (!usernameExists) {

                    const customerSnap =
                        await db.collection("customers")
                            .where(
                                "username",
                                "==",
                                username
                            )
                            .limit(1)
                            .get();

                    if (!customerSnap.empty) {

                        usernameExists = true;

                    }

                }


                if (usernameExists) {

                    alert(
                        "❌ User ID already exists!"
                    );

                    return;
                }


                // =================================================
                // CREATE FIREBASE AUTH ACCOUNT
                // =================================================

                const result =
                    await auth.createUserWithEmailAndPassword(
                        email,
                        password
                    );

                const user =
                    result.user;


                // =================================================
                // UPDATE DISPLAY NAME
                // =================================================

                await user.updateProfile({

                    displayName:
                        name

                });


                // =================================================
                // CREATE CUSTOMER PROFILE
                // =================================================

                await db.collection("customers")
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

                        walletBalance:
                            0,

                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    });


                // =================================================
                // CREATE USERNAME MAPPING
                // =================================================

                await db.collection("usernames")
                    .doc(username)
                    .set({

                        uid:
                            user.uid,

                        username:
                            username,

                        email:
                            email,

                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    });


                // =================================================
                // LOGOUT AFTER REGISTER
                // =================================================

                await auth.signOut();


                alert(
                    "✅ Registration Successful!\n\nYou can now login using your Email or User ID."
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
                            "❌ This email is already registered.";

                        break;

                    case "auth/invalid-email":

                        message =
                            "❌ Invalid email address.";

                        break;

                    case "auth/weak-password":

                        message =
                            "❌ Password is too weak.";

                        break;

                    case "permission-denied":

                        message =
                            "❌ Database permission denied. Check Firestore Rules.";

                        break;

                    default:

                        message =
                            "❌ " +
                            (error.message ||
                                "Unable to register.");

                }

                alert(message);

            }

        }
    );

}


// =====================================================
// SHOW / HIDE PASSWORD
// =====================================================

const togglePassword =
    getElement("togglePassword");

const passwordField =
    getElement("password");

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

                togglePassword.classList.remove(
                    "fa-eye"
                );

                togglePassword.classList.add(
                    "fa-eye-slash"
                );

            } else {

                passwordField.type =
                    "password";

                togglePassword.classList.remove(
                    "fa-eye-slash"
                );

                togglePassword.classList.add(
                    "fa-eye"
                );

            }

        }
    );

}


// =====================================================
// GOOGLE LOGIN
// =====================================================

const googleLogin =
    getElement("googleLogin");

if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        async () => {

            try {

                const provider =
                    new firebase.auth.GoogleAuthProvider();

                const result =
                    await auth.signInWithPopup(
                        provider
                    );

                const user =
                    result.user;


                // =================================================
                // ADMIN GOOGLE LOGIN
                // =================================================

                const isAdminPage =
                    window.location.pathname
                        .toLowerCase()
                        .includes("admin-login.html");


                if (isAdminPage) {

                    if (
                        user.email
                            .toLowerCase() !==
                        ADMIN_EMAIL
                            .toLowerCase()
                    ) {

                        alert(
                            "❌ Access Denied! Admin only."
                        );

                        await auth.signOut();

                        return;
                    }

                    window.location.href =
                        "dashboard.html";

                    return;
                }


                // =================================================
                // CREATE CUSTOMER IF NEW
                // =================================================

                const customerRef =
                    db.collection("customers")
                        .doc(user.uid);

                const customerDoc =
                    await customerRef.get();


                if (!customerDoc.exists) {

                    let username =
                        (
                            user.email
                                ? user.email.split("@")[0]
                                : "user"
                        )
                        .replace(
                            /[^a-zA-Z0-9._-]/g,
                            ""
                        )
                        .toLowerCase();


                    // Make username unique

                    const usernameRef =
                        db.collection("usernames")
                            .doc(username);

                    const usernameDoc =
                    await usernameRef.get();


                    if (usernameDoc.exists) {

                        username =
                            username +
                            Math.floor(
                                1000 +
                                Math.random() *
                                9000
                            );

                    }


                    await customerRef.set({

                        uid:
                            user.uid,

                        name:
                            user.displayName ||
                            "User",

                        username:
                            username,

                        email:
                            user.email ||
                            "",

                        phone:
                            user.phoneNumber ||
                            "",

                        walletBalance:
                            0,

                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    });


                    await db.collection("usernames")
                        .doc(username)
                        .set({

                            uid:
                                user.uid,

                            username:
                                username,

                            email:
                                user.email ||
                                "",

                            createdAt:
                                firebase.firestore
                                    .FieldValue
                                    .serverTimestamp()

                        });

                }


                // =================================================
                // USER HOME
                // =================================================

                window.location.href =
                    "shop.html";


            } catch (error) {

                console.error(
                    "Google Login Error:",
                    error
                );

                alert(
                    "❌ " +
                    (
                        error.message ||
                        "Google Login failed."
                    )
                );

            }

        }
    );

}