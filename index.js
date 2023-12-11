const express = require("express");
const app = express();
const pool = require("./dbPool.js"); // LC: link to database
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(3000, () => {
  console.log("server started");
});

// LC: Database Test (see dbPool.js for other table names)
app.get("/dbTest", async function(req, res) {
  let sql = "SELECT * FROM product";
  let rows = await executeSQL(sql);
  res.send(rows);
});

// LC: Function to execute SQL
async function executeSQL(sql, params) {
  return new Promise (function(resolve, reject) {
    pool.query(sql, params, function (err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
}