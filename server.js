var express = require("express");
var app = express();
const path = require("path");
const cookieParser = require("cookie-parser"); //per leggere i cookie
const session = require("express-session");
const passport = require("passport");
const SQLiteStore = require("connect-sqlite3")(session); //per salvare nel db la sessione
const LocalStrategy = require("passport-local"); //ci sono vari passport, qui e' per salvare i dati nel db
const db = require("./db");
const crypto = require("crypto");
const projectRoute = require("./routes/project"); //si riferisce a project.js per chiamare tutte le rotte
const userRoute = require("./routes/user"); //si riferisce a project.js per chiamare tutte le rotte
const documentRoute = require("./routes/document"); //si riferisce a document.js per chiamare tutte le rotte dei documenti

// per fare andare ejs
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
    cb(null, { id: user.id, username: user.username, role: user.role });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

app.post(
  "/login/password",
  passport.authenticate("local", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/login",
    failureMessage: true,
  })
);

app.use("/", projectRoute);
app.use("/", userRoute);
app.use("/", documentRoute.router);

// index page
app.get("/", function (req, res, next) {
  return res.render("index", { user: req.user });
});

// login page
app.get("/login", function (req, res) {
  res.render("login");
});

//mission page
app.get("/mission", function (req, res) {
  res.render("mission", { user: req.user });
});

//contatti page
app.get("/contatti", function (req, res) {
  res.render("contatti", { user: req.user });
});

app.get("/profilo", function (req, res) {
  res.render("my", { user: req.user });
});

app.get("/cerca", function (req, res) {
  res.render("cercaProg", { user: req.user });
});

app.use(passport.session());
//logout
app.get("/logout", function (req, res) {
  req.logout();
  res.render("index");
});

app.get("/project-details/:id", function (req, res) {
  res.render("dettaglioProg", { user: req.user });
});

app.listen(3003);
console.log("Server is listening on port 3003");
