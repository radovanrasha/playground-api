const MemoryGameRoom = require("./components/memorygame/models/memorygameroom.model");
const MemoryGameRoomTEST = require("./components/memorygame/models/testmemorygameonline.model");
const { v4: uuidv4 } = require("uuid");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("createRoom", async (data) => {
      const cardImages = [
        { src: "imageone", id: 0, matched: false },
        { src: "imagetwo", id: 0, matched: false },
        { src: "imagethree", id: 0, matched: false },
        { src: "imagefour", id: 0, matched: false },
        { src: "imagefive", id: 0, matched: false },
        { src: "imagesix", id: 0, matched: false },
        { src: "imageseven", id: 0, matched: false },
        { src: "imageeight", id: 0, matched: false },
        { src: "imageone", id: 0, matched: false },
        { src: "imagetwo", id: 0, matched: false },
        { src: "imagethree", id: 0, matched: false },
        { src: "imagefour", id: 0, matched: false },
        { src: "imagefive", id: 0, matched: false },
        { src: "imagesix", id: 0, matched: false },
        { src: "imageseven", id: 0, matched: false },
        { src: "imageeight", id: 0, matched: false },
      ];

      const shuffledCards = cardImages
        .map((item, index) => (item = { ...item, id: Math.random() * 1000 }))
        .sort((a, b) => a.id - b.id);

      const newroom = await new MemoryGameRoom({
        title: data.title,
        password: data.password ? data.password : null,
        playerOneScore: 0,
        playerTwoScore: 0,
        cardsList: shuffledCards,
        nextTurn: "firstPlayer",
        status: "waiting",
      }).save();

      socket.join(newroom._id);
      io.emit("roomCreated", { roomId: newroom._id });

      let rooms = await MemoryGameRoom.find({ status: "waiting" })
        .select("_id title")
        .sort({ createdAt: -1 });

      io.emit("freeRooms", rooms);
    });

    socket.on("getFreeRooms", async () => {
      const rooms = await MemoryGameRoom.find({ status: "waiting" }).select(
        "_id title"
      );

      io.emit("freeRooms", rooms);
    });

    socket.on("joinRoom", async (id) => {
      socket.join(id);

      await MemoryGameRoom.findByIdAndUpdate(
        { _id: id },
        { $set: { status: "ongoing" } }
      );

      io.sockets.emit("roomJoined", { roomId: newroom._id });
    });

    socket.on("revealCard", async ({ index, id }) => {
      const room = await MemoryGameRoom.find({ _id: id });

      io.to(id).emit("revealedCard", { src: room.cardsList[index], index });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
};
