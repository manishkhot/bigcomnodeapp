const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: 'mysql-2c6edfcb-manishkhot-bigcomapp.c.aivencloud.com', // Replace with your host
  user: 'avnadmin', // Replace with your database username
  password: 'AVNS_v8eI5XMHyrCVY3rQN7m', // Replace with your database password
  database: 'defaultdb', // Replace with your database name
  port: '20879'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('Connected as id ' + connection.threadId);
});


 /* connection.query('SELECT * FROM saved_cart', (error, results, fields) => {
  if (error) throw error;
  console.log('The solution is: ', results);
});*/

connection.query('SELECT * FROM saved_cart', (error, results, fields) => {
  if (error) throw error;

  results.forEach(row => {
    console.log('Cart ID: ', row.cart_name);
  });
});

app.get('/', (req, res) => { 
 res.writeHead(200, 
      { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ a: 1 }));
});

app.get('/listCartProduct', (req, res) => {
   res.writeHead(200, 
      { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ 'a':'Cart A1','b':'Cart A2', 'c':'Cart A3','d':'Cart A4'},{ 'a':'Cart A11','b':'Cart A22', 'c':'Cart A33','d':'Cart A44'},{ 'a':'Cart A111','b':'Cart A222', 'c':'Cart A333','d':'Cart A444'}]));
  });
app.get('/listCart', (req, res) => {
   res.writeHead(200, 
      { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ 'a':'Cart A1','b':'Cart A2', 'c':'Cart A3','d':'Cart A4'},{ 'a':'Cart A11','b':'Cart A22', 'c':'Cart A33','d':'Cart A44'},{ 'a':'Cart A111','b':'Cart A222', 'c':'Cart A333','d':'Cart A444'}]));
  });


app.get('/fetch-cart-data', (req, res) => {
 connection.query('SELECT * FROM saved_cart', (error, results, fields) => {
  if (error) throw error;
  results.forEach(row => {
    console.log('Cart ID: ', row.cart_name);
  });
  res.writeHead(200, 
      { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(results));
}); 
});

// create cart
app.post('/api/data', (req, res) => {
const data = req.body;
var request = JSON.stringify(
{
  "customer_id": data.customer_id,
  "line_items": [
    {
      "quantity": data.quantity,
      "product_id": data.product_id,
      "name": data.name,
    }
  ],
  "channel_id": 1,
  "currency": {
    "code": "SGD"
  },
  "locale": "en"
}
);

var config = {
  method: 'post',
  url: 'https://api.bigcommerce.com/stores/bmi8gmig1n/v3/carts',
  headers: { 
    'X-Auth-Token': 'qz2eqt3fj56p8octpgcm4cg6i4beqx2', 
    'Accept': 'application/json', 
    'Content-Type': 'application/json', 
    'Access-Control-Request-Headers': ''
  },
  data : request
};
axios(config)
.then(function (response) {  
  var commerceCartId = response.data['data']['id']; 
    const insertQuery = 'INSERT INTO saved_cart (cart_name, customer_id,commerce_cart_id,active_cart) VALUES (?, ?, ?, ?)';
    const values = [data.cart_name, data.customer_id, commerceCartId, 1];
    connection.query(insertQuery, values, (err, results) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', results);
    });    
    const insertItemQuery = 'INSERT INTO cart_item_id (product_id, commerce_cart_id,qty) VALUES (?, ?, ?)';
    const valuesItems = [data.product_id, commerceCartId, data.quantity];

    connection.query(insertItemQuery, valuesItems, (err, results) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', results);
    });  
    
/*const insertData = (data) => {
    const query = 'INSERT INTO saved_cart (cart_name, customer_id,commerce_cart_id) VALUES (?, ?,?)';
    connection.query(query, [data.value1, data.value2,commerceCartId], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err.stack);
            return;
        }
        console.log('val1:', data.value1);
        console.log('Data inserted:', results.insertId);
    });
};

insertData({ value1: data.cart_name, value2: data.customer_id,commerceCartId:data.commerce_cart_id });
*/

res.status(200).send(data);
})
.catch(function (error) {
  console.log(error);
});
});


// delete cart
app.post('/delete/cart', (req, res) => {
    const data = req.body;
    const query = 'DELETE FROM saved_cart WHERE cart_id=' + data.cart_id;
    connection.query(query, (error, results) => {
        if (error) throw error;
        console.log('Record deleted successfully:', results);
    });
res.status(200).send(data);
});

// Switch cart
app.post('/switch/cart', (req, res) => {
    const data = req.body;
     var data3 = JSON.stringify({
    "key": "",
    "value": ""
  });
    connection.query('SELECT * FROM saved_cart WHERE cart_id=' + data.cart_id, (error, results, fields) => {
      if (error) throw error;
      results.forEach(row => {
        console.log('Cart ID: ', row.commerce_cart_id);
         var config2 = {
    method: 'post',
    url: 'https://api.bigcommerce.com/stores/bmi8gmig1n/v3/carts/'+ row.commerce_cart_id +'/redirect_urls',
    headers: { 
      'X-Auth-Token': 'qz2eqt3fj56p8octpgcm4cg6i4beqx2', 
      'Accept': 'application/json', 
      'Content-Type': 'application/json', 
      'Access-Control-Request-Headers': ''
    },
    data : data3
  };
  axios(config2)
  .then(function (response) {    
     var cartUrl = response.data['data']['cart_url']; 
     let originalString = cartUrl;
    //let localCartUrl = originalString.replace("https://demo-bigcommerce-q1.mybigcommerce.com", "http://localhost:3001");
     res.status(200).send(cartUrl);
  })
  .catch(function (error) {
   console.log(error);
  });
  });
  });
  });
  app.listen(port, (error) => {
    if(!error)
      console.log(`Server is running on http://localhost:${port}`);
    else
      console.log("Ran into error", error);
  });
