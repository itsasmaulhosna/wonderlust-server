const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const app = express();
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

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
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('AUTH HEADER:', authHeader);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1]; // FIXED

    console.log('TOKEN:', token);

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // TEMP: skip jwt verify for now
    req.user = { token };
    const { playload } = await jwtVerify(token, JWKS);
    console.log(playload);
    next();
  } catch (error) {
    console.log('ERROR:', error);

    return res.status(403).json({ message: 'Forbidden' });
  }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db = client.db('wonderlust');
    const destinationsCollection = db.collection('destinations');
    const bookingsCollection = db.collection('bookings');

    app.get('/featured', async (req, res) => {
      const result = await destinationsCollection.find().limit(4).toArray();
      res.json(result);
    });
    app.get('/destination', async (req, res) => {
      const result = await destinationsCollection.find().toArray();
      res.json(result);
    });

    app.post('/destination', async (req, res) => {
      const destinationData = req.body;
      const result = await destinationsCollection.insertOne(destinationData);

      res.json(result);
    });

    app.get('/destination/:id', verifyToken, async (req, res) => {
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
    app.delete('/booking/:bookingId', verifyToken, async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingsCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });
      res.json(result);
    });

    app.post('/booking', verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookingsCollection.insertOne(bookingData);
      res.json(result);
    });
    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 });
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
