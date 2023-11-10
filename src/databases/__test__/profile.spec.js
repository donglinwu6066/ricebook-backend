const { getUserInfo, setUserInfo } = require('../profile').profileFunctions;

jest.mock('./db', () => ({
    getDB: jest.fn(() => ({
        collection: jest.fn((name) => ({
            findOne: jest.fn().mockImplementation((query) => {
                // Mock database
                if (name === 'profiles' && query.username === 'user') {
                    return Promise.resolve({ username: 'user', headline: 'Test headline' }); 
                } else if (name === 'users' && query.username === 'user') {
                    return Promise.resolve({ username: 'user'}); 
                }
                return Promise.resolve(null);
            }),
            find: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([
                  { username: 'user1', headline: 'Headline of user1' },
                  { username: 'user2', headline: 'Headline of user2' },
                  { username: 'user3', headline: 'Headline of user3' }
                ])
              }),
            updateOne: jest.fn(() => Promise.resolve({ modifiedCount: 1 })), // Simulate successful update
            insertOne: jest.fn(() => Promise.resolve({ insertedId: '1' })), // Simulate successful insert
        }))
    }))
}));

describe('Profile', () => {
    it('should get all headlines', async () => {
        // Mock Express' req and res objects
        const req = {
            params: {},
            username: 'user'
        };
        const res = {
            send: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        // Call the getUserInfo function with 'headline' as infoType
        await getUserInfo(req, res, 'headline');

        // Assertions
        expect(res.send).toHaveBeenCalledWith([
            { username: 'user1', headline: 'Headline of user1' },
            { username: 'user2', headline: 'Headline of user2' },
            { username: 'user3', headline: 'Headline of user3' }
          ]);
        expect(res.status).not.toHaveBeenCalledWith(404);
    });

    it('should set the headline for a given user', async () => {
        // Mock Express' req and res objects
        const req = {
            params: { user: 'user' },
            username: 'user', // the username should be set as if by the isLoggedIn middleware
            body: { headline: 'New headline' } // the new headline value to set
        };
        const res = {
            send: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        // Call the setUserInfo function with 'headline' as infoType
        await setUserInfo(req, res, 'headline');

        // Assertions
        // Check if the database's updateOne function was called correctly
        expect(res.send).toHaveBeenCalledWith({ username: req.username, headline: req.body.headline });

        // Check if no error status was sent
        expect(res.status).not.toHaveBeenCalledWith(400);
        expect(res.status).not.toHaveBeenCalledWith(404);
        expect(res.status).not.toHaveBeenCalledWith(500);
    });
});