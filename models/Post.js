const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
    {
    description: {
      type: String,
      max: 500,
      required: true
    },
    imgUrl: {
      type: String,
      required: true
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        default: []
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Post', postSchema)