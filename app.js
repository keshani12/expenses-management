const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const expenseRoutes = require("./routes/expenseroute");
const incomeRoutes = require("./routes/incomeroute");

dotenv.config(); // Load environment variables

const app = express();

// CORS Configuration
const corsOptions = {
  origin: "http://localhost:3000",  // Frontend URL (React app)
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
};
app.use(cors(corsOptions));  // Use the CORS configuration

app.use(express.json()); 

app.use("/api", expenseRoutes);  // Base API route
app.use("/income", incomeRoutes); 


app.get("/", (req, res) => {
  res.send("Backend is working successfully!");
});

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB successfully!");
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("Database connection error:", err));
