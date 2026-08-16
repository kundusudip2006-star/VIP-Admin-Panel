// ======================================================
// VIP PANEL STORE
// SHOP SYSTEM
// ======================================================

// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentUser = null;
let selectedProduct = null;

let walletBalanceUnsubscribe = null;
let productsUnsubscribe = null;


// ======================================================
// DOM ELEMENTS
// ======================================================

const productList =
    document.getElementById("productList");

const buyModal =
    document.getElementById("buyModal");

const closeModal =
    document.getElementById("closeModal");

const confirmBuyBtn =
    document.getElementById("confirmBuyBtn");


// ======================================================
// AUTH
// ======================================================

firebase.auth().onAuthStateChanged(async (user) => {

    if (!user) {

        window.location.replace("login.html");

        return;
    }

    currentUser = user;

    console.log(
        "Logged in user:",
        user.uid,
        user.email
    );


    document.documentElement.classList.remove(
        "auth-loading"
    );

    document.documentElement.classList.add(
        "auth-ready"
    );


    // Load products
    loadProducts();


    // Load wallet
    loadWalletBalance();

});


// ======================================================
// WALLET BALANCE
// ONLY ONE LISTENER
// ======================================================

function loadWalletBalance() {

    if (!currentUser) {
        return;
    }


    // Remove previous listener
    if (walletBalanceUnsubscribe) {

        walletBalanceUnsubscribe();

        walletBalanceUnsubscribe = null;
    }


    const balanceElement =
        document.getElementById(
            "shopWalletBalance"
        );


    if (!balanceElement) {

        console.warn(
            "shopWalletBalance element not found."
        );

        return;
    }


    balanceElement.innerText =
        "Loading...";


    // ==================================================
    // IMPORTANT
    // Customer document ID MUST be Firebase Auth UID
    // ==================================================

    const customerRef =
        db.collection("customers")
            .doc(currentUser.uid);


    walletBalanceUnsubscribe =
        customerRef.onSnapshot(

            (doc) => {

                console.log(
                    "Customer wallet snapshot:",
                    doc.exists
                );


                if (!doc.exists) {

                    balanceElement.innerText =
                        "0.00";

                    console.warn(
                        "Customer document not found:",
                        currentUser.uid
                    );

                    return;
                }


                const customer =
                    doc.data();


                const balance =
                    Number(
                        customer.balance || 0
                    );


                balanceElement.innerText =
                    balance.toFixed(2);


                console.log(
                    "Wallet balance:",
                    balance
                );

            },

            (error) => {

                console.error(
                    "Wallet Balance Error:",
                    error
                );


                balanceElement.innerText =
                    "0.00";

            }

        );

}


// ======================================================
// LOAD PRODUCTS
// ======================================================

function loadProducts() {

    if (!productList) {

        console.error(
            "productList element not found."
        );

        return;
    }


    if (productsUnsubscribe) {

        productsUnsubscribe();

        productsUnsubscribe = null;
    }


    productList.innerHTML = `

        <p class="loading">
            Loading products...
        </p>

    `;


    productsUnsubscribe =
        db.collection("products")
            .orderBy("createdAt", "desc")
            .onSnapshot(

                (snapshot) => {

                    productList.innerHTML = "";


                    if (snapshot.empty) {

                        productList.innerHTML = `

                            <div class="empty-products">

                                <h3>
                                    No Products Available
                                </h3>

                                <p>
                                    Products will appear here.
                                </p>

                            </div>

                        `;

                        return;
                    }


                    snapshot.forEach((doc) => {

                        const product =
                            doc.data();


                        let plansHTML =
                            "";


                        if (
                            Array.isArray(
                                product.plans
                            )
                        ) {

                            product.plans.forEach(
                                (plan, index) => {

                                    const price =
                                        Number(
                                            plan.price || 0
                                        );


                                    const stock =
                                        Number(
                                            plan.stock || 0
                                        );


                                    const outOfStock =
                                        stock <= 0;


                                    plansHTML += `

                                        <div class="plan-box">

                                            <div class="plan-info">

                                                <b>
                                                    ${escapeHTML(
                                                        plan.name ||
                                                        "Plan"
                                                    )}
                                                </b>

                                                <br>

                                                <span>
                                                    ₹${price.toFixed(2)}
                                                </span>

                                            </div>


                                            <button

                                                class="buy-btn"

                                                ${
                                                    outOfStock
                                                        ? "disabled"
                                                        : ""
                                                }

                                                onclick="openBuy(
                                                    '${doc.id}',
                                                    ${index}
                                                )"

                                            >

                                                ${
                                                    outOfStock
                                                        ? "Out of Stock"
                                                        : "Buy"
                                                }

                                            </button>

                                        </div>

                                    `;

                                }
                            );

                        }


                        const image =
                            product.image ||
                            "";


                        const imageHTML =
                            image
                                ? `
                                    <img
                                        src="${escapeHTML(image)}"
                                        alt="${escapeHTML(
                                            product.name ||
                                            "Product"
                                        )}"
                                        onerror="this.style.display='none'"
                                    >
                                  `
                                : "";


                        productList.innerHTML += `

                            <div class="product-card">

                                ${imageHTML}


                                <h3>
                                    ${escapeHTML(
                                        product.name ||
                                        "Product"
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        product.description ||
                                        ""
                                    )}
                                </p>


                                <div class="plans-container">

                                    ${plansHTML}

                                </div>

                            </div>

                        `;

                    });

                },

                (error) => {

                    console.error(
                        "Product loading error:",
                        error
                    );


                    productList.innerHTML = `

                        <div class="wallet-error">

                            <p>
                                Unable to load products.
                            </p>

                            <button
                                onclick="location.reload()"
                            >
                                Try Again
                            </button>

                        </div>

                    `;

                }

            );

}


