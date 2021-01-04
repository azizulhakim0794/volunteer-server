const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser')
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId
const admin = require('firebase-admin');
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hsgbd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: false}));

var serviceAccount = require("./volunteer-2b5c0-firebase-adminsdk-9pjet-0b1c5a26ea.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});
app.use(cors())
const port = 5000
console.log(process.env.DB_NAME)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const cardCollection = client.db("volunteer").collection("duties")
  const orderCollection = client.db("volunteer").collection("orders");
  console.log('database connection successfully')
  app.post('/addDuties', (req, res) => {
    const duties = req.body
    console.log(duties)
    cardCollection.insertMany(duties)
      .then(result => {
        console.log(result.insertedCount)
        res.send(result.insertedCount)
      })

  })
  app.get('/duties', (req, res) => {
    cardCollection.find({})
      .toArray((err, document) => {
        res.send(document)
      })

  })
  app.get('/duties/:id', (req, res) => {
    cardCollection.find({ id: req.params.id })
      // console.log(_id)
      .toArray((err, document) => {
        res.send(document)
      })

  })
  app.post('/productsByKeys', (req, res) => {
    const productKeys = req.body
    // console.log(productKeys)
    cardCollection.find({ id: { $in: productKeys } })
      .toArray((err, document) => {
        res.send(document)
        console.log(document)
      })
  })
  app.post('/addRegistration', (req, res) => {
    const product = req.body
    orderCollection.insertOne(product)
      .then(result => {
        res.send(result.insertedCount)
      })
  })
  app.get('/addRegistration', (req, res) => {
    const bearer = req.headers.authorization
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log(idToken)
      admin.auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email
          if (tokenEmail == queryEmail) {
            orderCollection.find({ email: queryEmail })
              .toArray((err, document) => {
                res.send(document)
              })
          }
          else{
            res.statusCode(401).send('un-authorized')
          }

        })
        .catch((error) => {
          // Handle error
          res.statusCode(401).send('un-authorized')
        })
        
    }
    else{
      res.statusCode(401).send('un-authorized')
    }
   

  })
  app.delete('/delete/:id', (req, res) => {
    orderCollection.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result.deletedCount > 0)
      })
  })
});


app.listen(process.env.PORT || port)