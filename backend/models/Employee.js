const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  empId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dept: String,
  secret: { type: String, required: true }
});

module.exports = mongoose.model("Employee", employeeSchema);
