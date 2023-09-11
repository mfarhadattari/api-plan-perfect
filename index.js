const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { jwtVerify } = require("./middleware");

const port = process.env.PORT || 3000;
const uri = process.env.DB_URI;
const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// create client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

(async () => {
  try {
    client.connect();

    // db collections
    const db = await client.db("plan-perfect");
    const taskCollection = db.collection("tasks");
    const archiveCollection = db.collection("archives");

    // ! --------------- Base --------------------
    app.get("/", (req, res) => {
      res.send("Plan perfect server is running!");
    });

    // ! ------------ JWT Token Generate ---------------
    app.post("/generate-jwt", (req, res) => {
      const data = req.body;
      const token = jwt.sign({ email: data.email }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });
      res.send({ token });
    });

    // ! ------------ My Task -------------------------
    app.get("/tasks", jwtVerify, async (req, res) => {
      const decodedEmail = req.decoded.email;
      if (decodedEmail !== req.query.email) {
        return res.status(401).send({ error: true, message: "Unauthorized Access" });
      }
      const query = { userEmail: req.query.email };
      const tasks = await taskCollection
        .find(query, { sort: { date: 1 } })
        .toArray();
      res.send(tasks);
    });

    // ! -------------- Add Task ----------------------
    app.post("/tasks", jwtVerify, async (req, res) => {
      const data = req.body;
      const insertedResult = await taskCollection.insertOne(data);
      res.send(insertedResult);
    });

    // ! -------------- Delete Task -------------------
    app.delete("/tasks/:id", jwtVerify, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const deletedResult = await taskCollection.deleteOne(query);
      res.send(deletedResult);
    });

    // ! --------------- Update Task Status -----------
    app.patch("/tasks/:id", jwtVerify, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const data = req.body;
      const updateDoc = {
        $set: {
          status: data.status,
        },
      };
      const updatedResult = await taskCollection.updateOne(query, updateDoc);
      res.send(updatedResult);
    });

    // ! -------------- Archive the Task -------------
    app.delete("/archive-task/:id", jwtVerify, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const task = await taskCollection.findOne(query);
      const deletedRes = await taskCollection.deleteOne(query);
      const archiveInsertRes = await archiveCollection.insertOne(task);
      res.send(archiveInsertRes);
    });

    // ! -------------- My Archive -------------------
    app.get("/archives", jwtVerify, async (req, res) => {
      const decodedEmail = req.decoded.email;
      if (decodedEmail !== req.query.email) {
        return res.status(401).send({ error: true, message: "Unauthorized Access" });
      }
      const query = { userEmail: req.query.email };
      const archives = await archiveCollection
        .find(query, { sort: { date: 1 } })
        .toArray();
      res.send(archives);
    });

    // ! --------------- Delete Archive -------------
    app.delete("/archives/:id", jwtVerify, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const deletedRes = await archiveCollection.deleteOne(query);
      res.send(deletedRes);
    });

    // ! ---------------- Clear Data --------------
    app.delete("/clear-data", jwtVerify, async (req, res) => {
      const decodedEmail = req.decoded.email;
      if (decodedEmail !== req.query.email) {
        return res.status(401).send({ error: true, message: "Unauthorized Access" });
      }
      const query = { userEmail: req.query.email };
      const deletedTask = await taskCollection.deleteMany(query);
      const deletedArchive = await archiveCollection.deleteMany(query);
      res.send(deletedArchive);
    });

    // ping if connected db successfully
    console.log("Successfully connected to database!");
  } catch (error) {
    console.error(error);
  }
})();

app.listen(port, () => {
  console.log(`Plan perfect server is running on port ${port}`);
});
