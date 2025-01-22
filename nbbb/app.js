const express = require("express");
const morgan = require("morgan");
const earthquakeRoutes = require("./routes/earthquakeRoutes");

const app = express();

app.use(express.json());
app.use(morgan("dev"));

// Root Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Earthquake Tracker API!",
  });
});

// Earthquake Routes
app.use("/api/earthquakes", earthquakeRoutes);

module.exports = app; // Export the app
