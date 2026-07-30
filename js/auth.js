// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

loginForm.addEventListener("submit", async (e)=>{

e.preventDefault();

let login=document.getElementById("email").value.trim();

const password=document.getElementById("password").value;

try{

let email="";

const isEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login);

if(isEmail){

email=login;

}else{

const username=login.replace("@","");

const snap=await db.collection("customers")
.where("username","==",username)
.limit(1)
.get();

if(snap.empty){

alert("User ID not found!");
return;

}

email=snap.docs[0].data().email;

}

await auth.signInWithEmailAndPassword(email,password);

if(window.location.pathname.includes("admin-login.html")){

if(email!=="kundusudip011@gmail.com"){

alert("Access Denied!");
await auth.signOut();
return;

}

window.location.href="dashboard.html";

}else{

window.location.href="shop.html";

}

}catch(err){

alert(err.message);

}

});

}


// ===============================
// REGISTER
// ===============================

const registerForm=document.getElementById("registerForm");

if(registerForm){

registerForm.addEventListener("submit",async(e)=>{

e.preventDefault();

const name=document.getElementById("name").value.trim();

const username=document.getElementById("username").value
.trim()
.replace("@","");

const email=document.getElementById("email").value.trim();

const password=document.getElementById("password").value;

try{

const check=await db.collection("customers")
.where("username","==",username)
.limit(1)
.get();

if(!check.empty){

alert("User ID already exists!");
return;

}

const result=await auth.createUserWithEmailAndPassword(email,password);

await result.user.updateProfile({

displayName:name

});

await db.collection("customers")
.doc(result.user.uid)
.set({

uid:result.user.uid,

name:name,

username:username,

email:email,

phone:"",

createdAt:firebase.firestore.FieldValue.serverTimestamp()

});

alert("Registration Successful!");

window.location.href="login.html";

}catch(err){

alert(err.message);

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

// ===============================
// Google Login
// ===============================

const googleLogin = document.getElementById("googleLogin");

if (googleLogin) {

    googleLogin.addEventListener("click", async () => {

        try {

            const provider = new firebase.auth.GoogleAuthProvider();

            const result = await auth.signInWithPopup(provider);

            const user = result.user;

            const doc = await db.collection("customers")
                .doc(user.uid)
                .get();

            if (!doc.exists) {

                await db.collection("customers")
                    .doc(user.uid)
                    .set({

                        uid: user.uid,
                        name: user.displayName,
                        username: user.email.split("@")[0],
                        email: user.email,
                        phone: "",
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()

                    });

            }

            window.location.href = "shop.html";

        } catch (error) {

            alert(error.message);

        }

    });

}