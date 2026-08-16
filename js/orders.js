// ==========================================================
// VIP PANEL STORE - ADMIN ORDERS
// Deliver Key + Cancel Order + Wallet Refund
// ==========================================================

/* Firebase db is already created in firebase.js */

// ==========================================================
// STATE
// ==========================================================

let selectedOrderId = null;
let selectedOrder = null;
let ordersUnsubscribe = null;


// ==========================================================
// ELEMENTS
// ==========================================================

const orderTable =
    document.getElementById("orderTable");

const orderModal =
    document.getElementById("orderModal");

const closeModalBtn =
    document.getElementById("closeModal");

const productKeyInput =
    document.getElementById("productKey");

const sendKeyBtn =
    document.getElementById("sendKeyBtn");

const rejectPaymentBtn =
    document.getElementById("rejectPaymentBtn");

const cancelOrderBtn =
    document.getElementById("cancelOrderBtn");

const searchOrder =
    document.getElementById("searchOrder");

const statusFilter =
    document.getElementById("statusFilter");

const paymentFilter =
    document.getElementById("paymentFilter");


// ==========================================================
// AUTH
// ==========================================================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    loadOrders();
});


// ==========================================================
// LOAD ORDERS
// ==========================================================

function loadOrders() {

    if (!orderTable) {

        console.error(
            "orderTable element not found."
        );

        return;
    }

    if (ordersUnsubscribe) {
        ordersUnsubscribe();
    }

    ordersUnsubscribe = db
        .collection("orders")
        .orderBy("createdAt", "desc")
        .onSnapshot(
            (snapshot) => {

                orderTable.innerHTML = "";

                if (snapshot.empty) {

                    orderTable.innerHTML = `
                        <tr>
                            <td colspan="8"
                                style="text-align:center;padding:25px;">
                                No Orders Found
                            </td>
                        </tr>
                    `;

                    return;
                }

                snapshot.forEach((doc) => {

                    const order = doc.data();

                    const status =
                        order.status || "Pending";

                    const payment =
                        order.paymentStatus || "Pending";

                    const date =
                        formatDate(order.createdAt);

                    const row =
                        document.createElement("tr");

                    row.dataset.orderId = doc.id;

                    row.innerHTML = `

                        <td>
                            ${escapeHTML(
                                order.orderId || doc.id
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                order.customerName ||
                                "Customer"
                            )}

                            <br>

                            <small>
                                ${escapeHTML(
                                    order.customerEmail || ""
                                )}
                            </small>
                        </td>

                        <td>

                            ${escapeHTML(
                                order.productName ||
                                "Product"
                            )}

                            <br>

                            <small>
                                ${escapeHTML(
                                    order.planName || ""
                                )}
                            </small>

                        </td>

                        <td>
                            ₹${Number(
                                order.price || 0
                            ).toFixed(2)}
                        </td>

                        <td>

                            <span class="status-badge">
                                ${escapeHTML(status)}
                            </span>

                        </td>

                        <td>
                            ${escapeHTML(payment)}
                        </td>

                        <td>
                            ${escapeHTML(date)}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="view-order-btn"
                                data-id="${doc.id}"
                            >

                                <i class="fa-solid fa-eye"></i>

                                Manage

                            </button>

                        </td>
                    `;

                    orderTable.appendChild(row);
                });

                applyFilters();
            },

            (error) => {

                console.error(
                    "Load Orders Error:",
                    error
                );

                orderTable.innerHTML = `
                    <tr>
                        <td colspan="8"
                            style="text-align:center;padding:25px;color:red;">

                            Unable to load orders.

                            <br>

                            ${escapeHTML(error.message)}

                        </td>
                    </tr>
                `;
            }
        );
}


// ==========================================================
// EVENT DELEGATION
// ==========================================================

if (orderTable) {

    orderTable.addEventListener(
        "click",
        (event) => {

            const button =
                event.target.closest(
                    ".view-order-btn"
                );

            if (!button) return;

            openOrder(
                button.dataset.id
            );
        }
    );
}


