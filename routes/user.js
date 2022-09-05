const db = require("../db");
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

//per ottenere gli utenti loggati
function fetchUsers(req, res, next) {
  db.all(
    "SELECT * FROM users WHERE id=?",
    [req.session.passport.user.id],
    function (err, items) {
      res.locals.users = items; //projects è il nome di una variabile che ho appena creato
      next();
    }
  );
}

//per fare logout di un utente
router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

//aggiungo un nuovo utente
router.post("/signup", function (req, res, next) {
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(
    req.body.password,
    salt,
    310000,
    32,
    "sha256",
    function (err, hashedPassword) {
      if (err) {
        return next(err);
      }
      db.run(
        "INSERT INTO users (username, role, hashed_password, salt) VALUES (?, ?, ?, ?)",
        [req.body.username, req.body.role, hashedPassword, salt],
        function (err) {
          if (err) {
            return next(err);
          }
          var user = {
            id: this.lastID,
            username: req.body.username,
          };
          //req.login(user, function (err) {
          //if (err) {
          //return next(err);
          //}
          res.redirect("/");
          //});
        }
      );
    }
  );
});

module.exports = router;
