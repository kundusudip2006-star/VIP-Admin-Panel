// ===============================
// Login
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {

            await auth.signInWithEmailAndPassword(email, password);

            // Admin Login
            if (window.location.pathname.includes("admin-login.html")) {

                if (email !== "kundusudip011@gmail.com") {

                    alert("Access Denied! Admin Only.");
                    await auth.signOut();
                    return;

                }

                alert("Admin Login Successful!");
                window.location.href = "dashboard.html";

            }

            // Customer Login
            else {

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
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {

            const result = await auth.createUserWithEmailAndPassword(email, password);

            await result.user.updateProfile({
                displayName: name
            });

            await db.collection("customers").add({
                uid: result.user.uid,
                name: name,
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