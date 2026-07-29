// ==========================
// Copy UPI ID
// ==========================
function copyUPI() {
    const upi = document.getElementById("upi").innerText;
    navigator.clipboard.writeText(upi);
    alert("UPI ID Copied");
}

// ==========================
// Auth Check
// ==========================
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = "login.html";
    }
});

// ==========================
// Load Payment Details
// ==========================
const data = JSON.parse(localStorage.getItem("orderData"));

if (data) {

    document.getElementById("productName").innerText =
        data.productName + " - " + data.planName;

    document.getElementById("amount").innerText =
        "₹" + data.price;

    const upiLink =
        `upi://pay?pa=kundusudip2006@oksbi&pn=VIP Store&am=${data.price}&cu=INR`;

    document.getElementById("payNow").href = upiLink;

    const qrURL =
        `https://quickchart.io/qr?text=${encodeURIComponent(upiLink)}`;

    document.getElementById("qrImage").src = qrURL;
}

// ==========================
// I've Paid
// ==========================
document.getElementById("paidBtn").addEventListener("click", async () => {

    const user = firebase.auth().currentUser;

    if (!user) {
        alert("Please Login First!");
        return;
    }

    const data = JSON.parse(localStorage.getItem("orderData"));

    if (!data) {
        alert("Order data not found!");
        return;
    }

    const orderId = "VIP-" + Date.now();

    await db.collection("orders").add({

        uid: user.uid,
        customerName: data.customerName,
        customerEmail: user.email,
        customerPhone: user.phoneNumber || "",

        productId: data.productId,
        productName: data.productName,
        planName: data.planName,
        planIndex: data.planIndex,
        price: data.price,

        paymentMethod: "Google Pay",
        paymentStatus: "Pending",
        status: "Pending",

        productKey: "",

        orderId: orderId,
        orderDate: new Date().toLocaleDateString(),
        orderTime: new Date().toLocaleTimeString(),

        createdAt: firebase.firestore.FieldValue.serverTimestamp()

    });

    // Telegram Notification
    try {

        await fetch("https://vip-admin-panel.onrender.com/new-order", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                orderId: orderId,
                name: data.customerName,
                email: user.email,
                phone: user.phoneNumber || "",
                product: data.productName,
                plan: data.planName,
                amount: data.price,
                paymentMethod: "Google Pay"

            })

        });

    } catch (e) {

        console.error(e);

    }

    localStorage.removeItem("orderData");

    alert("Payment Request Submitted!");

    window.location.href = "my-order.html";

});