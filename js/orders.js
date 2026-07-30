// ==========================
// Firebase Auth Check
// ==========================

firebase.auth().onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // শুধুমাত্র Admin Login
    if (user.email !== "kundusudip011@gmail.com") {
        alert("Access Denied!");
        firebase.auth().signOut();
        window.location.href = "login.html";
        return;
    }

    loadOrders();

});

// ==========================
// Elements
// ==========================

const orderTable = document.getElementById("orderTable");

const searchOrder = document.getElementById("searchOrder");

const statusFilter = document.getElementById("statusFilter");

const paymentFilter = document.getElementById("paymentFilter");

const orderModal = document.getElementById("orderModal");

const closeModal = document.getElementById("closeModal");

const sendKeyBtn = document.getElementById("sendKeyBtn");

const rejectPaymentBtn = document.getElementById("rejectPaymentBtn");

let selectedOrderId = null;

// ==========================
// Search
// ==========================

searchOrder.addEventListener("keyup", filterOrders);

statusFilter.addEventListener("change", filterOrders);

paymentFilter.addEventListener("change", filterOrders);

function filterOrders() {

    const search = searchOrder.value.toLowerCase();

    const status = statusFilter.value;

    const payment = paymentFilter.value;

    document.querySelectorAll("#orderTable tr").forEach(row => {

        const text = row.innerText.toLowerCase();

        const rowStatus = row.querySelector(".status")?.innerText || "";

        const rowPayment = row.querySelector(".payment")?.innerText || "";

        const matchSearch = text.includes(search);

        const matchStatus =
            status === "All" || rowStatus === status;

        const matchPayment =
            payment === "All" || rowPayment === payment;

        row.style.display =
            matchSearch && matchStatus && matchPayment
            ? ""
            : "none";

    });

}


// ==========================
// Load Orders
// ==========================

