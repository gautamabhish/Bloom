import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import prisma from "../db/prisma.js";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const submitAnswersAndGenerateProfile = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  console.log("request body", req.user);
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

  const prompt = `
    You are a romantic poet writing a dating profile.

    Create a poetic, warm, charming description in 150-200 words based on the following answers to 10 questions about personality, preferences, and interests.

    Try to use simple language and make it sound genuine and heartfelt. 

    the description should be romantic, but not overly cheesy or flowery. It should feel like it's written by a real person, not an AI.

    Do NOT mention the questions or the fact that these answers were generated from a quiz. Just create a romantic profile description based on the answers.

    Avoid using complex words or flowery language. The description should feel like it's written by a real person, not an AI.

    Do NOT mention questions , output only the final description text.

    Answers:
    ${answers.map((a, i) => `${i + 1}. ${a}`).join("\n")}
    `;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
  });

  const poem =
    completion.choices?.[0]?.message?.content || "A mysterious romantic soul.";

  return res.status(200).json(
    new ApiResponse(200, "Profile generated successfully", {
      poem,
      submissionId: submission.id,
    }),
  );
});

export { submitAnswersAndGenerateProfile };
