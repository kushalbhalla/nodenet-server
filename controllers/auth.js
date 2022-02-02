const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')

const User = require('../models/User');

//register a user
exports.register = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    bcrypt
        .hash(password, 12)
        .then(hashPw => {
            const user = new User({
                email: email,
                password: hashPw,
                username: username,
                profilePicture: ""
            });
            return user.save();
        })
        .then(result => {
            const { password, ...other} = result._doc;
            res.status(201).json({loadedUser: other});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

//login a user
exports.login = (req, res, next) => {
    const email = req.body.email;
    const userPassword = req.body.password;
    let loadedUser;
    User.findOne({email: email})
        .then(user => {
            if(!user) {
                const error = new Error('A user with this email could not be found');
                error.statusCode = 401;
                throw error;
            }
            const {password, ...other} = user._doc
            loadedUser = other;
            return bcrypt.compare(userPassword, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password!');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign(
                {
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                'secretkey',
                { expiresIn: '2h'}
            );
            res.status(200).json({loadedUser, token});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}