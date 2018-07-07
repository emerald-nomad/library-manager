const express = require("express");
const router = express.Router();
const isEmpty = require("./utilities/is-empty");
const moment = require("moment");
const sequelize = require("../models").sequelize;
const Op = require("../models").sequelize.Op;
const Loan = require("../models").Loan;
const Patron = require("../models").Patron;
const Book = require("../models").Book;

/* GET all loans. */
router.get("/loans", (req, res) => {
  Loan.findAll({
    include: [
      {
        model: Book
      },
      {
        model: Patron,
        attributes: [
          [sequelize.literal("first_name || ' ' || last_name"), "name"]
        ]
      }
    ]
  })
    .then(data => {
      const loans = [];

      for (const loanData of data) {
        let loan = {
          id: loanData.dataValues.id,
          loaned_on: loanData.dataValues.loaned_on,
          return_by: loanData.dataValues.return_by,
          returned_on: loanData.dataValues.returned_on,
          book_id: loanData.dataValues.book_id,
          book_title: loanData.dataValues.Book.title,
          patron_id: loanData.dataValues.patron_id,
          patron_name: loanData.dataValues.Patron.dataValues.name
        };
        console.log(loan);
        loans.push(loan);
      }
      // console.log(loans);
      res.render("loans", {
        title: "Loans",
        loans
      });
    })
    .catch(error => {
      res.status(500).send(error);
    });
});

/* GET new loan. */
router.get("/new_loan", (req, res) => {
  let errors;

  if (req.session === null || isEmpty(req.session)) {
    errors = [];
  } else {
    errors = req.session.errors;
  }
  req.session = null;

  const loaned_on = moment().format("YYYY-MM-DD");
  const return_by = moment()
    .add(7, "days")
    .format("YYYY-MM-DD");

  const getBooks = Book.findAll({
    attributes: ["id", "title"],
    order: ["id"]
  });

  const getPatrons = Patron.findAll({
    attributes: [
      "id",
      [sequelize.literal("first_name || ' ' || last_name"), "name"]
    ],
    order: ["id"]
  });

  const getLoans = Loan.findAll({
    where: {
      returned_on: null
    }
  });
  Promise.all([getBooks, getPatrons, getLoans])
    .then(bulkData => {
      const booksData = bulkData[0];
      const patronsData = bulkData[1];
      const loansData = bulkData[2];
      const unavailableBooks = [];
      const books = [];
      const patrons = [];

      for (const loan of loansData) {
        unavailableBooks.push(loan.book_id);
      }

      for (const book of booksData) {
        if (unavailableBooks.indexOf(book.id) < 0) {
          books.push(book);
        }
      }

      for (const patron of patronsData) {
        patrons.push(patron.dataValues);
      }

      res.render("new_loan", {
        title: "New Loan",
        loaned_on,
        return_by,
        books,
        patrons,
        errors
      });
    })
    .catch(error => {
      res.status(500).send(error);
    });
});

/* POST new loan. */
router.post("/new_loan", (req, res) => {
  Loan.create(req.body)
    .then(loan => {
      res.redirect("/loans");
    })
    .catch(error => {
      if (error.name === "SequelizeValidationError") {
        req.session.errors = error.errors;
        res.redirect("/new_loan");
      } else {
        res.status(500).send(error);
      }
    });
});

/* GET overdue loans. */
router.get("/overdue_loans", (req, res, next) => {
  Loan.findAll({
    where: {
      returned_on: null,
      return_by: {
        [Op.lt]: moment().format("YYYY-MM-DD")
      }
    },
    include: [
      {
        model: Book
      },
      {
        model: Patron,
        attributes: [
          [sequelize.literal("first_name || ' ' || last_name"), "name"]
        ]
      }
    ]
  })
    .then(data => {
      const loans = [];

      for (const loanData of data) {
        let loan = {
          id: loanData.dataValues.id,
          loaned_on: loanData.dataValues.loaned_on,
          return_by: loanData.dataValues.return_by,
          returned_on: loanData.dataValues.returned_on,
          book_id: loanData.dataValues.book_id,
          book_title: loanData.dataValues.Book.title,
          patron_id: loanData.dataValues.patron_id,
          patron_name: loanData.dataValues.Patron.dataValues.name
        };

        loans.push(loan);
      }
      res.render("loans", {
        title: "Books",
        header: "Checked Out Books",
        loans
      });
    })
    .catch(error => {
      res.status(500).send(error);
    });
});

/* GET checked out loans. */
router.get("/checked_loans", (req, res, next) => {
  Loan.findAll({
    where: {
      returned_on: null
    },
    include: [
      {
        model: Book
      },
      {
        model: Patron,
        attributes: [
          [sequelize.literal("first_name || ' ' || last_name"), "name"]
        ]
      }
    ]
  })
    .then(data => {
      const loans = [];

      for (const loanData of data) {
        let loan = {
          id: loanData.dataValues.id,
          loaned_on: loanData.dataValues.loaned_on,
          return_by: loanData.dataValues.return_by,
          returned_on: loanData.dataValues.returned_on,
          book_id: loanData.dataValues.book_id,
          book_title: loanData.dataValues.Book.title,
          patron_id: loanData.dataValues.patron_id,
          patron_name: loanData.dataValues.Patron.dataValues.name
        };
        loans.push(loan);
      }
      res.render("loans", {
        title: "Books",
        header: "Checked Out Books",
        loans
      });
    })
    .catch(error => {
      res.status(500).send(error);
    });
});

/* Get return book. */
router.get("/return_book/:id", (req, res) => {
  Loan.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Book
      },
      {
        model: Patron,
        attributes: [
          [sequelize.literal("first_name || ' ' || last_name"), "name"]
        ]
      }
    ]
  })
    .then(data => {
      let errors;

      if (req.session === null || isEmpty(req.session)) {
        errors = [];
      } else {
        errors = req.session.errors;
      }
      req.session = null;

      res.render("return_book", {
        title: "Return Book",
        id: data.dataValues.id,
        loaned_on: data.dataValues.loaned_on,
        return_by: data.dataValues.return_by,
        book_title: data.dataValues.Book.title,
        patron_name: data.dataValues.Patron.dataValues.name,
        date: moment().format("YYYY-MM-DD"),
        errors
      });
    })
    .catch(error => {
      res.status(500).send(error);
    });
});

/* PUT return book. */
router.put("/return_book/:id", (req, res) => {
  console.log(req.body.returned_on);
  Loan.update(
    { returned_on: req.body.returned_on },
    {
      where: {
        id: req.params.id
      }
    }
  )
    .then(loan => {
      res.redirect("/loans");
    })
    .catch(error => {
      if (error.name === "SequelizeValidationError") {
        req.session.errors = error.errors;
        res.redirect(`/return_book/${req.params.id}`);
      } else {
        res.status(500).send(error);
      }
    });
});

module.exports = router;
