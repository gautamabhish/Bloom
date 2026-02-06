import prisma from "../db/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/mail.js";
import { ApiResponse } from "../utils/api-response.js";
import crypto from "crypto";

const parseCollegeEmail = (email) => {
  const domain = "nith.ac.in";

  if (!email.endsWith(`@${domain}`)) {
    throw new ApiError(400, "Email must be a valid college email");
  }

  const rollNumber = email.split("@")[0];

  if (!/^[0-9]{2}[a-z]{3}[0-9]{3}$/i.test(rollNumber)) {
    throw new Error("Invalid roll number format");
  }

  return rollNumber.toLowerCase(); // Normalize roll number to lowercase
};
const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const loginUser = asyncHandler(async (req, res) => {
  let { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  email = email.toLowerCase().trim(); // Normalize email
  const rollNumber = parseCollegeEmail(email);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        rollNumber,
      },
    });
  }

  const token = generateToken();

  await prisma.emailVerification.upsert({
    where: { userId: user.id },
    update: {
      token,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    },
    create: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    },
  });

  await sendEmail({
    email: user.email,
    subject: "Ignite the spark: Your Blush Login Link",
    verificationUrl: `${req.protocol}://${req.get("host")}/api/auth/verify-email/${token}`,
  });

  res.status(200).json(new ApiResponse(200, "Login email sent successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const record = await prisma.emailVerification.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired token");
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { verified: true },
  });

  await prisma.emailVerification.delete({
    where: { id: record.id },
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: record.userId },
  });

  //gonna generate jwt

  res.status(200).json(
    new ApiResponse(200, "Email verified successfully", {
      user: updatedUser,
    }),
  );
});

export { loginUser, verifyEmail };
