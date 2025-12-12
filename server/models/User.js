const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

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
  // ADD THIS:
  department: {
    type: DataTypes.STRING,
    defaultValue: "General"
  },
  jobPosition: {
    type: DataTypes.STRING,
  },
  // Add other fields (avatarUrl, phone, etc) if you want the model to be complete
});

module.exports = User;