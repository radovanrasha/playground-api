const QRCode = require("qrcode");
const BattleshipRoom = require("./components/battleshipgame/models/battleshipgameroom.model");
const MemoryGameRoom = require("./components/memorygame/models/memorygameroom.model");
const hangmangameroomModel = require("./components/hangman/models/hangmangameroom.model");

//---------------------Hangman helpers---------------------
const HANGMAN_MAX_MISSES = 6;
const HANGMAN_WINNING_SCORE = 3;
// only the letters on the frontend keyboard (Serbian Latin alphabet)
const HANGMAN_LETTER = /^[A-ZČĆŽŠĐ]$/;
const HANGMAN_TERM = /^[A-ZČĆŽŠĐ ]+$/;

// a failing handler must not crash the server (unhandled rejection)
const safe =
  (handler) =>
  async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.log(error);
    }
  };

const findHangmanGame = (id) =>
  hangmangameroomModel.findById(id).catch(() => null);

// uppercased and single-spaced, or null when the term can't be played
const normalizeHangmanTerm = (value) => {
  const term = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

  if (term.length < 2 || term.length > 30 || !HANGMAN_TERM.test(term)) {
    return null;
  }

  return term;
};

// the term of a round still in play is hidden so the guesser can't read it
const toPublicHangmanGame = (game) => {
  const data = game.toObject();

  data.rounds = data.rounds.map((round) =>
    round.status === "ended" ? round : { ...round, term: [] }
  );

  return data;
};

const emitHangmanGame = (io, game) => {
  io.to(game._id.toString()).emit("gameInfoHangman", {
    game: toPublicHangmanGame(game),
  });
};

