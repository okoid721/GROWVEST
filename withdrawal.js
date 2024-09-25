const { User } = require("./db");
const Withdrawal = require("./db"); // Import the Withdrawal model

module.exports.handleWithdraw = async (ctx) => {
  try {
    const user = await User.findOne({ userId: ctx.from.id });

    if (!user) {
      return ctx.reply("User not found.");
    }

    const currentTime = new Date();
    const lastWithdrawalTime = user.lastWithdrawalTime || new Date(0); // Default to long ago if no withdrawal has happened
    const timeDiff = (currentTime - lastWithdrawalTime) / (1000 * 60 * 60); // Time difference in hours

    if (timeDiff >= 24) {
      // Deduct 20% of the balance for the withdrawal
      const withdrawalAmount = user.balance * 0.2;
      user.balance -= withdrawalAmount;
      user.lastWithdrawalTime = currentTime; // Update last withdrawal time

      // Save updated user data
      await user.save();

      // Record the withdrawal in the Withdrawal model
      await Withdrawal.create({
        userId: user.userId,
        name: user.firstName, // Assuming the user's name is stored in firstName
        amountWithdrawn: withdrawalAmount,
      });

      // Reply with a success message
      ctx.reply(
        `You have successfully withdrawn 20% of your balance. Your new balance is ${user.balance.toFixed(
          5
        )} NGN.`
      );
    } else {
      // Calculate remaining hours for the next withdrawal
      const hoursUntilNextWithdrawal = 24 - timeDiff;
      ctx.reply(
        `You can only withdraw every 24 hours. Next withdrawal available in ${hoursUntilNextWithdrawal.toFixed(
          2
        )} hours.`
      );
    }
  } catch (err) {
    console.error("Error handling withdrawal:", err);
    ctx.reply("An error occurred while processing your withdrawal.");
  }
};

module.exports.showWithdrawButton = async (ctx) => {
  try {
    const user = await User.findOne({ userId: ctx.from.id });

    if (!user) {
      return ctx.reply("User not found.");
    }

    const currentTime = new Date();
    const lastWithdrawalTime = user.lastWithdrawalTime || new Date(0); // Default to long ago if no withdrawal has happened
    const timeDiff = (currentTime - lastWithdrawalTime) / (1000 * 60 * 60); // Time difference in hours

    if (timeDiff >= 24) {
      // Show the withdrawal button only if 24 hours have passed
      ctx.reply("Click the button below to withdraw 20% of your balance.", {
        reply_markup: {
          inline_keyboard: [[{ text: "Withdraw", callback_data: "withdraw" }]],
        },
      });
    } else {
      // Calculate remaining hours for the next withdrawal
      const hoursUntilNextWithdrawal = 24 - timeDiff;
      ctx.reply(
        `Next withdrawal available in ${hoursUntilNextWithdrawal.toFixed(
          2
        )} hours.`
      );
    }
  } catch (err) {
    console.error("Error showing withdrawal button:", err);
    ctx.reply("An error occurred while displaying the withdrawal button.");
  }
};
