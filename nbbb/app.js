const express = require("express");
const morgan = require("morgan");
const earthquakeRoutes = require("./routes/earthquakeRoutes");

const app = express();


app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/earthquakes", earthquakeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
