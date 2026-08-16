// ======================================================
// VIP ADMIN DASHBOARD
// ======================================================

const ADMIN_EMAIL = "kundusudip011@gmail.com";


// ======================================================
// ELEMENTS
// ======================================================

const totalUsersEl = document.getElementById("totalUsers");
const totalCustomersEl = document.getElementById("totalCustomers");
const totalRevenueEl = document.getElementById("totalRevenue");
const totalOrdersEl = document.getElementById("totalOrders");
const pendingPaymentsEl = document.getElementById("pendingPayments");

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


// ======================================================
// ADMIN CHECK
// ======================================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {
        window.location.href = "admin-login.html";
        return;
    }

    if (
        !user.email ||
        user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {
        await auth.signOut();
        window.location.href = "admin-login.html";
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
            loadPendingPayments()
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

        const snapshot = await db
            .collection("customers")
            .get();

        const customers = [];

        snapshot.forEach(doc => {

            customers.push({
                id: doc.id,
                ...doc.data()
            });

        });


        // ==============================================
        // TOTAL USERS
        // ==============================================

        totalUsersEl.textContent =
            customers.length;


        // ==============================================
        // TOTAL CUSTOMERS
        // ==============================================

        totalCustomersEl.textContent =
            customers.length;


        // ==============================================
        // RECENT CUSTOMERS
        // ==============================================

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


        // ==============================================
        // ANALYTICS
        // ==============================================

        renderCustomerChart(customers);

    } catch (error) {

        console.error(
            "Customer loading error:",
            error
        );

        totalUsersEl.textContent = "0";
        totalCustomersEl.textContent = "0";

        recentCustomersEl.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    Failed to load customers
                </td>
            </tr>
        `;

    }

}


// ======================================================
// RECENT CUSTOMERS
// ======================================================

function renderRecentCustomers(customers) {

    if (!customers.length) {

        recentCustomersEl.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
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
                    customer.name || "Customer"
                );

            const phone =
                escapeHtml(
                    customer.phone || "-"
                );

            const email =
                escapeHtml(
                    customer.email || "-"
                );

            return `
                <tr>

                    <td>${name}</td>

                    <td>${phone}</td>

                    <td>${email}</td>

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

        const snapshot = await db
            .collection("orders")
            .get();

        let completedOrders = 0;
        let revenue = 0;

        const now = new Date();

        const currentMonth =
            now.getMonth();

        const currentYear =
            now.getFullYear();


        const notifications = [];


        snapshot.forEach(doc => {

            const order = doc.data();


            // ==========================================
            // COMPLETED ORDERS
            // ==========================================

            if (
                String(order.status || "").toLowerCase()
                === "delivered"
            ) {

                completedOrders++;

            }


            // ==========================================
            // MONTHLY REVENUE
            // ==========================================

            if (
                String(order.status || "").toLowerCase()
                === "delivered"
                &&
                String(order.paymentStatus || "").toLowerCase()
                === "approved"
            ) {

                let orderDate = null;

                if (
                    order.createdAt &&
                    order.createdAt.toDate
                ) {

                    orderDate =
                        order.createdAt.toDate();

                } else if (
                    order.orderDate &&
                    order.orderDate.toDate
                ) {

                    orderDate =
                        order.orderDate.toDate();

                }


                if (
                    orderDate &&
                    orderDate.getMonth() === currentMonth &&
                    orderDate.getFullYear() === currentYear
                ) {

                    revenue +=
                        Number(order.price || 0);

                }

            }


            // ==========================================
            // NEW / PENDING ORDERS
            // ==========================================

            if (
                String(order.status || "").toLowerCase()
                === "pending"
            ) {

                notifications.push(order);

            }

        });


        totalOrdersEl.textContent =
            completedOrders;


        totalRevenueEl.textContent =
            "₹" + revenue.toFixed(2);


        updateNotifications(
            notifications
        );


    } catch (error) {

        console.error(
            "Order loading error:",
            error
        );

        totalOrdersEl.textContent = "0";
        totalRevenueEl.textContent = "₹0";

    }

}


// ======================================================
// PENDING PAYMENTS
// ======================================================

async function loadPendingPayments() {

    try {

        const snapshot = await db
            .collection("balanceRechargeRequests")
            .get();

        let pending = 0;

        snapshot.forEach(doc => {

            const data = doc.data();

            if (
                String(data.status || "").toLowerCase()
                === "pending"
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

        pendingPaymentsEl.textContent = "0";

    }

}


// ======================================================
// NOTIFICATIONS
// ======================================================

function updateNotifications(orders) {

    notificationCountEl.textContent =
        orders.length;


    if (!orders.length) {

        notificationListEl.innerHTML =
            "No New Orders";

        return;

    }


    notificationListEl.innerHTML =
        orders.slice(0, 5).map(order => {

            return `
                <div class="notification-item">

                    <strong>
                        New Order
                    </strong>

                    <br>

                    ${escapeHtml(
                        order.productName || "Order"
                    )}

                    <br>

                    ₹${Number(
                        order.price || 0
                    ).toFixed(2)}

                </div>
            `;

        }).join("");

}


// ======================================================
// NOTIFICATION CLICK
// ======================================================

const bell =
    document.querySelector(".fa-bell");

if (bell) {

    bell.addEventListener("click", () => {

        notificationBox.classList.toggle(
            "show"
        );

    });

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
                        .collection("customers")
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
                        text.includes(keyword)
                    ) {

                        results.push({
                            id: doc.id,
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

function renderCustomerChart(customers) {

    const canvas =
        document.getElementById(
            "userChart"
        );

    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const monthlyCounts =
        new Array(12).fill(0);


    customers.forEach(customer => {

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

    });


    if (
        window.customerChart
    ) {

        window.customerChart.destroy();

    }


    window.customerChart =
        new Chart(ctx, {

            type: "line",

            data: {

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
                        label: "Customers",

                        data:
                            monthlyCounts,

                        tension: 0.35,

                        fill: true

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: true
                    }

                },

                scales: {

                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }

                    }

                }

            }

        });

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

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