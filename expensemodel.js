const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const expenseSchema = new Schema({
  expenseName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ["Fertilizers", "Labor", "Transport", "Other", "Income"], // ✅ predefined categories
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Bank Transfer", "Credit Card", "Other"], // ✅ only valid methods
    required: true
  },
  status: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  }
});

module.exports = mongoose.model("Expense", expenseSchema);



