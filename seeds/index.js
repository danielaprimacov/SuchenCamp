const mongoose = require("mongoose");
const CampGround = require("../models/campground");
const camps = require("./camps");

mongoose.set("strictQuery", true);

mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const seedDB = async () => {
  await CampGround.deleteMany({});
  for (let i = 0; i < camps.length; i++) {
    const camp = new CampGround({
      author: "63c55e207857df8534ad9afa",
      location: `${camps[i].nameloc}, ${camps[i].state}`,
      title: `${camps[i].name}`,
      description: camps[i].description,
      price: camps[i].price,
      geometry: {
        type: "Point",
        coordinates: [`${camps[i].cords.long}`, `${camps[i].cords.lat}`],
      },
      imgs: [
        {
          url: `${camps[i].image}`,
          filename: "",
        },
      ],
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
