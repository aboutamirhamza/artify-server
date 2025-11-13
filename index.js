const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 8000;
const admin = require("firebase-admin");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.otzdp54.mongodb.net/?appName=Cluster0`;

// Middlewares
app.use(cors());
app.use(express.json());

const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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
    // await client.connect();
    const db = client.db("artify_db");
    const artWorkCollection = db.collection("artworks");
    const userCollection = db.collection("users");

    app.get("/all-artworks", async (req, res) => {
      const cursor = artWorkCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/home-artworks", async (req, res) => {
      const cursor = artWorkCollection.find().limit(6).sort({ _id: -1 });
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

    app.put("/favorite/:artworkId", async (req, res) => {
      const { artworkId } = req.params;
      const { userEmail } = req.body;

      try {
        const result = await userCollection.updateOne(
          { email: userEmail },
          { $addToSet: { favorites: new ObjectId(artworkId) } },
          { upsert: true }
        );
        res.send({ success: true, message: "Added to favorites", result });
      } catch (err) {
        res.status(500).send({ success: false, message: err.message });
      }
    });

    app.put("/unfavorite/:artworkId", async (req, res) => {
      const { artworkId } = req.params;
      const { userEmail } = req.body;

      try {
        const result = await userCollection.updateOne(
          { email: userEmail },
          { $pull: { favorites: new ObjectId(artworkId) } }
        );
        res.send({ success: true, message: "Removed from favorites", result });
      } catch (err) {
        res.status(500).send({ success: false, message: err.message });
      }
    });

    app.get("/user-favorites/:email", async (req, res) => {
      const email = req.params.email;

      try {
        const user = await userCollection.findOne({ email });
        if (!user || !user.favorites?.length) return res.send([]);

        const favorites = await artWorkCollection
          .find({ _id: { $in: user.favorites } })
          .toArray();

        res.send(favorites);
      } catch (err) {
        res.status(500).send({ message: err.message });
      }
    });

    app.get("/my-artworks/:email", async (req, res) => {
      const email = req.params.email;
      const result = await artWorkCollection
        .find({ userEmail: email })
        .toArray();
      res.send(result);
    });

    app.delete("/artworks/:id", async (req, res) => {
      const id = req.params.id;
      const result = await artWorkCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.patch("/artworks/:id", async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      delete updated._id;

      try {
        const result = await artWorkCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updated }
        );

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: "Artwork updated", result });
        } else {
          res.send({ success: false, message: "No changes made" });
        }
      } catch (err) {
        res.status(500).send({ success: false, message: err.message });
      }
    });

    // await client.db("admin").command({ ping: 1 });
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
