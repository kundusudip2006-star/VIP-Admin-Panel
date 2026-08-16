// ======================================================
// VIP PANEL STORE
// AUTH SYSTEM - PART 1
// Email + User ID + Register
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
            document.getElementById("email")?.value.trim();

        const password =
            document.getElementById("password")?.value || "";

        if (!loginInput || !password) {

            alert(
                "Please enter User ID/Email and Password."
            );

            return;
        }

        try {

            let email = loginInput;

            // ==================================================
            // CHECK EMAIL OR USER ID
            // ==================================================

            const isEmail =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    loginInput
                );

            // ==================================================
            // USER ID LOGIN
            // ==================================================

            if (!isEmail) {

                const username =
                    loginInput
                        .replace(/^@/, "")
                        .trim()
                        .toLowerCase();

                if (!username) {

                    alert("Please enter a valid User ID.");

                    return;
                }

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
                    usernameDoc.data() || {};

                if (!usernameData.email) {

                    alert(
                        "This User ID has no login email."
                    );

                    return;
                }

                email =
                    String(
                        usernameData.email
                    ).trim();

            }

            // ==================================================
            // FIREBASE EMAIL LOGIN
            // ==================================================

            await auth.signInWithEmailAndPassword(
                email,
                password
            );

            // ==================================================
            // ADMIN LOGIN
            // ==================================================

            const currentPage =
                window.location.pathname
                    .toLowerCase();

            if (
                currentPage.includes(
                    "admin-login"
                )
            ) {

                if (
                    email.toLowerCase() !==
                    "kundusudip011@gmail.com"
                ) {

                    alert(
                        "Access Denied! Admin only."
                    );

                    await auth.signOut();

                    return;
                }

                window.location.href =
                    "dashboard.html";

                return;
            }

            // ==================================================
            // NORMAL USER LOGIN
            // ==================================================

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

                    message =
                        "Account not found.";

                    break;

                case "auth/wrong-password":

                    message =
                        "Incorrect password.";

                    break;

                case "auth/invalid-credential":

                    message =
                        "Invalid User ID/Email or password.";

                    break;

                case "auth/invalid-email":

                    message =
                        "Invalid email address.";

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
                        error.message ||
                        message;
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
                ?.value.trim();

        const username =
            document.getElementById("username")
                ?.value.trim()
                .replace(/^@/, "")
                .toLowerCase();

        const email =
            document.getElementById("email")
                ?.value.trim()
                .toLowerCase();

        const password =
            document.getElementById("password")
                ?.value || "";


        // ==================================================
        // VALIDATION
        // ==================================================

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

        if (
            !/^[a-zA-Z0-9._-]{3,30}$/
                .test(username)
        ) {

            alert(
                "User ID must be 3-30 characters and can contain letters, numbers, dot, underscore or hyphen."
            );

            return;
        }

        if (!email) {

            alert(
                "Please enter your email."
            );

            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(email)
        ) {

            alert(
                "Please enter a valid email address."
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

            // ==================================================
            // CHECK USERNAME
            // ==================================================

            const usernameRef =
                db
                    .collection("usernameIndex")
                    .doc(username);

            const usernameDoc =
                await usernameRef.get();

            if (usernameDoc.exists) {

                alert(
                    "User ID already exists!"
                );

                return;
            }


            // ==================================================
            // CREATE FIREBASE AUTH ACCOUNT
            // ==================================================

            const result =
                await auth
                    .createUserWithEmailAndPassword(
                        email,
                        password
                    );

            const user =
                result.user;


            // ==================================================
            // UPDATE FIREBASE DISPLAY NAME
            // ==================================================

            await user.updateProfile({

                displayName:
                    name

            });


            // ==================================================
            // CREATE CUSTOMER DOCUMENT
            // ==================================================

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


            // ==================================================
            // CREATE USERNAME INDEX
            // ==================================================

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


            // ==================================================
            // LOGOUT AFTER REGISTER
            // ==================================================

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
                        "Password must be at least 6 characters.";

                    break;

                case "permission-denied":

                    message =
                        "Firestore permission denied. Please check your Firestore Rules.";

                    break;

                default:

                    message =
                        error.message ||
                        message;
            }

            alert(message);
        }

    });

}
// ======================================================
// VIP PANEL STORE
// AUTH SYSTEM - PART 2
// Password Toggle + Google Login
// ======================================================


