console.log("Server starting...");

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ======================================================
// FIREBASE ADMIN
// ======================================================

const secretDir = "/etc/secrets";

if (!admin.apps.length) {

    const serviceAccountFile =
        "vip-admin-panel-2fc30-firebase-adminsdk-fbsvc-09fab6b93e.json";

    const serviceAccountPath =
        path.join(secretDir, serviceAccountFile);

    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(
            `Firebase Admin SDK JSON not found: ${serviceAccountPath}`
        );
    }

    const serviceAccount =
        JSON.parse(
            fs.readFileSync(serviceAccountPath, "utf8")
        );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log(
        "Firebase Admin initialized:",
        serviceAccount.project_id
    );
}

const db = admin.firestore();

// ======================================================
// TELEGRAM
// ======================================================

const BOT_TOKEN = process.env.BOT_TOKEN;

// তোমার Telegram admin chat ID
const CHAT_ID = "8152666872";

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN environment variable is missing");
}

const TELEGRAM_API =
    `https://api.telegram.org/bot${BOT_TOKEN}`;

// ======================================================
// TELEGRAM HELPER
// ======================================================

async function telegramRequest(method, data) {

    try {

        const response = await axios.post(
            `${TELEGRAM_API}/${method}`,
            data
        );

        return response.data;

    } catch (error) {

        console.error(
            `Telegram ${method} error:`,
            error.response?.data || error.message
        );

        throw error;
    }
}

// ======================================================
// SEND TELEGRAM MESSAGE
// ======================================================

async function sendTelegramMessage(
    text,
    replyMarkup = null
) {

    const payload = {
        chat_id: CHAT_ID,
        text: text
    };

    if (replyMarkup) {
        payload.reply_markup = replyMarkup;
    }

    return telegramRequest(
        "sendMessage",
        payload
    );
}

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.send(
        "VIP Admin Panel Telegram Notification Server Running"
    );
});

// ======================================================
// NEW ORDER
// ======================================================

