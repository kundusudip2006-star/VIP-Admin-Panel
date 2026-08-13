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

// ==========================
// Telegram Webhook
// ==========================
app.post("/telegram-webhook", async (req, res) => {

    try {

        const update = req.body;

        // Ignore messages that are not button clicks
        if (!update.callback_query) {
            return res.json({ ok: true });
        }

        const callbackQuery = update.callback_query;

        const callbackData = callbackQuery.data || "";

        const [action, orderId] = callbackData.split(":");

        if (!orderId) {
            return res.json({ ok: true });
        }

        // Remove Telegram loading animation
       try {
    await axios.post(
        `${TELEGRAM_API}/answerCallbackQuery`,
        {
            callback_query_id: callbackQuery.id
        }
    );
} catch (telegramError) {
    console.log(
        "Callback answer skipped:",
        telegramError.response?.data || telegramError.message
    );
}

        // ==========================
        // APPROVE PAYMENT
        // ==========================
        if (action === "approve") {

            const snapshot = await db
                .collection("orders")
                .where("orderId", "==", orderId)
                .limit(1)
                .get();

            if (snapshot.empty) {

                await sendTelegramMessage(
                    `❌ Order not found\n\nOrder ID: ${orderId}`
                );

                return res.json({ ok: true });
            }

            const doc = snapshot.docs[0];

            await doc.ref.update({
                paymentStatus: "Approved",
                status: "Approved",
                approvedAt:
                    admin.firestore.FieldValue.serverTimestamp()
            });

            await sendTelegramMessage(
                `✅ PAYMENT APPROVED\n\n🆔 Order ID: ${orderId}\n\nPayment has been approved successfully.`
            );

        }

        // ==========================
        // DELIVER KEY
        // ==========================
        if (action === "deliver") {

            const snapshot = await db
                .collection("orders")
                .where("orderId", "==", orderId)
                .limit(1)
                .get();

            if (snapshot.empty) {

                await sendTelegramMessage(
                    `❌ Order not found\n\nOrder ID: ${orderId}`
                );

                return res.json({ ok: true });
            }

            const doc = snapshot.docs[0];
            const order = doc.data();

            // Key is not created automatically yet.
            await sendTelegramMessage(
                `🔑 KEY DELIVERY\n\n🆔 Order ID: ${orderId}\n\n👤 Customer: ${order.customerName || "N/A"}\n📧 Email: ${order.customerEmail || "N/A"}\n\n⚠️ Key delivery system is ready, but a key must be entered first.`
            );
        }

        res.json({
            ok: true
        });

    } catch (err) {

        console.error("Telegram webhook error:", err);
        console.log(err.response?.data);

        res.status(500).json({
            ok: false,
            error: err.message
        });
    }
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});