const jwt = require("jsonwebtoken");

const jwtVerify = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).send({ error: true, message: "Unauthorized Access" });
  }
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).send({ error: true, message: "Unauthorized Access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ error: true, message: error.message });
    }

    req.decoded = decoded;
    next();
  });
};

module.exports = { jwtVerify };
