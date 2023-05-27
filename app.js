const express = require("express");
const crypto = require("crypto");
const path = require("path");
const { MongoClient } = require("mongodb");
const app = express();
const cors = require('cors');
const Json2csvParser = require("json2csv").Parser;
const fs = require("fs");

require("dotenv").config();

app.use(cors({origin : "*"}));

// Generate a hash for the URL
function generateHash(string, time) {
  return crypto
    .createHash("sha256")
    .update(string)
    .update(time)
    .digest("hex")
    .slice(0, 12);
}

let mongoClient;

const shortUrlBase = process.env.SHORT_URL_BASE;
const mongoUserName = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoProject = process.env.MONGO_PROJECT;
const mongoDBName = process.env.MONGO_DB_NAME;
const mongoURI = `mongodb+srv://${mongoUserName}:${mongoPassword}@${mongoProject}.rbcrqdr.mongodb.net/?retryWrites=true&w=majority`;

const urlDataCollection = "URLData";
const hashUrlMapCollection = "hashURLMapping";

const json2csvParser = new Json2csvParser({ header: true });

app.use(express.json());
app.use(cors)
app.use(express.static(path.join(__dirname, "/UI")));
app.use("/assets/css", express.static("assets/css"));
app.use("/assets/img", express.static("assets/img"));
app.use("/assets/js", express.static("assets/js"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/UI/index.html"));
});

app.get("/health", (req, res) => {
  console.log("Health Check : OK");
  res.status(200).json({"status" : "ok"});
});

app.get("/expired", (req, res) => {
  res.sendFile(path.join(__dirname, "/UI/404.html"));
});

app.get("/admin-panel", async (req, res) => {
  res.sendFile(path.join(__dirname, "/UI/adminPanel.html"));
});

// Shorten the URL and save it in the backend, return hashed URL
app.post("/v1/shorten", async (req, res) => {
  if (
    !req.body ||
    !req.body.base_url ||
    !req.body.utm_source ||
    !req.body.utm_medium ||
    !req.body.utm_campaign ||
    !req.body.utm_term ||
    !req.body.utm_content
  ) {
    return res.status(400).json({ error: "Fields missing or Invalid !" });
  }

  const base_url = req.body.base_url;
  const utm_source = req.body.utm_source;
  const utm_medium = req.body.utm_medium;
  const utm_campaign = req.body.utm_campaign;
  const utm_term = req.body.utm_term;
  const utm_content = req.body.utm_content;
  const timestamp = new Date().toJSON().toString();

  console.log("Timestamp ", timestamp);

  const completeUrl = `${base_url}?utm_source=${utm_source}&utm_medium=${utm_medium}&utm_campaign=${utm_campaign}&utm_term=${utm_term}&utm_content=${utm_content}`;

  // Generate a hash for the Complete URL
  const hash = generateHash(completeUrl, timestamp);

  const shortUrl = `${shortUrlBase}/safe-redirect/${hash}`;

  console.log(shortUrl);

  urlDataForMongo = {
    base_url: base_url,
    utm_source: utm_source,
    utm_medium: utm_medium,
    utm_campaign: utm_campaign,
    utm_term: utm_term,
    utm_content: utm_content,
    hash: hash,
    timestamp: timestamp,
  };

  hashUrlMap = {
    hash: hash,
    completeUrl: completeUrl,
    shortUrl: shortUrl,
    timestamp: timestamp,
    used: 0,
  };
  try {
    await insertIntoMongoDB(mongoDBName, urlDataCollection, urlDataForMongo);
    await insertIntoMongoDB(mongoDBName, hashUrlMapCollection, hashUrlMap);
    return res.status(200).json({ hashedUrl: shortUrl });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: JSON.stringify(err) || "Internal Server Error" });
  }
});

// Redirect to the original URL
app.get("/safe-redirect/:hash", async (req, res) => {
  const hash = req.params.hash;

  let redirectUrl = "";

  let where = {
    hash: hash,
  };

  let toUpdate = {
    used: 1,
    timestamp: new Date().toJSON().toString(),
  };

  try {
    let hashMapDocument = await getDocumentFromMongo(
      mongoDBName,
      hashUrlMapCollection,
      where
    );
    if (hashMapDocument.used && hashMapDocument.used == 1) {
      redirectUrl = "/expired";
      return res.redirect(redirectUrl);
    }
    let updateResult = await updateDocumentInMongo(
      mongoDBName,
      hashUrlMapCollection,
      where,
      toUpdate
    );
    if (
      updateResult.matchedCount &&
      updateResult.modifiedCount &&
      hashMapDocument.completeUrl != ""
    ) {
      if (!hashMapDocument.completeUrl.startsWith("https://")) {
        redirectUrl = "https://" + hashMapDocument.completeUrl;
      }
    } else {
      redirectUrl = "/expired";
    }
  } catch (err) {
    console.error(err);
    redirectUrl = "/expired";
  }

  return res.redirect(redirectUrl);
});

app.get("/v1/downloadUrlData", async (req, res) => {
  let allUrlDataDocs = await getAllDocumentsInCollection(
    mongoDBName,
    urlDataCollection
  );
  let csvData = json2csvParser.parse(allUrlDataDocs);
  let filename =
    "urlData__" +
    generateHash("random", new Date().toJSON().toString()).slice(0, 6) +
    ".csv";
  res
    .set({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${filename}`,
    })
    .status(200)
    .send(csvData);
});

app.get("/v1/downloadHashData", async (req, res) => {
  let allhashMapDocs = await getAllDocumentsInCollection(
    mongoDBName,
    hashUrlMapCollection
  );
  let csvData = json2csvParser.parse(allhashMapDocs);
  let filename =
    "urlHashMaps__" +
    generateHash("random", new Date().toJSON().toString()).slice(0, 6) +
    ".csv";
  res
    .set({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${filename}`,
    })
    .status(200)
    .send(csvData);
});

/* Mongo DB Client and CRUD Functions */

async function getMongoClient() {
  try {
    const client = new MongoClient(mongoURI);
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    return client;
  } catch (err) {
    throw err;
  }
}

async function insertIntoMongoDB(dbName, collection, object) {
  try {
    await mongoClient.db(dbName).collection(collection).insertOne(object);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getDocumentFromMongo(dbName, collection, filters) {
  try {
    let document = await mongoClient
      .db(dbName)
      .collection(collection)
      .findOne(filters);
    return document;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function updateDocumentInMongo(dbName, collection, where, toUpdate) {
  try {
    let updateResult = await mongoClient
      .db(dbName)
      .collection(collection)
      .updateOne(where, { $set: toUpdate });
    console.log(
      `${updateResult.matchedCount} document(s) matched the query criteria.`
    );
    console.log(`${updateResult.modifiedCount} document(s) was/were updated.`);
    return updateResult;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getAllDocumentsInCollection(dbName, collection) {
  try {
    let allDocumentsArray = await mongoClient
      .db(dbName)
      .collection(collection)
      .find({})
      .toArray();
    return allDocumentsArray;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/* Mongo DB Connection and Starting the Server */

const PORT = process.env.PORT;

getMongoClient()
  .then((client) => {
    mongoClient = client;
    // Start the application after the database connection is ready
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
