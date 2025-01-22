const axios = require("axios");

const fetchEarthquakeData = async (
  timeRange = "today",
  latitude = 9.145,
  longitude = 40.4897,
  maxRadius = 20
) => {
  const currentDate = new Date();
  let startDate;

  // Set the start date based on time range
  switch (timeRange) {
    case "yesterday":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 1)); 
      break;
    case "2 days ago":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 2));
      break;
    case "3 days ago":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 3)); 
      break;
    case "4 days ago":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 4)); 
      break;
    case "5 days ago":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 5)); 
      break;
    case "6 days ago":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 6)); 
      break;
    case "week":
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 7)); // 7 days ago
      break;
    case "month":
      startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1)); // 1 month ago
      break;
    case "today":
      startDate = new Date(currentDate.setHours(0, 0, 0, 0)); // Start of today
      break;
    default:
      startDate = new Date(currentDate.setDate(currentDate.getDate() - 1)); // Default to 1 day ago for "recent"
      break;
  }

  const startDateISO = startDate.toISOString();
  console.log(`Fetching data from: ${startDateISO}`);

  // Construct the USGS FDSN query URL with latitude, longitude, and maxradius parameters
  const USGS_API = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradius=${Math.min(
    maxRadius,
    20
  )}&starttime=${startDateISO}`;

  try {
    const response = await axios.get(USGS_API);
    console.log("Fetched Earthquake Data: ", response.data); // Full API response for debugging

    // Return the earthquake data from the response
    return response.data.features;
  } catch (error) {
    console.error("Error fetching earthquake data: ", error);
    throw new Error("Failed to fetch earthquake data: " + error.message);
  }
};

module.exports = { fetchEarthquakeData };