// ==========================================================
// OPEN ORDER
// ==========================================================

async function openOrder(orderId) {

    try {

        const orderRef =
            db.collection("orders")
              .doc(orderId);

        const orderDoc =
            await orderRef.get();

        if (!orderDoc.exists) {

            throw new Error(
                "Order not found."
            );
        }

        selectedOrderId = orderId;

        selectedOrder =
            orderDoc.data();

        fillOrderModal(
            selectedOrder,
            orderId
        );

        updateButtons();

        if (orderModal) {

            orderModal.style.display =
                "flex";
        }

    } catch (error) {

        console.error(
            "Open Order Error:",
            error
        );

        alert(
            "❌ " + error.message
        );
    }
}


// ==========================================================
// FILL ORDER MODAL
// ==========================================================

function fillOrderModal(order, docId) {

    setText(
        "orderId",
        order.orderId || docId
    );

    setText(
        "orderDate",
        formatDate(order.createdAt)
    );

    setText(
        "customerName",
        order.customerName || "-"
    );

    setText(
        "customerEmail",
        order.customerEmail || "-"
    );

    setText(
        "customerPhone",
        order.customerPhone || "-"
    );

    setText(
        "productName",
        order.productName || "-"
    );

    setText(
        "productPlan",
        order.planName || "-"
    );

    setText(
        "productPrice",
        Number(
            order.price || 0
        ).toFixed(2)
    );

    setText(
        "paymentStatus",
        order.paymentStatus || "Pending"
    );

    setText(
        "orderStatus",
        order.status || "Pending"
    );

    setText(
        "deliveredDate",
        formatDate(order.deliveredAt)
    );

    setText(
        "refundStatus",
        order.refundStatus || "Not Refunded"
    );

    setText(
        "refundAmount",
        Number(
            order.refundAmount || 0
        ).toFixed(2)
    );


    // Product key

    if (productKeyInput) {

        productKeyInput.value =
            order.productKey || "";
    }


    // Screenshot

    const screenshotImg =
        document.getElementById(
            "paymentScreenshotImg"
        );

    const screenshotBtn =
        document.getElementById(
            "viewScreenshotBtn"
        );

    if (
        order.paymentScreenshot &&
        screenshotImg
    ) {

        screenshotImg.src =
            order.paymentScreenshot;

        screenshotImg.style.display =
            "block";

        if (screenshotBtn) {

            screenshotBtn.href =
                order.paymentScreenshot;

            screenshotBtn.style.display =
                "inline-block";
        }

    } else {

        if (screenshotImg) {

            screenshotImg.src = "";

            screenshotImg.style.display =
                "none";
        }

        if (screenshotBtn) {

            screenshotBtn.href = "#";

            screenshotBtn.style.display =
                "none";
        }
    }
}


// ==========================================================
// UPDATE BUTTONS
// ==========================================================

function updateButtons() {

    if (!selectedOrder) return;

    const status =
        selectedOrder.status || "Pending";

    const key =
        String(
            selectedOrder.productKey || ""
        ).trim();


    // SEND KEY

    if (sendKeyBtn) {

        if (
            status === "Delivered" ||
            status === "Delivery Failed" ||
            key !== ""
        ) {

            sendKeyBtn.disabled = true;

        } else {

            sendKeyBtn.disabled = false;
        }
    }


    // CANCEL / REFUND

    if (cancelOrderBtn) {

        if (
            status === "Delivered" ||
            status === "Delivery Failed" ||
            key !== "" ||
            selectedOrder.refundStatus === "Completed"
        ) {

            cancelOrderBtn.disabled = true;

            if (
                status === "Delivery Failed" ||
                selectedOrder.refundStatus === "Completed"
            ) {

                cancelOrderBtn.innerHTML =
                    '<i class="fa-solid fa-check"></i> Already Refunded';

            } else {

                cancelOrderBtn.innerHTML =
                    '<i class="fa-solid fa-ban"></i> Cannot Cancel';
            }

        } else {

            cancelOrderBtn.disabled = false;

            cancelOrderBtn.innerHTML =
                '<i class="fa-solid fa-ban"></i> Cancel Order & Refund';
        }
    }
}


