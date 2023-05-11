const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

// Load User model
const User = require("../../models/User");
const Order = require("../../models/Order");

// @route   POST api/users/signup
// @desc    Register user
// @access  Public
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;

  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  // Check for existing user
  User.findOne({ email }).then((user) => {
    if (user) return res.status(400).json({ msg: "User already exists" });

    const newUser = new User({
      name,
      email,
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
