const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please Enter product Name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "please Enter product description"],
  },
  price: {
    type: Number,
    required: [true, "please Enter product Price"],
    maxLength: [8, "price cannot exceed 8 character"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: [
    {
      public_id: {
        type: String,
        // required:true
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, "please Enter product Category "],
  },
  Stoke: {
    type: Number,
    required: [true, "please Enter product Stoke"],
    maxLength: [4, "stoke cannot exceed 4 character"],
    default: 1,
  },

  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
