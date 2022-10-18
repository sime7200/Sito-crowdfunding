const db = require("../db");
const express = require("express");
const multer = require("multer");
const documentRoute = require("./document");

const upload = multer({
  dest: "public/uploads",
  limits: {
    fileSize: 30000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
});
const router = express.Router();

function fetchProjects(req, res, next) {
  db.all("SELECT * FROM projects", function (err, items) {
    res.locals.projects = items; //projects è il nome di una variabile che ho appena creato
    res.locals.searchValue = "";
    res.locals.searchCategory = "";
    res.locals.categoriaSel = "";

    next();
  });
}

//per selezionare un progetto con quel id
function fetchProjectsById(req, res, next) {
  const projectId = req.params.id;

  db.all(
    "SELECT * FROM projects WHERE id=?",
    [projectId],
    function (err, project) {
      res.locals.project = project[0];

      next();
    }
  );
}

function fetchProjectsByCategory(req, res, next) {
  if (req.body.categoriaSel == "Tutti") {
    db.all(
      "SELECT * FROM projects",
      [req.body.categoriaSel],
      function (err, items) {
        res.locals.projects = items;
        res.locals.searchValue = "";
        res.locals.searchCategory = "";
        res.locals.categoriaSel = "";
        next();
      }
    );
  } else {
    db.all(
      "SELECT * FROM projects WHERE category=?",
      [req.body.categoriaSel],
      function (err, items) {
        res.locals.projects = items;
        res.locals.searchValue = "";
        res.locals.searchCategory = "";
        res.locals.categoriaSel = "";
        next();
      }
    );
  }
}

//seleziona i progetti di un certo utente
function fetchProjectsByUser(req, res, next) {
  db.all(
    "SELECT * FROM projects WHERE id=?",
    [req.session.passport.user.id],
    function (err, items) {
      res.locals.projectsUser = items;

      next();
    }
  );
}

function fetchFollowById(req, res, next) {
  const projectId = req.params.id;
  const userId =
    req.session &&
    req.session.passport &&
    req.session.passport.user &&
    parseInt(req.session.passport.user.id);

  if (!userId) return next();

  db.all(
    "SELECT * FROM follow WHERE user=? AND id_prog=?",
    [userId, projectId],
    function (err, follow) {
      const isFollow = follow && follow.length ? true : false;

      res.locals.project = { ...res.locals.project, isFollow: isFollow };

      next();
    }
  );
}
function fetchCommentsById(req, res, next) {
  const projectId = req.params.id;

  db.all(
    "SELECT * FROM documents_comments WHERE project_id=? ORDER BY creation_date DESC",
    [projectId],
    function (err, comments) {
      res.locals.comments = comments;

      next();
    }
  );
}

//creo progetto
router.post(
  "/createProject",
  upload.single("image"),
  async function (req, res, next) {
    const filename = "/uploads/" + req.file.filename;

    if (!req.file) {
      res.status(401).json({ error: "Please provide an image" });
    }

    db.run(
      "INSERT INTO projects (owner_id,title,description,category,image,author_name) VALUES (?,?,?,?,?,?)",
      [
        req.session.passport.user.id,
        req.body.title,
        req.body.description,
        req.body.category,
        filename,
        req.session.passport.user.username,
      ],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect("/" + (req.body.filter || ""));
      }
    );
  }
);

//modifica progetto
router.post(
  "/modifica",
  upload.single("image"),
  async function (req, res, next) {
    const filename = "/uploads/" + req.file.filename;
    const id = req.body.id_prog;
    db.run(
      "UPDATE projects SET title = ?, description = ?, category = ?, image = ? WHERE id = ?",
      [req.body.title, req.body.description, req.body.category, filename, id],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.status(200).redirect("/" + (req.body.filter || ""));
      }
    );
  }
);

//elimina progetto
router.post("/deleteProject", function (req, res, next) {
  const id = req.body.deleteProjectId;

  db.run("DELETE FROM projects WHERE id = ?", [id], function (err) {
    if (err) {
      return next(err);
    }
    return res.redirect("/" + (req.body.filter || ""));
  });
});

