const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const memoryGameRoomSchema = new Schema(
  {
    id: { type: String },
    title: { type: String },
    password: { type: String },
    playerOneScore: { type: Number, default: 0 },
    playerTwoScore: { type: Number, default: 0 },
    cardsList: { type: Array },
    nextTurn: { type: String, enum: ["playerOne", "playerTwo"] },
    status: {
      type: String,
      enum: ["waiting", "ongoing", "finished", "canceled"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MemoryGameRoom", memoryGameRoomSchema);