// ======================================================
// OPEN BUY MODAL
// ======================================================

async function openBuy(
    productId,
    planIndex
) {

    if (!currentUser) {

        showVIPAlert(
            "Please login first.",
            "warning",
            "Login Required"
        );

        return;
    }


    try {

        const productSnap =
            await db
                .collection("products")
                .doc(productId)
                .get();


        if (!productSnap.exists) {

            showVIPAlert(
                "This product no longer exists.",
                "error",
                "Product Not Found"
            );

            return;
        }


        const product =
            productSnap.data();


        if (
            !Array.isArray(product.plans) ||
            !product.plans[planIndex]
        ) {

            showVIPAlert(
                "The selected plan could not be found.",
                "error",
                "Plan Not Found"
            );

            return;
        }


        const plan =
            product.plans[planIndex];


        const price =
            Number(plan.price || 0);


        const stock =
            Number(plan.stock || 0);


        if (stock <= 0) {

            showVIPAlert(
                "This plan is currently out of stock.",
                "warning",
                "Out of Stock"
            );

            return;
        }


        if (price <= 0) {

            showVIPAlert(
                "This product has an invalid price.",
                "error",
                "Invalid Price"
            );

            return;
        }


        selectedProduct = {

            id:
                productId,

            productName:
                product.name ||
                "Product",

            planName:
                plan.name ||
                "Plan",

            price:
                price,

            planIndex:
                planIndex

        };


        const productNameElement =
            document.getElementById(
                "buyProductName"
            );


        const productPriceElement =
            document.getElementById(
                "buyProductPrice"
            );


        const loginUserElement =
            document.getElementById(
                "loginUser"
            );


        if (productNameElement) {

            productNameElement.innerText =
                `${product.name || "Product"} (${plan.name || "Plan"})`;

        }


        if (productPriceElement) {

            productPriceElement.innerText =
                price.toFixed(2);

        }


        if (loginUserElement) {

            loginUserElement.innerHTML =
                `<b>Logged in:</b> ${
                    escapeHTML(
                        currentUser.email ||
                        currentUser.uid
                    )
                }`;

        }


        if (buyModal) {

            buyModal.style.display =
                "flex";

        }

    } catch (error) {

        console.error(
            "Open Buy Error:",
            error
        );


        showVIPAlert(
            error.message ||
            "Something went wrong.",
            "error",
            "Unable to Open Product"
        );

    }

}


// ======================================================
// CLOSE MODAL
// ======================================================

if (closeModal) {

    closeModal.onclick = () => {

        buyModal.style.display =
            "none";

        selectedProduct =
            null;

    };

}


window.addEventListener(
    "click",
    (event) => {

        if (
            buyModal &&
            event.target === buyModal
        ) {

            buyModal.style.display =
                "none";

            selectedProduct =
                null;
        }

    }
);


// ======================================================
// CONFIRM PURCHASE
// ======================================================