// Creazione nuovo commento
router.post("/createComment", function (req, res, next) {
  const projectId = req.body.projectId;
  const description = req.body.description;
  db.run(
    "INSERT INTO documents_comments (user_id,user_name,project_id,description) VALUES (?,?,?,?)",
    [
      req.session.passport.user.id,
      req.session.passport.user.username,
      projectId,
      description,
    ],
    function (err) {
      if (err) {
        console.log(err);
        return next(err);
      }
      return res.redirect(req.get("referer"));
    }
  );
});

//ottengo tutti i progetti
router.get("/", fetchProjects, fetchProjectsByCategory);

router.get("/creatore", fetchProjects);

router.get(
  "/project-details/:id",
  fetchProjectsById,
  fetchFollowById,
  fetchDonatori,
  fetchCommentsById,
  documentRoute.fetchDocuments,
  documentRoute.fetchFollowDocById
);

router.get("/profilo", fetchProjectsByUser);

router.post(
  "/search",
  fetchProjectsByCategory,
  async function (req, res, next) {
    const searchValue =
      req.body.searchValue && req.body.searchValue.toLowerCase();
    req.body.categoriaSel && req.body.categoriaSel.toLowerCase();

    res.locals.projects = res.locals.projects.filter(function (project) {
      return (
        project.title.toLowerCase().includes(searchValue) ||
        project.category.toLowerCase().includes(searchValue) ||
        project.description.toLowerCase().includes(searchValue)
      );
    });

    res.json(res.locals.projects);
  }
);

//aggiungi progetto ai preferiti
router.post("/addFollow", function (req, res, next) {
  const id_project = req.body.projectId;
  db.run(
    "INSERT INTO follow (user,id_prog) VALUES (?,?)",
    [req.session.passport.user.id, id_project],
    function (err) {
      if (err) {
        return next(err);
      }

      return res.redirect(req.get("referer"));
    }
  );
});

//rimuovi progetto dai preferiti
router.post("/removeFollow", function (req, res, next) {
  const id_project = req.body.projectId;

  db.run(
    "DELETE FROM follow  WHERE user=? AND id_prog=?",
    [req.session.passport.user.id, parseInt(id_project)],
    function (err) {
      if (err) {
        return next(err);
      }

      return res.redirect(req.get("referer"));
    }
  );
});

//modifica commento
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

//donazione
router.post("/donation", function (req, res, next) {
  const idProg = req.body.donazione; // donazione è il name nel form per donare

  db.run(
    "INSERT INTO donations (user_id,donatore,id_project,cifra) VALUES (?,?,?,?)",
    [
      req.session.passport.user.id,
      req.session.passport.user.username,
      idProg,
      req.body.euro,
    ],
    function (err) {
      if (err) {
        return next(err);
      }
    }
  );

  db.run(
    "UPDATE projects SET donations_total=donations_total+? WHERE id = ?",
    [req.body.euro, idProg],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(req.get("referer"));
    }
  );
});

//elimina commento
router.post("/deleteComment", function (req, res, next) {
  const id = req.body.id_commento;

  db.run("DELETE FROM documents_comments WHERE id = ?", [id], function (err) {
    if (err) {
      return next(err);
    }
    return res.redirect(req.get("referer"));
  });
});

function fetchDonatori(req, res, next) {
  const projectId = req.params.id;

  db.all(
    "SELECT * FROM donations WHERE id_project=? ",
    [projectId],
    function (err, items) {
      res.locals.elencoDonatori = items;

      next();
    }
  );
}

function fetchCommentsById(req, res, next) {
  const projectId = req.params.id;

  db.all(
    "SELECT * FROM documents_comments WHERE project_id=? ORDER BY creation_date DESC",
    [projectId],
    function (err, comments) {
      res.locals.comments = comments;

      next();
    }
  );
}

module.exports = router;
