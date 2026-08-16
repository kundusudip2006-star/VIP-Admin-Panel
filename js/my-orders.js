// ==========================
// AUTHENTICATION
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    loadOrders(user);

});

// ==========================
// ELEMENT
// ==========================

const orderList =
    document.getElementById("orderList");

// ==========================
// LOAD ORDERS REAL-TIME
// ==========================

function loadOrders(user) {

    db.collection("orders")
        .where("uid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .onSnapshot(

            (snapshot) => {

                orderList.innerHTML = "";

                if (snapshot.empty) {

                    orderList.innerHTML = `
                        <h2 style="text-align:center;">
                            No Orders Found
                        </h2>
                    `;

                    return;
                }

                snapshot.forEach((doc) => {

                    const order = doc.data();

                    // ==========================
                    // STATUS
                    // ==========================

                    let statusClass = "pending";
                    let statusText = "🔑 Key Pending";

                    // ==========================
                    // REFUNDED / DELIVERY FAILED
                    // ==========================

                    const isRefunded =
                        order.refundStatus === "refunded" ||
                        order.status === "Delivery Failed" ||
                        order.status === "delivery_failed";

                    if (isRefunded) {

                        statusClass = "refunded";

                        statusText =
                            "❌ Delivery Failed • 💰 Refunded";

                    }

                    // ==========================
                    // DELIVERED
                    // ==========================

                    else if (
                        order.status === "Delivered" &&
                        order.productKey &&
                        String(order.productKey).trim() !== ""
                    ) {

                        statusClass = "delivered";

                        statusText =
                            "✅ Key Delivered";

                    }

                    // ==========================
                    // DATE
                    // ==========================

                    let dateText = "-";

                    if (order.createdAt) {

                        try {

                            dateText =
                                order.createdAt
                                    .toDate()
                                    .toLocaleString();

                        } catch (e) {

                            dateText = "-";

                        }

                    }

                    // ==========================
                    // KEY / REFUND SECTION
                    // ==========================

                    let keyHTML = "";

                    // ==========================
                    // REFUND MESSAGE
                    // ==========================

                    if (isRefunded) {

                        keyHTML = `

                            <div
                                class="refund-box"
                                style="
                                    margin-top:15px;
                                    padding:14px;
                                    border-radius:12px;
                                    background:rgba(255,60,60,0.10);
                                    border:1px solid rgba(255,80,80,0.25);
                                "
                            >

                                <strong
                                    style="
                                        display:block;
                                        color:#ff6b6b;
                                        margin-bottom:6px;
                                    "
                                >
                                    ❌ Delivery Failed
                                </strong>

                                <span
                                    style="
                                        display:block;
                                        color:#00e676;
                                        font-weight:700;
                                    "
                                >
                                    💰 ₹${Number(
                                        order.refundAmount ??
                                        order.price ??
                                        0
                                    ).toFixed(2)}
                                    Refunded to Wallet
                                </span>

                                <small
                                    style="
                                        display:block;
                                        margin-top:7px;
                                        color:#9aa8bd;
                                    "
                                >
                                    The order amount has been returned
                                    to your wallet.
                                </small>

                            </div>

                        `;

                    }

                    // ==========================
                    // DELIVERED KEY
                    // ==========================

                    else if (
                        order.status === "Delivered" &&
                        order.productKey &&
                        String(order.productKey).trim() !== ""
                    ) {

                        keyHTML = `

                            <div
                                class="key-box"
                                id="key-${doc.id}"
                            >
                                ${escapeHTML(
                                    order.productKey
                                )}
                            </div>

                            <button
                                class="copy-btn"
                                onclick="copyKey('key-${doc.id}')"
                            >
                                📋 Copy Key
                            </button>

                            <br><br>

                            <a
                                href="https://t.me/+UMuZfXaJrXIwZWQ1"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="download-btn"
                            >
                                <i class="fa-brands fa-telegram"></i>
                                ⬇ Download
                            </a>

                        `;

                    }

                    // ==========================
                    // KEY PENDING
                    // ==========================

                    else {

                        keyHTML = `

                            <div class="key-pending">

                                🔑 Key Pending

                                <small>
                                    Please wait for key delivery.
                                </small>

                            </div>

                        `;

                    }

                    // ==========================
                    // ORDER CARD
                    // ==========================

                    orderList.innerHTML += `

                        <div class="order-card">

                            <h3>
                                ${escapeHTML(
                                    order.productName ||
                                    "Product"
                                )}
                            </h3>

                            <p>
                                <b>Order ID :</b>
                                ${escapeHTML(
                                    order.orderId ||
                                    doc.id
                                )}
                            </p>

                            <p>
                                <b>Date :</b>
                                ${dateText}
                            </p>

                            <p>
                                <b>Plan :</b>
                                ${escapeHTML(
                                    order.planName ||
                                    "N/A"
                                )}
                            </p>

                            <p>
                                <b>Price :</b>
                                ₹${Number(
                                    order.price || 0
                                ).toFixed(2)}
                            </p>

                            <p>
                                <b>Payment :</b>
                                ${escapeHTML(
                                    order.paymentStatus ||
                                    "Pending"
                                )}
                            </p>

                            <p>

                                <b>Status :</b>

                                <span
                                    class="${statusClass}"
                                >
                                    ${statusText}
                                </span>

                            </p>

                            ${keyHTML}

                        </div>

                    `;

                });

            },

            (error) => {

                console.error(
                    "My Orders Error:",
                    error
                );

                orderList.innerHTML = `
                    <p style="text-align:center;">
                        Unable to load orders.
                    </p>
                `;

            }

        );

}

// ==========================
// COPY KEY
// ==========================

function copyKey(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    const key =
        element.innerText.trim();

    navigator.clipboard
        .writeText(key)
        .then(() => {

            alert(
                "✅ Product Key Copied!"
            );

        })
        .catch(() => {

            alert(
                "❌ Unable to copy key."
            );

        });

}

// ==========================
// HTML ESCAPE
// ==========================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}