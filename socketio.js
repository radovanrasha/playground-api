const MemoryGameRoom = require("./components/memorygame/models/memorygameroom.model");
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

      console.log("eeeeeeeee");
      console.log("roooooooooms", socket.rooms);

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
      socket.join(newroom._id.toString());

      let rooms = await MemoryGameRoom.find({ status: "waiting" })
        .select("_id title")
        .sort({ createdAt: -1 });

      io.emit("freeRooms", rooms);
      io.to(newroom._id.toString()).emit("roomCreated", {
        roomId: newroom._id,
      });
    });

    socket.on("getFreeRooms", async () => {
      const rooms = await MemoryGameRoom.find({ status: "waiting" }).select(
        "_id title"
      );

      io.emit("freeRooms", rooms);
    });

    socket.on("joinRoom", async (id) => {
      socket.join(id.toString());
      await MemoryGameRoom.findByIdAndUpdate(
        { _id: id },
        { $set: { status: "ongoing" } }
      );

      io.to(id.toString()).emit("roomJoined", { id: id.toString() });
    });

    socket.on("revealCard", async ({ index, id }) => {
      socket.join(id.toString());
      const room = await MemoryGameRoom.findById({ _id: id });

      // console.log(room.cardsList[index]);
      io.to(id).emit("revealedCard", { src: room.cardsList[index].src, index });
    });

    socket.on("getGameInfo", async (id) => {
      const game = await MemoryGameRoom.findByIdAndUpdate({ _id: id });

      io.to(id.toString()).emit("gameInfo", { game });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
};
