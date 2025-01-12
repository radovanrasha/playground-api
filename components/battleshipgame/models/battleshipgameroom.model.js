const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BattleshipRoomSchema = new Schema(
  {
    id: { type: String },
    title: { type: String },
    qrcode: { type: String },
    password: { type: String },
    nextTurn: { type: String, enum: ["playerOne", "playerTwo"] },

    firstPlayerScore: { type: Number, default: 0 },
    secondPlayerScore: { type: Number, default: 0 },

    firstPlayerReady: { type: Boolean },
    secondPlayerReady: { type: Boolean },

    firstPlayerBoard: { type: Array },
    secondPlayerBoard: { type: Array },

    firstPlayerBoardRevealed: { type: Array },
    secondPlayerBoardRevealed: { type: Array },

    status: {
      type: String,
      enum: ["initialized", "waiting", "ongoing", "finished", "canceled"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BattleshipRoom", BattleshipRoomSchema);
