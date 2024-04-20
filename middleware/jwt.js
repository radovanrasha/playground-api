const jwt = require("jsonwebtoken");

const checkJWT = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers.authorization; // Express headers are auto converted to lowercase
  if (token && token.startsWith("Bearer ")) {
    // Remove Bearer from string
    token = token.split(" ")[1];
  }
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.json({
          message: "Token is not valid or token expired",
        });
      }
      req.user = decoded; // will set `request.user` using jwt.sign in auth-login
      next();
    });
  } else {
    return res.json({ message: "Auth token is not supplied" });
  }
};

module.exports = { checkJWT };
