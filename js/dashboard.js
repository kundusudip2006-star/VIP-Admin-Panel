// =====================================================
// VIP ADMIN DASHBOARD
// =====================================================

const ADMIN_EMAIL = "kundusudip011@gmail.com";

// =====================================================
// AUTHENTICATION
// =====================================================

firebase.auth().onAuthStateChanged(async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (user.email !== ADMIN_EMAIL) {
        alert("❌ Access Denied! Admin only.");
        await firebase.auth().signOut();
        window.location.href = "login.html";
        return;
    }

    loadDashboard();
    loadNotifications();
});

// =====================================================
// DASHBOARD
// =====================================================

function loadDashboard() {

    // --------------------------
    // TOTAL CUSTOMERS
    // --------------------------

    db.collection("customers").onSnapshot((snapshot) => {

        const el = document.getElementById("totalCustomers");

        if (el) {
            el.innerText = snapshot.size;
        }

    });

    // --------------------------
    // TOTAL USERS
    // --------------------------

    db.collection("customers").onSnapshot((snapshot) => {

        const el = document.getElementById("totalUsers");

        if (el) {
            el.innerText = snapshot.size;
        }

    });

    // --------------------------
    // TOTAL ORDERS
    // --------------------------

    db.collection("orders").onSnapshot((snapshot) => {

        const el = document.getElementById("totalOrders");

        if (el) {
            el.innerText = snapshot.size;
        }

    });

    // --------------------------
    // PENDING PAYMENTS
    // --------------------------

    db.collection("orders")
        .where("paymentStatus", "==", "Pending")
        .onSnapshot((snapshot) => {

            const el =
                document.getElementById("pendingPayments");

            if (el) {
                el.innerText = snapshot.size;
            }

        });

    // --------------------------
    // REVENUE
    // --------------------------

    db.collection("orders")
        .where("status", "==", "Delivered")
        .onSnapshot((snapshot) => {

            let revenue = 0;

            snapshot.forEach((doc) => {

                const order = doc.data();

                revenue += Number(order.price || 0);

            });

            const el =
                document.getElementById("totalRevenue");

            if (el) {
                el.innerText =
                    "₹" + revenue.toFixed(2);
            }

        });

    // --------------------------
    // RECENT CUSTOMERS
    // --------------------------

    db.collection("customers")
        .orderBy("createdAt", "desc")
        .limit(5)
        .onSnapshot(

            (snapshot) => {

                const tbody =
                    document.getElementById(
                        "recentCustomers"
                    );

                if (!tbody) return;

                tbody.innerHTML = "";

                if (snapshot.empty) {

                    tbody.innerHTML = `
                        <tr>
                            <td colspan="4"
                                style="text-align:center;">
                                No Customers Found
                            </td>
                        </tr>
                    `;

                    return;
                }

                snapshot.forEach((doc) => {

                    const customer =
                        doc.data();

                    tbody.innerHTML += `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    customer.name || "-"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    customer.phone || "-"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    customer.email || "-"
                                )}
                            </td>

                            <td>
                                <span class="active">
                                    Active
                                </span>
                            </td>

                        </tr>

                    `;

                });

            },

            (error) => {

                console.error(
                    "Customer Error:",
                    error
                );

            }

        );
}

// =====================================================
// NOTIFICATIONS
// =====================================================