if (confirmBuyBtn) {

    confirmBuyBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                showVIPAlert(
                    "Please login first.",
                    "warning",
                    "Login Required"
                );

                return;
            }


            if (!selectedProduct) {

                showVIPAlert(
                    "Please select a product first.",
                    "warning",
                    "Product Required"
                );

                return;
            }


            if (confirmBuyBtn.disabled) {
                return;
            }


            const oldText =
                confirmBuyBtn.innerText;


            confirmBuyBtn.disabled =
                true;

            confirmBuyBtn.innerText =
                "Processing...";


            try {

                // ==========================================
                // CUSTOMER DOCUMENT
                // ==========================================

                const customerRef =
                    db.collection("customers")
                        .doc(currentUser.uid);


                // ==========================================
                // PRODUCT DOCUMENT
                // ==========================================

                const productRef =
                    db.collection("products")
                        .doc(
                            selectedProduct.id
                        );


                // ==========================================
                // ORDER
                // ==========================================

                const orderRef =
                    db.collection("orders")
                        .doc();


                // ==========================================
                // WALLET TRANSACTION
                // ==========================================

                const transactionRef =
                    db.collection(
                        "balanceTransactions"
                    )
                    .doc();


                const orderId =
                    "ORD-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .substring(2, 7)
                        .toUpperCase();


                // ==========================================
                // FIRESTORE TRANSACTION
                // ==========================================

                await db.runTransaction(
                    async (transaction) => {

                        const customerSnap =
                            await transaction.get(
                                customerRef
                            );


                        const productSnap =
                            await transaction.get(
                                productRef
                            );


                        if (!customerSnap.exists) {

                            throw new Error(
                                "CUSTOMER_NOT_FOUND"
                            );
                        }


                        if (!productSnap.exists) {

                            throw new Error(
                                "PRODUCT_NOT_FOUND"
                            );
                        }


                        const customer =
                            customerSnap.data();


                        const product =
                            productSnap.data();


                        const balance =
                            Number(
                                customer.balance ||
                                0
                            );


                        const price =
                            Number(
                                selectedProduct.price ||
                                0
                            );


                        // ==================================
                        // BALANCE CHECK
                        // ==================================

                        if (balance < price) {

                            throw new Error(
                                `INSUFFICIENT_BALANCE:${balance}`
                            );

                        }


                        // ==================================
                        // PLAN CHECK
                        // ==================================

                        if (
                            !Array.isArray(
                                product.plans
                            ) ||
                            !product.plans[
                                selectedProduct.planIndex
                            ]
                        ) {

                            throw new Error(
                                "PLAN_NOT_FOUND"
                            );

                        }


                        const plans =
                            product.plans.map(
                                (item) => ({
                                    ...item
                                })
                            );


                        const plan =
                            plans[
                                selectedProduct.planIndex
                            ];


                        const stock =
                            Number(
                                plan.stock || 0
                            );
                            if (stock <= 0) {

                            throw new Error(
                                "OUT_OF_STOCK"
                            );

                        }


                        // ==================================
                        // CUSTOMER NAME / PHONE
                        // ==================================

                        const customerName =
                            customer.name ||
                            "Customer";


                        const customerPhone =
                            customer.phone ||
                            "";


                        // ==================================
                        // DEDUCT BALANCE
                        // ==================================

                        transaction.update(
                            customerRef,
                            {

                                balance:
                                    balance -
                                    price

                            }
                        );


                        // ==================================
                        // REDUCE STOCK
                        // ==================================

                        plan.stock =
                            stock - 1;


                        plans[
                            selectedProduct.planIndex
                        ] =
                            plan;


                        transaction.update(
                            productRef,
                            {

                                plans:
                                    plans

                            }
                        );


                        // ==================================
                        // CREATE ORDER
                        // ==================================

                        transaction.set(
                            orderRef,
                            {

                                uid:
                                    currentUser.uid,

                                orderId:
                                    orderId,

                                customerId:
                                    currentUser.uid,

                                customerName:
                                    customerName,

                                customerEmail:
                                    currentUser.email ||
                                    "",

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


                        // ==================================
                        // CREATE WALLET TRANSACTION
                        // ==================================

                        transaction.set(
                            transactionRef,
                            {

                                uid:
                                    currentUser.uid,

                                email:
                                    currentUser.email ||
                                    "",

                                customerId:
                                    currentUser.uid,

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

                    }
                );


                // ==========================================
                // TELEGRAM NOTIFICATION
                // ==========================================

                fetch(
                    "https://vip-admin-panel-1.onrender.com/new-order",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                orderId:
                                    orderId,

                                uid:
                                    currentUser.uid,

                                email:
                                    currentUser.email ||
                                    "",

                                product:
                                    selectedProduct.productName,

                                plan:
                                    selectedProduct.planName,

                                amount:
                                    selectedProduct.price,

                                paymentMethod:
                                    "Wallet Balance"

                            })

                    }
                )
                .then(
                    async (response) => {

                        const result =
                            await response
                                .json()
                                .catch(
                                    () => null
                                );

                        console.log(
                            "Order notification:",
                            result
                        );

                    }
                )
                .catch(
                    (error) => {

                        console.error(
                            "Order notification error:",
                            error
                        );

                    }
                );


                // ==========================================
                // CLOSE MODAL
                // ==========================================

                if (buyModal) {

                    buyModal.style.display =
                        "none";

                }


                selectedProduct =
                    null;


                // ==========================================
                // SUCCESS
                // ==========================================

                showOrderSuccess(
                    orderId
                );


            } catch (error) {

                console.error(
                    "Purchase Error:",
                    error
                );


                if (
                    error.message ===
                    "CUSTOMER_NOT_FOUND"
                ) {

                    showVIPAlert(
                        "Your customer profile was not found. Please register again or contact the administrator.",
                        "error",
                        "Customer Profile Missing"
                    );

                }

                else if (
                    error.message ===
                    "PRODUCT_NOT_FOUND"
                ) {

                    showVIPAlert(
                        "This product no longer exists.",
                        "error",
                        "Product Not Found"
                    );

                }

                else if (
                    error.message ===
                    "PLAN_NOT_FOUND"
                ) {

                    showVIPAlert(
                        "The selected plan no longer exists.",
                        "error",
                        "Plan Not Found"
                    );

                }

                else if (
                    error.message ===
                    "OUT_OF_STOCK"
                ) {

                    showVIPAlert(
                        "This plan is out of stock.",
                        "warning",
                        "Out of Stock"
                    );

                }

                else if (
                    error.message &&
                    error.message.startsWith(
                        "INSUFFICIENT_BALANCE:"
                    )
                ) {

                    const balance =
                        Number(
                            error.message.split(":")[1]
                        );


                    showVIPAlert(
                        `Required: ₹${Number(
                            selectedProduct.price
                        ).toFixed(2)}<br><br>` +
                        `Available: ₹${balance.toFixed(2)}`,
                        "warning",
                        "Insufficient Balance"
                    );

                }

                else if (
                    error.code ===
                    "permission-denied"
                ) {

                    showVIPAlert(
                        "Firestore permission denied. Please check the Firebase Rules.",
                        "error",
                        "Permission Denied"
                    );

                }

                else {

                    showVIPAlert(
                        error.message ||
                        "Purchase failed. Please try again.",
                        "error",
                        "Purchase Failed"
                    );

                }

            } finally {

                confirmBuyBtn.disabled =
                    false;

                confirmBuyBtn.innerText =
                    oldText;

            }

        }
    );

}


