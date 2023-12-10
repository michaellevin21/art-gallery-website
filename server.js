const express = require('express');
const app = express();
const mongoose = require("mongoose");
const parser = require('body-parser');
const session = require('express-session');


app.set("view engine", "pug");
app.use(parser.urlencoded({extended:true}));
app.use(session({
    secret: 'Zt@GYMb7Nu',
    resave: false,
    saveUninitialized: true,
  }));


  function checkIfLoggedIn(req, res, next) {
    if (req.session && req.session.userId) {
      return res.status(403).send('<p>Another user is already logged in in this browser window</p>');
    }
    next();
  }

/*let userRouter = require("./user-router");
app.use("/users", userRouter);
let productsRouter = require("./products-router");
app.use("/products", productsRouter);
let reviewsRouter = require("./reviews-router");
app.use("/reviews", reviewsRouter);*/

mongoose.connect('mongodb://127.0.0.1/gallery');

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
	app.listen(3000);
	console.log("Server listening on port 3000");
});

let accounts = db.collection('accounts');

app.get('/', function(req, res) {
	res.render('index');
});

app.get('/create',function(req,res){
    res.render('create');
});

app.post('/accounts',checkIfLoggedIn,async function(req,res){
    if( await accounts.findOne({username: req.body.username})){
        res.status(409).send('<p>This username is already taken</p>');
    }
    else{
        let user = {username: req.body.username, password: req.body.password, type: 'patron'};
        await accounts.insertOne(user);
        res.status(201);
        res.render('home',{user});
    }

});