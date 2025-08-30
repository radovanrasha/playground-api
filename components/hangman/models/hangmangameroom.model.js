const mongoose = require("mongoose");
const roundSchema = require("./hangmanround.model");

const Schema = mongoose.Schema;

const hangmanGameRoomSchema = new Schema(
  {
    title: { type: String },
    password: { type: String },
    nextTurn: { type: String, enum: ["playerOne", "playerTwo"] },

    playerOneScore: { type: Number, default: 0 },
    playerTwoScore: { type: Number, default: 0 },

    roundNumber: { type: Number, default: 1 },

    rounds: [roundSchema],

    status: {
      type: String,
      enum: ["initialized", "ongoing", "finished", "canceled"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HangmanGameRoom", hangmanGameRoomSchema);