// ======================================================
// MY ORDERS
// ======================================================

const myOrdersBtn =
    document.getElementById(
        "myOrdersBtn"
    );


if (myOrdersBtn) {

    myOrdersBtn.onclick = () => {

        window.location.href =
            "my-order.html";

    };

}


// ======================================================
// LOGOUT
// ======================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.onclick =
        async () => {

            try {

                await firebase.auth()
                    .signOut();

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );

            }

        };

}


// ======================================================
// ORDER SUCCESS
// ======================================================

function showOrderSuccess(
    orderId
) {

    showVIPAlert(

        `Order ID:<br><br>
         <strong>${escapeHTML(orderId)}</strong>
         <br><br>
         Your order has been placed successfully.
         <br><br>
         The product key will be provided after processing.`,

        "success",

        "Order Successful"

    );

}


// ======================================================
// VIP ALERT
// ======================================================

function showVIPAlert(
    message,
    type = "info",
    title = ""
) {

    const config = {

        success: {
            title: "Success",
            icon: "✓"
        },

        error: {
            title: "Something went wrong",
            icon: "!"
        },

        warning: {
            title: "Attention",
            icon: "!"
        },

        info: {
            title: "Notice",
            icon: "i"
        }

    };


    const data =
        config[type] ||
        config.info;


    const oldAlert =
        document.querySelector(
            ".vip-alert-overlay"
        );


    if (oldAlert) {

        oldAlert.remove();

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "vip-alert-overlay";


    overlay.innerHTML = `

        <div class="vip-alert ${type}">

            <button
                class="vip-alert-close"
                onclick="closeVIPAlert()">

                ×

            </button>


            <div class="vip-alert-icon">

                ${data.icon}

            </div>


            <div class="vip-alert-title">

                ${title || data.title}

            </div>


            <div
                class="vip-alert-message">

                ${message}

            </div>


            <button
                class="vip-alert-button"
                onclick="closeVIPAlert()">

                Continue

            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    requestAnimationFrame(() => {

        overlay.classList.add(
            "active"
        );

    });

}


// ======================================================
// CLOSE ALERT
// ======================================================

function closeVIPAlert() {

    const overlay =
        document.querySelector(
            ".vip-alert-overlay"
        );


    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "active"
    );


    setTimeout(() => {

        overlay.remove();

    }, 250);

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

    return String(value || "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}