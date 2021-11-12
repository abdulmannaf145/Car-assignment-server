const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');


// middlewear 
app.use(cors());
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oukh2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
console.log(uri)

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}


async function run() {
    try {
        await client.connect();
        const database = client.db('car_buy_sell');
        const usersCollection = database.collection('users');
        const bookedCollection = database.collection('booked');
        const allProductCollection = database.collection('all_product');
        const reviewCollection = database.collection('review');

        // app.get('/appointments', verifyToken, async (req, res) => {
        //     const email = req.query.email;
        //     const date = req.query.date;
        //     const query = { email: email, date: date }
        //     const cursor = appointmentsCollection.find(query);
        //     const appointments = await cursor.toArray();
        //     res.json(appointments);
        // })
        app.get("/usersOrder", verifyToken, async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const cursor = bookedCollection.find(query);
        const myOrder = await cursor.toArray();
        res.json(myOrder);
        });
        app.delete("/usersOrder/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await bookedCollection.deleteOne(query);
        res.json(result);
        });





        app.post('/review', async (req, res) => {
            const appointment = req.body;
            const result = await reviewCollection.insertOne(appointment);
            res.json(result)
        });
        app.post('/bookedCar', async (req, res) => {
            const appointment = req.body;
            const result = await bookedCollection.insertOne(appointment);
            res.json(result)
        });
        app.get('/review', async (req, res) => {
            const cursor = reviewCollection.find({});
            const user = await cursor.toArray();
            res.send(user);
        })
        
        app.get('/bookedCar', async (req, res) => {
            const cursor = bookedCollection.find({});
            const user = await cursor.toArray();
            res.send(user);
        })
        app.delete("/bookedCar/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await bookedCollection.deleteOne(query);
        res.json(result);
        });
        // // Delete User Services
        app.delete("/allProduct/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await allProductCollection.deleteOne(query);
        res.json(result);
        });
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        app.get("/allProduct", async (req, res) => {
            const cursor = allProductCollection.find({});
            const user = await cursor.toArray();
            res.send(user);
            });
        app.post('/allProduct', async (req, res) => {
            const user = req.body;
            const result = await allProductCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });
            app.get("/allProduct/:id", async (req, res) => {
        const id = req.params.id;
        console.log("getting specific service", id);
        const query = { _id: ObjectId(id) };
        const service = await allProductCollection.findOne(query);
        res.json(service);
            });
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const user = await cursor.toArray();
            res.send(user);
        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

       app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "you do not have access to make admin" });
      }
    });
        
    app.put("/usersOrder/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          condition: "shipped",
        },
      };
      const result = await bookedCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log("updating", id);
      res.json(result);
    }); 
        
        
        
        
        

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})