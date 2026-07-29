console.log("Server starting...");

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const BOT_TOKEN = "8545735365:AAEVzSmQQZiAdznz3FZfyrRXUS5ZPvcqLS4";
const CHAT_ID = "8152666872";

app.get("/", (req, res) => {
  res.send("Telegram Notification Server Running");
});

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

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: text,
      }
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    console.log(err.response?.data);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});