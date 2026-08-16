// ==========================================================
// VIP PANEL STORE - ADMIN ORDER.JS
// Deliver Key + Cancel Order + Automatic Wallet Refund
// ==========================================================

const db = firebase.firestore();

let selectedOrderId = null;
let selectedOrder = null;


// ==========================================================
// ELEMENTS
// ==========================================================

const orderList =
    document.getElementById("orderList");

const orderModal =
    document.getElementById("orderModal");

const productKeyInput =
    document.getElementById("productKey");

const sendKeyBtn =
    document.getElementById("sendKeyBtn");


// ==========================================================
// CANCEL / REFUND BUTTON
// ==========================================================

let cancelOrderBtn =
    document.getElementById("cancelOrderBtn");


if (!cancelOrderBtn && orderModal) {

    cancelOrderBtn =
        document.createElement("button");

    cancelOrderBtn.id =
        "cancelOrderBtn";

    cancelOrderBtn.type =
        "button";

    cancelOrderBtn.innerHTML =
        '<i class="fa-solid fa-ban"></i> Cancel & Refund';

    cancelOrderBtn.style.cssText = `
        width:100%;
        margin-top:10px;
        padding:12px 14px;
        border:0;
        border-radius:12px;
        background:linear-gradient(135deg,#dc2626,#ef4444);
        color:#fff;
        font-weight:700;
        cursor:pointer;
    `;

    const modalContent =
        orderModal.querySelector(".modal-content") ||
        orderModal.firstElementChild ||
        orderModal;

    modalContent.appendChild(cancelOrderBtn);
}


// ==========================================================
// AUTH
// ==========================================================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }

    loadOrders();

});


// ==========================================================
// LOAD ORDERS
// ==========================================================

