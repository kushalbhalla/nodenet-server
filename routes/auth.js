const express = require('express')
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/User');

const router = express.Router();

//register
router.post(
    '/register',
    [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('E-Mail address already exists!');
          }
        });
      })
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min: 5 }),
    body('username')
      .trim()
      .not()
      .isEmpty()
  ],
  authController.register
);

//login
router.post('/login', authController.login);


module.exports = router