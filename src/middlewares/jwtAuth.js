import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
  const AuthHeader = req.headers.authorization;
  if (!AuthHeader || !AuthHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access Denied. No token provided",
    });
  }

  const token = AuthHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid JWT",
    });
  }
};

export default authenticate;