const emitFreeRoomsHangman = async (target) => {
  const rooms = await hangmangameroomModel
    .find({ status: "initialized" })
    .select("_id title")
    .sort({ createdAt: -1 });

  target.emit("freeRoomsHangman", rooms);
};

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    //---------------------START Memory game socket events START---------------------
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
        nextTurn: "playerOne",
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
      // console.log("e", rooms);
      io.emit("freeRooms", rooms);
    });

    socket.on("joinRoom", async (id, player) => {
      socket.join(id.toString());

      if (player && player === "playerTwo") {
        await MemoryGameRoom.findByIdAndUpdate(
          { _id: id },
          { $set: { status: "ongoing" } }
        );
      }

      const game = await MemoryGameRoom.findById({ _id: id });

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
        let finished = true;

        if (cardTwo.id !== cardOne.id && cardTwo.src === cardOne.src) {
          room.cardsList[index] = { ...room.cardsList[index], matched: true };
          room.cardsList[cardOneIndex] = {
            ...room.cardsList[cardOneIndex],
            matched: true,
          };

          room.nextTurn === "playerOne"
            ? (room.playerOneScore = room.playerOneScore + 1)
            : (room.playerTwoScore = room.playerTwoScore + 1);
        } else {
          room.nextTurn === "playerOne"
            ? (room.nextTurn = "playerTwo")
            : (room.nextTurn = "playerOne");
        }

        for (let i = 0; i < room.cardsList.length; i++) {
          if (!room.cardsList[i].matched) {
            finished = false;
          }
        }

        finished ? (room.status = "finished") : (room.status = "ongoing");
      }

      room.cardsList[index] = { ...room.cardsList[index], revealed: true };

      await MemoryGameRoom.findByIdAndUpdate({ _id: id }, { ...room });

      io.to(id.toString()).emit("gameInfo", { game: room });
    });

    socket.on("getGameInfo", async (id) => {
      const game = await MemoryGameRoom.findById({ _id: id });

      io.to(id.toString()).emit("gameInfo", { game });
    });

    socket.on("restartTurn", async ({ id }) => {
      const game = await MemoryGameRoom.findById({ _id: id });

      for (let i = 0; i < game.cardsList.length; i++) {
        game.cardsList[i].revealed = false;
      }
      // console.log("e");
      await MemoryGameRoom.findByIdAndUpdate({ _id: id }, { ...game });

      // console.log(gameRes);

      io.to(id.toString()).emit("gameInfo", { game: game });
    });

    socket.on("gameCanceled", async (id) => {
      await MemoryGameRoom.findByIdAndUpdate(
        { _id: id },
        { $set: { status: "canceled" } }
      );

      const game = await MemoryGameRoom.findById({ _id: id });
      // console.log("game canceled");

      io.to(id.toString()).emit("gameInfo", { game });
    });

    //---------------------END Memory game socket events END---------------------

    //---------------------START Battleship game socket events START---------------------

    socket.on("createRoomBattleship", async (data) => {
      const newroom = await new BattleshipRoom({
        title: data.title,
        password: data.password ? data.password : null,
        nextTurn: "playerOne",
        status: "initialized",
        firstPlayerBoard: Array(10)
          .fill(null)
          .map(() => Array(10).fill()),
        firstPlayerBoardRevealed: Array(10)
          .fill(null)
          .map(() => Array(10).fill()),
      }).save();
      socket.join(newroom._id.toString());

      let rooms = await BattleshipRoom.find({ status: "initialized" })
        .select("_id title")
        .sort({ createdAt: -1 });

      const qrCodeBase64 = await QRCode.toDataURL(
        `https://playground.radovanrasha.com/battleship-multiplayer/${newroom._id.toString()}?player=playerTwo`
      );

      await BattleshipRoom.findByIdAndUpdate(
        { _id: newroom._id },
        { qrcode: qrCodeBase64 }
      );

      io.emit("freeRoomsBattleship", rooms);
      io.to(newroom._id.toString()).emit("roomCreatedBattleship", {
        roomId: newroom._id,
      });
    });

    socket.on("getFreeRoomsBattleship", async () => {
      const rooms = await BattleshipRoom.find({ status: "initialized" }).select(
        "_id title"
      );

      io.emit("freeRoomsBattleship", rooms);
    });

    socket.on("joinRoomBattleship", async (id, player) => {
      socket.join(id.toString());

      const game = await BattleshipRoom.findById({ _id: id });

      if (player && player === "playerTwo" && game.status === "initialized") {
        game.status = "waiting";
        game.secondPlayerBoard = Array(10)
          .fill(null)
          .map(() => Array(10).fill());
        game.secondPlayerBoardRevealed = Array(10)
          .fill(null)
          .map(() => Array(10).fill());
        await game.save();
      }

      io.to(id.toString()).emit("gameInfoBattleship", { game });
    });

    socket.on("playerReadyBattleship", async (id, player, board) => {
      if (player && player === "playerOne") {
        await BattleshipRoom.findByIdAndUpdate(
          { _id: id },
          { firstPlayerReady: true, firstPlayerBoard: board }
        );
      } else if (player && player === "playerTwo") {
        await BattleshipRoom.findByIdAndUpdate(
          { _id: id },
          { secondPlayerReady: true, secondPlayerBoard: board }
        );
      }

      const game = await BattleshipRoom.findById({ _id: id });

      if (game.firstPlayerReady && game.secondPlayerReady) {
        game.status = "ongoing";
        await game.save();
      }

      io.to(id.toString()).emit("gameInfoBattleship", { game });
    });

    socket.on(
      "clickOnBoardBattleship",
      async (id, player, rowIndex, colIndex) => {
        const game = await BattleshipRoom.findById({ _id: id });
        let countHitsPlayerOne = 0;
        let countHitsPlayerTwo = 0;

        if (player === "playerOne") {
          if (game.secondPlayerBoard[rowIndex][colIndex]) {
            game.secondPlayerBoardRevealed[rowIndex][colIndex] = "X";
            game.nextTurn =
              game.nextTurn === "playerTwo" ? "playerTwo" : "playerOne";
          } else {
            game.secondPlayerBoardRevealed[rowIndex][colIndex] = "O";
            game.nextTurn =
              game.nextTurn === "playerOne" ? "playerTwo" : "playerOne";
          }

          game.secondPlayerBoardRevealed.forEach((row) => {
            row.forEach((item) => {
              if (item === "X") {
                countHitsPlayerOne++;
              }
            });
          });

          game.firstPlayerScore = countHitsPlayerOne;
        } else if (player === "playerTwo") {
          if (game.firstPlayerBoard[rowIndex][colIndex]) {
            game.firstPlayerBoardRevealed[rowIndex][colIndex] = "X";
            game.nextTurn =
              game.nextTurn === "playerTwo" ? "playerTwo" : "playerOne";
          } else {
            game.firstPlayerBoardRevealed[rowIndex][colIndex] = "O";
            game.nextTurn =
              game.nextTurn === "playerOne" ? "playerTwo" : "playerOne";
          }

          game.firstPlayerBoardRevealed.forEach((row) => {
            row.forEach((item) => {
              if (item === "X") {
                countHitsPlayerTwo++;
              }
            });
          });

          game.secondPlayerScore = countHitsPlayerTwo;
        }

        if (countHitsPlayerOne === 17 || countHitsPlayerTwo === 17) {
          game.status = "finished";
        }

        await BattleshipRoom.findByIdAndUpdate(
          { _id: id },
          {
            secondPlayerBoardRevealed: game.secondPlayerBoardRevealed,
            firstPlayerBoardRevealed: game.firstPlayerBoardRevealed,
            nextTurn: game.nextTurn,
            firstPlayerScore: game.firstPlayerScore,
            secondPlayerScore: game.secondPlayerScore,
            status: game.status,
          }
        );

        const gameRes = await BattleshipRoom.findById({ _id: id });

        io.to(id.toString()).emit("gameInfoBattleship", { game: gameRes });
      }
    );

    //---------------------END Battleship game socket events END---------------------

    //---------------------START Hangman game socket events START---------------------
    socket.on(
      "createRoomHangman",
      safe(async (data) => {
        const newroom = await new hangmangameroomModel({
          title: data.title,
          password: data.password ? data.password : null,
          status: "initialized",
          rounds: [
            {
              roundNumber: 1,
              termSetter: "playerOne",
              status: "choosing_term",
            },
          ],
        }).save();
        socket.join(newroom._id.toString());

        newroom.qrcode = await QRCode.toDataURL(
          `https://playground.radovanrasha.com/hangman-multiplayer/${newroom._id.toString()}?player=playerTwo`
        );
        await newroom.save();

        await emitFreeRoomsHangman(io);
        socket.emit("roomCreatedHangman", { roomId: newroom._id });
      })
    );

    socket.on(
      "getFreeRoomsHangman",
      safe(async () => {
        await emitFreeRoomsHangman(socket);
      })
    );

    socket.on(
      "joinRoomHangman",
      safe(async (id, player) => {
        const game = await findHangmanGame(id);
        if (!game) return;

        socket.join(id.toString());

        // the second player starts the game and takes the room off the list
        if (player === "playerTwo" && game.status === "initialized") {
          game.status = "ongoing";
          await game.save();
          await emitFreeRoomsHangman(io);
        }

        emitHangmanGame(io, game);
      })
    );

    socket.on(
      "enteredTermHangman",
      safe(async (id, player, enteredTerm) => {
        const game = await findHangmanGame(id);
        if (!game || game.status !== "ongoing") return;

        const round = game.rounds[game.rounds.length - 1];
        if (round.status !== "choosing_term" || round.termSetter !== player) {
          return;
        }

        const term = normalizeHangmanTerm(enteredTerm);
        if (!term) {
          socket.emit(
            "hangmanError",
            "Use 2-30 letters from the keyboard and spaces."
          );
          return;
        }

        round.term = term.split("");
        round.maskedTerm = term.split("").map((char) => (char === " " ? " " : "_"));
        round.status = "in_progress";
        await game.save();

        emitHangmanGame(io, game);
      })
    );

    socket.on(
      "handleGuessHangman",
      safe(async (id, player, letter) => {
        const game = await findHangmanGame(id);
        if (!game || game.status !== "ongoing") return;

        const round = game.rounds[game.rounds.length - 1];
        const guesser = round.termSetter === "playerOne" ? "playerTwo" : "playerOne";
        const guess = String(letter || "").toUpperCase();

        if (round.status !== "in_progress" || player !== guesser) return;
        if (!HANGMAN_LETTER.test(guess) || round.guesses.includes(guess)) return;

        round.guesses.push(guess);

        if (round.term.includes(guess)) {
          round.maskedTerm = round.term.map((char, index) =>
            char === guess ? char : round.maskedTerm[index]
          );
        } else {
          round.incorrectGuesses.push(guess);
          round.missed += 1;
        }

        const termGuessed = !round.maskedTerm.includes("_");
        const hanged = round.missed >= HANGMAN_MAX_MISSES;

        if (termGuessed || hanged) {
          round.status = "ended";
          round.result = termGuessed ? "guessed" : "hanged";

          // the guesser scores for a found term, the setter when the guesser hangs
          const scorer = termGuessed ? guesser : round.termSetter;
          if (scorer === "playerOne") {
            game.playerOneScore += 1;
          } else {
            game.playerTwoScore += 1;
          }

          if (
            game.playerOneScore >= HANGMAN_WINNING_SCORE ||
            game.playerTwoScore >= HANGMAN_WINNING_SCORE
          ) {
            game.status = "finished";
          } else {
            // players swap roles every round
            game.roundNumber += 1;
            game.rounds.push({
              roundNumber: game.roundNumber,
              termSetter: guesser,
              status: "choosing_term",
            });
          }
        }

        await game.save();

        emitHangmanGame(io, game);
      })
    );

    socket.on(
      "gameCanceledHangman",
      safe(async (id) => {
        const game = await findHangmanGame(id);
        if (!game || game.status === "finished" || game.status === "canceled") {
          return;
        }

        game.status = "canceled";
        await game.save();

        emitHangmanGame(io, game);
        await emitFreeRoomsHangman(io);
      })
    );

    //---------------------END Hangman game socket events END---------------------
    //-----------------------------------------------------------------------------------
    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
};
