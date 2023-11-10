const { login, logout, register } = require('../auth').authFunctions;

let cookieKey = "sid";

jest.mock('./db', () => {
  const md5 = require('md5');

  return {
    getDB: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn().mockImplementation((query) => {
          if (query.username === 'user') {
            return Promise.resolve({
              username: 'user',
              salt: 'randomSalt',
              hash: md5('randomSalt' + 'password')
            });
          }
          return Promise.resolve(null);
        }),
        insertOne: jest.fn().mockResolvedValue({ insertedId: '1' })
      })
    })
  };
});


describe('Authentication', () => {

  it('should register a user', async () => {
    const req = {
      body:{
        username: 'user1',
        email: 'foo1@bar.com',
        dob: '01/01/2000',
        phone: '123-456-7890',
        zipcode: '12345',
        password: 'password1'
      }
    };
    const res = {
      send: jest.fn()
    };

    await register(req, res);

    expect(res.send).toHaveBeenCalledWith({ username: 'user1', result: 'success' });
  });

  it('should login a user with correct credentials', async () => {
    const req = {
      body: {
        username: 'user',
        password: 'password'
      }
    };
    const res = {
      cookie: jest.fn(),
      send: jest.fn(),
      sendStatus: jest.fn()
    };

    await login(req, res);

    expect(res.cookie).toHaveBeenCalledWith(cookieKey, expect.any(String), expect.objectContaining({ httpOnly: true }));
    expect(res.send).toHaveBeenCalledWith({ username: 'user', result: 'success' });
  });

  it('should logout a user', async () => {
    const req = {
      username: 'user'
    };
    const res = {
      cookie: jest.fn(),
      send: jest.fn()
    };

    await logout(req, res);

    expect(res.cookie).toHaveBeenCalledWith("sid", "", expect.objectContaining({ maxAge: 0 }));
    expect(res.send).toHaveBeenCalledWith('OK');
  });

});
