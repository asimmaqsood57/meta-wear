const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

// Load User model
const User = require("../../models/User");
const Order = require("../../models/Order");
const ContactForm = require("../../models/ContactForm");
const RegisterComplaint = require("../../models/RegisterComplaint");
const Review = require("../../models/Review");

// @route   POST api/users/signup
// @desc    Register user
// @access  Public
router.post("/signup", (req, res) => {
  const { name, email, password, phone, address, city } = req.body;

  // Simple validation
  if (!name || !email || !password || !phone || !address || !city) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  // Check for existing user
  User.findOne({ email }).then((user) => {
    if (user) return res.status(400).json({ msg: "User already exists" });

    const newUser = new User({
      name,
      email,
      phone,
      address,
      city,
      password,
    });

    // Create salt & hash
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser.save().then((user) => {
          res.json({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          });
        });
      });
    });
  });
});

router.put("/users/:userId", (req, res) => {
  const userId = req.params.userId;

  User.findByIdAndUpdate(userId, req.body, { new: true })
    .exec()
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      res.send(err);
    });
});

// POST /api/users/change-password
router.post("/change-password/:userId", async (req, res) => {
  const userId = req.params.userId;
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(user, user._id);
    // Compare the old password with the stored password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    console.log(isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Old password is incorrect" });
    }

    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    console.log(hash);
    user.password = hash;
    console.log(user.password, "saved");

    user.save().then((user) => {
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).then((user) => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ email: "User not found" });
    }

    // Check password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // Create JWT Payload
        const payload = { id: user.id, email: user.email };

        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: token,
              userId: user.id,
            });
          }
        );
      } else {
        return res.status(400).json({ password: "Password incorrect" });
      }
    });
  });
});

// POST route to save a new contact form submission
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const newFormSubmission = new ContactForm({
      name: name,
      email: email,
      message: message,
    });

    await newFormSubmission.save();

    return res.status(200).json({ message: "Form submitted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
// POST route to save a new contact form submission
router.post("/register-complaint", async (req, res) => {
  try {
    const { name, email, complaint } = req.body;

    const newFormSubmission = new RegisterComplaint({
      name: name,
      email: email,
      complaint: complaint,
    });

    await newFormSubmission.save();

    return res.status(200).json({ message: "Form submitted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// // Get all orders for a user
// router.get("/orders/:userId", (req, res) => {
//   Order.find({ user_id: req.params.userId }, (err, orders) => {
//     if (err) {
//       res.send(err);
//     } else {
//       res.json(orders);
//     }
//   });
// });

// Create a new order
router.post("/orders", (req, res) => {
  const order = new Order(req.body);
  order
    .save()
    .then(() => {
      res.json({ message: "Order created successfully!" });
    })
    .catch((err) => {
      res.send(err);
    });
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});
// POST route to save a new review form submission
router.post("/review", async (req, res) => {
  try {
    const { username, email, comment } = req.body;

    const newReview = new Review({
      username: username,
      email: email,
      comment: comment,
    });

    await newReview.save();

    return res.status(200).json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:userId", (req, res) => {
  const userId = req.params.userId;
  console.log(userId);
  Order.find({ user: userId })
    .exec()
    .then((orders) => {
      res.json(orders);
    })
    .catch((err) => {
      res.send(err);
    });
});

// Protected route
router.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
    });
  }
);

module.exports = router;
