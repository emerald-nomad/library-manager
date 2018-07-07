"use strict";

module.exports = (sequelize, DataTypes) => {
  const Book = sequelize.define(
    "Book",
    {
      title: {
        type: DataTypes.STRING,
        validate: { notEmpty: { msg: "Title is required" } }
      },
      author: {
        type: DataTypes.TEXT,
        validate: { notEmpty: { msg: "Author is required" } }
      },
      genre: {
        type: DataTypes.TEXT,
        validate: { notEmpty: { msg: "Genre is required" } }
      },
      first_published: DataTypes.INTEGER
    },
    { timestamps: false }
  );

  Book.associate = models => {
    // associations can be defined here
    models.Book.hasMany(models.Loan, {
      foreignKey: "book_id",
      sourceKey: "id"
    });
  };

  return Book;
};
