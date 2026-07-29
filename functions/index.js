console.log("Server starting...");

const express = require("express");
const axios = require("axios");

const app = express();
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
🛒 New Order

👤 Name: ${data.name || "N/A"}
📞 Phone: ${data.phone || "N/A"}
💰 Amount: ${data.amount || "N/A"}
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