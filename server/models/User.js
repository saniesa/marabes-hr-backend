const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Ensure this path is correct

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "EMPLOYEE",
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: "General"
  },
  jobPosition: {
    type: DataTypes.STRING,
  },
  // --- NEW PAYROLL FIELDS ---
  baseSalary: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  bankAccountNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = User;