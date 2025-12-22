const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); 
const User = require("./User");

const Payroll = sequelize.define("Payroll", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  month: {
    type: DataTypes.STRING, // e.g., "December"
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER, // e.g., 2025
    allowNull: false,
  },
  baseAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  bonusAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  deductionAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  netAmount: {
    type: DataTypes.DECIMAL(10, 2), // The final "Take home" pay
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "PAID"),
    defaultValue: "PENDING",
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
  }
});

// Link to User
Payroll.belongsTo(User, { foreignKey: "userId", onDelete: 'CASCADE' });
User.hasMany(Payroll, { foreignKey: "userId" });

module.exports = Payroll;