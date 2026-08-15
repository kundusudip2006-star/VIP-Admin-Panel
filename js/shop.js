let currentUser = null;
let selectedProduct = null;

const productList = document.getElementById("productList");
const buyModal = document.getElementById("buyModal");
const closeModal = document.getElementById("closeModal");
const confirmBuyBtn = document.getElementById("confirmBuyBtn");

// ==========================
// AUTH
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.replace("login.html");
        return;
    }

    currentUser = user;

    document.documentElement.classList.remove("auth-loading");

    loadProducts();
});

// ==========================
// LOAD PRODUCTS
// ==========================

function loadProducts() {

    db.collection("products")
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {

            productList.innerHTML = "";

            snapshot.forEach((doc) => {

                const product = doc.data();

                let plansHTML = "";

                if (product.plans) {

                    product.plans.forEach((plan, index) => {

                        plansHTML += `
                        <div class="plan-box">

                            <div>
                                <b>${plan.name || "Plan"}</b><br>
                                ₹${Number(plan.price || 0).toFixed(2)}
                            </div>

                            <button
                                class="buy-btn"
                                onclick="openBuy('${doc.id}', ${index})">
                                Buy
                            </button>

                        </div>
                        `;

                    });

                }

                productList.innerHTML += `
                <div class="product-card">

                    <img
                        src="${product.image || 'https://via.placeholder.com/150'}"
                        alt="${product.name || 'Product'}"
                    >

                    <h3>${product.name || "Product"}</h3>

                    <p>${product.description || ""}</p>

                    ${plansHTML}

                </div>
                `;

            });

        });
}

// ==========================
// OPEN BUY
// ==========================

async function openBuy(productId, planIndex) {

    try {

        const doc = await db
            .collection("products")
            .doc(productId)
            .get();

        if (!doc.exists) {
            alert("Product not found.");
            return;
        }

        const product = doc.data();

        if (
            !product.plans ||
            !product.plans[planIndex]
        ) {
            alert("Plan not found.");
            return;
        }

        const plan = product.plans[planIndex];

        if (Number(plan.stock || 0) <= 0) {
            alert("Out of Stock.");
            return;
        }

        selectedProduct = {

            id: productId,

            productName:
                product.name || "Product",

            planName:
                plan.name || "Plan",

            price:
                Number(plan.price || 0),

            planIndex:
                planIndex

        };

        document.getElementById("buyProductName").innerText =
            product.name + " (" + plan.name + ")";

        document.getElementById("buyProductPrice").innerText =
            Number(plan.price || 0).toFixed(2);

        document.getElementById("loginUser").innerHTML =
            "<b>Logged in:</b> " + currentUser.email;

        buyModal.style.display = "flex";

    } catch (error) {

        console.error("Open Buy Error:", error);

        alert("Something went wrong.");

    }
}

// ==========================
// CLOSE MODAL
// ==========================

closeModal.onclick = () => {
    buyModal.style.display = "none";
};

window.onclick = (e) => {

    if (e.target === buyModal) {
        buyModal.style.display = "none";
    }

};

// ==========================
// CONFIRM BUY
// ==========================

