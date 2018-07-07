const express = require("express");
const router = express.Router();
const isEmpty = require("./utilities/is-empty");
const moment = require("moment");
const sequelize = require("../models").sequelize;
const Op = require("../models").sequelize.Op;
const Book = require("../models").Book;
const Loan = require("../models").Loan;
const Patron = require("../models").Patron;

/* GET all books. */
router.get("/all_books", (req, res) => {
  Book.findAll()
    .then(data => {
      const books = [];

      for (const book of data) {
        books.push(book.dataValues);
      }

      res.render("books", {
        title: "Books",
        books
      });
    })
    .catch(error => res.status(500).send(error));
});

/* Redirect based on filter query. */
router.get("/books", (req, res, next) => {
  const filter = req.query.filter;

  if (filter === "overdue") {
    res.redirect("/overdue_books");
  } else if (filter === "checked_out") {
    res.redirect("/checked_books");
  }
});

/* GET overdue books. */
router.get("/overdue_books", (req, res, next) => {
  Book.findAll({
    include: [
      {
        model: Loan,
        where: {
          return_by: {
            [Op.lt]: moment().format("YYYY-MM-DD")
          },
          returned_on: null
        }
      }
    ]
  })
    .then(data => {
      const books = [];

      for (const book of data) {
        books.push(book.dataValues);
      }

      res.render("books", {
        title: "Books",
        books
      });
    })
    .catch(error => res.status(500).send(error));
});

/* GET checked out books. */
router.get("/checked_books", (req, res, next) => {
  Book.findAll({
    include: [
      {
        model: Loan,
        where: {
          returned_on: null
        }
      }
    ]
  })
    .then(data => {
      const books = [];

      for (const book of data) {
        books.push(book.dataValues);
      }

      res.render("books", {
        title: "Books",
        books
      });
    })
    .catch(error => {
      res.status(500).send(error);
    });
});

/* GET book details. */
router.get("/book_detail/:id", (req, res) => {
  Book.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Loan,
        attributes: ["id", "loaned_on", "return_by", "returned_on"],
        include: [
          {
            model: Patron,
            attributes: [
              "id",
              [sequelize.literal("first_name || ' ' || last_name"), "name"]
            ]
          }
        ]
      }
    ]
  })
    .then(data => {
      const loans = [];
      let errors = [];
      let book;

      if (req.session === null || isEmpty(req.session)) {
        book = data.dataValues;
      } else {
        book = req.session.book;
        book.id = data.dataValues.id;
        errors = req.session.errors;
      }
      req.session = null;

      for (const loanData of data.dataValues.Loans) {
        const loan = {
          id: loanData.dataValues.id,
          loaned_on: loanData.dataValues.loaned_on,
          return_by: loanData.dataValues.return_by,
          returned_on: loanData.dataValues.returned_on,
          patron_id: loanData.dataValues.Patron.dataValues.id,
          patron_name: loanData.dataValues.Patron.dataValues.name
        };
        loans.push(loan);
      }

      res.render("book_detail", {
        title: data.dataValues.title,
        header: data.dataValues.title,
        book,
        loans,
        errors
      });
    })
    .catch(error => {
      res.status(500).send(error);
    });
});

/* PUT book details. */
router.put("/book_detail/:id", (req, res) => {
  Book.update(req.body, {
    where: {
      id: req.params.id
    }
  })
    .then(book => {
      res.redirect("/all_books");
    })
    .catch(error => {
      if (error.name === "SequelizeValidationError") {
        req.session.book = req.body;
        req.session.errors = error.errors;

        res.redirect(`/book_detail/${req.params.id}`);
      } else {
        res.status(500).send(error);
      }
    });
});

/* GET new book. */
router.get("/books/new", (req, res) => {
  res.render("new_book", {
    title: "New Book",
    book: Book.build()
  });
});

/* POST new book. */
router.post("/books/new", (req, res) => {
  Book.create(req.body)
    .then(book => {
      res.redirect("/all_books");
    })
    .catch(error => {
      if (error.name === "SequelizeValidationError") {
        res.render("new_book", {
          book: Book.build(req.body),
          errors: error.errors,
          title: "New Book"
        });
      } else {
        res.status(500).send(error);
      }
    });
});

module.exports = router;