app.post("/new-order", async (req, res) => {

    try {

        const data = req.body;

        if (!data.orderId) {
            return res.status(400).json({
                success: false,
                error: "Order ID is missing"
            });
        }

        const text = `
🛒 NEW ORDER RECEIVED

━━━━━━━━━━━━━━━━━━

🆔 Order ID: ${data.orderId}

👤 Customer: ${data.name || "N/A"}
📧 Email: ${data.email || "N/A"}
📞 Phone: ${data.phone || "N/A"}

📦 Product: ${data.product || "N/A"}
📋 Plan: ${data.plan || "N/A"}

💰 Price: ₹${data.amount || "N/A"}

💳 Payment:
${data.paymentMethod || "Google Pay"}

📌 Status: Pending

📅 Date: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString()}

━━━━━━━━━━━━━━━━━━

VIP Admin Panel
`;

        const replyMarkup = {

            inline_keyboard: [

                [
                    {
                        text: "✅ Approve Payment",
                        callback_data:
                            `approve:${data.orderId}`
                    }
                ],

                [
                    {
                        text: "🔑 Deliver Key",
                        callback_data:
                            `deliver:${data.orderId}`
                    }
                ]

            ]

        };

        await sendTelegramMessage(
            text,
            replyMarkup
        );

        console.log(
            "Telegram order notification sent:",
            data.orderId
        );

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "NEW ORDER ERROR:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ======================================================
// FIND ORDER
// ======================================================

async function findOrder(orderId) {

    const snapshot = await db
        .collection("orders")
        .where(
            "orderId",
            "==",
            orderId
        )
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0];
}

// ======================================================
// TELEGRAM WEBHOOK
// ======================================================

app.post("/telegram-webhook", async (req, res) => {

    try {

        const update = req.body;

        // ==================================================
        // CALLBACK BUTTON
        // ==================================================

        if (update.callback_query) {

            const callbackQuery =
                update.callback_query;

            const callbackData =
                callbackQuery.data || "";

            const callbackChatId =
                String(
                    callbackQuery.message?.chat?.id || ""
                );

            // Only admin can use buttons
            if (callbackChatId !== CHAT_ID) {

                await telegramRequest(
                    "answerCallbackQuery",
                    {
                        callback_query_id:
                            callbackQuery.id,
                        text:
                            "❌ Unauthorized",
                        show_alert: true
                    }
                );

                return res.json({
                    ok: true
                });
            }

            const parts =
                callbackData.split(":");

            const action = parts[0];

            const orderId =
                parts.slice(1).join(":");

            console.log(
                "Telegram button clicked:",
                action,
                orderId
            );

            if (!orderId) {

                await telegramRequest(
                    "answerCallbackQuery",
                    {
                        callback_query_id:
                            callbackQuery.id,
                        text:
                            "❌ Order ID missing",
                        show_alert: true
                    }
                );

                return res.json({
                    ok: true
                });
            }

            // Remove Telegram loading
            // animation
            await telegramRequest(
                "answerCallbackQuery",
                {
                    callback_query_id:
                        callbackQuery.id
                }
            );

            // ==================================================
            // APPROVE PAYMENT
            // ==================================================

            if (action === "approve") {

                console.log(
                    "Approving order:",
                    orderId
                );

                const orderDoc =
                    await findOrder(orderId);

                if (!orderDoc) {

                    await sendTelegramMessage(
                        `❌ ORDER NOT FOUND

🆔 Order ID:
${orderId}

The order could not be found in Firestore.`
                    );

                    return res.json({
                        ok: true
                    });
                }

                const order =
                    orderDoc.data();

                // Already approved
                if (
                    order.paymentStatus ===
                        "Approved"
                ) {

                    await sendTelegramMessage(
                        `ℹ️ PAYMENT ALREADY APPROVED

🆔 Order ID:
${orderId}`
                    );

                    return res.json({
                        ok: true
                    });
                }

                await orderDoc.ref.update({

                    paymentStatus:
                        "Approved",

                    status:
                        "Approved",

                    approvedAt:
                        admin.firestore
                            .FieldValue
                            .serverTimestamp()

                });

                await sendTelegramMessage(
                    `✅ PAYMENT APPROVED

🆔 Order ID:
${orderId}

👤 Customer:
${order.customerName || "N/A"}

💰 Amount:
₹${order.price || "N/A"}

Payment has been approved successfully.

🔑 You can now press "Deliver Key".`
                );

                return res.json({
                    ok: true
                });
            }

            // ==================================================
            // DELIVER KEY BUTTON
            // ==================================================

            if (action === "deliver") {

                console.log(
                    "Preparing key delivery:",
                    orderId
                );

                const orderDoc =
                    await findOrder(orderId);

                if (!orderDoc) {

                    await sendTelegramMessage(
                        `❌ ORDER NOT FOUND

🆔 Order ID:
${orderId}`
                    );

                    return res.json({
                        ok: true
                    });
                }

                const order =
                    orderDoc.data();

                // Payment must be approved
                if (
                    order.paymentStatus !==
                    "Approved"
                ) {

                    await sendTelegramMessage(
                        `⚠️ PAYMENT NOT APPROVED

🆔 Order ID:
${orderId}

Please approve the payment first.`
                    );

                    return res.json({
                        ok: true
                    });
                }

                // Key already delivered
                if (
                    order.productKey &&
                    String(order.productKey)
                        .trim() !== ""
                ) {

                    await sendTelegramMessage(
                        `ℹ️ KEY ALREADY DELIVERED

🆔 Order ID:
${orderId}

🔑 Key:
${order.productKey}`
                    );

                    return res.json({
                        ok: true
                    });
                }

                // Save pending delivery request
                await db
                    .collection(
                        "telegramPendingDeliveries"
                    )
                    .doc(CHAT_ID)
                    .set({

                        orderId:
                            orderId,

                        createdAt:
                            admin.firestore
                                .FieldValue
                                .serverTimestamp()

                    });

                await sendTelegramMessage(
                    `🔑 KEY DELIVERY

🆔 Order ID:
${orderId}

👤 Customer:
${order.customerName || "N/A"}

📧 Email:
${order.customerEmail || "N/A"}

📦 Product:
${order.productName || "N/A"}

📋 Plan:
${order.planName || "N/A"}

━━━━━━━━━━━━━━━━━━

✏️ Please send the product key now.

Example:

ABC-123-XYZ

/cancel
`
                );

                return res.json({
                    ok: true
                });
            }

            return res.json({
                ok: true
            });
        }

        // ==================================================
        // TELEGRAM TEXT MESSAGE
        // ==================================================

        if (update.message) {

            const message =
                update.message;

            const messageChatId =
                String(
                    message.chat?.id || ""
                );

            // Only admin can send keys
            if (
                messageChatId !== CHAT_ID
            ) {

                return res.json({
                    ok: true
                });
            }

            const text =
                String(
                    message.text || ""
                ).trim();

            // Ignore empty messages
            if (!text) {

                return res.json({
                    ok: true
                });
            }

            // ==================================================
            // CANCEL DELIVERY
            // ==================================================

            if (
                text.toLowerCase() ===
                "/cancel"
            ) {

                await db
                    .collection(
                        "telegramPendingDeliveries"
                    )
                    .doc(CHAT_ID)
                    .delete();

                await sendTelegramMessage(
                    `❌ KEY DELIVERY CANCELLED`
                );

                return res.json({
                    ok: true
                });
            }

            // ==================================================
            // CHECK PENDING DELIVERY
            // ==================================================

            const pendingDoc =
                await db
                    .collection(
                        "telegramPendingDeliveries"
                    )
                    .doc(CHAT_ID)
                    .get();

            if (!pendingDoc.exists) {

                // Normal admin message
                return res.json({
                    ok: true
                });
            }

            const pending =
                pendingDoc.data();

            const orderId =
                pending.orderId;

            console.log(
                "Receiving key for order:",
                orderId
            );

            // ==================================================
            // FIND ORDER
            // ==================================================

            const orderDoc =
                await findOrder(orderId);

            if (!orderDoc) {

                await sendTelegramMessage(
                    `❌ ORDER NOT FOUND

🆔 Order ID:
${orderId}

Key was NOT delivered.`
                );

                await pendingDoc.ref.delete();

                return res.json({
                    ok: true
                });
            }

            const order =
                orderDoc.data();

            // ==================================================
            // CHECK PAYMENT
            // ==================================================

            if (
                order.paymentStatus !==
                "Approved"
            ) {

                await sendTelegramMessage(
                    `⚠️ PAYMENT IS NOT APPROVED

🆔 Order ID:
${orderId}

Key was NOT delivered.`
                );

                await pendingDoc.ref.delete();

                return res.json({
                    ok: true
                });
            }

            // ==================================================
            // CHECK EXISTING KEY
            // ==================================================

            if (
                order.productKey &&
                String(order.productKey)
                    .trim() !== ""
            ) {

                await sendTelegramMessage(
                    `⚠️ KEY ALREADY EXISTS

🆔 Order ID:
${orderId}

🔑 Existing Key:
${order.productKey}`
                );

                await pendingDoc.ref.delete();

                return res.json({
                    ok: true
                });
            }

            // ==================================================
            // SAVE KEY TO FIRESTORE
            // ==================================================

            await orderDoc.ref.update({

                productKey:
                    text,

                status:
                    "Delivered",

                deliveredAt:
                    admin.firestore
                        .FieldValue
                        .serverTimestamp()

            });

            // Remove pending delivery
            await pendingDoc.ref.delete();

            // ==================================================
            // SUCCESS MESSAGE
            // ==================================================

            await sendTelegramMessage(
                `✅ KEY DELIVERED SUCCESSFULLY

━━━━━━━━━━━━━━━━━━

🆔 Order ID:
${orderId}

👤 Customer:
${order.customerName || "N/A"}

📧 Email:
${order.customerEmail || "N/A"}

📦 Product:
${order.productName || "N/A"}

📋 Plan:
${order.planName || "N/A"}

🔑 Product Key:
${text}

📌 Status:
Delivered

━━━━━━━━━━━━━━━━━━

Customer can now see the key in My Orders.`
            );

            return res.json({
                ok: true
            });
        }

        // ==================================================
        // IGNORE OTHER TELEGRAM UPDATES
        // ==================================================

        return res.json({
            ok: true
        });

    } catch (error) {

        console.error(
            "Telegram webhook error:"
        );

        console.error(
            error.response?.data ||
            error.stack ||
            error.message
        );

        try {

            await sendTelegramMessage(
                `❌ SERVER ERROR

${error.message}`
            );

        } catch (telegramError) {

            console.error(
                "Could not send Telegram error:",
                telegramError.message
            );
        }

        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// ======================================================
// START SERVER
// ======================================================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );
}); 