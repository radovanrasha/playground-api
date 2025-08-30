const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roundSchema = new Schema({
  roundNumber: { type: Number, required: true },

  termSetter: { type: String, required: true },

  term: { type: [String], default: [] },

  maskedTerm: { type: [String], default: [] },

  guesses: { type: [String], default: [] },

  missed: { type: Number, default: 0 },

  incorrectGuesses: { type: [String], default: [] },

  status: {
    type: String,
    enum: ["choosing_term", "in_progress", "ended"],
    default: "choosing_term",
  },
});

module.exports = roundSchema;
