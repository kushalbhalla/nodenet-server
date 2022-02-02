const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');
const ObjectId = require('mongoose').Types.ObjectId;
const Post = require('../models/Post');
const User = require('../models/User');

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    const description = req.body.description;
    const imgUrl = req.file.path;
    let creator;
    const post = Post({
        description: description,
        imgUrl: imgUrl,
        creator: ObjectId(req.userId)
    });
    post.save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            creator = user;
            user.posts.push(post);
            user.save();

            const {posts, ...other} = user._doc;
            return posts
        })
        .then(result => {
            res.status(201).json(result);
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};


//update a post
exports.updatePost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(req.params.id)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }

            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized!');
                error.statusCode = 403;
                throw error;
            }

            let description = req.body.description;
            let imgUrl;
            if (!req.file) {
                if (req.body.imageUrl !== post.imgUrl) {
                    const error = new Error('No image provided.');
                    error.statusCode = 422;
                    throw error;
                } else {
                    imgUrl = req.body.imageUrl;
                }
            } else {
                imgUrl = req.file.path;
                if ( imgUrl !== post.imgUrl) {
                    clearImage(post.imgUrl);
                }
            }
            post.description = description;
            post.imgUrl = imgUrl;
            return post.save();
        })
        .then(result => {
            return User.findById(result.creator);
        })
        .then(user => {
            const {posts, ...other} = user._doc;
            res.status(200).json(posts);
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

// delete post
exports.deletePost = (req, res, next) => {
  const postId = req.params.id;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      return User.findById(result.creator);
    })
    .then(user => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(user => {
      res.status(200).json(user.posts);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//like a post
exports.likePost = (req, res, next) => {
    Post.findById(req.params.id)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            if (!post.likes.includes(req.userId)) {
                post.likes.push(req.userId);
                return post.save();
            } else {
                post.likes.pull(req.userId);
                return post.save();
            }
        })
        .then(result => {
            res.status(201).json(result);
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

//get a post
exports.getPost = (req, res, next) => {
    Post.findById(req.params.id)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }

            return User.findById(post.creator)
                .then(userData => {
                    const {username, _id, profilePicture, ...other } = userData._doc;
                    const user = {_id, username, profilePicture};
                    return {user, post}
                })
        })
        .then(postData => {
            res.status(200).json(postData);
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

//get user posts
exports.getUserPosts = (req, res, next) => {
    let userInfos;
    User.findById(req.userId)
        .then(user => {
            const {email, posts, password, followers, followings, createdAt, updatedAt, ...userInfo} = user._doc;
            userInfos = userInfo;
            return Post.find({
                '_id': {$in: posts}
            });
        })
        .then(result => {
            res.status(200).json(result);
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

//het timeline post
exports.getTimelinePost = (req, res, next) => {
    let userPosts = [];
    let userData;
    let followingsList;
    let friendsPosts;
    let creatorList = [];
    let friendsFinal = [];
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                    const error = new Error('User not found.');
                    error.statusCode = 404;
                    throw error;
                }
            const { followings, username, _id, profilePicture, ...other} = user._doc;
            followingsList = followings;
            userData = {
                _id: _id.toString(),
                username: username,
                profilePicture: profilePicture,
            }
            return Post.find({ creator: user._id});
        })
        .then(posts => {
            posts.forEach(post => {
                userPosts.push({
                    user: userData,
                    post: post
                });
            });
            return Post.find({
                'creator': followingsList
            });
            
        })
        .then(result => {
            result = result.filter(function(value, index, arr){ 
                return value != null;
            });
            result.forEach(post => {
                creatorList.push(post.creator.toString());
            });
            friendsPosts = result
            return User.find({
                '_id': creatorList
            });
        })
        .then(users => {
            friendsPosts.forEach(post=> {
                users.forEach(user => {
                    if (post.creator.toString() === user._id.toString()) {
                        const {username, _id, profilePicture, ...other} = user._doc;
                        friendsFinal.push({
                            user : {
                                _id : _id,
                                username : username,
                                profilePicture: profilePicture,
                            },
                            post: post
                        });
                    }
                })
            }) 
            res.status(200).json(userPosts.concat(...friendsFinal));
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};