const compression = require('compression');
const redis = require("redis");
const bluebird = require('bluebird');
const express = require('express');
const bodyParser = require('body-parser');
const db = require('../database/index.js');
bluebird.promisifyAll(redis);

class Server {
  constructor() {
    this.port = 7764;
    this.app = express();
    this.init();
  }

  init() {
    this.app.use(compression());
    this.client = redis.createClient(6379, 'ec2-54-84-9-120.compute-1.amazonaws.com');
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.listen(this.port);

    this.handleGets();
    this.handleapiGets();
    this.handlePosts();
    this.handleOptions();
    this.handleDelete();
    this.handlePuts();
  }

  handleOptions() {
    this.app.options(`/reviews/*`, bodyParser.json(), (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.status(202).send();
    });
  }

  handleGets() {
    this.app.get(`/reviews/*`, bodyParser.json(), (req, res) => {
      let productId = req.originalUrl.split('/')[2]; 
      if (!!!productId) {productId = 1}
      this.client.getAsync('key '+ productId).then( (data) => {
        if (data !== null) {
          res.status(200).send(JSON.parse(data))
        } else {
          db.getReviews(productId, (err, data) => {
            if (err) return console.error(err);
            res.status(202).send(data);
            this.client.setAsync('key ' + productId,  JSON.stringify(data) );
          });
        }
      });
    });

    // increment helpfullness
    this.app.get(`/helpful/*`, bodyParser.json(), (req, res) => {
      const productId = req.originalUrl.split('/')[2];
      const reviewId = req.originalUrl.split('/')[3];
      db.incrementHelpfulness(reviewId, (err, data) => {
        if (err) return console.error(err);
        this.client.expire('key ' + productId, 0);
        res.status(202).send('updated numHelpful of ' + reviewId + ' to ' + JSON.stringify(data.numhelpful));
      });
    });
  }

  handlePosts() {
    // create a new review
    this.app.post(`/reviews/new`, bodyParser.json(), (req, res) => {
      let data = req.body;
      db.createReview(data, (err, data) => {
        if (err) return console.error(err);
        res.status(202).send();
      });
    });
  }


}

const server = new Server();
