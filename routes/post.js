const router = require("express").Router();
const postController = require('../controllers/post');
const isAuth = require('../middleware/is-auth');

//create a post
router.post(
    '/add', 
    isAuth,
    postController.createPost
);

//update a post
router.put(
    '/update/:id', 
    isAuth,
    postController.updatePost
);

//delete a post
router.delete(
    '/delete/:id', 
    isAuth,
    postController.deletePost
);

//like post
router.put(
    '/like/:id', 
    isAuth,
    postController.likePost
);

//get a post
router.get(
    "/view/:id", 
    isAuth,
    postController.getPost
);

//get all post
router.get(
    "/all", 
    isAuth,
    postController.getUserPosts
);

//get timeline post
router.get(
    "/timeline",
    isAuth,
    postController.getTimelinePost
);

module.exports = router;