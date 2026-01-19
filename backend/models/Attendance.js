const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  empId: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true }
});

// prevent duplicate attendance per day
attendanceSchema.index({ empId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
