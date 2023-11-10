const { getDB } = require('./db');

async function getFollowing(req, res) {
    const username = req.params.user;
    const db = getDB();

    try {
        if (username) {
            const user = await db.collection('connections').findOne({ username: username });
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }

            res.send({ username: user.username, following: user.following });
        } else {
            const users = await db.collection('connections').find({}).toArray();
            // Map the results to include only the username and the requested info
            const allFollowing = users.map(user => ({
                username: user.username,
                following: user['following']
            }));
            res.send(allFollowing);
        }
    } catch (err) {
        console.error(`Database error during get following`, err);
        res.status(500).send({ error: 'Internal server error' });
    }
}
async function updateFollowing(req, res, infoType) {
    const requestingUser = req.username; 
    const targetUser = req.params.user;

    if (!requestingUser || !targetUser) {
        return res.status(400).send({ error: 'Both users must be specified' });
    }

    const db = getDB();

    try {
        // Ensure the target user exists
        const targetExists = await db.collection('users').findOne({ username: targetUser });
        if (!targetExists) {
            return res.status(404).send({ error: `${targetUser} does not exist` });
        }

        // Determine the update operation based on infoType
        let updateOperation;
        if (infoType === 'add') {
            updateOperation = { $addToSet: { following: targetUser } }; // Ensures no duplicates
        } else if (infoType === 'delete') {
            updateOperation = { $pull: { following: targetUser } }; // Removes the user
        } else {
            return res.status(400).send({ error: 'Invalid operation' });
        }

        // Perform the update operation
        const result = await db.collection('connections').updateOne(
            { username: requestingUser },
            updateOperation,
            { upsert: true } // Inserts a document if the user doesn't exist
        );

        //if (result.modifiedCount === 0 && result.upsertedCount === 0) {
        //    throw new Error(`User following update failed: ${infoType}`);
        //}

        // Get the updated list of users that the requesting user is following
        const updatedRequester = await db.collection('connections').findOne({ username: requestingUser });
        res.send({ username: requestingUser, following: updatedRequester.following });

    } catch (err) {
        console.error(`Database error during ${infoType} following:`, err);
        res.status(500).send({ error: 'Internal server error' });
    }
}

const addFollowing = (req, res) => updateFollowing(req, res, 'add');
const deleteFollowing = (req, res) => updateFollowing(req, res, 'delete');


function setupRoutes(app) {
    app.get('/following/:user?', getFollowing)
    app.put('/following/:user', addFollowing)
    app.delete('/following/:user', deleteFollowing)
}

module.exports = {
    setupRoutes
};