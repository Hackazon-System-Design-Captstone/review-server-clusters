const compression = require('compression');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('../database/index.js');
const  morgan  = require('morgan');
let port = 7766;
let app = express();

app.use(compression());
app.use(bodyParser.json());
app.use(morgan());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(port);

app.options(`/reviews/*`, (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.status(202).send();
});

app.get(`/reviews/*`, (req, res) => {
  let productId = req.originalUrl.split('/')[2]; 
  if (!!!productId) {productId = 1}
  db.getReviews(productId, (err, data) => {
    if (err) return console.error(err);
    res.status(202).send(data);
  });
});

    // increment helpfullness
app.get(`/helpful/*`, (req, res) => {
  const reviewId = req.originalUrl.split('/')[3];
  db.incrementHelpfulness(reviewId, (err, data) => {
    if (err) return console.error(err);
    res.status(202).send('updated numHelpful of ' + reviewId + ' to ' + JSON.stringify(data.numhelpful));
  });
});

    // create a new review
app.post(`/reviews/new`, (req, res) => {
  let data = req.body;
  db.createReview(data, (err, data) => {
    if (err) return console.error(err);
    res.status(202).send();
  });
});