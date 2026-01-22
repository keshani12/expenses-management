const express = require("express");
const router = express.Router();

const {
  getExpenses,
  addExpense,
  deleteExpense,
  updateExpense,
  getSummary,
  getWeeklySummary,
  getBalance,
  getWeeklyChartData
} = require("../controllers/expenseControllers");

// Routes for CRUD operations
router.get("/expenses", getExpenses);
router.post("/expenses", addExpense);
router.delete("/expenses/:id", deleteExpense);
router.put("/expenses/:id", updateExpense);
router.get("/balance", getBalance);

// Summary routes
router.get("/expenses/summary", getSummary); // Total income/expense
router.get("/expenses/summary/weekly", getWeeklySummary); // Last 7 days summary
router.get("/expenses/summary/weekly/chart", getWeeklyChartData); // Chart data for 7 days

module.exports = router;