function loadNotifications() {

    const bell =
        document.querySelector(".fa-bell");

    const box =
        document.getElementById(
            "notificationBox"
        );

    if (bell && box) {

        bell.onclick = () => {

            box.style.display =
                box.style.display === "block"
                    ? "none"
                    : "block";

        };

    }

    db.collection("orders")
        .where("status", "==", "Pending")
        .onSnapshot((snapshot) => {

            const count =
                document.getElementById(
                    "notificationCount"
                );

            const list =
                document.getElementById(
                    "notificationList"
                );

            if (count) {
                count.innerText =
                    snapshot.size;
            }

            if (!list) return;

            list.innerHTML = "";

            if (snapshot.empty) {

                list.innerHTML = `
                    <div style="padding:15px;">
                        No New Orders
                    </div>
                `;

                return;
            }

            snapshot.forEach((doc) => {

                const order =
                    doc.data();

                list.innerHTML += `

                    <div
                        class="notification-item"
                        style="
                            padding:12px;
                            border-bottom:
                                1px solid rgba(255,255,255,.08);
                        "
                    >

                        <b>
                            ${escapeHTML(
                                order.customerName ||
                                order.email ||
                                "Customer"
                            )}
                        </b>

                        <br>

                        Ordered:

                        <b>
                            ${escapeHTML(
                                order.productName ||
                                "Product"
                            )}
                        </b>

                        <br>

                        <small>
                            ₹${Number(
                                order.price || 0
                            ).toFixed(2)}
                        </small>

                        <br><br>

                        <button
                            onclick="openOrder(
                                '${doc.id}'
                            )"
                            style="
                                padding:8px 12px;
                                border:0;
                                border-radius:8px;
                                cursor:pointer;
                            "
                        >
                            Manage Order
                        </button>

                    </div>

                `;

            });

        });

}

// =====================================================
// OPEN ORDER
// =====================================================

async function openOrder(orderId) {

    try {

        const ref =
            db.collection("orders")
                .doc(orderId);

        const snap =
            await ref.get();

        if (!snap.exists) {

            alert("Order not found.");
            return;

        }

        const order =
            snap.data();

        const action =
            prompt(
                `Order: ${
                    order.productName || "Product"
                }\n\n` +

                `Price: ₹${
                    Number(order.price || 0)
                        .toFixed(2)
                }\n\n` +

                `Payment: ${
                    order.paymentStatus || "Pending"
                }\n\n` +

                `Current Status: ${
                    order.status || "Pending"
                }\n\n` +

                `Type:\n` +
                `1 = Mark Delivery Failed + Refund\n` +
                `2 = Mark Delivered\n` +
                `3 = Cancel\n\n` +
                `Enter option:`
            );

        if (action === "1") {

            await refundOrder(
                orderId
            );

        } else if (action === "2") {

            await markDelivered(
                orderId
            );

        } else if (action === "3") {

            await cancelOrder(
                orderId
            );

        }

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

// =====================================================
// REFUND ORDER
// =====================================================

async function refundOrder(orderId) {

    const confirmRefund =
        confirm(
            "Delivery failed হলে order amount customer wallet-এ ফেরত যাবে.\n\nContinue?"
        );

    if (!confirmRefund) {
        return;
    }

    try {

        const orderRef =
            db.collection("orders")
                .doc(orderId);

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

                // --------------------------
                // ALREADY REFUNDED
                // --------------------------

                if (
                    order.refundStatus ===
                    "refunded"
                ) {

                    throw new Error(
                        "This order is already refunded."
                    );

                }

                // --------------------------
                // UID CHECK
                // --------------------------

                if (!order.uid) {

                    throw new Error(
                        "Customer UID missing."
                    );

                }

                // --------------------------
                // REFUND AMOUNT
                // --------------------------

                const refundAmount =
                    Number(
                        order.price || 0
                    );

                if (
                    !Number.isFinite(
                        refundAmount
                    ) ||
                    refundAmount <= 0
                ) {

                    throw new Error(
                        "Invalid refund amount."
                    );

                }

                // --------------------------
                // USER WALLET
                // --------------------------

                const userRef =
                    db.collection("users")
                        .doc(order.uid);

                const userSnap =
                    await transaction.get(
                        userRef
                    );

                if (!userSnap.exists) {

                    throw new Error(
                        "Customer wallet not found."
                    );

                }

                const user =
                    userSnap.data();

                const oldBalance =
                    Number(
                        user.walletBalance || 0
                    );

                const newBalance =
                    oldBalance +
                    refundAmount;

                // --------------------------
                // UPDATE WALLET
                // --------------------------

                transaction.update(
                    userRef,
                    {
                        walletBalance:
                            newBalance
                    }
                );

                // --------------------------
                // UPDATE ORDER
                // --------------------------

                transaction.update(
                    orderRef,
                    {

                        status:
                            "Delivery Failed",

                        refundStatus:
                            "refunded",

                        refundAmount:
                            refundAmount,

                        refundAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp(),

                        refundedBy:
                            ADMIN_EMAIL

                    }
                );

                // --------------------------
                // WALLET TRANSACTION LOG
                // --------------------------

                const transactionRef =
                    db.collection(
                        "walletTransactions"
                    ).doc();

                transaction.set(
                    transactionRef,
                    {

                        uid:
                            order.uid,

                        orderId:
                            order.orderId ||
                            orderId,

                        type:
                            "refund",

                        amount:
                            refundAmount,

                        balanceBefore:
                            oldBalance,

                        balanceAfter:
                            newBalance,

                        reason:
                            "Order delivery failed",

                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp(),

                        createdBy:
                            ADMIN_EMAIL

                    }
                );

            }
        );

        alert(
            "✅ Delivery Failed + Wallet Refund Successful!"
        );

    } catch (error) {

        console.error(
            "Refund Error:",
            error
        );

        alert(
            "❌ Refund failed: " +
            error.message
        );

    }

}

