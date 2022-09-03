const db = require("../db");
const express = require("express");
const router = express.Router();

function fetchProjects(req, res, next) {
  db.all(
    "SELECT * FROM projects WHERE owner_id=?",
    [req.session.passport.user.id],
    function (err, items) {
      res.locals.projects = items; //projects è il nome di una variabile che ho appena creato
      next();
    }
  );
}

router.post("/createProject", function (req, res, next) {
  db.run(
    "INSERT INTO projects (owner_id,title,description,category,image,author_name) VALUES (?,?,?,?,?,?)",
    [
      req.session.passport.user.id,
      req.body.title,
      req.body.description,
      req.body.category,
      req.body.image,
      req.body.author_name,
    ],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.status(200).redirect("/" + (req.body.filter || ""));
    }
  );
});

router.get(
  "/",
  function (req, res, next) {
    //se l'utente non è loggato
    if (!req.session.passport.user) {
      return res.render("/login");
    }
    next();
  },
  fetchProjects
);
module.exports = router;
