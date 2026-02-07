import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import prisma from "../db/prisma.js";
import { Groq } from "groq-sdk";
import { response } from "express";
import axios from "axios";
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const submitAnswersAndGenerateProfile = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const userId = req.user.id;
  const rollNumber = req.user.rollNumber;

  if (!Array.isArray(answers) || answers.length !== 10) {
    throw new ApiError(400, "Exactly 10 answers are required");
  }

  for (const ans of answers) {
    if (typeof ans !== "string" || ans.trim().length < 3) {
      throw new ApiError(400, "Invalid answer format");
    }
  }

  const gender = answers[4].toUpperCase();
  if (gender !== "MALE" && gender !== "FEMALE") {
    throw new ApiError(400, "Invalid gender answer");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if(user.onboardingCompleted) {
    throw new ApiError(400, "Profile already generated");
  }
  const submission = await prisma.onboardingSubmission.upsert({
    where: { userId },
    update: {
      answers,
    },
    create: {
      userId,
      rollNumber,
      answers,
    },
  });
  axios.get("http://10.104.11.105:696/user/register", {
    params: {
      rollno: rollNumber,
      responses: JSON.stringify(answers),
    },
    timeout: 3000,
  }).catch(err => {
    console.error("External service error:", err.message);
  });

  const prompt = `
    Write a romantic but natural dating profile for a college student using the answers below.

    Rules:
    - 150–200 words
    - warm and heartfelt, not cheesy
    - simple, everyday language
    - no fancy or dramatic metaphors
    - sound human, not AI-generated
    - do not mention questions, quizzes, or prompts
    - output only the final profile text

    Answers:
    ${answers.map((a, i) => `${i + 1}. ${a}`).join("\n")}
    `;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });

     poem =
      completion.choices?.[0]?.message?.content ||
      "A mysterious romantic soul.";
  } catch (err) {
    console.error("Groq error:", err);
    throw new ApiError(502, "Profile generation failed");
  }

  const [username] = await prisma.$transaction(async (tx) => {
    const usernames = await tx.usernamePool.findMany({
      where: {
        gender: gender,
        taken: false,
      },
    });

    if (!usernames.length) throw new Error("No usernames left");

    const chosen = usernames[Math.floor(Math.random() * usernames.length)];

    await tx.usernamePool.update({
      where: { id: chosen.id },
      data: {
        taken: true,
        userId: userId,
      },
    });
    return [chosen];
  });

  let avatarUrl = "";
  if (gender === "MALE") {
    const avatarNumber = Math.floor(Math.random() * 19) + 1;
    avatarUrl = `/${gender.toLowerCase()}/${avatarNumber}.png`;
  } else {
    const avatarNumber = Math.floor(Math.random() * 12) + 1;
    avatarUrl = `/${gender.toLowerCase()}/${avatarNumber}.png`;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      gender: gender,
      username: username.name,
      avatarUrl: avatarUrl,
      poem: poem,
      onboardingCompleted: true,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Profile generated successfully", {
      poem,
      submissionId: submission.id,
      username: username.name,
      avatarUrl: avatarUrl,
    }),
  );
});

const homePageContent = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);

  const cursorCreatedAt = req.query.cursor;
  const cursorId = req.query.id;

  let whereClause = {
    verified: true,
    poem: {
      not: "",
    },
    id: {
      not: req.user.id,
    },
  };

  if (cursorCreatedAt && cursorId) {
    whereClause = {
      ...whereClause,
      OR: [
        {
          createdAt: {
            lt: new Date(cursorCreatedAt),
          },
        },
        {
          createdAt: new Date(cursorCreatedAt),
          id: {
            lt: cursorId,
          },
        },
      ],
    };
  }

  const users = await prisma.user.findMany({
    where: whereClause,

    orderBy: [{ createdAt: "desc" }, { id: "desc" }],

    take: limit + 1,
    select: {
      id: true,
      createdAt: true,
      username: true,
      poem: true,
    },
  });

  const hasMore = users.length > limit;

  const results = hasMore ? users.slice(0, limit) : users;

  let nextCursor = null;

  if (hasMore) {
    const last = results[results.length - 1];
    nextCursor = {
      cursor: last.createdAt.toISOString(),
      id: last.id,
    };
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: results.map((u) => ({
          username: u.username,
          poem: u.poem,
        })),
        nextCursor,
      },
      "Home page content fetched successfully",
    ),
  );
});


 const notificationsPanel = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // fetch incoming interactions (signals, likes, rejected) — recent first
  const incoming = await prisma.userInteraction.findMany({
    where: { toUserId: userId },
    include: {
      fromUser: { select: { id: true, username: true, avatarUrl: true, poem: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const likes = [];
  const resonance = [];

  // classify each incoming LIKED into resonance or likes (mutual)
  for (const i of incoming) {
    if (i.state !== "LIKED") continue;
    // reciprocal lookup via unique composite (fromUserId_toUserId)
    const reciprocal = await prisma.userInteraction.findUnique({
      where: { fromUserId_toUserId: { fromUserId: userId, toUserId: i.fromUserId } },
    });
    if (reciprocal && reciprocal.state === "LIKED") {
      resonance.push({
        userId: i.fromUser.id,
        username: i.fromUser.username,
        avatarUrl: i.fromUser.avatarUrl,
        poem: i.fromUser.poem,
        matchedAt: i.updatedAt,
      });
    } else {
      likes.push({
        userId: i.fromUser.id,
        username: i.fromUser.username,
        avatarUrl: i.fromUser.avatarUrl,
        poem: i.fromUser.poem,
        receivedAt: i.createdAt,
      });
    }
  }

  // SIGNALS: ephemeral; populated by your location engine (in-memory)
  const signals = []; // TODO: call location service / memory map

  return res.status(200).json(
    new ApiResponse(200, { signals, likes, resonance }, "Signals fetched successfully")
  );
});

export { submitAnswersAndGenerateProfile, homePageContent, notificationsPanel };
