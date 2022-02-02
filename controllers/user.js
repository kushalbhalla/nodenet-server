const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const fs = require('fs');
const path = require('path');
const Post = require('../models/Post');

//update user
exports.updateUser = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            const username = req.body.username;
            const email = req.body.email;
            let profilePicture = req.body.profilePicture;
            const bio = req.body.bio;
            const phoneNumber = req.body.phoneNumber;
            if (req.file) {
                profilePicture = req.file.path;
            }
            if (!profilePicture) {
                const error = new Error('No file picked.');
                error.statusCode = 422;
                throw error;
            }
            if (profilePicture !== user.profilePicture && user.profilePicture !== '') {
                clearImage(user.profilePicture);
            }
            user.username = username;
            user.email = email;
            user.profilePicture = profilePicture;
            user.bio = bio;
            user.phoneNumber = phoneNumber;
            user.save()
            const {password, ...userDetails} = user._doc;
            return userDetails
        })
        .then(result => {
            res.status(200).json( result );  
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};


//delete user
exports.deleteUser = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            return User.findByIdAndRemove(req.userId);
        })
        .then(result => {
            res.status(200).json({ message: 'User deleted!' });  
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

//get a user
exports.getUser = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            const {password, ...other} = user._doc;
            return other
        })
        .then(user => {
            res.status(200).json(user);  
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

//search user
exports.searchUser = (req, res, next) => {
    const searchInput = req.params.name;
    User.find({'username': {$regex: searchInput}})
        .then(searchedResult => {
            if (searchedResult.length === 0) {
                return searchedResult;
            } else {
                searchedResult.forEach((searchedUser, index) => {
                    if (searchedUser._id.toString() === req.userId) {
                        searchedResult.splice(index, 1);
                        return searchedResult;
                    }
                });
                return searchedResult
            }
        })
        .then(searchedResult => {
            searchedResult.forEach((searchedUser, index) => {
                const { _id, username, profilePicture, ...other } =  searchedUser._doc;
                searchedResult[index] = {_id, username, profilePicture}
            })
            res.status(200).json(searchedResult);
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

// view a user and its posts
exports.getUserWithPosts = (req, res, next) => {
    let userData;
    User.findById(req.params.id)
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            const {username, _id, profilePicture, bio, followers, followings, posts, ...other} = user._doc;
            userData = {
                        _id : _id,
                        username : username,
                        profilePicture: profilePicture,
                        bio: bio,
                        followers: followers,
                        followings: followings,
                        posts: posts
                    };
            return userData;
        })
        .then(result => {
            return Post.find({
                'creator': result._id
            });
        })
        .then(posts => {
            res.status(200).json({user: userData, posts: posts});  
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.followUser = (req, res, next) => {
    let currentUser;
    if (req.userId !== req.params.id) {
        User.findById(req.userId)
            .then(user => {
                if (!user) {
                    const error = new Error('User not found.');
                    error.statusCode = 404;
                    throw error;
                }
                currentUser =  user;
                return User.findById(req.params.id);
            })
            .then(targetUser => {
                if (!targetUser) {
                    const error = new Error('User not found.');
                    error.statusCode = 404;
                    throw error;
                }
                if (!currentUser.followings.includes(req.params.id)) {
                    currentUser.followings.push(req.params.id);
                    targetUser.followers.push(req.userId);
                    currentUser.save();
                    targetUser.save();

                    const {password, followings, ...other} = currentUser._doc
                    res.status(200).json(followings);
                } else {
                    res.status(403).json("you allready follow this user");
                }
            })
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err);
            });
    } else {
        res.status(403).json("you cant follow yourself");
    }
};

//unfollow user
exports.unfollowUser = (req, res, next) => {
    let currentUser;
    if (req.userId !== req.params.id) {
        User.findById(req.userId)
            .then(user => {
                if (!user) {
                    const error = new Error('User not found.');
                    error.statusCode = 404;
                    throw error;
                }
                currentUser =  user;
                return User.findById(req.params.id);
            })
            .then(targetUser => {
                if (!targetUser) {
                    const error = new Error('User not found.');
                    error.statusCode = 404;
                    throw error;
                }
                if (currentUser.followings.includes(req.params.id)) {
                    currentUser.followings.pull(req.params.id);
                    targetUser.followers.pull(req.userId);
                    currentUser.save();
                    targetUser.save();
                    const {password, followings, ...other} = currentUser._doc
                    res.status(200).json(followings);
                } else {
                    res.status(403).json("you dont follow this user");
                }
            })
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err);
            });
    } else {
        res.status(403).json("you cant unfollow yourself");
    }
}

//suggestion of users
exports.suggestUser = (req, res, next) => {
    let userList;
    User.findById(req.userId)
        .then(user => {
            if(!user) {
                const error = new Error('User not found.');
                    error.statusCode = 404;
                    throw error;
            }
            const { followings, ...other} = user._doc;
            followings.push(user._id);
            userList =  followings; 
            return User.find().limit(10);
        })
        .then(users => {
            const newUsers = [];
            users.forEach( (user) => {
                if (!userList.includes(user._id)) {
                    const { _id, username, profilePicture, ...other } =  user._doc;
                    newUsers.push({
                        _id: _id,
                        username: username,
                        profilePicture: profilePicture
                    });
                }
            });
            res.status(200).json(newUsers.slice(0,6));
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}


//get followers lists
exports.followers = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            if(!user) {
                const error = new Error('User not found.');
                    error.statusCode = 404;
                    throw error;
            }
            const { followers, ...other} = user._doc;
            return followers
        })
        .then(followersList => {
            return User.find({
                '_id': followersList
            })
            .then(users => {
                const newUsers = [];
                users.forEach( (user) => {
                    const { _id, username, profilePicture, ...other } =  user._doc;
                    newUsers.push({
                        _id: _id,
                        username: username,
                        profilePicture: profilePicture
                    });
                });
                return newUsers;
            })
        })
        .then(resData => {
            res.status(200).json(resData.slice(0,6));
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

//get followers lists
exports.followings = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            if(!user) {
                const error = new Error('User not found.');
                    error.statusCode = 404;
                    throw error;
            }
            const { followings, ...other} = user._doc;
            return followings
        })
        .then(followingsList => {
            return User.find({
                '_id': followingsList
            })
            .then(users => {
                const newUsers = [];
                users.forEach( (user) => {
                    const { _id, username, profilePicture, ...other } =  user._doc;
                    newUsers.push({
                        _id: _id,
                        username: username,
                        profilePicture: profilePicture
                    });
                });
                return newUsers;
            })
        })
        .then(resData => {
            res.status(200).json(resData.slice(0,6));
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};
