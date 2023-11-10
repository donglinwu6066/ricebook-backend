const { ValidationUtility: ValUtil } = require('../utils');

class User {
    constructor({ username, salt, hash, email, dob, phone, zipcode }) {
        this.username = ValUtil.validateType(username, 'string');
        this.salt = ValUtil.validateType(salt, 'string');
        this.hash = ValUtil.validateType(hash, 'string');
        this.email = ValUtil.validateType(email, 'string');
        this.dob = ValUtil.validateType(dob, 'string');
        this.phone = ValUtil.validateType(phone, 'string');
        this.zipcode = ValUtil.validateType(zipcode, 'string');
    }
}

class Profile {
    constructor({ username, avatar, headline }) {
        this.username = ValUtil.validateType(username, 'string');
        this.avatar = ValUtil.validateType(avatar, 'string');
        this.headline = ValUtil.validateType(headline, 'string');
    }
}

class Article {
    constructor({ author, text, date, comments }) {
        this.author = ValUtil.validateType(author, 'string');
        this.text = ValUtil.validateType(text, 'string');
        this.date = ValUtil.validateDate(date);
        this.comments = ValUtil.validateArray(comments, Comment);
    }
}

class Comment {
    constructor({ author, text, date }) {
        this.author = ValUtil.validateType(author, 'string');
        this.text = ValUtil.validateType(text, 'string');
        this.date = ValUtil.validateDate(date);
    }
}

module.exports = {
    User,
    Profile,
    Article,
    Comment
};
