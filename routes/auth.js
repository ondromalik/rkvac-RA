var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');

var userDB = {
    user: [
        {
            _id: 1,
            username: 'admin',
            password: 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg='
        },
        {
            _id: 2,
            username: 'steve',
            password: '588+9PF8OZmpTyxvYS6KiI5bECaHjk4ZOYsjvTjsIho='
        }
    ]
};

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    return sha256.update(password).digest('base64');
}

// Register a login strategy
passport.use('login', new LocalStrategy(
    function (username, password, done) {
        let hashedPassword = getHashedPassword(password);
        let userFound = false;
        for (user of userDB.user) {
            if (user.username === username) {
                if (user.password === hashedPassword) {
                    return done(null, user);
                } else {
                    done(null, false, {message: 'Invalid password'});
                }
                userFound = true;
            }
        }
        if (!userFound) {
            done(null, false, {message: 'Invalid username'});
        }

    }
));

// Required for storing user info into session
passport.serializeUser(function (user, done) {
    done(null, user._id);
});

// Required for retrieving user from session
passport.deserializeUser(function (id, done) {
    // The user should be queried against db
    // using the id
    done(null, user);
});

module.exports = passport;