// =====================================================
// MARK DELIVERED
// =====================================================

async function markDelivered(orderId) {

    const key =
        prompt(
            "Enter Product Key:"
        );

    if (!key || !key.trim()) {

        alert(
            "Product key required."
        );

        return;
    }

    try {

        const ref =
            db.collection("orders")
                .doc(orderId);

        const snap =
            await ref.get();

        if (!snap.exists) {

            throw new Error(
                "Order not found."
            );

        }

        const order =
            snap.data();

        if (
            order.productKey &&
            String(order.productKey)
                .trim() !== ""
        ) {

            throw new Error(
                "Key already delivered."
            );

        }

        if (
            order.paymentMethod !==
            "Wallet Balance" &&
            order.paymentStatus !==
            "Paid"
        ) {

            throw new Error(
                "Payment is not approved."
            );

        }

        await ref.update({

            productKey:
                key.trim(),

            status:
                "Delivered",

            deliveredAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp(),

            deliveredBy:
                ADMIN_EMAIL

        });

        alert(
            "✅ Product Key Delivered!"
        );

    } catch (error) {

        console.error(
            "Delivery Error:",
            error
        );

        alert(
            "❌ " +
            error.message
        );

    }

}

// =====================================================
// CANCEL ORDER WITHOUT REFUND
// =====================================================

async function cancelOrder(orderId) {

    const yes =
        confirm(
            "Cancel this order without wallet refund?"
        );

    if (!yes) {
        return;
    }

    try {

        await db.collection("orders")
            .doc(orderId)
            .update({

                status:
                    "Cancelled",

                cancelledAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp(),

                cancelledBy:
                    ADMIN_EMAIL

            });

        alert(
            "✅ Order Cancelled."
        );

    } catch (error) {

        console.error(
            "Cancel Error:",
            error
        );

        alert(
            "❌ " +
            error.message
        );

    }

}

// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            if (
                confirm(
                    "Logout?"
                )
            ) {

                await firebase
                    .auth()
                    .signOut();

                window.location.href =
                    "login.html";

            }

        }
    );

}

// =====================================================
// SEARCH
// =====================================================

const searchBox =
    document.getElementById(
        "searchBox"
    );

if (searchBox) {

    searchBox.addEventListener(
        "input",
        (e) => {

            const value =
                e.target.value
                    .toLowerCase()
                    .trim();

            const rows =
                document.querySelectorAll(
                    "#recentCustomers tr"
                );

            rows.forEach((row) => {

                row.style.display =
                    row.innerText
                        .toLowerCase()
                        .includes(value)
                        ? ""
                        : "none";

            });

        }
    );

}

// =====================================================
// CHART
// =====================================================

const chartCanvas =
    document.getElementById(
        "userChart"
    );

if (
    chartCanvas &&
    typeof Chart !== "undefined"
) {

    new Chart(
        chartCanvas,
        {

            type: "bar",

            data: {

                labels: [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun"
                    ],

                datasets: [

                    {

                        label:
                            "Customers",

                        data: [
                            0,
                            0,
                            0,
                            0,
                            0,
                            0
                        ],

                        borderWidth: 1

                    }

                ]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        display: true
                    }

                }

            }

        }
    );

}

// =====================================================
// HTML ESCAPE
// =====================================================

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