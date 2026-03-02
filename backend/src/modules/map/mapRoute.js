import express from "express";
import { MapController } from "./mapController.js";

const router = express.Router();

/**
 * Map Routes
 * Định nghĩa các endpoint cho Map Management
 */

// GET /api/maps - Lấy danh sách maps (hỗ trợ filter isActive)
router.get("/", MapController.getAllMaps);

// GET /api/maps/:id - Lấy chi tiết một map
router.get("/:id", MapController.getMapById);

// PATCH /api/maps/:id/status - Bật/tắt trạng thái map
router.patch("/:id/status", MapController.toggleMapStatus);

// PUT /api/maps/:id - Cập nhật metadata của map
router.put("/:id", MapController.updateMapMetadata);

export default router;
