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

    await db.collection("orders").add({

        uid: user.uid,
        customerName: data.customerName,
        customerEmail: user.email,
        customerPhone: "",
        productId: data.productId,
        productName: data.productName,
        planName: data.planName,
        planIndex: data.planIndex,
        price: data.price,

        paymentMethod: "Google Pay",
        paymentStatus: "Pending",
        status: "Pending",

        productKey: "",

        orderId: "VIP-" + Date.now(),
        orderDate: new Date().toLocaleDateString(),
        orderTime: new Date().toLocaleTimeString(),

        createdAt: firebase.firestore.FieldValue.serverTimestamp()

    });

    localStorage.removeItem("orderData");

    alert("Payment Request Submitted!");

    window.location.href = "my-order.html";

});