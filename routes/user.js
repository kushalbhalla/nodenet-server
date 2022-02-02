const express = require('express');
const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

//update user
router.put(
    "/update", 
    isAuth,
    userController.updateUser
);

//delete user
router.delete(
    "/delete",
    isAuth, 
    userController.deleteUser)
;

//get a user
router.get(
    "/get",    
    isAuth,
    userController.getUser
);

//search a user 
router.get(
    "/search/:name",
    isAuth,
    userController.searchUser
);

// view a user with its posts
router.get(
    "/view/:id",
    isAuth,
    userController.getUserWithPosts
);

//follow a user
router.put(
    "/follow/:id",
    isAuth,
    userController.followUser
);

//unfollow a user
router.put(
    "/unfollow/:id",
    isAuth,
    userController.unfollowUser
);

//user suggetions
router.get(
    "/suggestion",
    isAuth,
    userController.suggestUser
);

// get followers
router.get(
    "/followers", 
    isAuth,
    userController.followers
);

// get followings
router.get(
    "/followings",
    isAuth,
    userController.followings
);

module.exports = router