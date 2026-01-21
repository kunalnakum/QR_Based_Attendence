require("dotenv").config();
require("./db");

const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const Employee = require("./models/Employee");
const Attendance = require("./models/Attendance");

const app = express();
app.use(cors());
app.use(express.json());
const ExcelJS = require("exceljs");


/* =====================================================
   FRONTEND ROUTES
   ===================================================== */

const frontendPath = path.join(__dirname, "frontend");

app.use("/js", express.static(path.join(frontendPath, "js")));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "admin.html"));
});

app.get("/scanner.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "scanner.html"));
});

app.get("/report.html", (req, res) => {
  res.sendFile(path.join(frontendPath, "report.html"));
});

// /* =====================================================
//    FRONTEND (STATIC FILES – RAILWAY SAFE)
//    ===================================================== */

// const frontendPath = path.resolve(__dirname, "frontend");

// // Serve everything inside /frontend automatically
// app.use(express.static(frontendPath));

// // Default page
// app.get("/", (req, res) => {
//   res.sendFile(path.join(frontendPath, "admin.html"));
// });

/* =====================================================
   REGISTER EMPLOYEE
   ===================================================== */

app.post("/register-employee", async (req, res) => {
  try {
    const { empId, name, dept } = req.body;

    if (!empId || !name) {
      return res.status(400).json({ message: "Employee ID and Name required" });
    }

    const secret = uuidv4();

    await Employee.create({ empId, name, dept, secret });

    res.json({
      qrData: JSON.stringify({ empId, secret })
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Employee already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   MARK ATTENDANCE
   ===================================================== */

app.post("/mark-attendance", async (req, res) => {
  try {
    const { empId, secret } = req.body;

    const employee = await Employee.findOne({ empId, secret });
    if (!employee) {
      return res.status(401).json({ message: "Invalid QR" });
    }

    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString();

    await Attendance.create({ empId, date, time });

    res.json({ message: "Attendance marked" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Attendance already marked for today" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/attendance-report", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const records = await Attendance.find({ date }).sort({ empId: 1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   DOWNLOAD ATTENDANCE REPORT (EXCEL)
   ===================================================== */

app.get("/download-attendance", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).send("Date is required");
    }

    const records = await Attendance.find({ date });

    if (records.length === 0) {
      return res.status(404).send("No attendance found for this date");
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance");

    sheet.addRow(["Employee ID", "Date", "Time"]);

    records.forEach(r => {
      sheet.addRow([r.empId, r.date, r.time]);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-${date}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Server error");
  }
});


/* =====================================================
   START SERVER
   ===================================================== */

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log("Server running on port " + process.env.PORT);
});



