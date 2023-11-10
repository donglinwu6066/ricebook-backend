const md5 = require('md5');
const { getDB } = require('./db');
const { User } = require('./dataType');

let sessionUser = {};
let cookieKey = "sid";

// next is the argument for middleware function
// next could be named anything, 
// but following the convention is better
function isLoggedIn(req, res, next) {
    // likely didn't install cookie parser
    if (!req.cookies) {
        return res.sendStatus(401);
    }

    let sid = req.cookies[cookieKey];

    // no sid for cookie key
    if (!sid) {
        return res.sendStatus(401);
    }

    let username = sessionUser[sid];

    // no username mapped to sid
    if (username) {
        req.username = username;
        next();
    }
    else {
        return res.sendStatus(401)
    }
}

async function login(req, res) {
    let username = req.body.username;
    let password = req.body.password;

    // supply username and password
    if (!username || !password) {
        return res.sendStatus(400); // Bad Request
    }

    // Fetch user from the database
    try {
        const db = getDB(); // Make sure getDB() is a synchronous function or awaited if it returns a Promise
        const user = await db.collection('users').findOne({ username: username });

        if (!user) {
            // No user found with that username
            return res.sendStatus(401); // Unauthorized
        }

        // Create hash using md5, user salt and request password, check if hash matches user hash
        let hash = md5(user.salt + password);

        if (hash === user.hash) {
            // Create session id, use sessionUser to map sid to user username 
            let sid = md5(new Date().getTime() + username);
            sessionUser[sid] = username;

            // Adding cookie for session id
            res.cookie(cookieKey, sid, { maxAge: 3600 * 1000, httpOnly: true });
            res.send({ username: username, result: 'success' });
        } else {
            // Password does not match
            res.sendStatus(401); // Unauthorized
        }
    } catch (err) {
        console.error('Database error during login:', err);
        res.status(500).send({ error: 'Internal server error' }); // Server error
    }
}


function logout(req, res) {
    // Setting cookie expired for session id
    res.cookie(cookieKey, '', { maxAge: 0, httpOnly: true });
    res.send('OK');
}

async function register(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let info = req.body;

    // Supply username and password
    if (!username || !password) {
        return res.sendStatus(400);
    }

    let salt = username + new Date().getTime();
        let hash = md5(salt + password);

    // Insert user into the database
    try {
        const newUser = new User({
            username: username,
            salt: salt,
            hash: hash,
            email: info.email,
            dob: info.dob,
            phone: info.phone,
            zipcode: info.zipcode
        });

        const db = getDB();
        const userExists = await db.collection('users').findOne({ username: username });
        if (userExists) {
            console.log(`User ${username} exists`);
            return res.status(409).send({ error: 'User already exists' });
        }

        await db.collection('users').insertOne(newUser);
        res.send({ username: username, result: 'success' });

    } catch (err) {
        console.error('Database insert error:', err);
        return res.status(500).send({ error: 'Internal server error' });
    }
}

function setupRoutes(app) {
    app.post('/login', login);
    app.post('/register', register);
    app.put('/logout', logout);
    
    // load middleware
    app.use(isLoggedIn);
}

const authFunctions = {
    login,
    logout,
    register
};

module.exports = {
    setupRoutes,
    authFunctions
};