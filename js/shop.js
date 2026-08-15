let currentUser = null;
let selectedProduct = null;
let walletBalanceUnsubscribe = null;

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
    document.documentElement.classList.add("auth-ready");

    loadProducts();
    loadWalletBalance();
});

// ==========================
// LIVE WALLET BALANCE
// ==========================

function loadWalletBalance() {

    if (!currentUser) return;

    if (walletBalanceUnsubscribe) {
        walletBalanceUnsubscribe();
    }

    walletBalanceUnsubscribe = db
        .collection("customers")
        .where("email", "==", currentUser.email)
        .limit(1)
        .onSnapshot((snapshot) => {

            const balanceElement =
                document.getElementById(
                    "shopWalletBalance"
                );

            if (!balanceElement) return;

            if (snapshot.empty) {

                balanceElement.innerText =
                    "0.00";

                return;
            }

            const customer =
                snapshot.docs[0].data();

            const balance =
                Number(customer.balance || 0);

            balanceElement.innerText =
                balance.toFixed(2);

        }, (error) => {

            console.error(
                "Wallet balance error:",
                error
            );

        });
}

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
// TELEGRAM NOTIFICATION
// SEND WITHOUT WAITING
// ==========================

fetch(
    "https://vip-admin-panel-1.onrender.com/new-order",
    {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            orderId: orderId,

            name: customerName,

            email: currentUser.email,

            phone: customerPhone,

            product:
                selectedProduct.productName,

            plan:
                selectedProduct.planName,

            amount: price,

            paymentMethod:
                "Wallet Balance"

        })
    }
)
.then(async (response) => {

    const result =
        await response.json().catch(() => null);

    console.log(
        "Telegram notification response:",
        result
    );

})
.catch((telegramError) => {

    console.error(
        "Telegram notification failed:",
        telegramError
    );

});


// ==========================
// CLOSE BUY MODAL
// ==========================

buyModal.style.display = "none";


// ==========================
// BEAUTIFUL SUCCESS NOTIFICATION
// NO 10 SECOND DELAY
// ==========================

