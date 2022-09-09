function addRowHandlers() {
  if (!window.document) return;
  console.log("viso", window.document.getElementById("project-table"));
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

addRowHandlers();
