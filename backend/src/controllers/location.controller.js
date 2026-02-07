const CENTRAL_THRESHOLD = 60;
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import prisma from "../db/prisma.js";

import {
  updateUserLocation,
  getNearbyUsers
} from "../store/locationStore.js";

import {
  hasSeenSignal,
  markSignalSeen
} from "../store/signalCache.js";

/* ---------------- UPDATE LOCATION ---------------- */

export const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  const userId = req.user.id;

  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new ApiError(400, "Invalid coordinates");
  }

  updateUserLocation(userId, lat, lng);

  return res.status(200).json(
    new ApiResponse(200, "Location updated")
  );
});



/* ---------------- LIVE SIGNAL CHECK ---------------- */


export const checkLiveSignals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const myGender = req.user.gender;
  const myRoll = req.user.rollNumber;

  /* 1. Nearby users (memory-only) */
  const nearby = getNearbyUsers(userId, 50);
  if (!nearby.length) {
    return res.json(new ApiResponse(200, { signals: [] }));
  }

  /* 2. Remove already-delivered signals */
  const unseen = nearby.filter(
    uid => uid !== userId && !hasSeenSignal(userId, uid)
  );
  if (!unseen.length) {
    return res.json(new ApiResponse(200, { signals: [] }));
  }

  /* 3. Remove users with ANY past interaction */
  const interactions = await prisma.userInteraction.findMany({
    where: {
      OR: [
        { fromUserId: userId, toUserId: { in: unseen } },
        { toUserId: userId, fromUserId: { in: unseen } }
      ]
    },
    select: { fromUserId: true, toUserId: true }
  });

  const blocked = new Set();
  interactions.forEach(i => {
    blocked.add(i.fromUserId);
    blocked.add(i.toUserId);
  });

  const candidates = unseen.filter(uid => !blocked.has(uid));
  if (!candidates.length) {
    return res.json(new ApiResponse(200, { signals: [] }));
  }

  /* 4. Fetch opposite-gender profiles */
  const users = await prisma.user.findMany({
    where: {
      id: { in: candidates },
      gender: { not: myGender },
    },
    select: {
      id: true,
      rollNumber: true,
      username: true,
      avatarUrl: true,
    },
  });

  if (!users.length) {
    return res.json(new ApiResponse(200, { signals: [] }));
  }

  /* 5. Score + threshold filter */
  const qualified = [];

  for (const u of users) {
    const maleRoll = myGender === "MALE" ? myRoll : u.rollNumber;
    const femaleRoll = myGender === "FEMALE" ? myRoll : u.rollNumber;

    try {
      const { data } = await axios.get(
        "https://bloom-nsrj.onrender.com/score",
        {
          params: {
            maleRollNo: maleRoll,
            femaleRollNo: femaleRoll,
          },
          timeout: 1500,
        }
      );

      if (data?.score >= CENTRAL_THRESHOLD) {
        qualified.push({
          id: u.id,
          username: u.username,
          avatarUrl: u.avatarUrl,
          score: data.score,
        });

        // mark ONLY meaningful signals
        markSignalSeen(userId, u.id);
      }
    } catch (err) {
      // silent fail — do not block others
    }
  }

  return res.json(
    new ApiResponse(200, { signals: qualified })
  );
});


export const getSignalScore = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;

  const [me, other] = await prisma.user.findMany({
    where: { id: { in: [userId, otherUserId] } },
    select: {
      rollNumber: true,
      gender: true,
    },
  });

  if (!me || !other) {
    throw new ApiError(404, "User not found");
  }

  if (me.gender === other.gender) {
    return res.json(new ApiResponse(200, { score: 0 }));
  }

  const male = me.gender === "MALE" ? me : other;
  const female = me.gender === "FEMALE" ? me : other;

  const { data } = await axios.get(
    "https://bloom-nsrj.onrender.com/score",
    {
      params: {
        maleRollNo: male.rollNumber,
        femaleRollNo: female.rollNumber,
      },
      timeout: 2000,
    }
  );

  return res.json(
    new ApiResponse(200, {
      score: data.score ?? 0,
    })
  );
});