// ==========================================================
// SEND PRODUCT KEY
// ==========================================================

if (sendKeyBtn) {

    sendKeyBtn.addEventListener(
        "click",
        async () => {

            try {

                if (!selectedOrderId) {

                    throw new Error(
                        "Order not selected."
                    );
                }

                const key =
                    productKeyInput
                        ? productKeyInput.value.trim()
                        : "";

                if (!key) {

                    throw new Error(
                        "Enter Product Key."
                    );
                }

                sendKeyBtn.disabled = true;

                sendKeyBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Delivering...';


                const orderRef =
                    db.collection("orders")
                      .doc(selectedOrderId);


                await db.runTransaction(
                    async (transaction) => {

                        const orderSnap =
                            await transaction.get(
                                orderRef
                            );

                        if (!orderSnap.exists) {

                            throw new Error(
                                "Order not found."
                            );
                        }

                        const order =
                            orderSnap.data();


                        if (
                            order.status ===
                            "Delivery Failed"
                        ) {

                            throw new Error(
                                "This order has already been cancelled."
                            );
                        }


                        if (
                            order.status ===
                            "Delivered"
                        ) {

                            throw new Error(
                                "This order is already delivered."
                            );
                        }


                        if (
                            order.productKey &&
                            String(
                                order.productKey
                            ).trim() !== ""
                        ) {

                            throw new Error(
                                "Product key already delivered."
                            );
                        }


                        transaction.update(
                            orderRef,
                            {

                                productKey: key,

                                status:
                                    "Delivered",

                                deliveredAt:
                                    firebase.firestore
                                        .FieldValue
                                        .serverTimestamp()
                            }
                        );
                    }
                );


                alert(
                    "✅ Product key delivered successfully."
                );

                closeOrderModal();

            } catch (error) {

                console.error(
                    "Deliver Key Error:",
                    error
                );

                alert(
                    "❌ " + error.message
                );

            } finally {

                if (sendKeyBtn) {

                    sendKeyBtn.disabled =
                        false;

                    sendKeyBtn.innerHTML =
                        '<i class="fa-solid fa-paper-plane"></i> Send Product Key';
                }

                updateButtons();
            }
        }
    );
}


// ==========================================================
// CANCEL ORDER + REFUND
// ==========================================================

