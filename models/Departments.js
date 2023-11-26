const mongoose = require("mongoose");
const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true ,unique: true},
});
const DepartmentModel = mongoose.model("department", departmentSchema);
module.exports = { DepartmentModel };