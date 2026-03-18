import express from "express";
import { MapController } from "./mapController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// API MỚI: Gọi để lấy cục Data tổng cho Unity (ví dụ: /api/maps/MAP_01_ONG_KE/game-data)
router.get("/:id/game-data", MapController.getAggregatedGameData);

// Các API quản lý Map của Admin
router.get("/", MapController.getAllMaps);
router.get("/:id", MapController.getMapById);
router.patch("/:id/status", MapController.toggleMapStatus);
router.put("/:id", MapController.updateMapMetadata);
router.post("/", MapController.createMap);

export default router;
