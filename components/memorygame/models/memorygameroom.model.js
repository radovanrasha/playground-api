const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const memoryGameRoomSchema = new Schema(
  {
    id: { type: String },
    title: { type: String },
    password: { type: String },
    playerOneScore: { type: String },
    playerTwoScore: { type: String },
    cardsList: { type: Array },
    nextTurn: { type: String, enum: ["firstPlayer", "secondPlayer"] },
    status: { type: String, enum: ["waiting", "ongoing", "finished"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MemoryGameRoom", memoryGameRoomSchema);
