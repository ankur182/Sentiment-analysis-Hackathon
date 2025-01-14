const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database("./services.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    // Create `services` Table
    db.run(
      `CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        OriginalPrice INTEGER NOT NULL,
        CurrentPrice INTEGER NOT NULL,
        Quantity INTEGER NOT NULL
      )`,
      (err) => {
        if (err) console.error("Error creating services table:", err.message);
      }
    );

    // Create `tickerInfo` Table
    db.run(
      `CREATE TABLE IF NOT EXISTS tickerInfo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL ,
        sentiment TEXT NOT NULL
      )`,
      (err) => {
        if (err) console.error("Error creating tickerInfo table:", err.message);
      }
    );
  }
});

// Seed Data for `services` Table
app.get("/seed-services", (req, res) => {
  const services = [
    ["Apple", 10000, 19000, 12],
    ["Samsung", 5000, 24500, 6],
    ["Oppo", 2000, 61800, 23],
    ["Microsoft", 8000, 17500, 15],
    ["Google", 12000, 111500, 8],
    ["Tesla", 15000, 714000, 5],
    ["Amazon", 11000, 310500, 10],
    ["Meta", 9000, 28500, 20],
  ];

  const query = "INSERT INTO services (title, OriginalPrice, CurrentPrice, Quantity) VALUES (?, ?, ?, ?)";
  services.forEach((service) => {
    db.run(query, service, (err) => {
      if (err) console.error("Error seeding services data:", err.message);
    });
  });

  res.send("Services table seeded!");
});

// Seed Data for `tickerInfo` Table
app.get("/seed-ticker-info", (req, res) => {
  const tickerData = [
    ["AAPL", "Strong Sell"],
    ["SAM", "Hold"],
    ["OPP", "Neutral"],
    ["MSFT", "Buy"],
    ["GOOGL", "Strong Buy"],
    ["TSLA", "Sell"],
    ["AMZN", "Hold"],
    ["META", "Neutral"],
  ];

  const query = "INSERT INTO tickerInfo (ticker, sentiment) VALUES (?, ?)";
  tickerData.forEach((ticker) => {
    db.run(query, ticker, (err) => {
      if (err) console.error("Error seeding tickerInfo data:", err.message);
    });
  });

  res.send("TickerInfo table seeded!");
});

// Get All Services
app.get("/services", (req, res) => {
  db.all("SELECT * FROM services", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get All Tickers and Sentiments
app.get("/ticker-info", (req, res) => {
  db.all("SELECT ticker, sentiment FROM tickerInfo", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get Sentiment by Ticker
app.get("/ticker-info/:ticker", (req, res) => {
  const ticker = req.params.ticker.toUpperCase(); // Ensure ticker is case-insensitive
  db.get("SELECT sentiment FROM tickerInfo WHERE ticker = ?", [ticker], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (row) {
      res.json({ ticker, sentiment: row.sentiment });
    } else {
      res.status(404).json({ error: "Ticker not found" });
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
