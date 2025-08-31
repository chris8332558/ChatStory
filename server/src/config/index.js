// imports the dotenv package, and reads the `.env` file in the root directory and loads them 
// into Node.js global `process.env` object.
require('dotenv').config();
const { Pool } = require('pg'); // manage multiple database connections
const { MongoClient } = require('mongodb'); // Connect to a MongoDB instance 

// PostgreSQL Connection Pool: creates a connection pool for pgSQL 
// instead of creating a new connection for every single query.
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
});


// MongoDB Connection
const mongoClient = new MongoClient(process.env.MONGO_URI)
let db;

async function connectToMongo() {
    try {
        await mongoClient.connect();
        // Send a ping to confirm a successful connection
        await mongoClient.db("admin").command({ ping: 1 });
        db = mongoClient.db(); // Use the default BD from the URI
        console.log('Pinged your deloyment. Successfully connected to MongoDB Atlas');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    } 
};

// Function to get the MongoDB database instance
const getDB = () => {
    if (!db) {
        throw new Error('Mongo not connected: call connectToMongo() first');
    }
    return db;
};

// Standard Node.js way of making functions and variables from on file availble to other files.
module.exports = {
    pgPool: pool,
    connectToMongo,
    getDB
};