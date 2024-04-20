const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const chalk = require("chalk");
const cors = require("cors");
const http = require("http"); // Import Node's http module
const socketIo = require("socket.io");
const socketController = require("./socketio");

const app = express();
const server = http.createServer(app); // Wrap Express app with HTTP server
const io = socketIo(server, {
  cors: {
    origin: ["https://playground.radovanrasha.com", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
});

const socketControl = socketController(io);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
dotenv.config();

mongoose.set("strictQuery", false);

const allowedOrigins = [
  "https://playground.radovanrasha.com",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Playground app api!");
});

// Connect to DB and start server
const PORT = process.env.PORT || 3007;
mongoose
  .connect("mongodb://127.0.0.1:27017/playground-app")
  .then(() => {
    console.log(
      chalk.bgYellow.bold(
        `Connected to Mongo on url mongodb://127.0.0.1:27017/playground-app`
      )
    );
    server.listen(PORT, () => {
      console.log(
        chalk.italic.bgBlue.bold(
          `########## SERVER RUNNING ON PORT ${PORT} ##########`
        )
      );
    });
  })
  .catch((error) => console.log(error));
