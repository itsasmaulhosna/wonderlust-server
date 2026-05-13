const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();
const uri = process.env.MONGODB_URI;

const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db('wonderlust');
    const destinationsCollection = db.collection('destinations');
    const bookingsCollection = db.collection('bookings');
    app.get('/destination', async (req, res) => {
      const result = await destinationsCollection.find().toArray();
      res.json(result);
    });

    app.post('/destination', async (req, res) => {
      const destinationData = req.body;
      const result = await destinationsCollection.insertOne(destinationData);

      res.json(result);
    });

    app.get('/destination/:id', async (req, res) => {
      const { id } = req.params;

      const result = await destinationsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    app.patch('/destination/:id', async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      const result = await destinationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.json(result);
    });

    app.delete('/destination/:id', async (req, res) => {
      const { id } = req.params;
      const result = await destinationsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    app.get('/booking/:userId', async (req, res) => {
      const { userId } = req.params;
      const result = await bookingsCollection
        .find({ userId: userId })
        .toArray();
      res.json(result);
    });
    app.delete('/booking/:bookingId', async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingsCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });
      res.json(result);
    });
    app.post('/booking', async (req, res) => {
      const bookingData = req.body;
      const result = await bookingsCollection.insertOne(bookingData);
      res.json(result);
    });
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!',
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Welcome to the Wonderlust Server!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