function loadOrders() {

    db.collection("orders")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {

        orderTable.innerHTML = "";

        if (snapshot.empty) {

            orderTable.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center">
                    No Orders Found
                </td>
            </tr>
            `;

            return;
        }

        snapshot.forEach((doc) => {

            const order = doc.data();

            const date = order.createdAt
                ? order.createdAt.toDate().toLocaleString()
                : "-";

            orderTable.innerHTML += `

            <tr>

                <td>${order.orderId || doc.id.substring(0,8)}</td>

                <td>${order.customerName || ""}</td>

                <td>
    ${order.productName || ""}
    <br>
    <small style="color:#666;">
        ${order.planName || ""}
    </small>
</td>

               <td>${order.planName || "-"}</td>

                <td>₹${order.price || 0}</td>

                <td class="status">
                    ${order.status || "Pending"}
                </td>

                <td class="payment">
                    ${order.paymentStatus || "Pending"}
                </td>

                <td>${date}</td>

                <td>

                    
<button class="paid-btn" onclick="verifyPayment('${doc.id}')">Paid</button>

<button class="view-btn" onclick="viewOrder('${doc.id}')">View</button>

<button class="cancel-btn" onclick="cancelOrder('${doc.id}')">Cancel</button>

                </td>

            </tr>

            `;

        });

    });

}

// ==========================
// Verify Payment
// ==========================

async function verifyPayment(id){

    if(!confirm("Approve this payment?")) return;

    await db.collection("orders")
    .doc(id)
    .update({

        paymentStatus: "Paid"

    });

    alert("Payment Approved!");

    // যদি এই Order Modal খোলা থাকে
    if(selectedOrderId === id){

        document.getElementById("paymentStatus").innerText = "Paid";

        document.getElementById("sendKeyBtn").disabled = false;

    }

}

// ==========================
// Cancel Order
// ==========================

async function cancelOrder(id){

    if(!confirm("Cancel this order?")) return;

    await db.collection("orders")
    .doc(id)
    .update({

        status:"Cancelled"

    });

    alert("Order Cancelled");

}
// ==========================
// View Order
// ==========================

async function viewOrder(id){

    const doc = await db.collection("orders").doc(id).get();

    if(!doc.exists) return;

    const order = doc.data();

    selectedOrderId = id;

    document.getElementById("customerName").innerText =
        order.customerName || "";

    document.getElementById("productName").innerText =
    (order.productName || "") + " (" + (order.planName || "") + ")";

    document.getElementById("productPlan").innerText =
    order.planName || "-";
    document.getElementById("productPrice").innerText =
        order.price || 0;

    document.getElementById("orderStatus").innerText =
        order.status || "Pending";

    document.getElementById("productKey").value =
        order.productKey || "";

    // New Fields
    document.getElementById("customerEmail").innerText =
        order.customerEmail || "";

    document.getElementById("customerPhone").innerText =
        order.customerPhone || "";

    document.getElementById("orderId").innerText =
    order.orderId || doc.id;

    document.getElementById("paymentStatus").innerText =
        order.paymentStatus || "Pending";

        // Enable Send Key only after payment approved

const sendBtn = document.getElementById("sendKeyBtn");


if (order.paymentStatus === "Paid") {

    sendBtn.disabled = false;

} else {

    sendBtn.disabled = true;

}

        // ==========================
// Payment Screenshot
// ==========================

const screenshotImg = document.getElementById("paymentScreenshotImg");
const screenshotBtn = document.getElementById("viewScreenshotBtn");

if (order.paymentScreenshot) {

    screenshotImg.src = order.paymentScreenshot;
    screenshotImg.style.display = "block";

    screenshotBtn.href = order.paymentScreenshot;
    screenshotBtn.style.display = "inline-block";

} else {

    screenshotImg.style.display = "none";
    screenshotBtn.style.display = "none";

}

    if(order.createdAt){
        document.getElementById("orderDate").innerText =
            order.createdAt.toDate().toLocaleString();
    }else{
        document.getElementById("orderDate").innerText = "-";
    }

    if(order.deliveredAt){
        document.getElementById("deliveredDate").innerText =
            order.deliveredAt.toDate().toLocaleString();
    }else{
        document.getElementById("deliveredDate").innerText = "-";
    }

    orderModal.style.display = "flex";
}



// ==========================
// Close Modal
// ==========================

closeModal.onclick = ()=>{

    orderModal.style.display="none";

};

window.onclick=(e)=>{

    if(e.target===orderModal){

        orderModal.style.display="none";

    }

};



// ==========================
// Send Manual Key
// ==========================

sendKeyBtn.addEventListener("click", async ()=>{


    const key =
    document.getElementById("productKey").value.trim();


    if(!key){

        alert("Enter Product Key");

        return;

    }



    const orderDoc = await db.collection("orders")
.doc(selectedOrderId)
.get();

const order = orderDoc.data();

await db.collection("orders")
.doc(selectedOrderId)
.update({
    productKey: key,
    status: "Delivered",
    deliveredAt: firebase.firestore.FieldValue.serverTimestamp()
});

const productRef = db.collection("products").doc(order.productId);

const productDoc = await productRef.get();

if (productDoc.exists) {

    const product = productDoc.data();

    let plans = product.plans || [];

    let index = order.planIndex;

    if (plans[index]) {

        plans[index].stock = Math.max((plans[index].stock || 0) - 1, 0);

        await productRef.update({
            plans: plans
        });

    }

}



    alert("Key Delivered Successfully!");

    orderModal.style.display="none";


});



// ==========================
// Logout
// ==========================

document.getElementById("logoutBtn")
.addEventListener("click",async()=>{


    if(confirm("Logout?")){


        await firebase.auth().signOut();


        window.location.href="login.html";


    }


});
rejectPaymentBtn.addEventListener("click", async () => {

    if (!selectedOrderId) return;

    if (!confirm("Reject this payment?")) return;

    await db.collection("orders")
    .doc(selectedOrderId)
    .update({
        paymentStatus: "Rejected"
    });

    document.getElementById("paymentStatus").innerText = "Rejected";

    document.getElementById("sendKeyBtn").disabled = true;

    alert("Payment Rejected!");

});