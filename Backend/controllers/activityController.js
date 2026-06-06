import ActivityLog from '../models/ActivityLog.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Actions that are internal-only and should NEVER be exposed to vendors
const VENDOR_HIDDEN_ACTIONS = [
  'APPROVAL_STEP_L1_APPROVED',
  'APPROVAL_STEP_L2_APPROVED',
  'APPROVAL_FINAL_APPROVED',
  'APPROVAL_STEP_REJECTED',
  'USER_REGISTERED',
  'USER_ROLE_CHANGED',
  'VENDOR_STATUS_CHANGED',
  'VENDOR_DELETED',
];

/**
 * GET /api/activity
 * Full company-wide audit trail — Admin & Manager ONLY
 */
export const listActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, action, entity } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const parsedLimit = parseInt(limit, 10);

  const filters = {};
  if (action) filters.action = { $regex: action, $options: 'i' };
  if (entity) filters.entity = entity;

  const logs = await ActivityLog.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate('performedBy', 'firstName lastName email role avatar');

  const total = await ActivityLog.countDocuments(filters);

  return res.json(new ApiResponse(200, { logs, total, page: parseInt(page, 10), limit: parsedLimit }, 'Activity logs fetched'));
});

/**
 * GET /api/activity/mine
 * Personal activity log — every logged-in user can view their own actions.
 * Vendors see a filtered set (no internal approval/admin actions).
 */
export const getMyActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const parsedLimit = parseInt(limit, 10);

  const filters = { performedBy: req.user._id };

  // Vendors cannot see sensitive internal audit actions even in their own log
  if (req.user.role === 'vendor') {
    filters.action = { $nin: VENDOR_HIDDEN_ACTIONS };
  }

  const logs = await ActivityLog.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate('performedBy', 'firstName lastName email role avatar');

  const total = await ActivityLog.countDocuments(filters);

  return res.json(new ApiResponse(200, { logs, total, page: parseInt(page, 10), limit: parsedLimit }, 'My activity logs fetched'));
});
