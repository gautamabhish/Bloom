import prisma from "../db/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyjwt = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decodedToken.id,
      },
      select: {
        id: true,
        rollNumber: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "Unauthorized: User not found");
    }
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, "Unauthorized: Invalid token");
  }
});
