const { getDB } = require('./db');
const { ObjectId } = require('mongodb');

async function getArticles(req, res) {
    const articleId = req.params.id;
    const db = getDB();

    try {
        if (articleId) {
            // Convert the string ID to a MongoDB ObjectId
            const article = await db.collection('articles').findOne({ _id: new ObjectId(articleId) });

            if (!article) {
                return res.status(404).send({ error: 'Article not found' });
            }
            res.send(article);
        } else {
            // If no article ID is provided, retrieve all articles
            const articles = await db.collection('articles').find({}).toArray();
            res.send(articles);
        }
    } catch (err) {
        // If there is an error casting the articleId to an ObjectId, it will be caught here
        console.error('Database error during get articles:', err);
        res.status(err.statusCode || 500).send({ error: 'Internal server error' });
    }
}

async function setArticles(req, res) {
    const loggedInUser = req.username;
    const articleId = req.params.id;
    const { text, commentId } = req.body;

    if (!text) {
        return res.status(400).send({ error: 'Text is required' });
    }

    const db = getDB();

    try {
        // Find the article by ID
        const article = await db.collection('articles').findOne({ _id: new ObjectId(articleId) });

        // If no article is found or the user does not own the article
        if (!article || article.author !== loggedInUser) {
            return res.status(403).send({ error: 'No such article found or user does not own the article' });
        }

        if (commentId === undefined) {
            // Update the article text if commentId is not supplied
            const result = await db.collection('articles').updateOne(
                { _id: new ObjectId(articleId) },
                { $set: { text: text } }
            );
            
            // This causes error if the new post equal to old post
            // if (result.modifiedCount === 0) {
            //    throw new Error('Article update failed');
            // }
        } else if (commentId === "-1") {
            // Add a new comment
            const newComment = {
                author: loggedInUser,
                text: text,
                date: new Date()
            };
            const result = await db.collection('articles').updateOne(
                { _id: new ObjectId(articleId) },
                { $push: { comments: newComment } }
            );

            if (result.modifiedCount === 0) {
                throw new Error('Adding new comment failed');
            }
        } else {
            // Update an existing comment
            // Construct the query to update the correct comment
            const commentUpdateQuery = {};
            commentUpdateQuery[`comments.${commentId}.text`] = text;

            const result = await db.collection('articles').updateOne(
                { _id: new ObjectId(articleId), [`comments.${commentId}.author`]: loggedInUser },
                { $set: commentUpdateQuery }
            );
            // This causes error if the new post equal to old post
            // if (result.modifiedCount === 0) {
            //     throw new Error('Comment update failed');
            // }
        }

        // Get the updated article
        const updatedArticle = await db.collection('articles').findOne({ _id: new ObjectId(articleId) });
        res.send({ articles: [updatedArticle] });

    } catch (err) {
        console.error('Database error during set articles:', err);
        res.status(err.statusCode || 500).send({ error: 'Internal server error' });
    }
}

async function addArticle(req, res) {
    const author = req.username;
    const text = req.body.text;

    // Validate the input
    if (!author || !text) {
        return res.status(400).send({ error: 'Author and text are required' });
    }

    const db = getDB();
    try {
        // Create a new article object
        const newArticle = {
            author: author,
            text: text,
            date: new Date(),
            comments: []
        };

        // Insert the new article into the database
        const result = await db.collection('articles').insertOne(newArticle);
        
        // If the insertion is successful, MongoDB will return an object with the insertedId
        if (result.insertedId) {
            res.status(201).send(newArticle);
        } else {
            throw new Error('Article insertion failed');
        }

    } catch (err) {
        console.error('Database error during add an article:', err);
        res.status(500).send({ error: 'Internal server error' });
    }
}

function setupRoutes(app) {
    app.get('/articles/:id?', getArticles);
    app.put('/articles/:id', setArticles);
    app.post('/article', addArticle);
}

const articlesFunctions = {
    getArticles,
    addArticle
};

module.exports = {
    setupRoutes,
    articlesFunctions
};