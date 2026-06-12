import express from "express";
import { githubAuth, signUp, logIn } from "./authController.js";
import { verifyToken } from "../shared/authMiddleware.js";
import { globalEvents } from "../shared/events.js";

const router = express.Router();

router.post("/github", githubAuth);
router.post("/signup", signUp);
router.post("/login", logIn);

// SSE endpoint to push realtime events to the logged-in user
router.get("/stream/status", verifyToken, (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const userId = req.user.id;
    console.log(`SSE Client connected: ${userId}`);

    const onUserSuspended = (suspendedUserId) => {
        if (suspendedUserId === userId) {
            res.write(`event: suspended\n`);
            res.write(`data: {}\n\n`);
        }
    };

    globalEvents.on("user_suspended", onUserSuspended);

    // Keep connection alive every 15s to bypass timeouts
    const keepAlive = setInterval(() => {
        res.write(`: keepalive\n\n`);
    }, 15000);

    req.on("close", () => {
        globalEvents.off("user_suspended", onUserSuspended);
        clearInterval(keepAlive);
        console.log(`SSE Client disconnected: ${userId}`);
    });
});

export default router;
