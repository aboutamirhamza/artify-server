const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 8000;

// Middlewares
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://artifyDB:vzy2dGw6Pr1Vgn0W@cluster0.otzdp54.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Connecting to Artify Server");
});

async function run() {
  try {
    await client.connect();
    const db = client.db("artify_db");
    const artWorkCollection = db.collection("artworks");

    app.get("/all-artworks", async (req, res) => {
      const cursor = artWorkCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/artworks-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await artWorkCollection.findOne(query);
      res.send(result);
    });

    app.post("/artworks", async (req, res) => {
      const newArtwork = req.body;
      const result = await artWorkCollection.insertOne(newArtwork);
      res.status(201).send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    //
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Artify Server listening at ${port}`);
});
