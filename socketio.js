const MemoryGameRoom = require("./components/memorygame/models/memorygameroom.model");
const { v4: uuidv4 } = require("uuid");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("createRoom", async (data) => {
      const cardImages = [
        { src: "124908271092312193182301239915230", id: 0, matched: false },
        { src: "124908271092312193182301229915230", id: 0, matched: false },
        { src: "124908271092332193182301239915230", id: 0, matched: false },
        { src: "124903271092342193182301239915230", id: 0, matched: false },
        { src: "124908271092312193182301239915330", id: 0, matched: false },
        { src: "124908271092312193182301229945230", id: 0, matched: false },
        { src: "121908271092332193182301239915230", id: 0, matched: false },
        { src: "124903271092332193182301239915230", id: 0, matched: false },
        { src: "124908271092312193182301239915230", id: 0, matched: false },
        { src: "124908271092312193182301229915230", id: 0, matched: false },
        { src: "124908271092332193182301239915230", id: 0, matched: false },
        { src: "124903271092342193182301239915230", id: 0, matched: false },
        { src: "124908271092312193182301239915330", id: 0, matched: false },
        { src: "124908271092312193182301229945230", id: 0, matched: false },
        { src: "121908271092332193182301239915230", id: 0, matched: false },
        { src: "124903271092332193182301239915230", id: 0, matched: false },
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

      const game = await MemoryGameRoom.findByIdAndUpdate({ _id: id });

      io.to(id.toString()).emit("roomJoined", { id: id.toString() });

      io.to(id.toString()).emit("gameInfo", { game });
    });

    socket.on("revealCard", async ({ index, id, type, cardOne }) => {
      socket.join(id.toString());
      let room = await MemoryGameRoom.findById({ _id: id });

      if (type === "secondCard") {
        let cardOneIndex = room.cardsList.findIndex((item, index) => {
          return item.id === cardOne.id;
        });
        let cardTwo = room.cardsList[index];

        if (cardTwo.id !== cardOne.id && cardTwo.src === cardOne.src) {
          room.cardsList[index] = { ...room.cardsList[index], matched: true };
          room.cardsList[cardOneIndex] = {
            ...room.cardsList[cardOneIndex],
            matched: true,
          };
        }

        await MemoryGameRoom.findByIdAndUpdate({ _id: id }, { ...room });

        io.to(id.toString()).emit("gameInfo", { game: room });
      }

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
