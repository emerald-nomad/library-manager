const express = require("express");
const router = express.Router();
const isEmpty = require("./utilities/is-empty");
const sequelize = require("../models").sequelize;
const Patron = require("../models").Patron;
const Book = require("../models").Book;
const Loan = require("../models").Loan;

/* GET all patrons. */
router.get("/patrons", (req, res) => {
  Patron.findAll({
    attributes: {
      include: [[sequelize.literal("first_name || ' ' || last_name"), "name"]]
    }
  })
    .then(data => {
      const patrons = [];

      for (const patron of data) {
        patrons.push(patron.dataValues);
      }

      res.render("patrons", {
        title: "Patrons",
        patrons
      });
    })
    .catch(error => {
      res.status(500).send(error);
    });
});

/* GET new patron. */
router.get("/new_patron", (req, res) => {
  res.render("new_patron", {
    title: "New Patron",
    patron: Patron.build()
  });
});

/* POST new patron. */
router.post("/new_patron", (req, res) => {
  Patron.create(req.body)
    .then(patron => {
      res.redirect("/patrons");
    })
    .catch(error => {
      if (error.name === "SequelizeValidationError") {
        res.render("new_patron", {
          title: "New Patron",
          patron: Patron.build(req.body),
          errors: error.errors
        });
      } else {
        res.status(500).send(error);
      }
    });
});

/* GET patron details. */
router.get("/patron_detail/:id", (req, res) => {
  Patron.findOne({
    where: { id: req.params.id },
    attributes: {
      include: [[sequelize.literal("first_name || ' ' || last_name"), "name"]]
    },
    include: [
      {
        model: Loan,
        attributes: ["id", "loaned_on", "return_by", "returned_on"],
        include: [
          {
            model: Book,
            attributes: ["id", "title"]
          }
        ]
      }
    ]
  })
    .then(data => {
      const loans = [];
      let errors = [];
      let patron;

      if (req.session === null || isEmpty(req.session)) {
        patron = data.dataValues;
      } else {
        patron = req.session.patron;
        patron.id = data.dataValues.id;
        errors = req.session.errors;
      }
      req.session = null;

      for (const loanData of data.dataValues.Loans) {
        const loan = {
          id: loanData.dataValues.id,
          loaned_on: loanData.dataValues.loaned_on,
          return_by: loanData.dataValues.return_by,
          returned_on: loanData.dataValues.returned_on,
          book_id: loanData.dataValues.Book.dataValues.id,
          book_title: loanData.dataValues.Book.dataValues.title
        };
        loans.push(loan);
      }

      res.render("patron_detail", {
        title: data.dataValues.name,
        header: data.dataValues.name,
        patron,
        loans,
        errors
      });
    })
    .catch(error => {
      res.status(500).send(error);
    });
});

/* PUT patron details. */
router.put("/patron_detail/:id", (req, res) => {
  Patron.update(req.body, {
    where: {
      id: req.params.id
    }
  })
    .then(patron => {
      res.redirect("/patrons");
    })
    .catch(error => {
      if (error.name === "SequelizeValidationError") {
        req.session.patron = req.body;
        req.session.errors = error.errors;

        res.redirect(`/patron_detail/${req.params.id}`);
      } else {
        res.status(500).send(error);
      }
    });
});

module.exports = router;
