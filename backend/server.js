const express = require("express");
const cors = require("cors");
const ExcelJS = require("exceljs");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());
const path = require("path");

app.use(express.static(path.join(__dirname, "../frontend")));


app.post("/register-employee", async (req, res) => {
  const { empId, name, dept } = req.body;

  if (!empId || !name) {
    return res.status(400).json({ message: "Invalid data" });
  }

  const secret = uuidv4();

  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile("employees.xlsx");
  } catch {
    const sheet = workbook.addWorksheet("Employees");
    sheet.addRow(["empId", "name", "dept", "secret"]);
  }

  const sheet = workbook.getWorksheet("Employees");
  sheet.addRow([empId, name, dept, secret]);

  await workbook.xlsx.writeFile("employees.xlsx");

  res.json({
    qrData: JSON.stringify({ empId, secret })
  });
});


app.post("/mark-attendance", async (req, res) => {
  const { empId, secret } = req.body;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("employees.xlsx");
  const empSheet = workbook.getWorksheet("Employees");

  const rows = empSheet.getRows(2, empSheet.rowCount - 1);
  const employee = rows.find(
    r => r.getCell(1).value === empId && r.getCell(4).value === secret
  );

  if (!employee) {
    return res.status(401).json({ message: "Invalid QR" });
  }

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toLocaleTimeString();

  const attWorkbook = new ExcelJS.Workbook();

  try {
    await attWorkbook.xlsx.readFile("attendance.xlsx");
  } catch {
    const sheet = attWorkbook.addWorksheet("Attendance");
    sheet.addRow(["empId", "date", "time"]);
  }

  const sheet = attWorkbook.getWorksheet("Attendance");

  // DUPLICATE CHECK
  let alreadyMarked = false;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const existingEmpId = row.getCell(1).value;
    const existingDate = row.getCell(2).value;

    if (existingEmpId === empId && existingDate === date) {
      alreadyMarked = true;
    }
  });

  if (alreadyMarked) {
    return res.status(409).json({
      message: "Attendance already marked for today"
    });
  }

  // MARK ATTENDANCE
  sheet.addRow([empId, date, time]);
  await attWorkbook.xlsx.writeFile("attendance.xlsx");

  res.json({ message: "Attendance marked" });
});


app.get("/download-attendance", async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).send("Date is required");
  }

  const ExcelJS = require("exceljs");
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile("attendance.xlsx");
  } catch {
    return res.status(404).send("Attendance file not found");
  }

  const sheet = workbook.getWorksheet("Attendance");
  if (!sheet) {
    return res.status(404).send("Attendance sheet not found");
  }

  const newWorkbook = new ExcelJS.Workbook();
  const newSheet = newWorkbook.addWorksheet("Attendance");

  // Header
  newSheet.addRow(["empId", "date", "time"]);

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowDate = row.getCell(2).value;
    if (rowDate === date) {
      newSheet.addRow([
        row.getCell(1).value,
        row.getCell(2).value,
        row.getCell(3).value
      ]);
    }
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=attendance-${date}.xlsx`
  );

  await newWorkbook.xlsx.write(res);
  res.end();
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
