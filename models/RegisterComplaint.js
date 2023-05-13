const mongoose = require("mongoose");

const registerComplaintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  complaint: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const registerComplaint = mongoose.model(
  "registerComplaint",
  registerComplaintSchema
);

module.exports = registerComplaint;
