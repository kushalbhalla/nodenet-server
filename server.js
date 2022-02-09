//importing modules
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

//importing routes
const userRoutes = require("./routes/user"); 
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/post");

const app = express();
const port = process.env.PORT || 8080;
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json());

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));
// app.use("/", express.static(path.join(__dirname, "angular")));

//middleware
app.use(express.json());
app.use(cors());

//app.use((req, res, next) => {
//  res.setHeader('Access-Control-Allow-Origin', '*');
//  res.setHeader(
//    'Access-Control-Allow-Methods',
//    'GET, POST, PUT, PATCH, DELETE'
//  );
//  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
//   res.setHeader('Access-Control-Allow-Credentials', true);
//  next();
//});

//routes
app.use("/api/user/", userRoutes);
app.use("/api/auth/", authRoutes);
app.use("/api/post/", postRoutes);
// app.use((req, res, next) => {
//   res.sendFile(path.join(__dirname, "angular", "index.html"));
// });



// error handlig
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
    .connect(
        'mongodb+srv://kushal:kushal@cluster0.cn3d6.mongodb.net/nodenet?retryWrites=true&w=majority'
    )
    .then(result => {
        app.listen(port, () => {
            console.log("sever running");
        });
    })
    .catch( err => {
        console.log(err);
    });
