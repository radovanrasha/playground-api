const MemoryGameRoom = require("./components/memorygameroom/models/memorygameroom.model");
const MemoryGameRoomTEST = require("./components/memorygameroom/models/testmemorygameonline.model");
const { v4: uuidv4 } = require("uuid");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("createRoom", async (data) => {
      const shuffledCards = [...data.cards, ...data.cards]
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
      io.sockets.emit("roomCreated", { roomId: newroom._id });
    });

    socket.on("joinRoom", async (id) => {
      socket.join(id);

      await MemoryGameRoom.findByIdAndUpdate(
        { _id: id },
        { $set: { status: "ongoing" } }
      );

      io.sockets.emit("roomJoined", { roomId: newroom._id });
    });

    socket.on("revealCard", async (index) => {
      const cards = await MemoryGameRoomTEST.findOne();
      console.log(index);
      if (!cards) {
        const cardImages = [
          { src: "../../card-images/imageone.png", id: 0, matched: false },
          { src: "../../card-images/imagetwo.png", id: 0, matched: false },
          { src: "../../card-images/imagethree.png", id: 0, matched: false },
          { src: "../../card-images/imagefour.png", id: 0, matched: false },
          { src: "../../card-images/imagefive.png", id: 0, matched: false },
          { src: "../../card-images/imagesix.png", id: 0, matched: false },
          { src: "../../card-images/imageseven.png", id: 0, matched: false },
          { src: "../../card-images/imageeight.png", id: 0, matched: false },
          { src: "../../card-images/imageone.png", id: 0, matched: false },
          { src: "../../card-images/imagetwo.png", id: 0, matched: false },
          { src: "../../card-images/imagethree.png", id: 0, matched: false },
          { src: "../../card-images/imagefour.png", id: 0, matched: false },
          { src: "../../card-images/imagefive.png", id: 0, matched: false },
          { src: "../../card-images/imagesix.png", id: 0, matched: false },
          { src: "../../card-images/imageseven.png", id: 0, matched: false },
          { src: "../../card-images/imageeight.png", id: 0, matched: false },
        ];

        const shuffledCards = cardImages
          .map((item, index) => (item = { ...item, id: Math.random() * 1000 }))
          .sort((a, b) => a.id - b.id);

        await new MemoryGameRoomTEST({
          cardsList: shuffledCards,
          playerOneScore: 0,
          playerTwoScore: 0,
          nextTurn: "firstPlayer",
        }).save();
      }

      const game = await MemoryGameRoomTEST.findOne();

      io.sockets.emit("revealedCard", {
        src: game.cardsList[index].src,
        index,
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
};
