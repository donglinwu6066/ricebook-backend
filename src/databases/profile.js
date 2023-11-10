const { getDB } = require('./db');
const { User, Profile } = require('./dataType');

async function setUserInfo(req, res, infoType) {
    // Access the new value from the request body using the infoType
    const newValue = req.body[infoType];
    //const collectionName = (infoType === 'headline' || infoType === 'avatar') ? 'profiles' : 'users';

    // Determine the collection and class to use based on infoType
    let collectionName, Entity;
    if (infoType === 'headline' || infoType === 'avatar') {
        collectionName = 'profiles';
        Entity = Profile;
    } else {
        collectionName = 'users';
        Entity = User;
    }

    // Check if the new value is provided
    if (!newValue) {
        return res.status(400).send({ error: `${infoType.charAt(0).toUpperCase() + infoType.slice(1)} is required` });
    }

    const db = getDB();
    try {
        // Check if the user exists
        const userExists = await db.collection('users').findOne({ username: req.username });
        if (!userExists) {
            return res.status(404).send({ error: 'User not found' });
        }

        let entity = await db.collection(collectionName).findOne({ username: req.username });
        // Get existing profile or user object
        if (!entity) {
            // Define the object based on the Entity class
            entity = new Entity({
                username: req.username,
                // Set appropriate properties based on the Entity type
                ...(Entity === Profile ? { avatar: '', headline: '' } : {}),
                ...{ [infoType]: newValue }
            });
            
            // Insert new entity into the database
            await db.collection(collectionName).insertOne(entity);
        } else {
            // Update the existing entity
            const updateObject = new Entity({
                ...entity,
                ...{ [infoType]: newValue }
            });
            
            // Use the updated object for the database operation
            await db.collection(collectionName).updateOne(
                { username: req.username },
                { $set: { [infoType]: updateObject[infoType] } }
            );
        }
        /*
        const profile = await db.collection(collectionName).findOne({ username: req.username });
        if (!profile) {
            // Set up a new profile object with default values
            const newProfile = {
                username: req.username,
                headline: infoType === 'headline' ? newValue : '',
                avatar: infoType === 'avatar' ? newValue : ''
            };
            await db.collection(collectionName).insertOne(newProfile);
        } else {
            // Update the existing profile
            await db.collection(collectionName).updateOne(
                { username: req.username },
                { $set: { [infoType]: newValue } },
                { upsert: true }
            );
        }
        */
        // Send the updated information back
        res.send({ username: req.username, [infoType]: newValue });

    } catch (err) {
        console.error(`Database error during set ${infoType}`, err);
        res.status(500).send({ error: 'Internal server error' });
    }
}

async function getUserInfo(req, res, infoType) {
    const username = req.params.user;
    const db = getDB();
    const collectionName = (infoType === 'headline' || infoType === 'avatar') ? 'profiles' : 'users';

    try {
        if (username) {
            let user = await db.collection('users').findOne({ username: username });
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }

            const response = { username: user.username };
            // headline and avatar store in profile
            user = await db.collection(collectionName).findOne({ username: user.username });
            
            // Construct the response object dynamically
            response[infoType] = user[infoType];
            res.send(response);
        } else {
            const users = await db.collection(collectionName).find({}).toArray();
            // Map the results to include only the username and the requested info
            const allInfo = users.map(user => ({
                username: user.username,
                [infoType]: user[infoType]
            }));
            res.send(allInfo);
        }

    } catch (err) {
        console.error(`Database error during get ${infoType}`, err);
        res.status(500).send({ error: 'Internal server error' });
    }
}

const getHeadline = (req, res) => getUserInfo(req, res, 'headline');
const getAvatar = (req, res) => getUserInfo(req, res, 'avatar');
const getEmail = (req, res) => getUserInfo(req, res, 'email');
const getZipcode = (req, res) => getUserInfo(req, res, 'zipcode');
const getDob = (req, res) => getUserInfo(req, res, 'dob');
const getPhone = (req, res) => getUserInfo(req, res, 'phone');

const setHeadline = (req, res) => setUserInfo(req, res, 'headline');
const setAvatar = (req, res) => setUserInfo(req, res, 'avatar');
const setEmail = (req, res) => setUserInfo(req, res, 'email');
const setZipcode = (req, res) => setUserInfo(req, res, 'zipcode');
const setPhone = (req, res) => setUserInfo(req, res, 'phone');

const profileFunctions = {
    getUserInfo,
    setUserInfo
};

function setupRoutes(app) {
    app.get('/headline/:user?', getHeadline)
    app.put('/headline', setHeadline)
    app.get('/avatar/:user?', getAvatar)
    app.put('/avatar', setAvatar)
    app.get('/email/:user?', getEmail)
    app.put('/email', setEmail)
    app.get('/zipcode/:user?', getZipcode)
    app.put('/zipcode', setZipcode)
    app.get('/dob/:user?', getDob)
    app.get('/phone/:user?', getPhone)
    app.put('/phone', setPhone)
}

module.exports = {
    profileFunctions,
    setupRoutes
};