const db = require("../db");
const express = require("express");
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
  const id = req.params.id;

  db.all("SELECT * FROM projects WHERE id=?", [id], function (err, project) {
    res.locals.project = project[0];
    next();
  });
}

//creo progetto
router.post("/createProject", function (req, res, next) {
  db.run(
    "INSERT INTO projects (owner_id,title,description,category,image,author_name) VALUES (?,?,?,?,?,?)",
    [
      req.session.passport.user.id,
      req.body.title,
      req.body.description,
      req.body.category,
      req.body.image,
      req.session.passport.user.username,
    ],
    function (err) {
      if (err) {
        return next(err);
      }
      return res.status(200).redirect("/" + (req.body.filter || ""));
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
  fetchProjectsById
  /*
  function (req, res, next) {
    res.render("dettaglioProg", {
      user: res.user,
    });
    next();
  }
  */
);

//modifica progetto non vaaaa
router.post("/modifica", function (req, res, next) {
  const id = req.body.id_prog;
  console.log("->", req.body.title, req.body.author_name);
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
      return res.status(200).redirect("/" + (req.body.filter || ""));
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
