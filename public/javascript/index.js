function addOnClickRow() {
  if (!window.document) retur;
  let table = document.getElementById("project-table");
  let rows = table.getElementsByTagName("tr");
  for (i = 0; i < rows.length; i++) {
    let currentRow = table.rows[i];
    let createClickHandler = function (row) {
      return function () {
        let cell = row.getElementsByTagName("td")[0];
        let id = cell.innerHTML;

        window.location.pathname = `/project-details/${id}`;
      };
    };
    currentRow.onclick = createClickHandler(currentRow);
  }
}

addOnClickRow();

async function searchProject(reset) {
  const value = document.getElementById("searchValue").value;
  const projectCheckbox = document.getElementsByName("progetto-checkbox")[0];
  const documentCheckbox = document.getElementsByName("documento-checkbox")[0];

  if (reset) searchValue.value = "";

  try {
    let response = await fetch("/search", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        searchValue: reset ? "" : value,
        checkInProjet: projectCheckbox.checked,
        checkInDocument: documentCheckbox.checked,
      }),
    });
    let data = await response.json();

    let tableBody = document.getElementById("table-project-body");

    const rows = data
      .map((project) => {
        return `<tr>
            <td>${project.id}</td>
            <td>${project.title}</td>
            <td>${project.description}</td>
            <td>${project.category}</td>
            <td>${project.author_name}</td>
          </tr>`;
      })
      .join("");

    tableBody.innerHTML = rows;
    addOnClickRow();
  } catch (error) {
    console.log(error);
  }
}
async function addDocToFavourites(id) {
  try {
    await fetch("/addDocToFollow", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        docId: id,
      }),
    });
    window.location.reload();
  } catch (error) {
    console.log(error);
  }
}
async function removeDocFromFavourites(id) {
  try {
    await fetch("/removeDocFromFollow", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        docId: id,
      }),
    });
    window.location.reload();
  } catch (error) {
    console.log(error);
  }
}

function onOpenUpdateCommentModal(description, id) {
  const inputDescription = document.getElementById("comment-description");
  const commentId = document.getElementById("comment_id");

  inputDescription.value = description;
  commentId.value = id;
}
