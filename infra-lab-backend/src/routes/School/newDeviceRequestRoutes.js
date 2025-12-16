import express from "express";
import { createNewDeviceRequest } from "../../controllers/School/newDeviceRequest/createNewDeviceRequest.js";
import { listPendingDevices } from "../../controllers/School/newDeviceRequest/listPendingDevices.js";
import { approveNewDevice } from "../../controllers/School/newDeviceRequest/approveNewDevice.js";
import { rejectNewDevice } from "../../controllers/School/newDeviceRequest/rejectNewDevice.js";

const router = express.Router();

// Lab Manager tạo yêu cầu thiết bị mới
router.post("/", createNewDeviceRequest);

// School Admin xem danh sách thiết bị chờ duyệt
router.get("/pending", listPendingDevices);

// School Admin duyệt thiết bị mới
router.patch("/:id/approve", approveNewDevice);

// School Admin từ chối thiết bị mới
router.patch("/:id/reject", rejectNewDevice);

export default router;

