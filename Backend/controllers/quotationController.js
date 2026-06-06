import Quotation from '../models/Quotation.model.js';
import RFQ from '../models/RFQ.model.js';
import Vendor from '../models/Vendor.model.js';
import Approval from '../models/Approval.model.js';
import ActivityLog from '../models/ActivityLog.model.js';
import { createNotification } from '../services/notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

export const listQuotations = asyncHandler(async (req, res) => {
  const { rfqId, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const parsedLimit = parseInt(limit, 10);

  const filters = {};
  if (rfqId) {
    filters.rfq = rfqId;
  }

  // Vendors can only see their own quotations
  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ linkedUser: req.user._id, isDeleted: { $ne: true } });
    if (!vendor) {
      return res.json(new ApiResponse(200, { quotations: [], total: 0, page: parseInt(page, 10), limit: parsedLimit }, 'Vendor profile not found'));
    }
    filters.vendor = vendor._id;
  }

  const quotations = await Quotation.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate('rfq', 'rfqNumber title category deadline status')
    .populate('vendor', 'companyName category gstNumber contactPerson rating');

  const total = await Quotation.countDocuments(filters);

  return res.json(new ApiResponse(200, { quotations, total, page: parseInt(page, 10), limit: parsedLimit }, 'Quotations list fetched'));
});

export const submitQuotation = asyncHandler(async (req, res) => {
  const { rfq: rfqId, items, deliveryDays, gstPercent = 18, notes, paymentTerms, status = 'submitted' } = req.body;

  const rfq = await RFQ.findById(rfqId);
  if (!rfq) {
    throw new ApiError(404, 'RFQ not found');
  }

  if (rfq.status !== 'published') {
    throw new ApiError(400, 'Cannot submit quotations to a closed, draft, or cancelled RFQ');
  }

  if (new Date(rfq.deadline) < new Date()) {
    throw new ApiError(400, 'RFQ deadline has already passed');
  }

  const vendor = await Vendor.findOne({ linkedUser: req.user._id, isDeleted: { $ne: true } });
  if (!vendor) {
    throw new ApiError(403, 'Forbidden: Only verified vendors can submit quotations');
  }

  // Check if vendor already submitted a quotation
  const existingQuote = await Quotation.findOne({ rfq: rfqId, vendor: vendor._id });
  if (existingQuote) {
    throw new ApiError(400, 'You have already submitted a quotation for this RFQ. Please edit your existing quotation instead.');
  }

  // Calculations
  let subtotal = 0;
  const processedItems = items.map(item => {
    // Check item matching line item
    const total = parseFloat(item.unitPrice) * parseInt(item.qty, 10);
    subtotal += total;
    return {
      item: item.item,
      qty: parseInt(item.qty, 10),
      unitPrice: parseFloat(item.unitPrice),
      total
    };
  });

  const gstAmount = subtotal * (parseFloat(gstPercent) / 100);
  const grandTotal = subtotal + gstAmount;

  const quotation = await Quotation.create({
    rfq: rfqId,
    vendor: vendor._id,
    items: processedItems,
    subtotal,
    gstPercent: parseFloat(gstPercent),
    gstAmount,
    grandTotal,
    deliveryDays: parseInt(deliveryDays, 10),
    paymentTerms,
    notes,
    status,
    submittedAt: status === 'submitted' ? new Date() : null,
  });

  if (status === 'submitted') {
    rfq.quotationCount += 1;
    await rfq.save();

    // Notify RFQ creator (Officer / Admin)
    await createNotification({
      user: rfq.createdBy,
      title: 'Quotation Submitted',
      message: `${vendor.companyName} submitted a quotation for RFQ: ${rfq.title} (${rfq.rfqNumber}). Amount: ₹${grandTotal.toLocaleString('en-IN')}`,
      type: 'quotation',
      link: `/rfqs/${rfq._id}`
    });
  }

  await ActivityLog.create({
    action: `QUOTATION_${status.toUpperCase()}`,
    entity: 'quotation',
    entityId: quotation._id,
    entityTitle: `${rfq.rfqNumber} - ${vendor.companyName}`,
    performedBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, quotation, 'Quotation submitted successfully'));
});

export const getQuotationDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quotation = await Quotation.findById(id)
    .populate('rfq', 'rfqNumber title category deadline status lineItems')
    .populate('vendor', 'companyName category gstNumber contactPerson rating phone email address');

  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  // Security: Vendor can only see their own quotation
  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ linkedUser: req.user._id, isDeleted: { $ne: true } });
    if (!vendor || quotation.vendor._id.toString() !== vendor._id.toString()) {
      throw new ApiError(403, 'Forbidden: You cannot access this quotation');
    }
  }

  return res.json(new ApiResponse(200, quotation, 'Quotation details fetched'));
});

