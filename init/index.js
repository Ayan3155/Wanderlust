require("dotenv").config({path:"../.env"});

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
// const { geocodingClient } = require("../cloudConfig.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const geocodingClient = mbxGeocoding({
    accessToken: process.env.MAP_TOKEN
});

let MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch(err => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});

    const listingsWithCoordinates = [];

    for (let obj of initData.data) {
        try {
            const response = await geocodingClient.forwardGeocode({
                query: obj.location,
                limit: 1,
            }).send();

            if (!response.body.features.length) {
                console.log(`Location not found: ${obj.location}`);
                continue;
            }

            const geometry = response.body.features[0].geometry;

            listingsWithCoordinates.push({
                ...obj,
                owner: "6a969ec4cb676aeecd5edecb",
                geometry: geometry
            });

            console.log(`Geocoded: ${obj.location}`);

        } catch (err) {
            console.log(`Error geocoding ${obj.location}: ${err.message}`);
        }
    }

    await Listing.insertMany(listingsWithCoordinates);

    console.log("Data was initialized");
};

initDB();
