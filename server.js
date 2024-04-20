const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const chalk = require("chalk");
const cors = require("cors");

const app = express();
//Middlewares
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

// //ALL ROUTES
// const routes = {
//   user: require("./routes/user.routes"),
//   note: require("./routes/note.routes"),
// };

// // START ROUTES
// routes.user(app);
// routes.note(app);

app.get("/", (req, res) => {
  res.send("Playground app api!");
});

// Connect to DB and start server
const PORT = process.env.PORT || 3005;
mongoose
  .connect("mongodb://127.0.0.1:27017/playground-app")
  .then(() => {
    console.log(
      chalk.bgYellow.bold(
        `Connected to Mongo on url mongodb://127.0.0.1:27017/playground-app`
      )
    );
    app.listen(PORT, () => {
      console.log(
        chalk.italic.bgBlue.bold(
          `########## SERVER RUNNING ON PORT ${PORT} ##########`
        )
      );
    });
  })
  .catch((error) => console.log(error));

module.exports = app;