export const editQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items, deliveryDays, gstPercent = 18, notes, paymentTerms, status } = req.body;

  const quotation = await Quotation.findById(id).populate('rfq');
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  const vendor = await Vendor.findOne({ linkedUser: req.user._id, isDeleted: { $ne: true } });
  if (!vendor || quotation.vendor.toString() !== vendor._id.toString()) {
    throw new ApiError(403, 'Forbidden: You cannot edit this quotation');
  }

  if (quotation.status === 'selected' || quotation.status === 'rejected') {
    throw new ApiError(400, 'Cannot edit a selected or rejected quotation');
  }

  // Recalculations
  if (items) {
    let subtotal = 0;
    const processedItems = items.map(item => {
      const total = parseFloat(item.unitPrice) * parseInt(item.qty, 10);
      subtotal += total;
      return {
        item: item.item,
        qty: parseInt(item.qty, 10),
        unitPrice: parseFloat(item.unitPrice),
        total
      };
    });

    quotation.items = processedItems;
    quotation.subtotal = subtotal;
    const pGstPercent = gstPercent ? parseFloat(gstPercent) : quotation.gstPercent;
    quotation.gstAmount = subtotal * (pGstPercent / 100);
    quotation.grandTotal = subtotal + quotation.gstAmount;
  }

  if (deliveryDays) quotation.deliveryDays = parseInt(deliveryDays, 10);
  if (notes) quotation.notes = notes;
  if (paymentTerms) quotation.paymentTerms = paymentTerms;

  const oldStatus = quotation.status;
  if (status && ['draft', 'submitted'].includes(status)) {
    quotation.status = status;
    if (oldStatus === 'draft' && status === 'submitted') {
      quotation.submittedAt = new Date();
      quotation.rfq.quotationCount += 1;
      await quotation.rfq.save();

      // Notify RFQ creator (Officer / Admin)
      await createNotification({
        user: quotation.rfq.createdBy,
        title: 'Quotation Submitted',
        message: `${vendor.companyName} submitted a quotation for RFQ: ${quotation.rfq.title} (${quotation.rfq.rfqNumber}). Amount: ₹${quotation.grandTotal.toLocaleString('en-IN')}`,
        type: 'quotation',
        link: `/rfqs/${quotation.rfq._id}`
      });
    }
  }

  await quotation.save();

  await ActivityLog.create({
    action: 'QUOTATION_EDITED',
    entity: 'quotation',
    entityId: quotation._id,
    entityTitle: `${quotation.rfq.rfqNumber} - ${vendor.companyName}`,
    performedBy: req.user._id,
  });

  return res.json(new ApiResponse(200, quotation, 'Quotation updated successfully'));
});

export const selectQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quotation = await Quotation.findById(id).populate('rfq').populate('vendor');
  if (!quotation) {
    throw new ApiError(404, 'Quotation not found');
  }

  if (quotation.status !== 'submitted') {
    throw new ApiError(400, 'Only submitted quotations can be selected');
  }

  // Update this quotation to selected
  quotation.status = 'selected';
  await quotation.save();

  // Reject all other quotations for the same RFQ
  await Quotation.updateMany(
    { rfq: quotation.rfq._id, _id: { $ne: id }, status: 'submitted' },
    { $set: { status: 'rejected' } }
  );

  // Close the RFQ
  quotation.rfq.status = 'closed';
  await quotation.rfq.save();

  // Initialize the Approval steps workflow: L1 Review -> L2 Review -> PO Auto-Generate
  const approval = await Approval.create({
    quotation: quotation._id,
    rfq: quotation.rfq._id,
    vendor: quotation.vendor._id,
    steps: [
      { role: 'manager', label: 'L1 Review', status: 'pending' },
      { role: 'manager', label: 'L2 Review', status: 'pending' }
    ],
    currentStep: 0,
    overallStatus: 'pending',
    amount: quotation.grandTotal,
    initiatedBy: req.user._id,
  });

  // Notify Managers for L1 Approval
  const managers = await User.find({ role: 'manager', isActive: true });
  for (const manager of managers) {
    await createNotification({
      user: manager._id,
      title: 'Quotation Pending Approval',
      message: `A quotation from ${quotation.vendor.companyName} for ₹${quotation.grandTotal.toLocaleString('en-IN')} requires L1 Review.`,
      type: 'approval',
      link: `/approvals/${approval._id}`
    });
  }

  await ActivityLog.create({
    action: 'QUOTATION_SELECTED',
    entity: 'quotation',
    entityId: quotation._id,
    entityTitle: `${quotation.rfq.rfqNumber} - ${quotation.vendor.companyName}`,
    performedBy: req.user._id,
    meta: { approvalId: approval._id }
  });

  return res.json(new ApiResponse(200, { quotation, approval }, 'Quotation selected and approval workflow initiated'));
});

export const compareQuotations = asyncHandler(async (req, res) => {
  const { rfqId } = req.params;
  const rfqObjectId = new mongoose.Types.ObjectId(rfqId);

  // Aggregation matching lowest price
  const comparison = await Quotation.aggregate([
    { $match: { rfq: rfqObjectId, status: { $in: ['submitted', 'selected'] } } },
    { $lookup: { from: 'vendors', localField: 'vendor', foreignField: '_id', as: 'vendor' } },
    { $unwind: '$vendor' },
    { $sort: { grandTotal: 1 } }
  ]);

  // Post-process: mark index 0 as isLowest: true, others as false
  const processed = comparison.map((item, index) => ({
    ...item,
    isLowest: index === 0
  }));

  return res.json(new ApiResponse(200, processed, 'Quotations compared successfully'));
});
