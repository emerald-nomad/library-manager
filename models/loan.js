"use strict";
//const Patron = require('../models').Patron;

module.exports = (sequelize, DataTypes) => {
  const Loan = sequelize.define(
    "Loan",
    {
      book_id: {
        type: DataTypes.INTEGER,
        validate: { notEmpty: { msg: "Book ID is required" } }
      },
      patron_id: {
        type: DataTypes.INTEGER,
        validate: { notEmpty: { msg: "Patron ID is required" } }
      },
      loaned_on: {
        type: DataTypes.DATEONLY,
        validate: { notEmpty: { msg: "Loaned date is required" } }
      },
      return_by: {
        type: DataTypes.DATEONLY,
        validate: { notEmpty: { msg: "Return by date is required" } }
      },
      returned_on: {
        type: DataTypes.DATEONLY,
        validate: { notEmpty: { msg: "Returned on date is required" } }
      }
    },
    { timestamps: false, underscored: true }
  );
  // validate: { notEmpty: { msg: "Book ID is required" } }
  // validate: { notEmpty: { msg: "Patron ID is required" } }
  // validate: { notEmpty: { msg: "Loaned date is required is required" } }
  // validate: {
  //   notEmpty: { msg: "Return by date is required is required" }
  // }
  // validate: {
  //   notEmpty: { msg: "Returned on date is required is required" }
  // }
  Loan.associate = function(models) {
    // associations can be defined here
    models.Loan.belongsTo(models.Patron, {
      foreignKey: "patron_id",
      targetKey: "id"
    });

    models.Loan.belongsTo(models.Book, {
      foreignKey: "book_id",
      targetKey: "id"
    });
  };

  return Loan;
};
