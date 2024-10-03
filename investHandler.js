const fs = require("fs");
const { Markup } = require("telegraf");
const { User, Investment } = require("./db"); // Import the Investment model

// Temporary storage for pending investments (could also use session storage or a proper state management)
let pendingInvestments = {};

module.exports = {
  handleInvest: async (ctx) => {
    const keyboard = [
      [
        { text: "NGN3500", callback_data: "invest_3" },
        { text: "NGN5000", callback_data: "invest_5" },
      ],
      [
        { text: "NGN7500", callback_data: "invest_8" },
        { text: "NGN10000", callback_data: "invest_10" },
      ],
      [
        { text: "NGN15000", callback_data: "invest_20" },
        { text: "Back", callback_data: "back" },
      ],
    ];

    ctx.reply("Choose an amount you want to trade:", {
      reply_markup: {
        keyboard: keyboard,
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
  },

  handleText: async (ctx, text) => {
    const userId = ctx.from.id; // User's Telegram ID

    if (
      ["NGN3500", "NGN5000", "NGN7500", "NGN10000", "NGN15000"].includes(text)
    ) {
      const amount = parseInt(text.replace("NGN", ""));

      // Temporarily store the user's investment details
      pendingInvestments[userId] = { amount };

      ctx.replyWithPhoto(
        {
          source: fs.createReadStream("./secnd.png"),
        },
        {
          caption:
            `🚀 **Investment Confirmation**\n\n` +
            `Thank you for choosing to Trade **NGN${amount}**! 💰\n\n` +
            `Please make sure to enter the correct amount and ensure the transfer is successful. ✅\n\n` +
            `Click the link below to make the payment:`,
          reply_markup: {
            inline_keyboard: [
              [
                Markup.button.url(
                  "Make Payment",
                  "https://fundsvest.vercel.app/"
                ),
              ],
            ],
          },
        }
      );

      // Display the "Transfer successful" button immediately
      const keyboard = [
        [{ text: "Transfer successful", callback_data: "success" }],
        [{ text: "Back", callback_data: "back" }],
      ];

      ctx.reply(
        "After sending the receipt, click the button below once you've completed the transfer:",
        {
          reply_markup: {
            keyboard: keyboard,
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        }
      );
    } else if (text === "Transfer successful") {
      // Retrieve the stored investment details
      const investmentDetails = pendingInvestments[userId];

      if (investmentDetails) {
        const { amount } = investmentDetails;

        // Save the investment details to MongoDB when transfer is confirmed
        try {
          await Investment.create({ userId, amount });
          console.log(`Investment of ${amount} USDT saved for user ${userId}`);

          // Optionally update the user's balance
          const user = await User.findOne({ userId });
          const profitPercentage = 0.75;
          const profitAmount = amount * profitPercentage;
          user.balance += amount + profitAmount;
          await user.save();
          console.log(`User's balance updated with ${amount + profitAmount}`);

          ctx.reply(
            `Transfer successful! Your Trade of NGN${amount} has been processed. 💼`
          );
        } catch (err) {
          console.error("Error saving investment:", err);
          ctx.reply("Sorry, there was an error processing your investment.");
        }

        // Clear the pending investment
        delete pendingInvestments[userId];
      } else {
        ctx.reply("No pending investment found. Please try again.");
      }

      const keyboard = [
        [
          { text: "Balance", callback_data: "balance" },
          { text: "Trade", callback_data: "invest" },
          { text: "Set wallet", callback_data: "withdraw" },
        ],
        [{ text: "Withdraw", callback_data: "show_withdraw_button" }],
      ];
      ctx.reply("What would you like to do next?", {
        reply_markup: {
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
    } else if (text === "Back") {
      const keyboard = [
        [
          { text: "Balance", callback_data: "balance" },
          { text: "Trade", callback_data: "invest" },
          { text: "Set wallet", callback_data: "withdraw" },
        ],
        [{ text: "Withdraw", callback_data: "show_withdraw_button" }],
      ];
      ctx.reply("Action canceled.", {
        reply_markup: {
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });

      // Clear pending investment if any
      delete pendingInvestments[userId];
    }
  },
};
