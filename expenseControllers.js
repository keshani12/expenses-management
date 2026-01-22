const Expense = require("../model/expensemodel");
const LocalIncome = require("../model/incomemodel"); // ✅ Import LocalIncome model at the top!

const mongoose = require("mongoose");

// ✅ Get all expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses", details: error.message });
  }
};

// ✅ Add a new expense
exports.addExpense = async (req, res) => {
  const { expenseName, category, amount, date, paymentMethod, status, description } = req.body;

  if (!expenseName || !category || !amount || !date || !paymentMethod || !status) {
    return res.status(400).json({ error: "All required fields must be filled!" });
  }

  try {
    const newExpense = new Expense({ expenseName, category, amount, date, paymentMethod, status, description });
    await newExpense.save();
    res.status(201).json({ message: "Expense added successfully", expense: newExpense });
  } catch (error) {
    res.status(500).json({ error: "Failed to add expense", details: error.message });
  }
};

// ✅ Update an expense
exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const { expenseName, category, amount, date, paymentMethod, status, description } = req.body;

  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { expenseName, category, amount, date, paymentMethod, status, description },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) return res.status(404).json({ message: "Expense not found" });

    res.status(200).json({ message: "Expense updated successfully", expense: updatedExpense });
  } catch (error) {
    res.status(500).json({ error: "Failed to update expense", details: error.message });
  }
};

// ✅ Delete an expense
exports.deleteExpense = async (req, res) => {
  const { id } = req.params;
  console.log("Received delete request for ID:", id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid expense ID" });
  }

  try {
    const deletedExpense = await Expense.findByIdAndDelete(id);
    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense", details: error.message });
  }
};

// ✅ Get income and expense summary
exports.getSummary = async (req, res) => {
  try {
    const expenses = await Expense.find();

    const totalIncome = expenses
      .filter(exp => exp.category === "Income")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpenses = expenses
      .filter(exp => exp.category !== "Income")
      .reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({
      totalIncome,
      totalExpenses,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate summary", details: error.message });
  }
};

// ✅ Weekly Summary Controller (Last 7 Days)
exports.getWeeklySummary = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // 🗓️ last 7 days including today

    const weeklyExpenses = await Expense.find({
      date: {
        $gte: sevenDaysAgo,
        $lte: today
      }
    });

    const totalIncome = weeklyExpenses
      .filter(exp => exp.category === "Income")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const totalExpenses = weeklyExpenses
      .filter(exp => exp.category !== "Income")
      .reduce((sum, exp) => sum + exp.amount, 0);

    res.status(200).json({
      totalIncome,
      totalExpenses,
      from: sevenDaysAgo.toDateString(),
      to: today.toDateString()
    });
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    res.status(500).json({ error: "Failed to fetch weekly summary", details: error.message });
  }
};

// ✅ Weekly Chart Data Controller (grouped by date)
exports.getWeeklyChartData = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // last 7 days including today

    const expenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$category", "Income"] }, "$amount", 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $ne: ["$category", "Income"] }, "$amount", 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } } // Sort by date
    ]);

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error in getWeeklyChartData:", error);
    res.status(500).json({ message: "Error fetching weekly chart data", error: error.message });
  }
};
exports.getBalance = async (req, res) => {
  try {
    // Get all local incomes
    const localIncomes = await LocalIncome.find();
    if (!localIncomes || localIncomes.length === 0) {
      return res.status(404).json({ message: "Income not found" });
    }

    // Calculate total income
    const totalIncome = localIncomes.reduce((sum, income) => {
      let revenue = 0;
      if (income.totalRevenue) {
        if (typeof income.totalRevenue === "string") {
          // Remove any non-numeric characters except for the decimal point (ignoring "Rs.")
          const cleanedRevenue = income.totalRevenue.replace(/[^\d.]/g, ''); 
          revenue = parseFloat(cleanedRevenue) || 0;
        } else {
          revenue = income.totalRevenue;
        }
      }
      return sum + revenue;
    }, 0);

    // Get all expenses
    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Calculate balance
    const balance = totalIncome - totalExpenses;

    // Send formatted response with 2 decimal points
    res.status(200).json({
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      balance: parseFloat(balance.toFixed(2))
    });

  } catch (error) {
    console.error("Error calculating balance:", error);
    res.status(500).json({ message: "Failed to calculate balance", error: error.message });
  }
};




// ✅ Get Total Income from LocalIncome Model
exports.getTotalIncome = async (req, res) => {
  try {
    const localIncomes = await LocalIncome.find(); // get all local incomes
    const totalIncome = localIncomes.reduce((sum, income) => sum + (income.totalRevenue || 0), 0); // calculate total income

    res.status(200).json({ totalIncome });
  } catch (error) {
    console.error("Error calculating total income:", error);
    res.status(500).json({ message: "Failed to calculate total income", error: error.message });
  }
};







