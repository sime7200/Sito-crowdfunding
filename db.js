var sqlite3 = require("sqlite3");
var crypto = require("crypto");

var db = new sqlite3.Database("./var/db/projects.db");

db.serialize(function () {
  // create the database schema
  db.run(
    "CREATE TABLE IF NOT EXISTS users ( \
    id INTEGER PRIMARY KEY, \
    username TEXT UNIQUE, \
    role TEXT NOT NULL, \
    hashed_password BLOB, \
    salt BLOB \
  )"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS projects ( \
    owner_id INTEGER NOT NULL, \
    id INTEGER PRIMARY KEY, \
    title TEXT NOT NULL, \
    description TEXT NOT NULL, \
    category TEXT NOT NULL, \
    image BLOB NOT NULL, \
    author_name TEXT NOT NULL, \
    donations_count INTEGER, \
    donations_total REAL \
  )"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS documents ( \
    id INTEGER PRIMARY KEY, \
    author TEXT NOT NULL, \
    title TEXT NOT NULL, \
    description TEXT NOT NULL, \
    date DATE NOT NULL, \
    type TEXT NOT NULL, \
    file BLOB \
  )"
  );

  // create an initial user (username: alice, password: letmein)
  var salt = crypto.randomBytes(16);
  db.run(
    "INSERT OR IGNORE INTO users (username, role, hashed_password, salt) VALUES (?, ?, ?, ?)",
    [
      "alice",
      "Creatore",
      crypto.pbkdf2Sync("letmein", salt, 310000, 32, "sha256"),
      salt,
    ]
  );
  db.run(
    "INSERT OR IGNORE INTO users (username, role, hashed_password, salt) VALUES (?, ?, ?, ?)",
    [
      "luca",
      "Creatore",
      crypto.pbkdf2Sync("ciao", salt, 310000, 32, "sha256"),
      salt,
    ]
  );
});

module.exports = db;
