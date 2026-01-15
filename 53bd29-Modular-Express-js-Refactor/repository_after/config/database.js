const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const connectToDB = async () => {
    const mongoAtlastUrl = process.env.DBURL || "";
    console.log("Connecting...");
    try {
        await mongoose.connect(mongoAtlastUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MDBA Connected!");
        console.log("connected!");
    } catch (err) {
        console.log("ERROR");
        throw err;
    }
};

module.exports = { connectToDB };
