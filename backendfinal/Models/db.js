const mongoose  = require("mongoose");

const mongo_url = process.env.MONGODB_URI;

mongoose.connect(mongo_url)
    .then(() => {
        console.log("Connected to MongoDB successfully");
    }).catch((err) => {
        console.log("Error connecting to MongoDB", err);
    })