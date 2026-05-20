require("dotenv").config();

const mongoose = require("mongoose");

const backupDatabase = require("./utils/backupDatabase");

async function runBackup() {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected");

        await backupDatabase();

        process.exit();

    } catch (err) {

        console.log(err.message);

        process.exit(1);
    }
}

runBackup();