//index.js
const express = require("express");
const app = express();
const fetch = require("node-fetch");
const pool = require("./dbPool.js"); 
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
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

app.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.search;

    // Modify the SQL query based on search criteria
    let sql;
    if (searchTerm) {
      sql = `SELECT * FROM product WHERE productname LIKE '%${searchTerm}%'`;
    } else {
      sql = 'SELECT * FROM product';
    }

    // Execute the SQL query
    let rows = await executeSQL(sql);

    // Render the search results page
    res.render("search", { results: rows, searchTerm });
  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/cart", async (req, res) => {
  try {
    // Retrieve user's cart items 
    let sql = "SELECT * FROM cart JOIN product ON cart.productid = product.productid";
    let items = await executeSQL(sql);

    res.render("cart", { items });
  } catch (error) {
    console.error("Error loading user's cart:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/addToCart", async (req, res) => {
  try {
    const { productid, quantity } = req.body;

    // Validate productid and quantity
    if (!productid || !quantity || isNaN(quantity) || quantity < 1 || quantity > 10) {
      return res.status(400).send("Invalid productid or quantity.");
    }

    // Retrieve product details
    const productQuery = "SELECT * FROM product WHERE productid = ?";
    const productRows = await executeSQL(productQuery, [productid]);

    if (productRows.length === 0) {
      return res.status(404).send("Product not found.");
    }

    const product = productRows[0];

    // Calculate subtotal
    const subtotal = parseFloat(product.productprice) * parseInt(quantity);

    // Generate a new cartid based on the existing entries in the cart table
    const cartidQuery = "SELECT MAX(cartid) AS maxCartId FROM cart";
    const cartidRows = await executeSQL(cartidQuery);

    let newCartId;
    if (cartidRows[0].maxCartId) {
      // If there are existing cart entries, increment the max cartid
      const maxCartId = cartidRows[0].maxCartId;
      const numericPart = parseInt(maxCartId.substring(1), 36) + 1;
      newCartId = "C" + numericPart.toString(36).toUpperCase().padStart(7, "0");
    } else {
      // If no existing cart entries, start with a default value
      newCartId = "C0000000";
    }

    // Add the selected product to the user's cart
    const addToCartQuery = "INSERT INTO cart (cartid, productid, quantity, subtotal) VALUES (?, ?, ?, ?)";
    await executeSQL(addToCartQuery, [newCartId, productid, quantity, subtotal]);


    res.redirect("/search");
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.listen(3000, () => {
  console.log("server started");
});


app.get("/dbTest", async function (req, res) {
  let sql = "SELECT * FROM product";
  let rows = await executeSQL(sql);
  res.send(rows);
});


async function executeSQL(sql, params) {
  return new Promise(function (resolve, reject) {
    pool.query(sql, params, function (err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
}
