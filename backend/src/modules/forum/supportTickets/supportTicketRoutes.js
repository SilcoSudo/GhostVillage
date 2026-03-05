import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  createSupportTicket,
  listMySupportTickets,
} from "./supportTicketController.js";

const router = express.Router();

router.get("/", authMiddleware, listMySupportTickets);
router.post("/", authMiddleware, createSupportTicket);

export default router;
