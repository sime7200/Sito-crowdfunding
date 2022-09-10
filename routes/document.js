const db = require("../db");
const express = require("express");
const router = express.Router();

router.post("/newDocument", function (req, res, next) {
  db.run(
    "INSERT INTO documents (author,title,description,date,type,project_id) VALUES (?,?,?,?,?,?)",
    [
      req.body.author,
      req.body.title,
      req.body.description,
      req.body.date,
      req.body.type,
      req.body.project_id,
    ],
    function (err) {
      if (err) {
        return next(err);
      }
      return res
        .status(200)
        .redirect("/project-details/:id" + (req.body.filter || ""));
    }
  );
});

function fetchDocuments(req, res, next) {
  db.all(
    "SELECT * FROM documents",
    [req.session.passport.user.id],
    function (err, items) {
      res.locals.projects = items; //projects è il nome di una variabile che ho appena creato
      next();
    }
  );
}

module.exports = router;
