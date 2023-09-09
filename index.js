const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

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
    const userCollection = db.collection("users");
    const archiveCollection = db.collection("archives");

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
    app.get("/tasks", async (req, res) => {
      const query = { userEmail: req.query.email };
      const tasks = await taskCollection.find(query).toArray();
      res.send(tasks);
    });

    // ! -------------- Add Task ----------------------
    app.post("/tasks", async (req, res) => {
      const data = req.body;
      const insertedResult = await taskCollection.insertOne(data);
      res.send(insertedResult);
    });

    // ! -------------- Delete Task -------------------
    app.delete("/tasks/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const deletedResult = await taskCollection.deleteOne(query);
      res.send(deletedResult);
    });

    // ! --------------- Update Task Status -----------
    app.patch("/tasks/:id", async (req, res) => {
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
    app.delete("/archive-task/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const task = await taskCollection.findOne(query);
      const deletedRes = await taskCollection.deleteOne(query);
      const archiveInsertRes = await archiveCollection.insertOne(task);
      res.send(archiveInsertRes);
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
