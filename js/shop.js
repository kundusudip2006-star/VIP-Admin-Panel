// ==========================
// Firebase Auth Check
// ==========================

let currentUser = null;
let selectedProduct = null;

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadProducts();

});

// ==========================
// Elements
// ==========================

const productList = document.getElementById("productList");
const buyModal = document.getElementById("buyModal");
const closeModal = document.getElementById("closeModal");
const confirmBuyBtn = document.getElementById("confirmBuyBtn");

// ==========================
// Load Products
// ==========================

function loadProducts() {

    db.collection("products")
    .orderBy("createdAt","desc")
    .onSnapshot((snapshot)=>{

        productList.innerHTML="";

        snapshot.forEach((doc)=>{

            const product=doc.data();

            let plansHTML="";

            if(product.plans){

                product.plans.forEach((plan,index)=>{

                    plansHTML+=`

                    <div class="plan-box">

                        <div>

                            <b>${plan.name}</b><br>

                            ₹${plan.price}

                        </div>

                        <button
                        class="buy-btn"
                        onclick="openBuy('${doc.id}',${index})">

                        Buy

                        </button>

                    </div>

                    `;

                });

            }

            productList.innerHTML+=`

            <div class="product-card">

                <img
                src="${product.image || 'https://via.placeholder.com/150'}">

                <h3>${product.name}</h3>

                <p>${product.description || ""}</p>

                ${plansHTML}

            </div>

            `;

        });

    });

}

// ==========================
// Open Buy
// ==========================

async function openBuy(productId, planIndex) {

    const doc = await db.collection("products").doc(productId).get();

    if (!doc.exists) return;

    const product = doc.data();

    const plan = product.plans[planIndex];

    if (plan.stock <= 0) {
        alert("Out of Stock");
        return;
    }

    selectedProduct = {
        id: productId,
        productName: product.name,
        planName: plan.name,
        price: plan.price,
        stock: plan.stock,
        planIndex: planIndex
    };

    document.getElementById("buyProductName").innerText =
        product.name + " (" + plan.name + ")";

    document.getElementById("buyProductPrice").innerText =
        plan.price;

    document.getElementById("loginUser").innerHTML =
        "<b>Logged in :</b> " + currentUser.email;

    buyModal.style.display = "flex";
}

// ==========================
// Close Modal
// ==========================

closeModal.onclick = () => buyModal.style.display = "none";

window.onclick = (e) => {
    if (e.target == buyModal) {
        buyModal.style.display = "none";
    }
};

// ==========================
// Confirm Buy
// ==========================

confirmBuyBtn.addEventListener("click", async () => {

    const snap = await db.collection("customers")
        .where("email", "==", currentUser.email)
        .limit(1)
        .get();

    let customerName = "Customer";
    let customerPhone = "";

    if (!snap.empty) {
        const data = snap.docs[0].data();
        customerName = data.name;
        customerPhone = data.phone;
    }

    localStorage.setItem("orderData", JSON.stringify({
        customerName: customerName,
        customerEmail: currentUser.email,
        customerPhone: customerPhone,
        productId: selectedProduct.id,
        productName: selectedProduct.productName,
        planName: selectedProduct.planName,
        planIndex: selectedProduct.planIndex,
        price: selectedProduct.price
    }));

    window.location.href = "payment.html";

});
// ==========================
// My Orders
// ==========================

document.getElementById("myOrdersBtn").onclick = () => {

    window.location.href = "my-order.html";

};

// ==========================
// Logout
// ==========================

document.getElementById("logoutBtn").onclick = async () => {

    if (confirm("Logout?")) {

        await firebase.auth().signOut();

        window.location.href = "login.html";

    }

};
