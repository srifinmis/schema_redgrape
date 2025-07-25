require("dotenv").config();
const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 5000;
const dirname = path.join(__dirname, "src", "controller"); // Absolute path

// ✅ Middleware
app.use(express.json());
app.use(cors());              // Allow CORS (can be restricted by origin)
app.use(helmet());            // Secure HTTP headers
app.use(morgan("combined")); // Logging

// ✅ Utility to safely read and respond with JSON from file
async function sendJsonFromFile(res, fileName) {
  try {
    // Prevent directory traversal attacks
    if (fileName.includes("..") || path.isAbsolute(fileName)) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    const filePath = path.join(dirname, fileName);
    const data = await fs.readFile(filePath, "utf8");
    const jsonData = JSON.parse(data);
    res.json(jsonData);
  } catch (err) {
    console.error(`❌ Error processing ${fileName}:`, err.message);
    if (err.code === "ENOENT") {
      res.status(404).json({ error: "File not found" });
    } else if (err instanceof SyntaxError) {
      res.status(400).json({ error: "Invalid JSON format in file" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

// ✅ Route factory for all endpoints
function createJsonRoute(routePath, fileName) {
  app.get(routePath, async (req, res) => {
    await sendJsonFromFile(res, fileName);
  });
}

// ✅ Define your routes
createJsonRoute("/api/fetch/common", "common.txt");
createJsonRoute("/api/fetch/PostalAddress", "PostalAddress.txt");
createJsonRoute("/api/fetch/ContactMech", "ContactMech.txt");
createJsonRoute("/api/fetch/PartyGroup", "PartyGroup.txt");
createJsonRoute("/api/fetch/TelecomNumber", "TelecomNumber.txt");
createJsonRoute("/api/fetch/Person", "Person.txt");
createJsonRoute("/api/fetch/ApiResponse", "apiResponse.txt");


// ✅ Optional: External API passthrough (uncomment if needed)
// app.get("/api/fetch/API", async (req, res) => {
//   try {
//     const axios = require("axios");
//     const response = await axios.get("https://www.redgrape.tech/license/api.html");
//     res.send(response.data); // Use res.json(JSON.parse(...)) if strictly JSON
//   } catch (error) {
//     console.error("❌ Error fetching external API:", error.message);
//     res.status(500).json({ success: false, message: "Failed to fetch schema" });
//   }
// });

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
