const express = require("express");
const app = express();

const port = process.env.PORT || 3000;
const cors = require("cors");
const corsOptions = {
  origin: [process.env.FRONTEND_URL],
};
app.use(cors(corsOptions));
const mongoose = require("mongoose");
const Product = require("./module/productmodel.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const ApiFteature = require("./utils/feature.js");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const User = require("./module/user.js");
const userRoutes = require("./routes/userRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const paymentRoutes = require("./routes/paymentRoute.js");
const Order = require("./module/ordermodel.js");
const cloudinary = require("cloudinary");

const { isAuthenticated, authorizeRoles } = require("./middleware/authen.js");

//handling uncaught expection

process.on("uncaughtException", (err) => {
  console.log(`Error:${err.message}`);
  console.log(`Shutting down the server due to handling uncaught exception`);

  process.exit(1);
});

app.use(express.json()); //middleware to pass json bodies
app.use(cookieParser()); //use  cookie parser

//secrect key

process.env.JWT_SECRET = "gshekdewdwededknbeld3edjoend";
process.env.JWT_EXPIRE = "5d";
process.env.COOKIE_EXPIRE = "5";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json({ limit: "500mb" })); // Set limit to 50MB or any size you need
app.use(express.urlencoded({ limit: "500mb", extended: true }));

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("connected to DB");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit with failure code
  }
}

main();

// use user routes ,login route,logout route
app.use("/api/users", userRoutes);
app.use("/api/users", orderRoutes);
app.use("/api/users", paymentRoutes);

//create product  admin

app.post(
  "/api/admin/product/new",
  isAuthenticated,
  authorizeRoles("admin"),
  wrapAsync(async (req, res, next) => {
    let images = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;

    req.body.user = req.user.id;
    const product = await Product.create(req.body);
    return res.status(201).send(product);
  })
);

//GET all  product
app.get(
  "/api/products",
  wrapAsync(async (req, res, next) => {
    const resultPerPage = 8;
    const productCount = await Product.countDocuments();
    const apiFeature = new ApiFteature(Product.find(), req.query)
      .search()
      .filter()
      .pagination(resultPerPage);
    const products = await apiFeature.query;
    return res.status(200).send({ products, productCount, resultPerPage });
  })
);

//GET all  product admin
app.get(
  "/api/admin/products",
  isAuthenticated,
  wrapAsync(async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      products,
    });
  })
);

//GET PRODUCT DETAIL
app.get(
  "/api/product/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;

    let product = await Product.findById(id);
    if (!product) {
      return next(new ExpressError("product not found", 404));
    }

    return res.status(200).send(product);
  })
);
//update product   admin

app.put(
  "/api/admin/product/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  wrapAsync(async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      let product = await Product.findById(id);
      if (!product) {
        return next(new ExpressError("product not found", 404));
      }

      // Images Start Here
      let images = [];

      if (typeof req.body.images === "string") {
        images.push(req.body.images);
      } else {
        images = req.body.images;
      }

      if (images !== undefined) {
        // Deleting Images From Cloudinary
        for (let i = 0; i < product.images.length; i++) {
          await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
          });

          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }

        req.body.images = imagesLinks;
      }

      product = await Product.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      });

      return res.status(200).send(product);
    } catch (error) {
      console.error(error); // Log the validation or other errors
      return next(error);
    }
  })
);

// delete route  ADMIN
app.delete(
  "/api/admin/product/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    try {
      let product = await Product.findById(id);
      if (!product) {
        return next(new ExpressError("product not found", 404));
      }

      //deleting image from cloudaniary
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }

      await product.deleteOne();
      return res.status(200).json({ message: "product deleted scuessfully" });
    } catch (error) {
      return next(new ExpressError("Internal Server Error", 500));
    }
  })
);
//create new review  or update riview
app.put(
  "/api/review",
  isAuthenticated,
  wrapAsync(async (req, res, next) => {
    const { rating, comment, productId } = req.body;
    if (!productId) {
      return next(new ExpressError("Product ID is required", 400));
    }
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };
    //get the product thought productId
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ExpressError("Product not found", 404));
    }
    //`product model review
    const isReviewed = product.reviews.find(
      (rev) => rev.user.toString() === req.user._id
    );
    console.log(isReviewed);
    //cond
    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() === req.user._id.toString())
          (rev.rating = rating), (rev.comment = comment);
      });
    }
    //not give the review push the review
    else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
    //all reviews total
    let avg = 0;
    product.reviews.forEach((rev) => {
      avg += rev.rating;
    });

    product.ratings = avg / product.reviews.length;
    await product.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
      product,
    });
  })
);
//product review for single product
app.get(
  "/api/reviews",
  wrapAsync(async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    if (!product) {
      return next(new ExpressError("Product not found", 404));
    }

    res.status(200).json({
      success: true,
      review: product.reviews,
    });
  })
);

//delete review
app.get(
  "/api/reviews",
  isAuthenticated,
  wrapAsync(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
      return next(new ExpressError("Product not found", 404));
    }
    const reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== req.query.id.toString()
    );
    let avg = 0;
    reviews.forEach((rev) => {
      avg += rev.rating;
    });
    const numOfReviews = reviews.length;
    const ratings = avg / reviews.length || 0;
    await product.findByIdAndUpdate(
      req.query._productId,
      {
        reviews,
        ratings,
        numOfReviews,
      },
      {
        num: true,
        runValidators: true,
        useFindModify: false,
      }
    );
    res.status(200).json({
      success: true,
      review: reviews,
    });
  })
);

// express error
// Express error
app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
  let { statuscode, message } = err;
  statuscode = statuscode || 500;
  message = message || "Something went wrong";

  // Handle wrong MongoDB ID error
  if (err.name === "CastError") {
    message = `Resource not found. Invalid: ${err.path}`;
    statuscode = 400;
  }

  return res.status(statuscode).send(message);
});

const server = app.listen(port, () => {
  console.log(`Server at  http://localhost:${port}`);
});

// handling unhandeld promise rejections

process.on("unhandledRejection", (err) => {
  console.log(`Error:${err.message}`);
  console.log(`shutting down the server due to unhandled promise rejection`);
  server.close(() => {
    process.exit(1);
  });
});
