const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BattleshipRoomSchema = new Schema(
  {
    id: { type: String },
    title: { type: String },
    password: { type: String },
    nextTurn: { type: String, enum: ["playerOne", "playerTwo"] },
    firstPlayerReady: { type: Boolean },
    secondPlayerReady: { type: Boolean },
    status: {
      type: String,
      enum: ["initialized", "waiting", "ongoing", "finished", "canceled"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BattleshipRoom", BattleshipRoomSchema);
