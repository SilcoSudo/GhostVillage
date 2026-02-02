import express from "express";
import { MapController } from "./mapController.js";

const router = express.Router();

// Endpoint: GET /api/maps
router.get("/", MapController.getMaps);

export default router;
