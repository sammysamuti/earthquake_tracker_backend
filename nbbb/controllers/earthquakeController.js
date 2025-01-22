const admin = require("../firebase/firebase");
const earthquakeService = require("../services/earthquakeService");
const cron = require("node-cron");

// Firestore setup
const db = admin.firestore();
const USERS_COLLECTION = "users";
const NOTIFICATIONS_COLLECTION = "notifications";

// Utility: Calculate distance between two coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Utility: Filter earthquakes by distance and geographic bounds
function filterEarthquakes(earthquakeData, latitude, longitude) {
  const minLatitude = 3.0;
  const maxLatitude = 17.0;
  const minLongitude = 30.0;
  const maxLongitude = 50.0;

  return earthquakeData.filter((quake) => {
    const [quakeLongitude, quakeLatitude] =
      quake.geometry.coordinates.map(Number);

    const distance = getDistanceFromLatLonInKm(
      latitude,
      longitude,
      quakeLatitude,
      quakeLongitude
    );

    return (
      quakeLatitude >= minLatitude &&
      quakeLatitude <= maxLatitude &&
      quakeLongitude >= minLongitude &&
      quakeLongitude <= maxLongitude &&
      distance <= 500
    );
  });
}

// Route: Update user location and fetch earthquake data
exports.updateLocationAndGetEarthquakes = async (req, res) => {
  const { latitude, longitude, timeRange, fcmToken } = req.body;

  if (!latitude || !longitude || !fcmToken) {
    return res.status(400).json({
      success: false,
      message: "Invalid location data or missing FCM token",
    });
  }

  try {
    // Save user data in Firestore
    await db.collection(USERS_COLLECTION).doc(fcmToken).set({
      latitude,
      longitude,
      fcmToken,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`User location updated: [${latitude}, ${longitude}]`);

    // Fetch earthquake data
    const earthquakeData = await earthquakeService.fetchEarthquakeData(
      timeRange || "recent"
    );

    const filteredData = filterEarthquakes(earthquakeData, latitude, longitude);

    res.status(200).json({
      success: true,
      message: "Location updated and earthquake data fetched successfully",
      earthquakeData: filteredData,
    });
  } catch (error) {
    console.error(
      "Error updating location or fetching earthquake data:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Function: Send earthquake alerts
async function sendAlerts() {
  const usersSnapshot = await db.collection(USERS_COLLECTION).get();

  for (const userDoc of usersSnapshot.docs) {
    const user = userDoc.data();
    const { latitude, longitude, fcmToken } = user;

    const earthquakeData = await earthquakeService.fetchEarthquakeData(
      "recent"
    );
    const filteredData = filterEarthquakes(earthquakeData, latitude, longitude);

    for (const quake of filteredData) {
      const quakeId = quake.id; // Assume each quake has a unique ID
      const notificationsRef = db.collection(NOTIFICATIONS_COLLECTION);

      // Check if this quake has already been alerted for this user
      const alreadyNotified = await notificationsRef
        .where("userFcmToken", "==", fcmToken)
        .where("quakeId", "==", quakeId)
        .get();

      if (alreadyNotified.empty) {
        const magnitude = quake.properties.mag;
        const location = quake.properties.place;
        const time = new Date(quake.properties.time).toLocaleString();
        const message = `Earthquake detected near ${location}. Magnitude: ${magnitude}. Time: ${time}`;

        sendEarthquakeAlert(fcmToken, message);

        // Save notification record in Firestore
        await notificationsRef.add({
          userFcmToken: fcmToken,
          quakeId,
          notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
}

// Function: Send push notification via Firebase
function sendEarthquakeAlert(fcmToken, message) {
  const payload = {
    notification: {
      title: "Earthquake Alert",
      body: message,
    },
    android: {
      notification: {
        sound: "default",
      },
    },
    token: fcmToken, // Send to a specific device token
  };

  admin
    .messaging()
    .send(payload)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
}

// Schedule: Run sendAlerts every 5 minutes
cron.schedule("*/5 * * * *", sendAlerts);
