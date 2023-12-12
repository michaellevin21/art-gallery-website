const express = require('express');
const app = express();
const mongoose = require("mongoose");
const parser = require('body-parser');
const { Cookie } = require('express-session');



app.set("view engine", "pug");
app.use(parser.urlencoded({extended:true}));

let curAccount = {username: '', password: ''};
let results = [];

mongoose.connect('mongodb://127.0.0.1/gallery');

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
	app.listen(3000);
	console.log("Server listening on port 3000");
});

let accounts = db.collection('accounts');
let gallery = db.collection('gallery');
let artists = db.collection('artists');

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/create',function(req,res){
    res.render('create');
});

app.get('/login',function(req,res){
  res.render('login');
});

app.get('/home',function(req,res){
  if(curAccount.username == ''){
    res.render('index');
  }
  else{
    res.render('home',{user:curAccount});
  }
});

app.post('/accounts',async function(req,res){
    if(curAccount.username != ''){
      res.status(403).send('<p>Another user is already logged in within this browser window</p>')
    }
    else if(req.body.create == ''){
      if( await accounts.findOne({username: req.body.username})){
        res.status(409).send('<p>This username is already taken</p>');
      }
      else{
        let user = {username: req.body.username, password: req.body.password, type: 'patron',reviewed: [], liked: [], notifications: [], followed: [],reviews:[]};
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
    results = await gallery.find({}).toArray();
    res.render('gallery',{results,start:0,end:10,user:curAccount});
  }
});

app.get('/notif',function(req,res){
  if(curAccount.username == ''){
    res.render('index');
  }
  else{
    res.render('notif',{user:curAccount});
  }
  
});

app.get('/logout',function(req,res){
  curAccount = {username: '', password: ''};
  res.render('index');
});

app.get('/followed',function(req,res){
  if(curAccount.username == ''){
    res.render('index');
  }
  else{
    res.render('followed',{user:curAccount});
  }
  
});

app.get('/liked',async function(req,res){
  if(curAccount.username == ''){
    res.render('index');
  }
  else{
    let liked = [];
    for(let artwork of curAccount.liked){
      liked.push(await gallery.findOne({Title: artwork}));
    }
    res.render('liked',{user:curAccount,liked});
  }
});

app.get('/reviews',async function(req,res){
  if(curAccount.username == ''){
    res.render('index');
  }
  else{
    let reviewed = [];
    for(let artwork of curAccount.reviewed){
      reviewed.push(await gallery.findOne({Title: artwork}));
    }
    res.render('reviewed',{user:curAccount,reviewed});
  }
});

app.get('/artworks',async function(req,res){
  if(curAccount.username == ''){
    res.render('index');
  }
  else{
    filter = {};
    if(req.query.title){
      filter.Title = req.query.title.toUpperCase();
    }
    if(req.query.name){
      filter.Artist = req.query.name.toUpperCase();
    }
    if(req.query.category){
      filter.Category = req.query.category.toUpperCase();
    }
    results = await gallery.find(filter).toArray();
    res.render('gallery',{results,start:0,end:10,user:curAccount});
  }
});

app.get('/artist/:name',async function(req,res){
  if(curAccount.username == ''){
    res.render('index');
  }
  else{
    if(!req.params.name){
      res.status(404).send('<p>Artist Not Found</p>');
    }
    let artistName = `${req.params.name.split('_')[0]}`;
    for (let i = 1; i < req.params.name.split('_').length; i++){
      artistName += ` ${req.params.name.split('_')[i]}`;
    }
    if(artistName == curAccount.username){
      res.render('home',{user:curAccount});
    }
    else{
      let artist = await artists.findOne({name: artistName});
      if(!artist){
        res.status(404).send('<p>Artist Not Found</p>');
      }
      else{
        res.render('artist',{artist,user:curAccount});
      }
    } 
  }
});

app.get('/:title/review', async function (req, res) {
  if (curAccount.username == '') {
    res.render('index');
  } 
  else {
    if (!req.params.title) {
      res.status(404).send('<p>404 Page Not Found</p>');
    } 
    else {
      let artworkTitle = `${req.params.title.split('_')[0]}`;
      for (let i = 1; i < req.params.title.split('_').length; i++){
        artworkTitle += ` ${req.params.title.split('_')[i]}`;
      }
      let artwork = await gallery.findOne({ Title: artworkTitle });
      if (!artwork) {
        res.status(404).send('<p>404 Page Not Found</p>');
      } 
      else {
        res.render('addReview', { artwork });
      }
    }
  }
});

app.get('/:title/unreview', async function (req, res) {
  if (curAccount.username == '') {
    res.render('index');
  } 
  else {
    if (!req.params.title) {
      res.status(404).send('<p>404 Page Not Found</p>');
    } 
    else {
      let artworkTitle = `${req.params.title.split('_')[0]}`;
      for (let i = 1; i < req.params.title.split('_').length; i++){
        artworkTitle += ` ${req.params.title.split('_')[i]}`;
      }
      let artwork = await gallery.findOne({ Title: artworkTitle });
      if (!artwork) {
        res.status(404).send('<p>404 Page Not Found</p>');
      } 
      else {
        let commonReviews = artwork.Reviews.filter(value => curAccount.reviews.includes(value));
        await gallery.updateOne(artwork,{$pull:{Reviews: {$in: commonReviews}}});
        curAccount.reviews = curAccount.reviews.filter(value => !commonReviews.includes(value));
        curAccount.notifications.push(`You unreviewed ${artworkTitle}`);
        curAccount.reviewed.splice(curAccount.reviewed.indexOf(artworkTitle),1);
        await accounts.updateOne({username:curAccount.username},{$set:curAccount});
        res.render('notif',{user:curAccount});
      }
    }
  }
});

app.post('/:title/reviews', async function (req, res) {
  let artworkTitle = `${req.params.title.split('_')[0]}`;
  for (let i = 1; i < req.params.title.split('_').length; i++){
    artworkTitle += ` ${req.params.title.split('_')[i]}`;
  }
  let artwork = await gallery.findOne({ Title: artworkTitle });
  gallery.updateOne(artwork,{$push:{Reviews: req.body.review}});
  curAccount.reviewed.push(artwork.Title);
  curAccount.reviews.push(req.body.review);
  curAccount.notifications.push(`You reviewed ${artworkTitle}`);
  await accounts.updateOne({username:curAccount.username},{$set:curAccount});
  res.render('notif',{user:curAccount});

});

app.get('/:title/like', async function (req, res) {
  if (curAccount.username == '') {
    res.render('index');
  } 
  else {
    if (!req.params.title) {
      res.status(404).send('<p>404 Page Not Found</p>');
    } 
    else {
      let artworkTitle = `${req.params.title.split('_')[0]}`;
      for (let i = 1; i < req.params.title.split('_').length; i++){
        artworkTitle += ` ${req.params.title.split('_')[i]}`;
      }
      let artwork = await gallery.findOne({ Title: artworkTitle });
      if (!artwork) {
        res.status(404).send('<p>404 Page Not Found</p>');
      } 
      else {
        await gallery.updateOne(artwork,{$inc:{Likes:1}});
        curAccount.liked.push(artworkTitle);
        curAccount.notifications.push(`You liked ${artworkTitle}`);
        await accounts.updateOne({username:curAccount.username},{$set:curAccount});
        res.render('notif',{user:curAccount});
      }
    }
  }
});

app.get('/:title/unlike', async function (req, res) {
  if (curAccount.username == '') {
    res.render('index');
  } 
  else {
    if (!req.params.title) {
      res.status(404).send('<p>404 Page Not Found</p>');
    } 
    else {
      let artworkTitle = `${req.params.title.split('_')[0]}`;
      for (let i = 1; i < req.params.title.split('_').length; i++){
        artworkTitle += ` ${req.params.title.split('_')[i]}`;
      }
      let artwork = await gallery.findOne({ Title: artworkTitle });
      if (!artwork) {
        res.status(404).send('<p>404 Page Not Found</p>');
      } 
      else {
        await gallery.updateOne(artwork,{$inc:{Likes:-1}});
        curAccount.liked.splice(curAccount.liked.indexOf(artworkTitle),1);
        curAccount.notifications.push(`You unliked ${artworkTitle}`);
        await accounts.updateOne({username:curAccount.username},{$set:curAccount});
        res.render('notif',{user:curAccount});
      }
    }
  }
});

app.get('/next/:end',function(req,res){
  if (curAccount.username == '') {
    res.render('index');
  }
  else if(!req.params.end){
    res.status(404).send('<p>404 Page Not Found</p>');
  }
  else{
    let newStart = parseInt(req.params.end);
    res.render('gallery',{user:curAccount,start:newStart,end:newStart+10,results});
  }
});

app.get('/previous/:start',function(req,res){
  if (curAccount.username == '') {
    res.render('index');
  }
  else if(!req.params.start){
    res.status(404).send('<p>404 Page Not Found</p>');
  }
  else{
    let newEnd = parseInt(req.params.start);
    res.render('gallery',{user:curAccount,start:newEnd-10,end:newEnd,results});
  }
});

app.get('/:name/follow',async function(req,res){
  if (curAccount.username == '') {
    res.render('index');
  }
  else if(!req.params.name){
    res.status(404).send('<p>404 Page Not Found</p>');
  }
  else{
    let artistName = `${req.params.name.split('_')[0]}`;
    for (let i = 1; i < req.params.name.split('_').length; i++){
      artistName += ` ${req.params.name.split('_')[i]}`;
    }
    let artist = await artists.findOne({name: artistName});
    if(!artist){
      res.status(404).send('<p>Artist Not Found</p>');
    }
    else{
      await artists.updateOne({name:artistName},{$push:{followers:curAccount.username}});
      curAccount.followed.push(artistName);
      curAccount.notifications.push(`You followed ${artistName}`);
      await accounts.updateOne({username:curAccount.username},{$set:curAccount});
      res.render('notif',{user:curAccount});
    } 
  }
});

app.get('/:name/unfollow',async function(req,res){
  if (curAccount.username == '') {
    res.render('index');
  }
  else if(!req.params.name){
    res.status(404).send('<p>404 Page Not Found</p>');
  }
  else{
    let artistName = `${req.params.name.split('_')[0]}`;
    for (let i = 1; i < req.params.name.split('_').length; i++){
      artistName += ` ${req.params.name.split('_')[i]}`;
    }
    let artist = await artists.findOne({name: artistName});
    if(!artist){
      res.status(404).send('<p>Artist Not Found</p>');
    }
    else{
      await artists.updateOne({name:artistName},{$pull:{followers:curAccount.username}});
      curAccount.followed.splice(curAccount.followed.indexOf(artistName),1);
      curAccount.notifications.push(`You unfollowed ${artistName}`);
      await accounts.updateOne({username:curAccount.username},{$set:curAccount});
      res.render('notif',{user:curAccount});
    } 
  }
});

        
      

