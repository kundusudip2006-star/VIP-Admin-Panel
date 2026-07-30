// ==========================
// Copy UPI ID
// ==========================
function copyUPI() {
    const upi = document.getElementById("upi").innerText;
    navigator.clipboard.writeText(upi);
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

    const paidBtn = document.getElementById("paidBtn");

    // Prevent multiple clicks
    if (paidBtn.disabled) return;

    paidBtn.disabled = true;
    paidBtn.innerText = "Processing...";

    const user = firebase.auth().currentUser;

    if (!user) {
        alert("Please Login First!");
        paidBtn.disabled = false;
        paidBtn.innerText = "I've Paid";
        return;
    }

    const data = JSON.parse(localStorage.getItem("orderData"));

    if (!data) {
        alert("Order data not found!");
        paidBtn.disabled = false;
        paidBtn.innerText = "I've Paid";
        return;
    }

    try {

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

        localStorage.removeItem("orderData");

       Swal.fire({
    icon: "success",
    title: "Payment Submitted!",
    html: `
        <h3 style="color:#28a745;">Thank You ❤️</h3>

        <p>Your payment request has been submitted successfully.</p>

        <p>⏳ Please wait while our admin verifies your payment.</p>

        <p>You will receive your product after approval.</p>
    `,
    confirmButtonText: "OK",
    confirmButtonColor: "#28a745",
    allowOutsideClick: false
}).then(() => {
    window.location.href = "my-order.html";
});

        window.location.href = "my-order.html";

    } catch (error) {

        console.error(error);

        alert("Something went wrong. Please try again.");

        paidBtn.disabled = false;
        paidBtn.innerText = "I've Paid";

    }

});