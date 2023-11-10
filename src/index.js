require('dotenv').config();

const auth = require('./databases/auth');
const articles = require('./databases/articles');
const profile = require('./databases/profile');
const following = require('./databases/following');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { connectDB, closeConnection } = require('./databases/db');
const cors = require('cors');
const corsOptions = {
    origin: 'http://127.0.0.1:3001',
    credentials: true,
    optionsSuccessStatus: 200
};

// Connect to mongodb
connectDB().catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit the process with an error code
});

const hello = (req, res) => res.send({ hello: 'This is the backend of dw73ricebook.' });

const app = express();

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', hello);

auth.setupRoutes(app);
articles.setupRoutes(app);
profile.setupRoutes(app);
following.setupRoutes(app);

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    const addr = server.address();
    console.log(`Server listening at http://${addr.address}:${addr.port}`)
});

// exit database after shutdown
process.on('SIGINT', async () => {
    try {
        await closeConnection();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Failed to close database connection', error);
        process.exit(1);
    }
});