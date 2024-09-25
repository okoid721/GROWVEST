const { Telegraf } = require("telegraf");
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();
const { Markup } = require("telegraf");

const { connectToDatabase, User, Investment, Withdrawal } = require("./db");
const investHandler = require("./investHandler");
const withdrawHandler = require("./withdraw");
const balanceHandler = require("./balance");
const { handleWithdraw, showWithdrawButton } = require("./withdrawal");

// Initialize and connect to the database
connectToDatabase();

// Initialize Express.js
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Express.js routes
// app.get("/api/users", async (req, res) => {
//   try {
//     const users = await User.find({});
//     res.json(users);
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// app.get("/api/investments", async (req, res) => {
//   try {
//     const investments = await Investment.find({});
//     res.json(investments);
//   } catch (error) {
//     console.error("Error fetching investments:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// app.get("/api/withdrawals", async (req, res) => {
//   try {
//     const withdrawals = await Withdrawal.find({});
//     res.json(withdrawals);
//   } catch (error) {
//     console.error("Error fetching withdrawals:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// Initialize the Telegraf bot
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// Handle /start command
bot.start(async (ctx) => {
  const { id, first_name, last_name, username } = ctx.from;

  try {
    // Save user data to MongoDB
    await User.findOneAndUpdate(
      { userId: id },
      { firstName: first_name, lastName: last_name, username: username },
      { upsert: true, new: true }
    );

    ctx.replyWithPhoto(
      {
        source: fs.createReadStream("./first.png"),
      },
      {
        caption:
          `Hello, ${first_name} This is GrowVest ✨ - your reliable app for keeping and using your NIARA, all at your fingertips to make extra income for yourself! 📱\n` +
          "\n" +
          "We're excited to introduce our new Telegram mini-app! Start earning now, and soon you'll find out all the great money you can earn from them. ⚡\n" +
          "\n" +
          "Have friends? Invite them! The more, the merrier! 👯\n" +
          "\n" +
          "Remember: GROWVEST is a place where you can invest your NIARA and earn 70% of your deposit, offering boundless investment opportunities!.🚀\n" +
          "\n" +
          "💬 *Join our Telegram group for updates and discussions:* [Join the Group](https://t.me/+2TGeHpWQ4_JhMzZk)",
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [
            [
              { text: "Balance", callback_data: "balance" },
              { text: "Trade", callback_data: "invest" },
              { text: "Set wallet", callback_data: "withdraw" },
            ],
            [{ text: "Withdraw", callback_data: "show_withdraw_button" }], // Withdraw button added here
          ],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      }
    );
  } catch (error) {
    console.error("Error handling /start command:", error);
  }
});

// Handle text commands
bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  try {
    if (text === "Trade") {
      await investHandler.handleInvest(ctx);
    } else if (text === "Balance") {
      await balanceHandler.handleBalance(ctx);
    } else if (text === "Set wallet") {
      await withdrawHandler.handleSetWallet(ctx);
    } else if (text === "Withdraw") {
      await showWithdrawButton(ctx); // Show withdrawal button
    } else {
      await investHandler.handleText(ctx, text);
      await withdrawHandler.handleText(ctx, text);
    }
  } catch (error) {
    console.error("Error handling text message:", error);
  }
});

// Handle withdrawal button click
bot.action("withdraw", async (ctx) => {
  await handleWithdraw(ctx); // Perform the withdrawal when the button is clicked
});

// Launch both Express and Telegraf
async function startApp() {
  await Promise.all([
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    }),
    bot.launch(),
  ]);
}

startApp().catch((error) => console.error("Error starting app:", error));
