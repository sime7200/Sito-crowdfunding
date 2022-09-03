var express = require("express");
var app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const SQLiteStore = require("connect-sqlite3")(session);
const LocalStrategy = require("passport-local");
const db = require("./db");
const crypto = require("crypto");
const projectRoute = require("./routes/project"); //si riferisce a project.js

// set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: "sessions.db", dir: "./var/db" }),
  })
);

app.use("/", projectRoute);

app.use(passport.authenticate("session"));

passport.use(
  new LocalStrategy(function verify(username, password, cb) {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      function (err, row) {
        if (err) {
          return cb(err);
        }
        if (!row) {
          return cb(null, false, {
            message: "Incorrect username or password.",
          });
        }

        crypto.pbkdf2(
          password,
          row.salt,
          310000,
          32,
          "sha256",
          function (err, hashedPassword) {
            if (err) {
              return cb(err);
            }
            if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
              return cb(null, false, {
                message: "Incorrect username or password.",
              });
            }
            return cb(null, row);
          }
        );
      }
    );
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

app.use(function (req, res, next) {
  console.log(req.session.message);
  next();
});

app.post(
  "/login/password",
  passport.authenticate("local", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/login",
    failureMessage: true,
  })
);
// This is the basic express session({..}) initialization.app.use(passport.initialize())
// init passport on every route call.app.use(passport.session())
// allow passport to use "express-session".

// use res.render to load up an ejs view file

// index page
app.get("/", function (req, res) {
  res.render("index");
});

// about page
app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/pippo", function (req, res) {
  res.render("dettaglioProg");
});

app.listen(8080);
console.log("Server is listening on port 8080");
