import express from "express";
import {
  authMiddleware,
  authorize,
} from "../../../middlewares/auth.middleware.js";
import {
  createSupportTicket,
  listAllSupportTicketsForAdmin,
  listMySupportTickets,
  updateSupportTicketStatusByAdmin,
  addAdminReply,
} from "./supportTicketController.js";

const router = express.Router();

router.get("/", authMiddleware, listMySupportTickets);
router.post("/", authMiddleware, createSupportTicket);

router.get(
  "/admin/all",
  authMiddleware,
  authorize("admin"),
  listAllSupportTicketsForAdmin,
);

router.patch(
  "/admin/:ticketId/status",
  authMiddleware,
  authorize("admin"),
  updateSupportTicketStatusByAdmin,
);

router.post(
  "/admin/:ticketId/replies",
  authMiddleware,
  authorize("admin"),
  addAdminReply,
);

export default router;
