// ===============================
// Login
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        let login = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {

            let email = login;

            // Username login
            if (!login.includes("@")) {

                const snap = await db.collection("customers")
                    .where("username", "==", login)
                    .get();

                if (snap.empty) {
                    alert("Username not found!");
                    return;
                }

                email = snap.docs[0].data().email;
            }

            await auth.signInWithEmailAndPassword(email, password);

            if (window.location.pathname.includes("admin-login.html")) {

                if (email !== "kundusudip011@gmail.com") {

                    alert("Access Denied! Admin Only.");
                    await auth.signOut();
                    return;

                }

                alert("Admin Login Successful!");
                window.location.href = "dashboard.html";

            } else {

                alert("Login Successful!");
                window.location.href = "shop.html";

            }

        } catch (error) {

            alert(error.message);

        }

    });

}

// ===============================
// Register
// ===============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const username = document.getElementById("username").value.trim().replace("@", "");
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {

            // Username already exists?
            const check = await db.collection("customers")
                .where("username", "==", username)
                .get();

            if (!check.empty) {
                alert("Username already taken!");
                return;
            }

            const result = await auth.createUserWithEmailAndPassword(email, password);

            await result.user.updateProfile({
                displayName: name
            });

            await db.collection("customers").doc(result.user.uid).set({
                uid: result.user.uid,
                name: name,
                username: username,
                email: email,
                phone: "",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Registration Successful!");

            window.location.href = "login.html";

        } catch (error) {

            alert(error.message);

        }

    });

}
// ===============================
// Show / Hide Password
// ===============================

const togglePassword = document.getElementById("togglePassword");
const passwordField = document.getElementById("password");

if (togglePassword && passwordField) {

    togglePassword.addEventListener("click", () => {

        if (passwordField.type === "password") {

            passwordField.type = "text";
            togglePassword.classList.remove("fa-eye");
            togglePassword.classList.add("fa-eye-slash");

        } else {

            passwordField.type = "password";
            togglePassword.classList.remove("fa-eye-slash");
            togglePassword.classList.add("fa-eye");

        }

    });

}