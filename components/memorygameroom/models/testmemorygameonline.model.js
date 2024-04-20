const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const memoryGameRoomSchema = new Schema(
  {
    playerOneScore: { type: String },
    playerTwoScore: { type: String },
    cardsList: { type: Array },
    nextTurn: { type: String, enum: ["firstPlayer", "secondPlayer"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MemoryGameTest", memoryGameRoomSchema);
