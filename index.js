const express = require("express");
const app = express();
const fetch = require("node-fetch");
const pool = require("./dbPool.js"); // LC: link to database
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/checkout", async (req, res) => {
  let sql = "SELECT * FROM cart";
  let rows = await executeSQL(sql);
  res.render("checkout", { items: rows });
});

app.get("/confirm", (req, res) => {
  res.render("ship", { city: "", state: "" });
});

// Function to get state and city from zip
app.get("/getShipInfo", async (req, res) => {
  let zip = req.query.zip;
  let url = `https://csumb.space/api/cityInfoAPI.php?zip=${zip}`;
  let response = await fetch(url);
  let data = await response.json();
  console.log(data.city);
  console.log(data.state);
  res.render("ship", { city: data.city, state: data.state });
});

app.listen(3000, () => {
  console.log("server started");
});

// LC: Database Test (see dbPool.js for other table names)
app.get("/dbTest", async function (req, res) {
  let sql = "SELECT * FROM product";
  let rows = await executeSQL(sql);
  res.send(rows);
});

// LC: Function to execute SQL
async function executeSQL(sql, params) {
  return new Promise(function (resolve, reject) {
    pool.query(sql, params, function (err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
}
