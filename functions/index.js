console.log("Server starting...");

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// Firebase Admin
// ==========================
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// ==========================
// Telegram
// ==========================
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = "8152666872";

const TELEGRAM_API =
    `https://api.telegram.org/bot${BOT_TOKEN}`;

// ==========================
// Home
// ==========================
app.get("/", (req, res) => {
    res.send("Telegram Notification Server Running");
});

// ==========================
// Send Telegram Message
// ==========================
async function sendTelegramMessage(text, replyMarkup = null) {

    const payload = {
        chat_id: CHAT_ID,
        text: text
    };

    if (replyMarkup) {
        payload.reply_markup = replyMarkup;
    }

    return axios.post(
        `${TELEGRAM_API}/sendMessage`,
        payload
    );
}

// ==========================
// NEW ORDER
// ==========================
app.post("/new-order", async (req, res) => {

    try {

        const data = req.body;

        const text = `
🛒 NEW ORDER RECEIVED

━━━━━━━━━━━━━━

🆔 Order ID: ${data.orderId || "N/A"}

👤 Customer: ${data.name || "N/A"}
📧 Email: ${data.email || "N/A"}
📞 Phone: ${data.phone || "N/A"}

📦 Product: ${data.product || "N/A"}
📋 Plan: ${data.plan || "N/A"}

💰 Price: ₹${data.amount || "N/A"}

💳 Payment: ${data.paymentMethod || "Google Pay"}

📌 Status: Pending

📅 Date: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString()}

━━━━━━━━━━━━━━

VIP Admin Panel
`;

        // Telegram buttons
        const replyMarkup = {
            inline_keyboard: [
                [
                    {
                        text: "✅ Approve Payment",
                        callback_data: `approve:${data.orderId}`
                    }
                ],
                [
                    {
                        text: "🔑 Deliver Key",
                        callback_data: `deliver:${data.orderId}`
                    }
                ]
            ]
        };

        await sendTelegramMessage(text, replyMarkup);

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);
        console.log(err.response?.data);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/// ==========================
// Telegram Webhook
// ==========================
app.post("/telegram-webhook", async (req, res) => {

    const update = req.body;

    // Telegram-কে immediately 200 response
    res.status(200).json({ ok: true });

    // Button click না হলে কিছু করার নেই
    if (!update.callback_query) {
        return;
    }

    try {

        const callbackQuery = update.callback_query;
        const callbackData = callbackQuery.data || "";

        console.log("Telegram button clicked:", callbackData);

        const parts = callbackData.split(":");
        const action = parts[0];
        const orderId = parts.slice(1).join(":");

        if (!orderId) {
            console.log("Order ID missing");
            return;
        }

        // ==========================
        // APPROVE PAYMENT
        // ==========================
        if (action === "approve") {

            console.log("Approving order:", orderId);

            const snapshot = await db
                .collection("orders")
                .where("orderId", "==", orderId)
                .limit(1)
                .get();

            console.log("Orders found:", snapshot.size);

            if (snapshot.empty) {

                await sendTelegramMessage(
                    `❌ ORDER NOT FOUND\n\n🆔 ${orderId}`
                );

                return;
            }

            const doc = snapshot.docs[0];

            await doc.ref.update({
                paymentStatus: "Approved",
                status: "Approved",
                approvedAt:
                    admin.firestore.FieldValue.serverTimestamp()
            });

            console.log("Payment approved:", orderId);

            // Telegram notification
            await sendTelegramMessage(
                `✅ PAYMENT APPROVED\n\n🆔 Order ID: ${orderId}\n\nPayment has been approved successfully.`
            );

            return;
        }

        // ==========================
        // DELIVER KEY
        // ==========================
        if (action === "deliver") {

            console.log("Deliver key clicked:", orderId);

            const snapshot = await db
                .collection("orders")
                .where("orderId", "==", orderId)
                .limit(1)
                .get();

            if (snapshot.empty) {

                await sendTelegramMessage(
                    `❌ ORDER NOT FOUND\n\n🆔 ${orderId}`
                );

                return;
            }

            const order = snapshot.docs[0].data();

            await sendTelegramMessage(
                `🔑 KEY DELIVERY\n\n🆔 Order ID: ${orderId}\n\n👤 Customer: ${order.customerName || "N/A"}\n📧 Email: ${order.customerEmail || "N/A"}\n\n⚠️ Please enter/deliver the key from the admin system.`
            );

            return;
        }

    } catch (err) {

        console.error("❌ Telegram webhook error:");
        console.error(err);
        console.error(err.response?.data);

        try {

            await sendTelegramMessage(
                `❌ SERVER ERROR\n\n${err.message}`
            );

        } catch (telegramError) {

            console.error(
                "Telegram error:",
                telegramError.response?.data || telegramError.message
            );

        }
    }
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});