
const mongoose = require("mongoose");



const fs = require("fs");
const path = require("path");
const faker = require('faker');


//Create and save supplies

let artworks = JSON.parse(fs.readFileSync('gallery.json', 'utf8'));


works = [];

for(let art of artworks){
	let newArt = {};
    newArt.Title = art.Title;
	newArt.Artist = art.Artist;
    newArt.Year = art.Year;
    newArt.Category = art.Category;
    newArt.Medium = art.Medium;
    newArt.Description = art.Description;
    newArt.Poster = art.Poster;
    works.push(newArt);
}

mongoose.connect('mongodb://127.0.0.1/gallery');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {

	await mongoose.connection.dropDatabase()
	console.log("Dropped database. Starting re-creation.");

	const gallery = db.collection('gallery');

	gallery.insertMany(works, (insertErr, result) => {
		if (insertErr) {
		  console.error('Error inserting documents into MongoDB:', insertErr);
		} else {
		  console.log(`Inserted ${result.insertedCount} documents into the supplies collection`);
		}
	});
	console.log("All artworks saved.");
});
