const express = require('express');
const app = express();
const mongoose = require("mongoose");
const parser = require('body-parser');


app.set("view engine", "pug");
app.use(parser.urlencoded({extended:true}));

/*let userRouter = require("./user-router");
app.use("/users", userRouter);
let productsRouter = require("./products-router");
app.use("/products", productsRouter);
let reviewsRouter = require("./reviews-router");
app.use("/reviews", reviewsRouter);*/

mongoose.connect('mongodb://127.0.0.1/store');

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
	app.listen(3000);
	console.log("Server listening on port 3000");
});

let accounts = db.collections('accounts');

app.get('/', function(req, res) {
	res.render('index');
});

app.get('/create',function(req,res){
    res.render('create');
});

app.post('/accounts',async function(req,res){
    if(!req.body.username || !req.body.password){
        res.status(400);
    }
    else if( await accounts.findOne({username: req.body.username})){
        res.status(409);
    }
    else{
        await accounts.insertOne({username: req.body.username, password: req.body.password});
        res.status(201);
    }

});