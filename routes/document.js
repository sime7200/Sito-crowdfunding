const db = require("../db");
const express = require("express");
const router = express.Router();

router.post("/newDocument", function (req, res, next) {
  db.run(
    "INSERT INTO documents (author,title,description,date,type,project_id, user_id) VALUES (?,?,?,?,?,?,?)",
    [
      req.body.author,
      req.body.title,
      req.body.description,
      req.body.date,
      req.body.type,
      req.body.project_id,
      req.session.passport.user.id,
    ],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(req.get("referer"));
      //return res.status(200).redirect("/" + (req.body.filter || ""));
    }
  );
});

//modifica documento
router.post("/updateDocument", function (req, res, next) {
  db.run(
    "UPDATE documents SET author=?, title=?, description=?, date=?, type=? WHERE title=? ",
    [
      req.body.author,
      req.body.title,
      req.body.description,
      req.body.date,
      req.body.type,
      req.body.selezionaDoc,
    ],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(req.get("referer"));
    }
  );
});

router.post("/updateComment", function (req, res, next) {
  const description = req.body.description;
  const comment_id = req.body.comment_id;

  db.run(
    "UPDATE documents_comments SET description=? WHERE id = ?",
    [description, comment_id],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(req.get("referer"));
    }
  );
});

//prende tutti i documenti
function fetchDocuments(req, res, next) {
  const projectId = req.params.id;
  db.all(
    "SELECT * FROM documents WHERE project_id=? ORDER BY date DESC",
    [projectId],
    function (err, items) {
      res.locals.documents = items; //documents è il nome di una variabile che ho appena creato
      next();
    }
  );
}

//prende i documenti di un determinato utente in base all'id
function fetchFollowDocById(req, res, next) {
  const userId =
    req.session &&
    req.session.passport &&
    req.session.passport.user &&
    parseInt(req.session.passport.user.id);

  if (!userId) return next();

  db.all(
    "SELECT * FROM followDocuments WHERE user_id=?",
    [userId],
    function (err, documentsFollowed) {
      res.locals.documents = res.locals.documents.map((doc) => ({
        ...doc,
        isFollow: documentsFollowed.some(
          (element) => element.doc_id === doc.id
        ),
      }));

      next();
    }
  );
}

// Aggiunta doc ai preferiti
router.post("/addDocToFollow", function (req, res, next) {
  const docId = req.body.docId;

  db.run(
    "INSERT INTO followDocuments (user_id, doc_id) VALUES (?,?)",
    [req.session.passport.user.id, docId],
    function (err) {
      if (err) {
        console.log(err);
        return next(err);
      }

      return res.redirect(req.get("referer"));
    }
  );
});

// Rimuovi doc dai preferiti
router.post("/removeDocFromFollow", function (req, res, next) {
  const docId = req.body.docId;

  db.run(
    "DELETE FROM followDocuments WHERE user_id=? AND doc_id =?",
    [req.session.passport.user.id, docId],
    function (err) {
      if (err) {
        console.log(err);
        return next(err);
      }

      return res.redirect(req.get("referer"));
    }
  );
});

module.exports = {
  router: router,
  fetchDocuments: fetchDocuments,
  fetchFollowDocById: fetchFollowDocById,
};
