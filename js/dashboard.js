// ==========================
// Firebase Auth Check
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Only Admin Access
    if (user.email !== "kundusudip011@gmail.com") {
        alert("Access Denied! Admin only.");
        firebase.auth().signOut();
        window.location.href = "login.html";
        return;
    }

    loadDashboard();
});

// ==========================
// Dashboard
// ==========================

function loadDashboard() {

    // Total Customers
    db.collection("customers").onSnapshot((snapshot) => {

        document.getElementById("totalCustomers").innerText =
            snapshot.size;

    });
    // Total Revenue
db.collection("orders")
.where("status", "==", "Delivered")
.onSnapshot((snapshot) => {

    let revenue = 0;

    snapshot.forEach((doc) => {
        revenue += Number(doc.data().price || 0);
    });

    document.getElementById("totalRevenue").innerText = "₹" + revenue;
});

// Total Orders
db.collection("orders")
.onSnapshot((snapshot) => {

    document.getElementById("totalOrders").innerText = snapshot.size;

});
// Pending Payments
db.collection("orders")
.where("paymentStatus", "==", "Pending")
.onSnapshot((snapshot) => {

    document.getElementById("pendingPayments").innerText =
        snapshot.size;

});
    // Recent Customers
    db.collection("customers")
        .orderBy("createdAt", "desc")
        .limit(5)
        .onSnapshot((snapshot) => {

            const tbody =
                document.getElementById("recentCustomers");

            tbody.innerHTML = "";

            snapshot.forEach((doc) => {

                const customer = doc.data();

                tbody.innerHTML += `

                <tr>

                    <td>${customer.name || ""}</td>

                    <td>${customer.phone || ""}</td>

                    <td>${customer.email || ""}</td>

                    <td>Active</td>

                </tr>

                `;

            });

        });

}
// ==========================
// Chart
// ==========================

const chartCanvas = document.getElementById("userChart");

if (chartCanvas) {

    new Chart(chartCanvas, {

        type: "bar",

        data: {

            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],

            datasets: [{

                label: "Customers",

                data: [5, 10, 15, 20, 25, 30],

                borderWidth: 1

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    display: true

                }

            }

        }

    });

}

// ==========================
// Total Users
// ==========================

db.collection("customers")
.onSnapshot((snapshot) => {
    document.getElementById("totalUsers").innerText = snapshot.size;
});

// ==========================
// Logout
// ==========================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        if (confirm("Logout?")) {

            await firebase.auth().signOut();

            window.location.href = "login.html";

        }

    });

}

const bell = document.querySelector(".fa-bell");

const box = document.getElementById("notificationBox");

bell.onclick = () => {

    if(box.style.display=="block"){

        box.style.display="none";

    }else{

        box.style.display="block";

    }

};

db.collection("orders")

.where("status","==","Pending")

.onSnapshot((snapshot)=>{

    document.getElementById("notificationCount").innerText =
    snapshot.size;

    const list =
    document.getElementById("notificationList");

    list.innerHTML="";

    if(snapshot.empty){

        list.innerHTML="No New Orders";

        return;

    }

    snapshot.forEach((doc)=>{

        const order = doc.data();

        list.innerHTML += `
            <div class="notification-item">

                <b>${order.customerName}</b><br>

                Ordered <b>${order.productName}</b>

            </div>
        `;

    });

});