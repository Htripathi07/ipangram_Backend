const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  role: {
    type: String,
    enum: ["employee", "manager"],
  },
  department: { type: String, required: true },
  image: { type: String, required: true },
});

const EmployeeModel = mongoose.model("employee", employeeSchema);

module.exports = { EmployeeModel };