confirmBuyBtn.addEventListener("click", async () => {

    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    if (!selectedProduct) {
        alert("Please select a product.");
        return;
    }

    if (confirmBuyBtn.disabled) {
        return;
    }

    const oldText = confirmBuyBtn.innerText;

    confirmBuyBtn.disabled = true;
    confirmBuyBtn.innerText = "Processing...";

    try {

        // ==========================
        // FIND CUSTOMER
        // ==========================

        const customerSnap = await db
            .collection("customers")
            .where("email", "==", currentUser.email)
            .limit(1)
            .get();

        if (customerSnap.empty) {
            throw new Error("Customer account not found.");
        }

        const customerDoc =
            customerSnap.docs[0];

        const customerRef =
            customerDoc.ref;

        const customerData =
            customerDoc.data();

        const customerName =
            customerData.name || "Customer";

        const customerPhone =
            customerData.phone || "";

        const price =
            Number(selectedProduct.price || 0);

        if (price <= 0) {
            throw new Error("Invalid product price.");
        }

        // ==========================
        // ORDER ID
        // ==========================

        const orderId =
            "ORD-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 7)
                .toUpperCase();

        const productRef =
            db.collection("products")
                .doc(selectedProduct.id);

        const orderRef =
            db.collection("orders")
                .doc();

        const transactionRef =
            db.collection("balanceTransactions")
                .doc();

        // ==========================
        // FIRESTORE TRANSACTION
        // ==========================

        await db.runTransaction(async (transaction) => {

            const customerSnap =
                await transaction.get(customerRef);

            const productSnap =
                await transaction.get(productRef);

            if (!customerSnap.exists) {
                throw new Error(
                    "Customer account not found."
                );
            }

            if (!productSnap.exists) {
                throw new Error(
                    "Product no longer exists."
                );
            }

            const customer =
                customerSnap.data();

            const product =
                productSnap.data();

            const balance =
                Number(customer.balance || 0);

            // ==========================
            // BALANCE CHECK
            // ==========================

            if (balance < price) {

                throw new Error(
                    `INSUFFICIENT_BALANCE:${balance}`
                );

            }

            // ==========================
            // PLAN CHECK
            // ==========================

            if (
                !product.plans ||
                !product.plans[selectedProduct.planIndex]
            ) {

                throw new Error(
                    "Selected plan no longer exists."
                );

            }

            const plans =
                [...product.plans];

            const plan =
                {
                    ...plans[selectedProduct.planIndex]
                };

            const stock =
                Number(plan.stock || 0);

            if (stock <= 0) {
                throw new Error("OUT_OF_STOCK");
            }

            // ==========================
            // DEDUCT BALANCE
            // ==========================

            transaction.update(
                customerRef,
                {
                    balance:
                        balance - price
                }
            );

            // ==========================
            // REDUCE STOCK
            // ==========================

            plan.stock = stock - 1;

            plans[selectedProduct.planIndex] =
                plan;

            transaction.update(
                productRef,
                {
                    plans: plans
                }
            );

            // ==========================
            // CREATE ORDER
            // ==========================

            transaction.set(
                orderRef,
                {

                    uid:
                        currentUser.uid,

                    orderId:
                        orderId,

                    customerId:
                        customerRef.id,

                    customerName:
                        customerName,

                    customerEmail:
                        currentUser.email,

                    customerPhone:
                        customerPhone,

                    productId:
                        selectedProduct.id,

                    productName:
                        selectedProduct.productName,

                    planName:
                        selectedProduct.planName,

                    planIndex:
                        selectedProduct.planIndex,

                    price:
                        price,

                    paymentMethod:
                        "Wallet Balance",

                    paymentStatus:
                        "Approved",

                    // IMPORTANT
                    status:
                        "Pending",

                    productKey:
                        "",

                    createdAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                }
            );

            // ==========================
            // WALLET TRANSACTION
            // ==========================

            transaction.set(
                transactionRef,
                {

                    uid:
                        currentUser.uid,

                    email:
                        currentUser.email,

                    customerId:
                        customerRef.id,

                    type:
                        "debit",

                    amount:
                        price,

                    orderId:
                        orderId,

                    status:
                        "Completed",

                    description:
                        `Purchase: ${selectedProduct.productName} - ${selectedProduct.planName}`,

                    createdAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                }
            );

        });

        // ==========================
        // TELEGRAM IMMEDIATE NOTIFICATION
        // ==========================

        try {

            await fetch(
                "https://vip-admin-panel-1.onrender.com/new-order",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        orderId:
                            orderId,

                        name:
                            customerName,

                        email:
                            currentUser.email,

                        phone:
                            customerPhone,

                        product:
                            selectedProduct.productName,

                        plan:
                            selectedProduct.planName,

                        amount:
                            price,

                        paymentMethod:
                            "Wallet Balance"

                    })

                }
            );

        } catch (telegramError) {

            console.error(
                "Telegram notification failed:",
                telegramError
            );

        }

        // ==========================
        // CLOSE BUY MODAL
        // ==========================

        buyModal.style.display = "none";

        // ==========================
        // SILENT 10 SECOND PROCESSING
        // CUSTOMER TIMER DEKHBE NA
        // ==========================

        await new Promise(resolve => {
            setTimeout(resolve, 10000);
        });

        // ==========================
        // CUSTOMER SUCCESS
        // ==========================

        alert(
            "✅ Order placed successfully!\n\n" +
            "Order ID: " +
            orderId +
            "\n\n" +
            "🔑 Key Pending\n" +
            "Your key will appear after delivery."
        );

    } catch (error) {

        console.error(
            "Purchase Error:",
            error
        );

        if (
            error.message ===
            "OUT_OF_STOCK"
        ) {

            alert(
                "❌ Sorry, this product is out of stock."
            );

        } else if (
            error.message.startsWith(
                "INSUFFICIENT_BALANCE:"
            )
        ) {

            const balance =
                error.message.split(":")[1];

            alert(
                "❌ Insufficient wallet balance.\n\n" +
                "Required: ₹" +
                Number(
                    selectedProduct.price
                ).toFixed(2) +
                "\n" +
                "Available: ₹" +
                Number(balance).toFixed(2)
            );

        } else {

            alert(
                "❌ Purchase failed.\n\n" +
                error.message
            );

        }

    } finally {

        confirmBuyBtn.disabled = false;

        confirmBuyBtn.innerText =
            oldText;

    }

});

// ==========================
// MY ORDERS
// ==========================

document.getElementById("myOrdersBtn").onclick = () => {

    window.location.href =
        "my-order.html";

};

// ==========================
// LOGOUT
// ==========================

document.getElementById("logoutBtn").onclick = async () => {

    if (confirm("Logout?")) {

        await firebase.auth().signOut();

        window.location.href =
            "login.html";

    }

};