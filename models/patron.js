"use strict";

module.exports = (sequelize, DataTypes) => {
  var Patron = sequelize.define(
    "Patron",
    {
      first_name: {
        type: DataTypes.TEXT,
        validate: { notEmpty: { msg: "First name is required" } }
      },
      last_name: {
        type: DataTypes.TEXT,
        validate: { notEmpty: { msg: "Last name is required" } }
      },
      address: {
        type: DataTypes.TEXT,
        validate: { notEmpty: { msg: "Address is required" } }
      },
      email: {
        type: DataTypes.TEXT,
        validate: { notEmpty: { msg: "Email is required" } }
      },
      library_id: {
        type: DataTypes.TEXT,
        validate: { notEmpty: { msg: "Library ID is required" } }
      },
      zip_code: {
        type: DataTypes.INTEGER,
        validate: { notEmpty: { msg: "Zip code is required" } }
      }
    },
    { timestamps: false }
  );

  Patron.associate = function(models) {
    // associations can be defined here
    models.Patron.hasMany(models.Loan, {
      foreignKey: "patron_id",
      sourceKey: "id"
    });
  };

  return Patron;
};
