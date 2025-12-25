import express from "express";
import { checkAuthMiddleware, authorize, verifyToken } from "../middlewares/authMiddleware.js";

// School Admin controllers
import {
  createDeviceWithInstances,
  getDeviceInstances,
  getInstancesStats,
  addInstancesToDevice
} from "../controllers/School/schooladmin/deviceInstanceController.js";

// Lab Manager controllers
import {
  getAvailableDevicesForRequest,
  confirmReceiveDevices
} from "../controllers/LabManager/warehouseController.js";

import {
  getAvailableDevicesForBorrow,
  approveAndAssignDevices,
  rejectBorrowRequest,
  getPendingBorrowRequests
} from "../controllers/LabManager/borrowApprovalController.js";

import {
  getReturnInfo,
  receiveReturnDevices,
  getActiveReturns
} from "../controllers/LabManager/returnController.js";

// Common controllers
import {
  getDeviceInstanceHistory,
  getDeviceInstanceSummary,
  compareModelInstances
} from "../controllers/common/deviceInstanceHistoryController.js";

import {
  getDashboardOverview,
  getBorrowTrends,
  getDeviceUtilization,
  getRepairCosts,
  getDashboardAlerts
} from "../controllers/common/dashboardController.js";

const router = express.Router();

// ===== SCHOOL ADMIN ROUTES =====
router.post(
  "/school-admin/devices/create-with-instances",
  checkAuthMiddleware,
  authorize("school_admin"),
  createDeviceWithInstances
);

router.get(
  "/school-admin/devices/:deviceId/instances",
  checkAuthMiddleware,
  authorize("school_admin", "lab_manager"),
  getDeviceInstances
);

router.get(
  "/school-admin/devices/instances/stats",
  checkAuthMiddleware,
  authorize("school_admin"),
  getInstancesStats
);

router.post(
  "/school-admin/devices/:deviceId/add-instances",
  checkAuthMiddleware,
  authorize("school_admin"),
  addInstancesToDevice
);

// ===== LAB MANAGER ROUTES =====

// Nhận từ kho
router.get(
  "/lab-manager/warehouse-requests/:id/available-devices",
  checkAuthMiddleware,
  authorize("lab_manager"),
  getAvailableDevicesForRequest
);

router.post(
  "/lab-manager/warehouse-requests/:id/confirm-receive",
  checkAuthMiddleware,
  authorize("lab_manager"),
  confirmReceiveDevices
);

// Phê duyệt đơn mượn
router.get(
  "/lab-manager/borrow-requests/pending",
  checkAuthMiddleware,
  authorize("lab_manager"),
  getPendingBorrowRequests
);

router.get(
  "/lab-manager/borrow-requests/:id/available-devices",
  checkAuthMiddleware,
  authorize("lab_manager"),
  getAvailableDevicesForBorrow
);

router.post(
  "/lab-manager/borrow-requests/:id/approve-and-assign",
  checkAuthMiddleware,
  authorize("lab_manager"),
  approveAndAssignDevices
);

router.post(
  "/lab-manager/borrow-requests/:id/reject",
  checkAuthMiddleware,
  authorize("lab_manager"),
  rejectBorrowRequest
);

// Nhận trả thiết bị
router.get(
  "/lab-manager/borrow-requests/:id/return-info",
  checkAuthMiddleware,
  authorize("lab_manager"),
  getReturnInfo
);

router.post(
  "/lab-manager/borrow-requests/:id/receive-return",
  checkAuthMiddleware,
  authorize("lab_manager"),
  receiveReturnDevices
);

router.get(
  "/lab-manager/returns/active",
  checkAuthMiddleware,
  authorize("lab_manager"),
  getActiveReturns
);

// ===== COMMON ROUTES (All roles) =====

// Lịch sử thiết bị
router.get(
  "/device-instances/:id/history",
  verifyToken,
  getDeviceInstanceHistory
);

router.get(
  "/device-instances/:id/summary",
  verifyToken,
  getDeviceInstanceSummary
);

router.get(
  "/device-models/:modelId/instances-comparison",
  verifyToken,
  compareModelInstances
);

// Dashboard
router.get(
  "/dashboard/overview",
  verifyToken,
  getDashboardOverview
);

router.get(
  "/dashboard/charts/borrow-trends",
  verifyToken,
  getBorrowTrends
);

router.get(
  "/dashboard/charts/device-utilization",
  verifyToken,
  getDeviceUtilization
);

router.get(
  "/dashboard/charts/repair-costs",
  verifyToken,
  getRepairCosts
);

router.get(
  "/dashboard/alerts",
  verifyToken,
  getDashboardAlerts
);

export default router;

