const express = require("express");
const {
  updateLocationAndGetEarthquakes,
} = require("../controllers/earthquakeController");
const router = express.Router();


router.post("/location", updateLocationAndGetEarthquakes);


module.exports = router;
