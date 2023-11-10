// This will be needed to simulate the MongoDB ObjectId
const { getArticles, addArticle } = require('../articles').articlesFunctions;
const validObjectId = ['507f191e810c19729de860ea', '507f191e810c19729de860eb', '507f191e810c19729de860ec', '507f191e810c19729de860ed'];

jest.mock('./db', () => {
    const { ObjectId } = require('mongodb');
    const validId = validObjectId;

    return {
        getDB: jest.fn(() => ({
            collection: jest.fn().mockReturnValue({
                findOne: jest.fn().mockImplementation((query) => {
                    // Use the valid mocked ObjectId string for comparison
                    if (query._id.equals(new ObjectId(validId[0]))) {
                        return Promise.resolve({
                            pid: validId[0],
                            author: 'user1',
                            text: 'Content 1',
                            date: new Date('2023-01-01'),
                            comments: []
                        });
                    }
                    return Promise.resolve(null);
                }),
                find: jest.fn().mockReturnValue({
                    toArray: jest.fn().mockResolvedValue([
                        // Ensure the pid fields contain valid ObjectId strings
                        { pid: validId[0], author: 'user1', text: 'Content 1', date: new Date('2023-01-01'), comments: [] },
                        { pid: validId[1], author: 'user2', text: 'Content 2', date: new Date('2023-01-02'), comments: [] },
                        { pid: validId[2], author: 'user3', text: 'Content 3', date: new Date('2023-01-03'), comments: [] },
                    ])
                }),
                insertOne: jest.fn().mockResolvedValue({ insertedId: validId[3] })
            })
        }))
    };
});


describe('Articles', () => {
    it('should add a new article', async () => {
        const req = {
            username: 'user1',
            body: {
                text: 'New article content' 
            }
        };
        const res = {
            send: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await addArticle(req, res);

        // Assertions
        expect(res.status).toHaveBeenCalledWith(201); 
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            author: 'user1',
            text: 'New article content',
            date: expect.any(Date),
            comments: []
        }));
    });

    it('should get all articles', async () => {
        const req = {
            params: {}
        };
        const res = {
            send: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await getArticles(req, res);

        expect(res.send).toHaveBeenCalledWith([
            { pid: validObjectId[0], author: 'user1', text: 'Content 1', date: new Date('2023-01-01'), comments: [] },
            { pid: validObjectId[1], author: 'user2', text: 'Content 2', date: new Date('2023-01-02'), comments: [] },
            { pid: validObjectId[2], author: 'user3', text: 'Content 3', date: new Date('2023-01-03'), comments: [] },
        ]);
        expect(res.status).not.toHaveBeenCalledWith(404);
        expect(res.status).not.toHaveBeenCalledWith(500);
    });

    it('should get a single article (by id)', async () => {
        // Use the valid ObjectId string for the articleId
        const validtId = validObjectId[0];
        const req = {
            params: { id: validtId },
        };
        const res = {
            send: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await getArticles(req, res);

        expect(res.send).toHaveBeenCalledWith({
            pid: validtId,
            author: 'user1',
            text: 'Content 1',
            date: expect.any(Date),
            comments: []
        });
        expect(res.status).not.toHaveBeenCalledWith(404);
        expect(res.status).not.toHaveBeenCalledWith(500);
    });
});
