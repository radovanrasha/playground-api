const MemoryGameRoom = require("./components/memorygameroom/models/memorygameroom.model");
const MemoryGameRoomTEST = require("./components/memorygameroom/models/testmemorygameonline.model");
const { v4: uuidv4 } = require("uuid");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("revealCard", async (index) => {
      socket.emit("otkriveno", index);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
};
