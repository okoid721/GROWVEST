const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB connection URI
const MONGO_URI = process.env.DATABASE_URL;

// Define a schema for storing user data
const userSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  firstName: String,
  lastName: String,
  username: String,
  dateJoined: { type: Date, default: Date.now },
  balance: { type: Number, default: 0 },

  // Add wallet information
  wallet: {
    name: { type: String }, // User's full name
    accountNumber: { type: String }, // Bank account number
    bankName: { type: String }, // Name of the bank
  },
  lastWithdrawalTime: { type: Date, default: null },
});

// Define a schema for storing investments
const investmentSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  firstName: String,
  amount: { type: Number, required: true },
  processed: { type: Boolean, default: false },
  dateInvested: { type: Date, default: Date.now },
});

// Define a schema for storing withdrawals
const withdrawalSchema = new mongoose.Schema({
  userId: { type: Number, required: true }, // Telegram User ID
  name: { type: String, required: true }, // Name of the person withdrawing
  amountWithdrawn: { type: Number, required: true }, // Amount withdrawn
  dateWithdrawn: { type: Date, default: Date.now }, // Date of withdrawal
});

// Create models based on the schemas
const User = mongoose.model("User", userSchema);
const Investment = mongoose.model("Investment", investmentSchema);
const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

module.exports = {
  connectToDatabase,
  User,
  Investment,
  Withdrawal,
};