function loadOrders() {

    if (!orderList) {

        console.error(
            "orderList element not found."
        );

        return;
    }

    db.collection("orders")
        .orderBy("createdAt", "desc")
        .onSnapshot(

            (snapshot) => {

                orderList.innerHTML = "";

                if (snapshot.empty) {

                    orderList.innerHTML = `
                        <p style="
                            text-align:center;
                            padding:25px;
                        ">
                            No orders found.
                        </p>
                    `;

                    return;
                }


                snapshot.forEach((doc) => {

                    const order =
                        doc.data();

                    const status =
                        order.status ||
                        "Pending";


                    let statusClass =
                        "pending";


                    if (
                        status ===
                        "Delivered"
                    ) {

                        statusClass =
                            "delivered";

                    }


                    if (
                        status ===
                        "Delivery Failed"
                    ) {

                        statusClass =
                            "failed";

                    }


                    let dateText =
                        "-";


                    if (order.createdAt) {

                        try {

                            dateText =
                                order.createdAt
                                    .toDate()
                                    .toLocaleString();

                        } catch (e) {

                            dateText =
                                "-";

                        }

                    }


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "order-card";


                    card.innerHTML = `

                        <h3>
                            ${escapeHTML(
                                order.productName ||
                                "Product"
                            )}
                        </h3>


                        <p>
                            <b>Order ID:</b>
                            ${escapeHTML(
                                order.orderId ||
                                doc.id
                            )}
                        </p>


                        <p>
                            <b>Customer:</b>
                            ${escapeHTML(
                                order.customerName ||
                                "Customer"
                            )}
                        </p>


                        <p>
                            <b>Email:</b>
                            ${escapeHTML(
                                order.customerEmail ||
                                "-"
                            )}
                        </p>


                        <p>
                            <b>Plan:</b>
                            ${escapeHTML(
                                order.planName ||
                                "N/A"
                            )}
                        </p>


                        <p>
                            <b>Price:</b>
                            ₹${Number(
                                order.price || 0
                            ).toFixed(2)}
                        </p>


                        <p>
                            <b>Payment:</b>
                            ${escapeHTML(
                                order.paymentStatus ||
                                "Pending"
                            )}
                        </p>


                        <p>

                            <b>Status:</b>

                            <span
                                class="${statusClass}"
                            >
                                ${escapeHTML(
                                    status
                                )}
                            </span>

                        </p>


                        <p>

                            <b>Date:</b>

                            ${escapeHTML(
                                dateText
                            )}

                        </p>


                        <button
                            type="button"
                            class="view-order-btn"
                            data-order-id="${doc.id}"
                        >
                            View / Manage Order
                        </button>

                    `;


                    orderList.appendChild(
                        card
                    );

                });


                document
                    .querySelectorAll(
                        ".view-order-btn"
                    )
                    .forEach((button) => {

                        button.onclick =
                            () => {

                                openOrder(
                                    button.dataset
                                        .orderId
                                );

                            };

                    });

            },


            (error) => {

                console.error(
                    "Load Orders Error:",
                    error
                );


                orderList.innerHTML = `

                    <p style="
                        text-align:center;
                        padding:25px;
                    ">

                        Unable to load orders.

                    </p>

                `;

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


        selectedOrderId =
            orderId;


        selectedOrder =
            orderDoc.data();


        if (productKeyInput) {

            productKeyInput.value =
                selectedOrder.productKey ||
                "";

        }


        if (orderModal) {

            orderModal.style.display =
                "flex";

        }


        updateCancelButton();


    } catch (error) {

        console.error(
            "Open Order Error:",
            error
        );


        alert(
            "❌ " +
            error.message
        );

    }

}


// ==========================================================
// CLOSE MODAL
// ==========================================================

function closeOrderModal() {

    if (orderModal) {

        orderModal.style.display =
            "none";

    }


    selectedOrderId =
        null;


    selectedOrder =
        null;


    if (productKeyInput) {

        productKeyInput.value =
            "";

    }

}


window.closeOrderModal =
    closeOrderModal;


// ==========================================================
// CLOSE MODAL - OUTSIDE CLICK
// ==========================================================

if (orderModal) {

    orderModal.addEventListener(
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

}


// ==========================================================
// UPDATE CANCEL BUTTON
// ==========================================================

function updateCancelButton() {

    if (
        !cancelOrderBtn ||
        !selectedOrder
    ) {

        return;

    }


    const status =
        selectedOrder.status ||
        "Pending";


    const hasKey =
        selectedOrder.productKey &&
        String(
            selectedOrder.productKey
        ).trim() !== "";


    if (
        status === "Delivered" ||
        status === "Delivery Failed" ||
        hasKey
    ) {

        cancelOrderBtn.disabled =
            true;


        cancelOrderBtn.style.opacity =
            "0.5";


        if (
            status ===
            "Delivery Failed"
        ) {

            cancelOrderBtn.innerHTML =
                "Already Refunded";

        } else {

            cancelOrderBtn.innerHTML =
                "Order Cannot Be Cancelled";

        }

    } else {

        cancelOrderBtn.disabled =
            false;


        cancelOrderBtn.style.opacity =
            "1";


        cancelOrderBtn.innerHTML =
            '<i class="fa-solid fa-ban"></i> Cancel & Refund';

    }

}


// ==========================================================
// SEND / DELIVER KEY
// ==========================================================

if (sendKeyBtn) {

    sendKeyBtn.addEventListener(
        "click",
        async () => {

            try {

                if (!selectedOrderId) {

                    alert(
                        "Order not selected."
                    );

                    return;

                }


                const key =
                    productKeyInput
                        ? productKeyInput.value.trim()
                        : "";


                if (!key) {

                    alert(
                        "Enter Product Key."
                    );

                    return;

                }


                sendKeyBtn.disabled =
                    true;


                sendKeyBtn.innerText =
                    "Delivering...";


                const orderRef =
                    db.collection("orders")
                        .doc(selectedOrderId);


                const orderDoc =
                    await orderRef.get();


                if (!orderDoc.exists) {

                    throw new Error(
                        "Order not found."
                    );

                }


                const order =
                    orderDoc.data();


                // PAYMENT CHECK

                if (
                    order.paymentMethod !==
                    "Wallet Balance"
                ) {

                    if (
                        order.paymentStatus !==
                        "Paid"
                    ) {

                        throw new Error(
                            "Payment is not approved."
                        );

                    }

                }


                // CANCELLED ORDER CHECK

                if (
                    order.status ===
                    "Delivery Failed"
                ) {

                    throw new Error(
                        "This order has already been cancelled/refunded."
                    );

                }


                // ALREADY DELIVERED

                if (
                    order.productKey &&
                    String(
                        order.productKey
                    ).trim() !== ""
                ) {

                    throw new Error(
                        "Key has already been delivered."
                    );

                }


                // SAVE KEY

                await orderRef.update({

                    productKey:
                        key,

                    status:
                        "Delivered",

                    deliveredAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                });


                alert(
                    "✅ Key Delivered Successfully!"
                );


                closeOrderModal();


            } catch (error) {

                console.error(
                    "Deliver Key Error:",
                    error
                );


                alert(
                    "❌ " +
                    error.message
                );


            } finally {

                sendKeyBtn.disabled =
                    false;


                sendKeyBtn.innerText =
                    "Deliver Key";

            }

        }
    );

}


// ==========================================================
// CANCEL ORDER + WALLET REFUND
// ==========================================================

if (cancelOrderBtn) {

    cancelOrderBtn.addEventListener(
        "click",
        async () => {

            try {

                if (!selectedOrderId) {

                    alert(
                        "Order not selected."
                    );

                    return;

                }


                const orderRef =
                    db.collection("orders")
                        .doc(selectedOrderId);


                const orderDoc =
                    await orderRef.get();


                if (!orderDoc.exists) {

                    throw new Error(
                        "Order not found."
                    );

                }


                const order =
                    orderDoc.data();


                const price =
                    Number(
                        order.price || 0
                    );


                if (price <= 0) {

                    throw new Error(
                        "Invalid refund amount."
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


                // ALREADY REFUNDED

                if (
                    order.status ===
                    "Delivery Failed"
                ) {

                    throw new Error(
                        "This order has already been cancelled/refunded."
                    );

                }


                // PRODUCT KEY CHECK

                if (
                    order.productKey &&
                    String(
                        order.productKey
                    ).trim() !== ""
                ) {

                    throw new Error(
                        "A product key already exists. Refund is blocked."
                    );

                }


                // WALLET PAYMENT CHECK

                if (
                    order.paymentMethod !==
                    "Wallet Balance"
                ) {

                    throw new Error(
                        "Automatic wallet refund is only available for Wallet Balance orders."
                    );

                }


                // CUSTOMER ID

                const customerId =
                    order.customerId;


                if (!customerId) {

                    throw new Error(
                        "Customer ID is missing from this order."
                    );

                }


                const customerRef =
                    db.collection(
                        "customers"
                    )
                    .doc(customerId);


                // UNIQUE REFUND ID

                const refundTransactionId =
                    "REFUND-" +
                    String(
                        order.orderId ||
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
                    .doc(
                        refundTransactionId
                    );


                // CONFIRM

                const confirmed =
                    confirm(

                        "Cancel this order?\n\n" +

                        "Refund: ₹" +
                        price.toFixed(2) +

                        "\n\n" +

                        "The amount will be added to the customer's wallet."

                    );


                if (!confirmed) {

                    return;

                }


                cancelOrderBtn.disabled =
                    true;


                cancelOrderBtn.innerText =
                    "Refunding...";


                // ==================================================
                // FIRESTORE TRANSACTION
                // ==================================================

                await db.runTransaction(
                    async (transaction) => {

                        const freshOrderSnap =
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


                        if (
                            !freshOrderSnap.exists
                        ) {

                            throw new Error(
                                "Order not found."
                            );

                        }


                        if (
                            !customerSnap.exists
                        ) {

                            throw new Error(
                                "Customer account not found."
                            );

                        }


                        const freshOrder =
                            freshOrderSnap.data();


                        // DOUBLE REFUND PROTECTION

                        if (
                            freshOrder.status ===
                            "Delivery Failed"
                        ) {

                            throw new Error(
                                "This order was already refunded."
                            );

                        }


                        // DELIVERED CHECK

                        if (
                            freshOrder.status ===
                            "Delivered"
                        ) {

                            throw new Error(
                                "Delivered order cannot be refunded."
                            );

                        }


                        // KEY CHECK

                        if (
                            freshOrder.productKey &&
                            String(
                                freshOrder.productKey
                            ).trim() !== ""
                        ) {

                            throw new Error(
                                "Product key already exists."
                            );

                        }


                        // REFUND RECORD CHECK

                        if (
                            refundSnap.exists
                        ) {

                            throw new Error(
                                "Refund transaction already exists."
                            );

                        }


                        const customer =
                            customerSnap.data();


                        const oldBalance =
                            Number(
                                customer.balance ||
                                0
                            );


                        const newBalance =
                            oldBalance +
                            price;


                        // ==================================================
                        // 1. ADD MONEY TO WALLET
                        // ==================================================

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


                        // ==================================================
                        // 2. UPDATE ORDER
                        // ==================================================

                        transaction.update(
                            orderRef,
                            {

                                status:
                                    "Delivery Failed",

                                paymentStatus:
                                    "Refunded",

                                refundAmount:
                                    price,

                                refundStatus:
                                    "Completed",

                                refundedAt:
                                    firebase.firestore
                                        .FieldValue
                                        .serverTimestamp()

                            }
                        );


                        // ==================================================
                        // 3. CREATE REFUND TRANSACTION
                        // ==================================================

                        transaction.set(
                            refundRef,
                            {

                                uid:
                                    freshOrder.uid ||
                                    "",

                                email:
                                    freshOrder.customerEmail ||
                                    "",

                                customerId:
                                    customerId,

                                type:
                                    "credit",

                                amount:
                                    price,

                                orderId:
                                    freshOrder.orderId ||
                                    selectedOrderId,

                                status:
                                    "Completed",

                                transactionType:
                                    "Refund",

                                description:
                                    "Refund: " +
                                    (
                                        freshOrder.productName ||
                                        "Product"
                                    ) +
                                    " - " +
                                    (
                                        freshOrder.planName ||
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


                // SUCCESS

                alert(

                    "✅ Order cancelled successfully.\n\n" +

                    "₹" +
                    price.toFixed(2) +

                    " has been refunded to the customer's wallet."

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
                        '<i class="fa-solid fa-ban"></i> Cancel & Refund';


                    updateCancelButton();

                }

            }

        }
    );

}


// ==========================================================
// HTML ESCAPE
// ==========================================================

function escapeHTML(value) {

    return String(value)

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