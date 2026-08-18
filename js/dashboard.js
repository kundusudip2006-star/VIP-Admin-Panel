// ======================================================
// VIP ADMIN DASHBOARD
// WALLET PAYMENT VERIFICATION
// ======================================================


// ======================================================
// ADMIN
// ======================================================

const ADMIN_EMAIL =
    "kundusudip011@gmail.com";


// ======================================================
// ELEMENTS
// ======================================================

const totalUsersEl =
    document.getElementById("totalUsers");

const totalCustomersEl =
    document.getElementById("totalCustomers");

const totalRevenueEl =
    document.getElementById("totalRevenue");

const totalOrdersEl =
    document.getElementById("totalOrders");

const pendingPaymentsEl =
    document.getElementById("pendingPayments");

const recentCustomersEl =
    document.getElementById("recentCustomers");

const notificationCountEl =
    document.getElementById("notificationCount");

const notificationListEl =
    document.getElementById("notificationList");

const searchBox =
    document.getElementById("searchBox");

const notificationBox =
    document.getElementById("notificationBox");


// Wallet verification

const walletVerificationList =
    document.getElementById(
        "walletVerificationList"
    );

const walletVerificationLoading =
    document.getElementById(
        "walletVerificationLoading"
    );

const walletVerificationEmpty =
    document.getElementById(
        "walletVerificationEmpty"
    );

const refreshWalletPayments =
    document.getElementById(
        "refreshWalletPayments"
    );


// ======================================================
// ADMIN AUTH CHECK
// ======================================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        window.location.href =
            "admin-login.html";

        return;

    }


    if (
        !user.email ||
        user.email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
    ) {

        await auth.signOut();

        window.location.href =
            "admin-login.html";

        return;

    }


    await loadDashboard();

});


// ======================================================
// LOAD DASHBOARD
// ======================================================

