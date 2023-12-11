const express = require('express');
const app = express();
const mongoose = require("mongoose");
const parser = require('body-parser');



app.set("view engine", "pug");
app.use(parser.urlencoded({extended:true}));

let curAccount = {username: '', password: ''};

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
let gallery = db.collection('gallery');

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/create',function(req,res){
    res.render('create');
});

app.get('/login',function(req,res){
  res.render('login');
});

app.post('/accounts',async function(req,res){
    if(curAccount.username != ''){
      res.status(403).send('<p>Another user is already logged in within this browser window</p>')
    }
    if(req.body.create == ''){
      if( await accounts.findOne({username: req.body.username})){
        res.status(409).send('<p>This username is already taken</p>');
      }
      else{
        let user = {username: req.body.username, password: req.body.password, type: 'patron'};
        await accounts.insertOne(user);
        curAccount = user;
        res.status(201);
        res.render('home',{user});
      }
    }
    else{
      let user = await accounts.findOne({username: req.body.username, password: req.body.password});
      if(user){
        curAccount = user;
        res.status(200);
        res.render('home',{user});
      }
      else{
        res.status(401).send('<p>Incorrect Username or Password</p>');
      }
    }

});

app.get('/gallery',async function(req,res){
  if(curAccount.username == ''){
    res.render('index');
  }
  else{
    res.render('gallery',{results:await gallery.find({}).toArray(),start:0,end:10});
  }
});