import express from "express";
import { ItemController } from "./itemController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

/**
 * Item Routes
 */
router.get("/", ItemController.getAllItems);
router.get("/:id", ItemController.getItemById);
router.post("/", ItemController.createItem);
router.put("/:id", ItemController.updateItem);
router.patch("/:id/status", ItemController.toggleItemStatus);
router.delete("/:id", ItemController.deleteItem);

export default router;
