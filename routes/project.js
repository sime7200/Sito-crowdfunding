const db = require("../db");
const express = require("express");
//const multer = require("multer");
//const upload = multer({ dest: "./public/data/uploads/" });
const router = express.Router();

/*
function fetchProjects(req, res, next) {
  db.all("SELECT * FROM projects", function (err, items) {
    res.locals.projects = items; //projects è il nome di una variabile che ho appena creato
    next();
  });
}
*/

function fetchProjects(req, res, next) {
  db.all("SELECT * FROM projects", function (err, items) {
    res.locals.projects = items; //projects è il nome di una variabile che ho appena creato
    res.locals.searchValue = "";

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
function fetchFollowById(req, res, next) {
  const projectId = req.params.id;
  const userId = parseInt(req.session.passport.user.id);

  db.all(
    "SELECT * FROM follow WHERE user=? AND id_prog=?",
    [userId, projectId],
    function (err, follow) {
      const isFollow = !!follow;

      res.locals.project = { ...res.locals.project, isFollow: isFollow };

      next();
    }
  );
}
function fetchCommentsById(req, res, next) {
  const projectId = req.params.id;

  db.all(
    "SELECT * FROM project_comments WHERE project_id=?",
    [projectId],
    function (err, comments) {
      res.locals.comments = comments;

      next();
    }
  );
}

function fetchDocuments(req, res, next) {
  const projectId = req.params.id;
  db.all(
    "SELECT * FROM documents WHERE project_id=?",
    [projectId],
    function (err, items) {
      res.locals.documents = items; //documents è il nome di una variabile che ho appena creato
      next();
    }
  );
}

//creo progetto
router.post(
  "/createProject",
  //upload.single("image"),
  function (req, res, next) {
    db.run(
      "INSERT INTO projects (owner_id,title,description,category,image,author_name) VALUES (?,?,?,?,?,?)",
      [
        req.session.passport.user.id,
        req.body.titolo,
        req.body.description,
        req.body.category,
        req.file,
        req.session.passport.user.username,
      ],
      function (err) {
        console.log("tit", titolo);
        if (err) {
          return next(err);
        }
        return status(200).redirect("/" + (req.body.filter || ""));
      }
    );
  }
);

// Creazione nuovo commento
router.post("/createComment", function (req, res, next) {
  const projectId = req.body.projectId;
  const description = req.body.description;
  db.run(
    "INSERT INTO project_comments (user_id,user_name,project_id,description) VALUES (?,?,?,?)",
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

//ottengo tutti i progetti nel db di quell'utente loggato
router.get("/", fetchProjects);

router.get(
  "/creatore",
  /*
  function (req, res, next) {
    //se l'utente non è loggato
    if (!req.session.passport.user) {
      return res.render("/login");
    }
    next();
  },
  */
  fetchProjects
);

router.get(
  "/project-details/:id",
  fetchProjectsById,
  fetchFollowById,
  fetchCommentsById,
  fetchDocuments
);

//modifica progetto non vaaaa
router.post("/modifica", function (req, res, next) {
  const id = req.body.id_prog;
  g("->", req.body.title, req.body.author_name);
  db.run(
    "UPDATE projects SET title = ?, description = ?, category = ?, image = ? WHERE id = ?",
    [
      req.body.title,
      req.body.description,
      req.body.category,
      req.body.image,
      id,
    ],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.status(200).redirect("/" + (req.body.filter || ""));
    }
  );
});

/*
//oppure così
router.post(
  "/modifica/:id)",
  function (req, res, next) {
    db.run(
      "DELETE FROM projects WHERE id = ? AND owner_id = ?",
      [req.params.id, req.user.id],
      function (err) {
        if (err) {
          return next(err);
        }
        return res.redirect("/" + (req.body.filter || ""));
      }
    );
  },
  function (req, res, next) {
    db.run(
      "UPDATE projects SET title = ?, description = ?, category = ?, image = ? WHERE id = ? AND owner_id = ?",
      [
        req.body.title,
        req.body.description,
        req.body.category,
        req.body.image,
        req.params.id,
        req.user.id,
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
*/

router.post("/search", fetchProjects, function (req, res, next) {
  const searchValue = req.body.searchValue;

  res.locals.projects = res.locals.projects.filter(function (project) {
    return project.title.includes(searchValue);
  });

  res.json(res.locals.projects);
});

router.post("/saveProject", function (req, res, next) {
  const id_project = req.body.saveProjectId;
  db.run(
    "INSERT INTO follow (user,id_prog) VALUES (?,?)",
    [req.session.passport.user.id, id_project],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(req.get("referer"));
      //return res.status(200).redirect("/" + (req.body.filter || ""));
    }
  );
});

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

module.exports = router;
