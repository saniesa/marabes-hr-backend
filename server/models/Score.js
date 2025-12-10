const { DataTypes } = require('sequelize');

const sequelize = require('../db');

const User = require('./User');

const Category = require('./Category');
 
const Score = sequelize.define('Score', {

  id: { 

    type: DataTypes.UUID, 

    defaultValue: DataTypes.UUIDV4, 

    primaryKey: true 

  },

  score: { 

    type: DataTypes.INTEGER, 

    allowNull: false,

    validate: {

      min: 0,

      max: 100

    }

  },

  date: { 

    type: DataTypes.DATEONLY, 

    defaultValue: DataTypes.NOW 

  },

  feedback: { 

    type: DataTypes.TEXT,

    allowNull: true

  }

}, {

  tableName: 'scores',

  timestamps: false

});
 
Score.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Score, { foreignKey: 'userId' });
 
Score.belongsTo(Category, { foreignKey: 'categoryId' });

Category.hasMany(Score, { foreignKey: 'categoryId' });
 
module.exports = Score;
 