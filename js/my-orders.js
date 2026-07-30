// ==========================
// Authentication Check
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadOrders(user);

});

// ==========================
// Load My Orders
// ==========================

const orderList = document.getElementById("orderList");

function loadOrders(user) {

    db.collection("orders")
        .where("uid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {

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

                let statusColor = "pending";

                if (order.status === "Delivered") {
                    statusColor = "delivered";
                }

                orderList.innerHTML += `

                <div class="order-card">

                    <h3>${order.productName}</h3>

                    <p><b>Order ID :</b> ${order.orderId}</p>

                    <p><b>Date :</b> ${order.orderDate}</p>

                    <p><b>Time :</b> ${order.orderTime}</p>

                    <p><b>Plan :</b> ${order.planName || "N/A"}</p>

                    <p><b>Price :</b> ₹${order.price}</p>

                    <p><b>Payment :</b> ${order.paymentStatus}</p>

                    <p>
                        <b>Status :</b>
                        <span class="${statusColor}">
                            ${order.status}
                        </span>
                    </p>

                    ${
                        order.status === "Delivered"
                        ? `
                        <div class="key-box" id="key-${doc.id}">
                            ${order.productKey}
                        </div>

                        <button class="copy-btn"
                            onclick="copyKey('key-${doc.id}')">
                            Copy Key
                        </button>
                        `
                        : ""
                    }

                </div>

                `;

            });

        });

}

// ==========================
// Copy Key
// ==========================

function copyKey(id) {

    const key = document.getElementById(id).innerText;

    navigator.clipboard.writeText(key);

    alert("Product Key Copied!");

}