const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");
const { createProxyMiddleware } = require('http-proxy-middleware');
const { connection } = require("./config/db");
const { UserModel } = require("./models/User.model");
const { DepartmentModel } = require("./models/Departments");
const { EmployeeModel } = require("./models/Employees.model");
const { authentication } = require("./middlewares/authentication");

const PORT = 3001;

const app = express();
const corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));
app.use(express.json());



module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://busy-lime-marlin-cuff.cyclic.app',
      changeOrigin: true,
    })
  );
};
app.get("/", (req, res) => {
  res.send({ message: "Base Api route" });
});






app.post("/signup", async (req, res) => {
  let { name, email, password, role, location } = req.body;
  bcrypt.hash(password, 4, async function (err, hash) {
    const new_user = new UserModel({
      name,
      email,
      password: hash,
      role,
      location,
    });
    try {
      await new_user.save();
      res.send({ message: "Signup successfully" });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send({ message: "something went wrong! Try again later..." });
    }
  });
});




app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Attempting to find user with email:", email);

    const user = await UserModel.findOne({ email });
    console.log("User found:", user);

    if (!user) {
      console.log("No user found with this email. Prompting to sign up.");
      return res.send({ message: "Sign up first!!!" });
    }

    const hashed_password = user.password;
    console.log("Stored Hashed Password:", hashed_password);
    console.log("Stored Hashed Password:", password);
    bcrypt.compare(password, hashed_password, function (err, result) {
      if (err) {
        console.error("Error during password comparison:", err);
        return res
          .status(500)
          .send({ message: "Error during password comparison" });
      }

      console.log("Password comparison result:", result);

      if (result) {
        let token = jwt.sign({ user_id: user._id }, process.env.SECRET_KEY);
        console.log("Login successful, token generated.");
        res.send({ message: "Login successful", token: token });
      } else {
        console.log("Login failed, invalid credentials.");
        res.send({ message: "Login failed, Invalid credentials.." });
      }
    });
  } catch (error) {
    console.error("Server error during login:", error);
    res.status(500).send({ message: "Server error during login" });
  }
});








app.get("/departments", async (req, res) => {
  try {
    const departments = await DepartmentModel.find();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching departments" });
  }
});





app.post("/departments", async (req, res) => {
  const { name } = req.body;
  try {
    const newDepartment = new DepartmentModel({ name });
    await newDepartment.save();
    res
      .status(201)
      .json({
        message: "Department created successfully",
        department: newDepartment,
      });
  } catch (error) {
    res.status(500).json({ message: "Error creating department" });
  }
});








app.put("/departments/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedDepartment = await DepartmentModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );
    res.json(updatedDepartment);
  } catch (error) {
    res.status(500).json({ message: "Error updating department" });
  }
});



app.delete("/departments/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await DepartmentModel.findByIdAndDelete(id);
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting department" });
  }
});



app.post('/employees', async (req, res) => {
  try {
      const newEmployee = new EmployeeModel(req.body);
      await newEmployee.save();
      res.status(201).json(newEmployee);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});




app.get('/employees', async (req, res) => {
  try {
      const employees = await EmployeeModel.find();
      res.json(employees);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});





app.get('/employees/:id', async (req, res) => {
  try {
      const employee = await EmployeeModel.findById(req.params.id);
      if (!employee) {
          return res.status(404).json({ message: 'Employee not found' });
      }
      res.json(employee);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});




app.put('/employees/:id', async (req, res) => {
  try {
      const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
      );
      res.json(updatedEmployee);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});




app.delete('/employees/:id', async (req, res) => {
  try {
      const employee = await EmployeeModel.findByIdAndDelete(req.params.id);
      if (!employee) {
          return res.status(404).json({ message: 'Employee not found' });
      }
      res.status(200).json({ message: 'Employee deleted' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


app.get("/getEmployeesByDepartMent/:id",async(req,res)=>{

  try {
    const employee = await EmployeeModel.findById(req.params.id);

  } catch (error) {
    
  }
})


//api for getting the  employee list via deparment ids
app.get('/employees/byDepartmentId', async (req, res) => {
  const departmentId = req.body.departmentId;
  try {
    const department = await DepartmentModel.findById(departmentId);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

  
    const employees = await EmployeeModel.find({ department: departmentId }).populate({
      path: 'department',
      select: 'name _id', 
    });

    res.json({
      department: department,
      employees: employees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

///this is the api for the getting the employee listing by the  location filter
app.get('/employeeFilterByLocation', async (req, res) => {
  const { location } = req.body;

  try {
    const employees = await EmployeeModel.find({ location: location });
    res.json({ employees: employees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});






// this is the api for the getting the employee listing by the  asc and desc order
app.get('/EmployeeFilter', async (req, res) => {
  const { order } = req.body;

  try {
    let sortOption = {};

    if (order === 'asc') {
      sortOption = { name: 1 };
    } else if (order === 'desc') {
      sortOption = { name: -1 };
    } else {
      return res.status(400).json({ message: 'Invalid order parameter. Use "asc" or "desc".' });
    }

    const employees = await EmployeeModel.find().sort(sortOption);
    res.json({ employees: employees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});





app.listen(PORT, async () => {
  try {
    await connection;
    console.log("Connection established successfully");
  } catch (error) {
    console.log("Error connecting with mongoose db", error);
  }
  console.log(`listening to server http://localhost:${PORT}`);
});