async function loadDashboard() {

    try {

        await Promise.all([

            loadCustomers(),

            loadOrders(),

            loadPendingPayments(),

            loadWalletVerification()

        ]);

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


// ======================================================
// LOAD CUSTOMERS
// ======================================================

async function loadCustomers() {

    try {

        const snapshot =
            await db
                .collection("customers")
                .get();


        const customers = [];


        snapshot.forEach(doc => {

            customers.push({

                id:
                    doc.id,

                ...doc.data()

            });

        });


        totalUsersEl.textContent =
            customers.length;

        totalCustomersEl.textContent =
            customers.length;


        customers.sort((a, b) => {

            const aTime =
                a.createdAt?.toMillis
                    ? a.createdAt.toMillis()
                    : 0;

            const bTime =
                b.createdAt?.toMillis
                    ? b.createdAt.toMillis()
                    : 0;

            return bTime - aTime;

        });


        renderRecentCustomers(
            customers.slice(0, 5)
        );


        renderCustomerChart(
            customers
        );


    } catch (error) {

        console.error(
            "Customer loading error:",
            error
        );


        totalUsersEl.textContent =
            "0";

        totalCustomersEl.textContent =
            "0";


        recentCustomersEl.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="text-align:center;"
                >

                    Failed to load customers

                </td>

            </tr>

        `;

    }

}


// ======================================================
// RECENT CUSTOMERS
// ======================================================

function renderRecentCustomers(
    customers
) {

    if (!customers.length) {

        recentCustomersEl.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="text-align:center;"
                >

                    No Customers Found

                </td>

            </tr>

        `;

        return;

    }


    recentCustomersEl.innerHTML =
        customers.map(customer => {

            const name =
                escapeHtml(
                    customer.name ||
                    "Customer"
                );

            const phone =
                escapeHtml(
                    customer.phone ||
                    "-"
                );

            const email =
                escapeHtml(
                    customer.email ||
                    "-"
                );


            return `

                <tr>

                    <td>
                        ${name}
                    </td>

                    <td>
                        ${phone}
                    </td>

                    <td>
                        ${email}
                    </td>

                    <td>

                        <span class="status active">
                            Active
                        </span>

                    </td>

                </tr>

            `;

        }).join("");

}


// ======================================================
// LOAD ORDERS
// ======================================================

async function loadOrders() {

    try {

        const snapshot =
            await db
                .collection("orders")
                .get();


        let completedOrders = 0;

        let revenue = 0;


        const now =
            new Date();

        const currentMonth =
            now.getMonth();

        const currentYear =
            now.getFullYear();


        const notifications = [];


        snapshot.forEach(doc => {

            const order =
                doc.data();


            const status =
                String(
                    order.status || ""
                ).toLowerCase();


            const paymentStatus =
                String(
                    order.paymentStatus || ""
                ).toLowerCase();


            if (
                status === "delivered"
            ) {

                completedOrders++;

            }


            if (
                status === "delivered" &&
                paymentStatus === "approved"
            ) {

                let orderDate =
                    null;


                if (
                    order.createdAt &&
                    order.createdAt.toDate
                ) {

                    orderDate =
                        order.createdAt.toDate();

                }


                if (
                    orderDate &&
                    orderDate.getMonth() ===
                    currentMonth &&
                    orderDate.getFullYear() ===
                    currentYear
                ) {

                    revenue +=
                        Number(
                            order.price || 0
                        );

                }

            }


            if (
                status === "pending"
            ) {

                notifications.push(
                    order
                );

            }

        });


        totalOrdersEl.textContent =
            completedOrders;


        totalRevenueEl.textContent =
            "₹" +
            revenue.toFixed(2);


        updateNotifications(
            notifications
        );


    } catch (error) {

        console.error(
            "Order loading error:",
            error
        );


        totalOrdersEl.textContent =
            "0";

        totalRevenueEl.textContent =
            "₹0";

    }

}


// ======================================================
// PENDING PAYMENTS COUNT
// ======================================================

async function loadPendingPayments() {

    try {

        const snapshot =
            await db
                .collection(
                    "balanceRechargeRequests"
                )
                .get();


        let pending = 0;


        snapshot.forEach(doc => {

            const data =
                doc.data();


            if (
                String(
                    data.status || ""
                ).toLowerCase() ===
                "pending"
            ) {

                pending++;

            }

        });


        pendingPaymentsEl.textContent =
            pending;


    } catch (error) {

        console.error(
            "Pending payment error:",
            error
        );


        pendingPaymentsEl.textContent =
            "0";

    }

}


// ======================================================
// WALLET VERIFICATION
// ======================================================

async function loadWalletVerification() {

    if (!walletVerificationList) {
        return;
    }


    walletVerificationLoading.style.display =
        "block";

    walletVerificationEmpty.style.display =
        "none";


    walletVerificationList.innerHTML =
        "";


    try {

        const snapshot =
            await db
                .collection(
                    "balanceRechargeRequests"
                )
                .get();


        const pendingRequests = [];


        snapshot.forEach(doc => {

            const data =
                doc.data();


            const status =
                String(
                    data.status || "Pending"
                )
                .toLowerCase()
                .trim();


            if (
                status === "pending"
            ) {

                pendingRequests.push({

                    id:
                        doc.id,

                    ...data

                });

            }

        });


        pendingRequests.sort(
            (a, b) => {

                return (
                    getTimestamp(
                        b.createdAt
                    ) -
                    getTimestamp(
                        a.createdAt
                    )
                );

            }
        );


        walletVerificationLoading.style.display =
            "none";


        if (!pendingRequests.length) {

            walletVerificationEmpty.style.display =
                "block";

            return;

        }


        walletVerificationEmpty.style.display =
            "none";


        pendingRequests.forEach(
            request => {

                renderWalletRequest(
                    request
                );

            }
        );


    } catch (error) {

        console.error(
            "Wallet verification loading error:",
            error
        );


        walletVerificationLoading.style.display =
            "none";


        walletVerificationList.innerHTML = `

            <div class="wallet-admin-error">

                <i class="fa-solid fa-circle-exclamation"></i>

                <h3>
                    Unable to load payments
                </h3>

                <p>
                    ${escapeHtml(
                        error.message ||
                        "Please try again."
                    )}
                </p>

            </div>

        `;

    }

}


// ======================================================
// RENDER WALLET REQUEST
// ======================================================

function renderWalletRequest(
    request
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "wallet-verification-card";


    const amount =
        Number(
            request.amount || 0
        );


    const date =
        formatDate(
            request.createdAt
        );


    card.innerHTML = `

        <div class="wallet-request-header">

            <div>

                <div class="wallet-request-title">

                    <i class="fa-solid fa-wallet"></i>

                    Wallet Recharge

                </div>

                <div class="wallet-request-date">

                    ${escapeHtml(date)}

                </div>

            </div>


            <div class="wallet-request-amount">

                ₹${amount.toFixed(2)}

            </div>

        </div>


        <div class="wallet-request-details">


            <div class="wallet-detail">

                <span>
                    User
                </span>

                <strong>
                    ${escapeHtml(
                        request.email ||
                        "Unknown User"
                    )}
                </strong>

            </div>


            <div class="wallet-detail">

                <span>
                    Mobile
                </span>

                <strong>
                    ${escapeHtml(
                        request.mobile ||
                        "-"
                    )}
                </strong>

            </div>


            <div class="wallet-detail">

                <span>
                    Recharge ID
                </span>

                <strong>
                    ${escapeHtml(
                        request.rechargeId ||
                        request.id
                    )}
                </strong>

            </div>


            <div class="wallet-detail">

                <span>
                    Payment Method
                </span>

                <strong>
                    ${escapeHtml(
                        request.paymentMethod ||
                        "UPI"
                    )}
                </strong>

            </div>


        </div>


        <div class="wallet-request-actions">


            <button
                type="button"
                class="wallet-reject-btn"
                data-id="${escapeHtml(
                    request.id
                )}"
            >

                <i class="fa-solid fa-xmark"></i>

                Reject

            </button>


            <button
                type="button"
                class="wallet-approve-btn"
                data-id="${escapeHtml(
                    request.id
                )}"
            >

                <i class="fa-solid fa-check"></i>

                Approve

            </button>


        </div>

    `;


    walletVerificationList.appendChild(
        card
    );


    const approveBtn =
        card.querySelector(
            ".wallet-approve-btn"
        );


    const rejectBtn =
        card.querySelector(
            ".wallet-reject-btn"
        );


    approveBtn.addEventListener(
        "click",
        () => {

            approveWalletPayment(
                request,
                card,
                approveBtn,
                rejectBtn
            );

        }
    );


    rejectBtn.addEventListener(
        "click",
        () => {

            rejectWalletPayment(
                request,
                card,
                approveBtn,
                rejectBtn
            );

        }
    );

}


// ======================================================
// APPROVE WALLET PAYMENT
// ======================================================

async function approveWalletPayment(
    request,
    card,
    approveBtn,
    rejectBtn
) {

    const rechargeId =
        request.rechargeId ||
        request.id;


    if (!rechargeId) {

        showDashboardAlert(
            "Recharge ID is missing.",
            "error",
            "Approval Failed"
        );

        return;

    }


    const confirmed =
        confirm(
            "Approve ₹" +
            Number(
                request.amount || 0
            ).toFixed(2) +
            " wallet recharge?"
        );


    if (!confirmed) {
        return;
    }


    approveBtn.disabled =
        true;

    rejectBtn.disabled =
        true;


    approveBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Approving...';


    try {

        const requestRef =
            db
                .collection(
                    "balanceRechargeRequests"
                )
                .doc(rechargeId);


        const transactionRef =
            db
                .collection(
                    "balanceTransactions"
                )
                .doc(rechargeId);


        const customerRef =
            db
                .collection(
                    "customers"
                )
                .doc(request.uid);


        /*
         * IMPORTANT
         *
         * Firestore transaction ensures:
         *
         * 1. Balance is read safely.
         * 2. Recharge cannot be approved twice.
         * 3. Customer balance gets amount only once.
         */

        await db.runTransaction(
            async (transaction) => {

                const requestSnap =
                    await transaction.get(
                        requestRef
                    );


                if (!requestSnap.exists) {

                    throw new Error(
                        "Recharge request not found."
                    );

                }


                const requestData =
                    requestSnap.data();


                const currentStatus =
                    String(
                        requestData.status ||
                        "Pending"
                    )
                    .toLowerCase()
                    .trim();


                if (
                    currentStatus !==
                    "pending"
                ) {

                    throw new Error(
                        "This recharge has already been processed."
                    );

                }


                const amount =
                    Number(
                        requestData.amount ||
                        0
                    );


                if (
                    !Number.isFinite(amount) ||
                    amount <= 0
                ) {

                    throw new Error(
                        "Invalid recharge amount."
                    );

                }


                if (!requestData.uid) {

                    throw new Error(
                        "Customer UID is missing."
                    );

                }


                const customerSnap =
                    await transaction.get(
                        customerRef
                    );


                if (
                    !customerSnap.exists
                ) {

                    throw new Error(
                        "Customer account not found."
                    );

                }


                const customerData =
                    customerSnap.data() ||
                    {};


                const currentBalance =
                    Number(
                        customerData.balance ||
                        0
                    );


                if (
                    !Number.isFinite(
                        currentBalance
                    )
                ) {

                    throw new Error(
                        "Customer balance is invalid."
                    );

                }


                const newBalance =
                    currentBalance +
                    amount;


                // ======================================
                // UPDATE CUSTOMER BALANCE
                // ======================================

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


                // ======================================
                // UPDATE RECHARGE REQUEST
                // ======================================

                transaction.update(
                    requestRef,
                    {

                        status:
                            "Approved",

                        balanceAdded:
                            true,

                        approvedAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp(),

                        approvedBy:
                            ADMIN_EMAIL

                    }
                );


                // ======================================
                // UPDATE TRANSACTION
                // ======================================

                transaction.set(
                    transactionRef,
                    {

                        rechargeId:
                            rechargeId,

                        uid:
                            requestData.uid,

                        email:
                            requestData.email ||
                            "",

                        mobile:
                            requestData.mobile ||
                            "",

                        amount:
                            amount,

                        type:
                            "credit",

                        transactionType:
                            "recharge",

                        status:
                            "Successful",

                        paymentMethod:
                            requestData.paymentMethod ||
                            "UPI / Google Pay",

                        balanceAdded:
                            true,

                        approvedAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp(),

                        approvedBy:
                            ADMIN_EMAIL,

                        createdAt:
                            requestData.createdAt ||
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );

            }
        );


        card.remove();


        await loadPendingPayments();


        showDashboardAlert(
            "₹" +
            Number(
                request.amount || 0
            ).toFixed(2) +
            " has been added to the customer's wallet.",
            "success",
            "Payment Approved"
        );


        checkWalletEmpty();


    } catch (error) {

        console.error(
            "Approve wallet payment error:",
            error
        );


        approveBtn.disabled =
            false;

        rejectBtn.disabled =
            false;


        approveBtn.innerHTML =
            '<i class="fa-solid fa-check"></i> Approve';


        showDashboardAlert(
            error.message ||
            "Unable to approve payment.",
            "error",
            "Approval Failed"
        );

    }

}


// ======================================================
// REJECT WALLET PAYMENT
// ======================================================

async function rejectWalletPayment(
    request,
    card,
    approveBtn,
    rejectBtn
) {

    const rechargeId =
        request.rechargeId ||
        request.id;


    if (!rechargeId) {

        showDashboardAlert(
            "Recharge ID is missing.",
            "error",
            "Reject Failed"
        );

        return;

    }


    const confirmed =
        confirm(
            "Reject this wallet recharge request?"
        );


    if (!confirmed) {
        return;
    }


    approveBtn.disabled =
        true;

    rejectBtn.disabled =
        true;


    rejectBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Rejecting...';


    try {

        const requestRef =
            db
                .collection(
                    "balanceRechargeRequests"
                )
                .doc(rechargeId);


        const transactionRef =
            db
                .collection(
                    "balanceTransactions"
                )
                .doc(rechargeId);


        await db.runTransaction(
            async (transaction) => {

                const requestSnap =
                    await transaction.get(
                        requestRef
                    );


                if (!requestSnap.exists) {

                    throw new Error(
                        "Recharge request not found."
                    );

                }


                const requestData =
                    requestSnap.data();


                const currentStatus =
                    String(
                        requestData.status ||
                        "Pending"
                    )
                    .toLowerCase()
                    .trim();


                if (
                    currentStatus !==
                    "pending"
                ) {

                    throw new Error(
                        "This recharge has already been processed."
                    );

                }


                // ======================================
                // REJECT REQUEST
                // ======================================

                transaction.update(
                    requestRef,
                    {

                        status:
                            "Rejected",

                        balanceAdded:
                            false,

                        rejectedAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp(),

                        rejectedBy:
                            ADMIN_EMAIL

                    }
                );


                // ======================================
                // UPDATE TRANSACTION
                // ======================================

                transaction.set(
                    transactionRef,
                    {

                        rechargeId:
                            rechargeId,

                        uid:
                            requestData.uid ||
                            "",

                        email:
                            requestData.email ||
                            "",

                        mobile:
                            requestData.mobile ||
                            "",

                        amount:
                            Number(
                                requestData.amount ||
                                0
                            ),

                        type:
                            "credit",

                        transactionType:
                            "recharge",

                        status:
                            "Rejected",

                        paymentMethod:
                            requestData.paymentMethod ||
                            "UPI / Google Pay",

                        balanceAdded:
                            false,

                        rejectedAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp(),

                        rejectedBy:
                            ADMIN_EMAIL,

                        createdAt:
                            requestData.createdAt ||
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );

            }
        );


        card.remove();


        await loadPendingPayments();


        showDashboardAlert(
            "Wallet recharge request has been rejected.",
            "success",
            "Payment Rejected"
        );


        checkWalletEmpty();


    } catch (error) {

        console.error(
            "Reject wallet payment error:",
            error
        );


        approveBtn.disabled =
            false;

        rejectBtn.disabled =
            false;


        rejectBtn.innerHTML =
            '<i class="fa-solid fa-xmark"></i> Reject';


        showDashboardAlert(
            error.message ||
            "Unable to reject payment.",
            "error",
            "Reject Failed"
        );

    }

}


// ======================================================
// CHECK EMPTY WALLET LIST
// ======================================================

function checkWalletEmpty() {

    if (!walletVerificationList) {
        return;
    }


    if (
        walletVerificationList
            .children
            .length === 0
    ) {

        walletVerificationEmpty.style.display =
            "block";

    }

}


// ======================================================
// REFRESH
// ======================================================

if (refreshWalletPayments) {

    refreshWalletPayments.addEventListener(
        "click",
        async () => {

            await loadWalletVerification();

            await loadPendingPayments();

        }
    );

}


// ======================================================
// NOTIFICATIONS
// ======================================================

function updateNotifications(
    orders
) {

    notificationCountEl.textContent =
        orders.length;


    if (!orders.length) {

        notificationListEl.innerHTML =
            "No New Orders";

        return;

    }


    notificationListEl.innerHTML =
        orders
            .slice(0, 5)
            .map(order => {

                return `

                    <div class="notification-item">

                        <strong>
                            New Order
                        </strong>

                        <br>

                        ${escapeHtml(
                            order.productName ||
                            "Order"
                        )}

                        <br>

                        ₹${Number(
                            order.price ||
                            0
                        ).toFixed(2)}

                    </div>

                `;

            })
            .join("");

}


// ======================================================
// NOTIFICATION CLICK
// ======================================================

const bell =
    document.getElementById(
        "notificationBell"
    );


if (bell) {

    bell.addEventListener(
        "click",
        () => {

            notificationBox.classList.toggle(
                "show"
            );

        }
    );

}


// ======================================================
// SEARCH
// ======================================================

if (searchBox) {

    searchBox.addEventListener(
        "input",
        async () => {

            const keyword =
                searchBox.value
                    .trim()
                    .toLowerCase();


            if (!keyword) {

                await loadCustomers();

                return;

            }


            try {

                const snapshot =
                    await db
                        .collection(
                            "customers"
                        )
                        .get();


                const results = [];


                snapshot.forEach(doc => {

                    const customer =
                        doc.data();


                    const text = `

                        ${customer.name || ""}

                        ${customer.email || ""}

                        ${customer.phone || ""}

                        ${customer.username || ""}

                    `.toLowerCase();


                    if (
                        text.includes(
                            keyword
                        )
                    ) {

                        results.push({

                            id:
                                doc.id,

                            ...customer

                        });

                    }

                });


                renderRecentCustomers(
                    results.slice(0, 5)
                );


            } catch (error) {

                console.error(
                    "Search error:",
                    error
                );

            }

        }
    );

}


// ======================================================
// CUSTOMER CHART
// ======================================================

function renderCustomerChart(
    customers
) {

    const canvas =
        document.getElementById(
            "userChart"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext("2d");


    const monthlyCounts =
        new Array(12).fill(0);


    customers.forEach(
        customer => {

            if (
                customer.createdAt &&
                customer.createdAt.toDate
            ) {

                const date =
                    customer.createdAt.toDate();


                monthlyCounts[
                    date.getMonth()
                ]++;

            }

        }
    );


    if (
        window.customerChart
    ) {

        window.customerChart.destroy();

    }


    window.customerChart =
        new Chart(
            ctx,
            {

                type:
                    "line",

                data:
                    {

                        labels: [

                            "Jan",
                            "Feb",
                            "Mar",
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dec"

                        ],

                        datasets: [

                            {

                                label:
                                    "Customers",

                                data:
                                    monthlyCounts,

                                tension:
                                    0.35,

                                fill:
                                    true

                            }

                        ]

                    },

                options:
                    {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins:
                            {

                                legend:
                                    {
                                        display:
                                            true
                                    }

                            },

                        scales:
                            {

                                y:
                                    {

                                        beginAtZero:
                                            true,

                                        ticks:
                                            {

                                                precision:
                                                    0

                                            }

                                    }

                            }

                    }

            }
        );

}


// ======================================================
// TIMESTAMP
// ======================================================

function getTimestamp(
    value
) {

    if (!value) {
        return 0;
    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime();

    }


    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    if (
        typeof value ===
        "number"
    ) {

        return value;

    }


    const parsed =
        new Date(value).getTime();


    return Number.isNaN(parsed)
        ? 0
        : parsed;

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
    timestamp
) {

    const time =
        getTimestamp(
            timestamp
        );


    if (!time) {

        return "Date unavailable";

    }


    const date =
        new Date(time);


    return (

        date.toLocaleDateString(
            "en-IN",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"

            }
        )

        +

        " • " +

        date.toLocaleTimeString(
            "en-IN",
            {

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        )

    );

}


// ======================================================
// DASHBOARD ALERT
// ======================================================

function showDashboardAlert(
    message,
    type = "info",
    title = ""
) {

    const old =
        document.querySelector(
            ".vip-dashboard-alert"
        );


    if (old) {
        old.remove();
    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "vip-dashboard-alert";


    overlay.innerHTML = `

        <div class="vip-dashboard-alert-box">

            <button
                class="vip-dashboard-alert-close"
                onclick="this.closest('.vip-dashboard-alert').remove()"
            >
                ×
            </button>

            <div class="vip-dashboard-alert-icon">
                ${
                    type === "success"
                        ? "✓"
                        : type === "error"
                            ? "!"
                            : "i"
                }
            </div>

            <h3>
                ${escapeHtml(
                    title ||
                    "Notice"
                )}
            </h3>

            <p>
                ${escapeHtml(
                    message
                )}
            </p>

            <button
                onclick="this.closest('.vip-dashboard-alert').remove()"
            >
                Continue
            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

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


// ======================================================
// LOGOUT
// ======================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await auth.signOut();

                window.location.href =
                    "admin-login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}