import { loginUser, verifyEmail } from "../controllers/auth.controllers.js";
import { Router } from "express";

const router = Router();

router.post("/login", loginUser);
router.get("/verify-email/:token", verifyEmail);

export default router;