// ======================================================
// SHOW / HIDE PASSWORD
// ======================================================

const togglePassword =
    document.getElementById(
        "togglePassword"
    );

const passwordField =
    document.getElementById(
        "password"
    );


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
                    .remove(
                        "fa-eye"
                    );

                togglePassword.classList
                    .add(
                        "fa-eye-slash"
                    );

            } else {

                passwordField.type =
                    "password";

                togglePassword.classList
                    .remove(
                        "fa-eye-slash"
                    );

                togglePassword.classList
                    .add(
                        "fa-eye"
                    );

            }

        }
    );

}


// ======================================================
// GOOGLE LOGIN
// ======================================================

const googleLogin =
    document.getElementById(
        "googleLogin"
    );


if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        async () => {

            try {

                // ==========================================
                // GOOGLE PROVIDER
                // ==========================================

                const provider =
                    new firebase.auth
                        .GoogleAuthProvider();


                // ==========================================
                // GOOGLE SIGN IN
                // ==========================================

                const result =
                    await auth
                        .signInWithPopup(
                            provider
                        );


                const user =
                    result.user;


                if (!user) {

                    throw new Error(
                        "Google login failed."
                    );

                }


                // ==========================================
                // CUSTOMER REFERENCE
                // ==========================================

                const customerRef =
                    db
                        .collection(
                            "customers"
                        )
                        .doc(
                            user.uid
                        );


                const customerDoc =
                    await customerRef.get();


                // ==========================================
                // EXISTING USER
                // ==========================================

                if (
                    customerDoc.exists
                ) {

                    window.location.href =
                        "shop.html";

                    return;
                }


                // ==========================================
                // CREATE BASE USERNAME
                // ==========================================

                let baseUsername =
                    user.email
                        ? user.email
                            .split("@")[0]
                            .toLowerCase()
                            .replace(
                                /[^a-z0-9._-]/g,
                                ""
                            )
                        : "user";


                if (
                    baseUsername.length < 3
                ) {

                    baseUsername =
                        "user" +
                        Date.now()
                            .toString()
                            .slice(-5);

                }


                // ==========================================
                // FIND AVAILABLE USERNAME
                // ==========================================

                let finalUsername =
                    baseUsername;

                let counter = 1;


                while (true) {

                    const usernameCheck =
                        await db
                            .collection(
                                "usernameIndex"
                            )
                            .doc(
                                finalUsername
                            )
                            .get();


                    if (
                        !usernameCheck.exists
                    ) {

                        break;
                    }


                    finalUsername =
                        baseUsername +
                        counter;

                    counter++;

                }


                // ==========================================
                // CREATE CUSTOMER
                // ==========================================

                await customerRef.set({

                    uid:
                        user.uid,

                    name:
                        user.displayName ||
                        "Customer",

                    username:
                        finalUsername,

                    email:
                        user.email ||
                        "",

                    phone:
                        "",

                    balance:
                        0,

                    createdAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                });


                // ==========================================
                // CREATE USERNAME INDEX
                // ==========================================

                await db
                    .collection(
                        "usernameIndex"
                    )
                    .doc(
                        finalUsername
                    )
                    .set({

                        username:
                            finalUsername,

                        email:
                            user.email ||
                            "",

                        uid:
                            user.uid,

                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    });


                // ==========================================
                // GO TO SHOP
                // ==========================================

                window.location.href =
                    "shop.html";


            } catch (error) {

                console.error(
                    "Google Login Error:",
                    error
                );


                let message =
                    "Google login failed.";


                switch (error.code) {

                    case "auth/popup-closed-by-user":

                        message =
                            "Google login popup was closed.";

                        break;

                    case "auth/popup-blocked":

                        message =
                            "Popup was blocked by the browser.";

                        break;

                    case "auth/account-exists-with-different-credential":

                        message =
                            "An account already exists with this email.";

                        break;

                    case "permission-denied":

                        message =
                            "Firestore permission denied. Please check your Rules.";

                        break;

                    default:

                        message =
                            error.message ||
                            message;

                }


                alert(message);

            }

        }
    );

}


// ======================================================
// AUTH STATE DEBUG
// ======================================================

auth.onAuthStateChanged(
    (user) => {

        if (user) {

            console.log(
                "Auth user:",
                user.uid
            );

            console.log(
                "Auth email:",
                user.email
            );

        } else {

            console.log(
                "No user logged in."
            );

        }

    }
);