if (cancelOrderBtn) {

    cancelOrderBtn.addEventListener(
        "click",
        async () => {

            try {

                if (!selectedOrderId) {

                    throw new Error(
                        "Order not selected."
                    );
                }


                const confirmed =
                    confirm(
                        "Cancel this order?\n\n" +
                        "The order will become Delivery Failed.\n" +
                        "The wallet amount will be refunded."
                    );

                if (!confirmed) return;


                cancelOrderBtn.disabled =
                    true;

                cancelOrderBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Refunding...';


                const orderRef =
                    db.collection("orders")
                      .doc(selectedOrderId);


                // IMPORTANT:
                // Customer ID is taken from
                // the order itself.

                const initialOrderSnap =
                    await orderRef.get();

                if (!initialOrderSnap.exists) {

                    throw new Error(
                        "Order not found."
                    );
                }


                const initialOrder =
                    initialOrderSnap.data();


                const customerId =
                    initialOrder.customerId ||
                    initialOrder.uid;


                if (!customerId) {

                    throw new Error(
                        "Customer ID missing."
                    );
                }


                const customerRef =
                    db.collection("customers")
                      .doc(customerId);


                const refundId =
                    "REFUND-" +
                    String(
                        initialOrder.orderId ||
                        selectedOrderId
                    )
                    .replace(
                        /[^a-zA-Z0-9_-]/g,
                        "_"
                    );


                const refundRef =
                    db.collection(
                        "balanceTransactions"
                    )
                    .doc(refundId);


                await db.runTransaction(
                    async (transaction) => {

                        // READ EVERYTHING FIRST

                        const orderSnap =
                            await transaction.get(
                                orderRef
                            );

                        const customerSnap =
                            await transaction.get(
                                customerRef
                            );

                        const refundSnap =
                            await transaction.get(
                                refundRef
                            );


                        if (!orderSnap.exists) {

                            throw new Error(
                                "Order not found."
                            );
                        }


                        if (!customerSnap.exists) {

                            throw new Error(
                                "Customer wallet not found."
                            );
                        }


                        const order =
                            orderSnap.data();


                        const customer =
                            customerSnap.data();


                        // DOUBLE REFUND PROTECTION

                        if (
                            order.status ===
                            "Delivery Failed" ||
                            order.refundStatus ===
                            "Completed"
                        ) {

                            throw new Error(
                                "This order has already been refunded."
                            );
                        }


                        // DELIVERED CHECK

                        if (
                            order.status ===
                            "Delivered"
                        ) {

                            throw new Error(
                                "Delivered orders cannot be refunded."
                            );
                        }


                        // KEY CHECK

                        if (
                            order.productKey &&
                            String(
                                order.productKey
                            ).trim() !== ""
                        ) {
                            throw new Error(
                                "Product key already delivered. Refund blocked."
                            );
                        }


                        // WALLET PAYMENT ONLY

                        if (
                            order.paymentMethod !==
                            "Wallet Balance"
                        ) {

                            throw new Error(
                                "This order was not paid using wallet balance."
                            );
                        }


                        // REFUND RECORD CHECK

                        if (refundSnap.exists) {

                            throw new Error(
                                "Refund transaction already exists."
                            );
                        }


                        const amount =
                            Number(
                                order.price || 0
                            );


                        if (amount <= 0) {

                            throw new Error(
                                "Invalid refund amount."
                            );
                        }


                        const oldBalance =
                            Number(
                                customer.balance || 0
                            );


                        const newBalance =
                            oldBalance + amount;


                        // ==========================================
                        // 1. ADD REFUND TO WALLET
                        // ==========================================

                        transaction.update(
                            customerRef,
                            {

                                balance:
                                    newBalance,

                                updatedAt:
                                    firebase.firestore
                                        .FieldValue
                                        .serverTimestamp()
                            }
                        );


                        // ==========================================
                        // 2. MARK ORDER DELIVERY FAILED
                        // ==========================================

                        transaction.update(
                            orderRef,
                            {

                                status:
                                    "Delivery Failed",

                                paymentStatus:
                                    "Refunded",

                                refundAmount:
                                    amount,

                                refundStatus:
                                    "Completed",

                                refundedAt:
                                    firebase.firestore
                                        .FieldValue
                                        .serverTimestamp()
                            }
                        );


                        // ==========================================
                        // 3. CREATE REFUND TRANSACTION
                        // ==========================================

                        transaction.set(
                            refundRef,
                            {

                                uid:
                                    order.uid || "",

                                email:
                                    order.customerEmail || "",

                                customerId:
                                    customerId,

                                type:
                                    "credit",

                                amount:
                                    amount,

                                orderId:
                                    order.orderId ||
                                    selectedOrderId,

                                status:
                                    "Completed",

                                transactionType:
                                    "Refund",

                                description:
                                    "Refund: " +
                                    (
                                        order.productName ||
                                        "Product"
                                    ) +
                                    " - " +
                                    (
                                        order.planName ||
                                        "Plan"
                                    ),

                                createdAt:
                                    firebase.firestore
                                        .FieldValue
                                        .serverTimestamp()
                            }
                        );

                    }
                );


                alert(
                    "✅ Order cancelled successfully.\n\n" +
                    "₹" +
                    Number(
                        initialOrder.price || 0
                    ).toFixed(2) +
                    " has been refunded to the wallet."
                );


                closeOrderModal();


            } catch (error) {

                console.error(
                    "Refund Error:",
                    error
                );

                alert(
                    "❌ Refund failed.\n\n" +
                    error.message
                );

            } finally {

                if (cancelOrderBtn) {

                    cancelOrderBtn.disabled =
                        false;

                    cancelOrderBtn.innerHTML =
                        '<i class="fa-solid fa-ban"></i> Cancel Order & Refund';
                }

                updateButtons();
            }
        }
    );
}


