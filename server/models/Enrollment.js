const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');
const Course = require('./Course');

const Enrollment = sequelize.define('Enrollment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  dateEnrolled: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
}, {
  tableName: 'enrollments',
  timestamps: false
});

Enrollment.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Enrollment, { foreignKey: 'userId' });

Enrollment.belongsTo(Course, { foreignKey: 'courseId' });
Course.hasMany(Enrollment, { foreignKey: 'courseId' });

module.exports = Enrollment;