showOrderSuccess(
    orderId,
    selectedProduct.productName,
    selectedProduct.planName,
    price
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
// ======================================================
// BEAUTIFUL ORDER SUCCESS POPUP
// ======================================================

function showOrderSuccess(
    orderId,
    productName,
    planName,
    price
) {

    // Remove old popup if exists
    const oldPopup =
        document.getElementById(
            "orderSuccessPopup"
        );

    if (oldPopup) {
        oldPopup.remove();
    }


    // ==========================
    // ADD STYLE
    // ==========================

    if (
        !document.getElementById(
            "orderSuccessStyle"
        )
    ) {

        const style =
            document.createElement("style");

        style.id =
            "orderSuccessStyle";

        style.innerHTML = `

        #orderSuccessPopup {

            position: fixed;

            inset: 0;

            z-index: 999999;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(0, 0, 0, 0.72);

            backdrop-filter:
                blur(8px);

            animation:
                popupFadeIn
                0.25s ease;

        }


        .order-success-box {

            width: 100%;

            max-width: 380px;

            padding: 28px 22px;

            border-radius: 24px;

            text-align: center;

            background:
                linear-gradient(
                    145deg,
                    #071b35,
                    #062c42
                );

            border:
                1px solid
                rgba(0, 220, 255, 0.35);

            box-shadow:
                0 20px 60px
                rgba(0, 0, 0, 0.55),

                0 0 35px
                rgba(0, 200, 255, 0.15);

            color: white;

            transform:
                scale(0.9);

            animation:
                popupScale
                0.3s ease
                forwards;

        }


        .success-icon {

            width: 70px;

            height: 70px;

            margin:
                0 auto 16px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 50%;

            font-size: 34px;

            background:
                linear-gradient(
                    135deg,
                    #00e676,
                    #00bfa5
                );

            box-shadow:
                0 0 30px
                rgba(0, 230, 118, 0.35);

        }


        .order-success-box h2 {

            margin:
                0 0 8px;

            font-size: 24px;

            font-weight: 700;

        }


        .success-subtitle {

            margin:
                0 0 20px;

            color:
                rgba(255,255,255,0.72);

            font-size: 14px;

        }


        .order-info {

            text-align: left;

            padding: 15px;

            border-radius: 16px;

            background:
                rgba(255,255,255,0.06);

            border:
                1px solid
                rgba(255,255,255,0.08);

            margin-bottom: 20px;

        }


        .order-info-row {

            display: flex;

            justify-content: space-between;

            gap: 10px;

            margin-bottom: 10px;

            font-size: 13px;

        }


        .order-info-row:last-child {

            margin-bottom: 0;

        }


        .order-label {

            color:
                rgba(255,255,255,0.55);

        }


        .order-value {

            text-align: right;

            font-weight: 600;

            color: white;

            word-break: break-word;

        }


        .pending-text {

            margin-bottom: 20px;

            padding: 11px;

            border-radius: 12px;

            background:
                rgba(255,193,7,0.10);

            border:
                1px solid
                rgba(255,193,7,0.22);

            color:
                #ffd54f;

            font-size: 13px;

        }


        .success-ok-btn {

            width: 100%;

            border: none;

            padding: 13px;

            border-radius: 14px;

            font-size: 15px;

            font-weight: 700;

            color: white;

            cursor: pointer;

            background:
                linear-gradient(
                    135deg,
                    #006eff,
                    #00c6ff
                );

            box-shadow:
                0 8px 25px
                rgba(0,150,255,0.25);

        }


        .success-ok-btn:active {

            transform:
                scale(0.97);

        }


        @keyframes popupFadeIn {

            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }

        }


        @keyframes popupScale {

            from {
                transform:
                    scale(0.88);

                opacity: 0;
            }

            to {
                transform:
                    scale(1);

                opacity: 1;
            }

        }

        `;

        document.head.appendChild(style);
    }


    // ==========================
    // CREATE POPUP
    // ==========================

    const popup =
        document.createElement("div");

    popup.id =
        "orderSuccessPopup";


    popup.innerHTML = `

        <div class="order-success-box">

            <div class="success-icon">
                ✓
            </div>

            <h2>
                Order Confirmed!
            </h2>

            <p class="success-subtitle">
                Your order has been placed successfully.
            </p>


            <div class="order-info">

                <div class="order-info-row">

                    <span class="order-label">
                        Order ID
                    </span>

                    <span class="order-value">
                        ${orderId}
                    </span>

                </div>


                <div class="order-info-row">

                    <span class="order-label">
                        Product
                    </span>

                    <span class="order-value">
                        ${productName}
                    </span>

                </div>


                <div class="order-info-row">

                    <span class="order-label">
                        Plan
                    </span>

                    <span class="order-value">
                        ${planName}
                    </span>

                </div>


                <div class="order-info-row">

                    <span class="order-label">
                        Amount
                    </span>

                    <span class="order-value">
                        ₹${Number(price).toFixed(2)}
                    </span>

                </div>

            </div>


            <div class="pending-text">

                🔑 Your key is currently pending.
                <br>
                It will appear here after delivery.

            </div>


            <button
                class="success-ok-btn"
                id="successOkBtn">

                Done

            </button>

        </div>

    `;


    document.body.appendChild(popup);


    // ==========================
    // DONE BUTTON
    // ==========================

  document.getElementById(
    "successOkBtn"
).onclick = () => {

    popup.remove();

    window.location.href =
        "my-order.html";

};


    // ==========================
    // CLICK OUTSIDE
    // ==========================

    popup.onclick = (e) => {

        if (
            e.target === popup
        ) {

            popup.remove();

        }

    };

}

// ==========================================
// SHOP HEADER - LIVE WALLET BALANCE
// ==========================================

firebase.auth().onAuthStateChanged(async (user) => {

    if (!user) {
        return;
    }

    const balanceElement =
        document.getElementById("shopWalletBalance");

    if (!balanceElement) {
        return;
    }

    try {

        const customerSnap = await db
            .collection("customers")
            .where("email", "==", user.email)
            .limit(1)
            .get();

        if (customerSnap.empty) {

            balanceElement.innerText = "0.00";

            return;
        }

        const customerData =
            customerSnap.docs[0].data();

        const balance =
            Number(
                customerData.balance || 0
            );

        balanceElement.innerText =
            balance.toFixed(2);

    } catch (error) {

        console.error(
            "Wallet Balance Error:",
            error
        );

        balanceElement.innerText =
            "0.00";
    }

});