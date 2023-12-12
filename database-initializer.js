
const mongoose = require("mongoose");



const fs = require("fs");
const path = require("path");
const faker = require('faker');




let artworks = JSON.parse(fs.readFileSync('gallery.json', 'utf8'));


let works = [];
let names = [];
let people = [];

for(let art of artworks){
	let newArt = {};
    newArt.Title = art.Title.toUpperCase();
	newArt.Artist = art.Artist.toUpperCase();
	if(!names.includes(newArt.Artist)){
		names.push(newArt.Artist);
	}
    newArt.Year = art.Year;
    newArt.Category = art.Category.toUpperCase();
    newArt.Medium = art.Medium;
    newArt.Description = art.Description;
    newArt.Poster = art.Poster;
	newArt.Reviews = [];
	newArt.Likes = 0;
    works.push(newArt);
}

for(let name of names){
	let person = {};
	person.name = name;
	person.artworks = [];
	person.workshops = [];
	people.push(person);
}

mongoose.connect('mongodb://127.0.0.1/gallery');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {

	await mongoose.connection.dropDatabase()
	console.log("Dropped database. Starting re-creation.");

	const gallery = db.collection('gallery');
	const artists = db.collection('artists');

	await artists.insertMany(people, (insertErr, result) => {
		if (insertErr) {
		  console.error('Error inserting artists into MongoDB:', insertErr);
		} else {
		  console.log(`Inserted ${result.insertedCount} artists into the supplies collection`);
		}
	});
	console.log("All artists saved.");
	
	await gallery.insertMany(works, (insertErr, result) => {
		if (insertErr) {
		  console.error('Error inserting documents into MongoDB:', insertErr);
		} else {
		  console.log(`Inserted ${result.insertedCount} documents into the supplies collection`);
		}
	});
	console.log("All artworks saved.");

	const galleryArtworks = await gallery.find({}).toArray();
	for (let artwork of galleryArtworks) {
  		await artists.updateOne({name: artwork.Artist}, {$push: {artworks: artwork}});
	}

	
});
