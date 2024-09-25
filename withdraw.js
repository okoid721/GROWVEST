const { User } = require("./db");
const userState = {}; // Store the state of the user (waiting for name, account number, etc.)

module.exports.handleSetWallet = async (ctx) => {
  const userId = ctx.from.id;

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      ctx.reply("User not found.");
      return;
    }

    // Check if all wallet details (name, account number, and bank name) are already set
    if (
      user.wallet &&
      user.wallet.name &&
      user.wallet.accountNumber &&
      user.wallet.bankName
    ) {
      ctx.reply(
        "Your bank details have already been set and cannot be changed."
      );
      return;
    }

    // Start by asking for the user's name
    userState[userId] = { step: "waiting_for_name" };
    ctx.reply("Please enter your full name:");
  } catch (error) {
    console.error("Error checking user wallet:", error);
    ctx.reply("An error occurred. Please try again later.");
  }
};

module.exports.handleText = async (ctx, text) => {
  const userId = ctx.from.id;
  const userProgress = userState[userId];

  if (userProgress) {
    try {
      const user = await User.findOne({ userId });

      if (!user) {
        ctx.reply("User not found.");
        return;
      }

      // Check if wallet details have been already set
      if (
        user.wallet &&
        user.wallet.name &&
        user.wallet.accountNumber &&
        user.wallet.bankName
      ) {
        ctx.reply("Your bank details are already set and cannot be changed.");
        return;
      }

      // Handle each step of the process
      if (userProgress.step === "waiting_for_name") {
        // Save the name and ask for the account number
        userState[userId].name = text;
        userState[userId].step = "waiting_for_account_number";
        ctx.reply("Thank you! Now, please enter your account number:");
      } else if (userProgress.step === "waiting_for_account_number") {
        // Save the account number and ask for the bank name
        userState[userId].accountNumber = text;
        userState[userId].step = "waiting_for_bank_name";
        ctx.reply("Got it! Now, please enter your bank name:");
      } else if (userProgress.step === "waiting_for_bank_name") {
        // Save the bank name and complete the process
        const bankName = text;
        const { name, accountNumber } = userState[userId];

        // Save the details in the database
        user.wallet = {
          name,
          accountNumber,
          bankName,
        };

        await user.save();
        console.log(`Bank details saved for user ${userId}:`, user.wallet);

        ctx.reply("Your bank details have been saved successfully!");

        // Clear the user state after saving
        delete userState[userId];
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      ctx.reply("An error occurred while saving your bank details.");
    }
  }
};
