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
    image TEXT NOT NULL, \
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
    type NUMERIC NOT NULL, \
    project_id INTEGER NOT NULL,\
    user_id INTEGER NOT NULL\
  )"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS follow ( \
    user INTEGER NOT NULL,  \
    id_prog INTEGER NOT NULL\
  )"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS project_comments ( \
    id INTEGER PRIMARY KEY, \
    user_id INTEGER NOT NULL,  \
    user_name TEXT NOT NULL,  \
    project_id INTEGER NOT NULL, \
    description TEXT NOT NULL, \
    creation_date REAL DEFAULT (datetime('now', 'localtime')) \
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
  // create an user (username: luca, password: ciao)
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