// ==========================================================
// REJECT PAYMENT
// ==========================================================

if (rejectPaymentBtn) {

    rejectPaymentBtn.addEventListener(
        "click",
        async () => {

            try {

                if (!selectedOrderId) {

                    throw new Error(
                        "Order not selected."
                    );
                }


                const confirmed =
                    confirm(
                        "Reject this payment?"
                    );

                if (!confirmed) return;


                rejectPaymentBtn.disabled =
                    true;

                rejectPaymentBtn.innerText =
                    "Rejecting...";


                await db
                    .collection("orders")
                    .doc(selectedOrderId)
                    .update({

                        paymentStatus:
                            "Rejected",

                        status:
                            "Cancelled",

                        rejectedAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()
                    });


                alert(
                    "Payment rejected successfully."
                );


                closeOrderModal();


            } catch (error) {

                console.error(
                    "Reject Payment Error:",
                    error
                );

                alert(
                    "❌ " + error.message
                );

            } finally {

                rejectPaymentBtn.disabled =
                    false;

                rejectPaymentBtn.innerHTML =
                    '<i class="fa-solid fa-xmark"></i> Reject Payment';
            }
        }
    );
}


// ==========================================================
// CLOSE MODAL
// ==========================================================

if (closeModalBtn) {

    closeModalBtn.addEventListener(
        "click",
        closeOrderModal
    );
}


window.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            orderModal
        ) {

            closeOrderModal();
        }
    }
);


function closeOrderModal() {

    if (orderModal) {

        orderModal.style.display =
            "none";
    }

    selectedOrderId = null;

    selectedOrder = null;

    if (productKeyInput) {

        productKeyInput.value = "";
    }
}


// ==========================================================
// SEARCH + FILTER
// ==========================================================

if (searchOrder) {

    searchOrder.addEventListener(
        "input",
        applyFilters
    );
}


if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        applyFilters
    );
}


if (paymentFilter) {

    paymentFilter.addEventListener(
        "change",
        applyFilters
    );
}


function applyFilters() {

    if (!orderTable) return;


    const search =
        String(
            searchOrder
                ? searchOrder.value
                : ""
        )
        .toLowerCase()
        .trim();


    const status =
        statusFilter
            ? statusFilter.value
            : "All";


    const payment =
        paymentFilter
            ? paymentFilter.value
            : "All";


    const rows =
        orderTable.querySelectorAll("tr");


    rows.forEach((row) => {

        const text =
            row.innerText.toLowerCase();


        const statusText =
            row.children[4]
                ? row.children[4]
                    .innerText
                    .trim()
                : "";


        const paymentText =
            row.children[5]
                ? row.children[5]
                    .innerText
                    .trim()
                : "";


        const searchMatch =
            !search ||
            text.includes(search);


        const statusMatch =
            status === "All" ||
            statusText.includes(status);


        const paymentMatch =
            payment === "All" ||
            paymentText.includes(payment);


        row.style.display =
            searchMatch &&
            statusMatch &&
            paymentMatch
                ? ""
                : "none";
    });
}


// ==========================================================
// LOGOUT
// ==========================================================

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await firebase
                    .auth()
                    .signOut();

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );

                alert(
                    "Logout failed."
                );
            }
        }
    );
}


// ==========================================================
// HELPERS
// ==========================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.innerText =
            value ?? "-";
    }
}


function formatDate(timestamp) {

    if (!timestamp) {

        return "-";
    }

    try {

        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            return timestamp
                .toDate()
                .toLocaleString();
        }

        return new Date(timestamp)
            .toLocaleString();

    } catch (error) {

        return "-";
    }
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}