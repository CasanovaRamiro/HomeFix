import jwt from "jsonwebtoken";

export const getTestToken = (userId: number = 1): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
};
