import Invoice from '../models/Invoice.model.js';
import PurchaseOrder from '../models/PurchaseOrder.model.js';
import Vendor from '../models/Vendor.model.js';
import ActivityLog from '../models/ActivityLog.model.js';
import { createNotification } from '../services/notificationService.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { sendInvoiceEmail } from '../services/emailService.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listInvoices = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const parsedLimit = parseInt(limit, 10);

  const filters = {};
  if (status) {
    filters.status = status;
  }

  // Vendors see only their own invoices
  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ linkedUser: req.user._id, isDeleted: { $ne: true } });
    if (!vendor) {
      return res.json(new ApiResponse(200, { invoices: [], total: 0, page: parseInt(page, 10), limit: parsedLimit }, 'Vendor profile not found'));
    }
    filters.vendor = vendor._id;
  }

  const invoices = await Invoice.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate('po', 'poNumber status grandTotal')
    .populate('vendor', 'companyName category gstNumber contactPerson');

  const total = await Invoice.countDocuments(filters);

  return res.json(new ApiResponse(200, { invoices, total, page: parseInt(page, 10), limit: parsedLimit }, 'Invoices list fetched'));
});

export const generateInvoice = asyncHandler(async (req, res) => {
  const { poId } = req.body;

  const po = await PurchaseOrder.findById(poId).populate('vendor');
  if (!po) {
    throw new ApiError(404, 'Purchase Order not found');
  }

  // Check if invoice already exists
  const existingInvoice = await Invoice.findOne({ po: poId });
  if (existingInvoice) {
    throw new ApiError(400, 'Invoice has already been generated for this Purchase Order');
  }

  const invoice = new Invoice({
    po: po._id,
    vendor: po.vendor._id,
    lineItems: po.lineItems,
    subtotal: po.subtotal,
    cgst: po.cgstAmount,
    sgst: po.sgstAmount,
    grandTotal: po.grandTotal,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days due
    status: 'pending_payment'
  });

  const { url, fileId } = await generateInvoicePDF(invoice, po, po.vendor);
  invoice.pdfUrl = url;
  invoice.pdfFileId = fileId;
  await invoice.save();

  await ActivityLog.create({
    action: 'INVOICE_GENERATED',
    entity: 'invoice',
    entityId: invoice._id,
    entityTitle: `${invoice.invoiceNumber} - ${po.vendor.companyName}`,
    performedBy: req.user._id,
  });

  if (po.vendor.linkedUser) {
    await createNotification({
      user: po.vendor.linkedUser,
      title: 'New Invoice Generated',
      message: `Invoice ${invoice.invoiceNumber} has been generated for Purchase Order ${po.poNumber}.`,
      type: 'invoice',
      link: `/invoices/${invoice._id}`
    });
  }

  return res.status(201).json(new ApiResponse(201, invoice, 'Invoice generated successfully'));
});

export const getInvoiceDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id)
    .populate('po', 'poNumber issuedAt deliveryDate status')
    .populate('vendor', 'companyName category gstNumber contactPerson phone email address');

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  // Security check for vendors
  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ linkedUser: req.user._id, isDeleted: { $ne: true } });
    if (!vendor || invoice.vendor._id.toString() !== vendor._id.toString()) {
      throw new ApiError(403, 'Forbidden: You cannot access this invoice');
    }
  }

  return res.json(new ApiResponse(200, invoice, 'Invoice details fetched'));
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id);
  if (!invoice || !invoice.pdfUrl) {
    throw new ApiError(404, 'Invoice PDF not found or not generated');
  }

  // Fetch the PDF from ImageKit and stream it
  const response = await fetch(invoice.pdfUrl);
  if (!response.ok) {
    throw new ApiError(500, 'Failed to fetch invoice PDF from storage');
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(buffer);
});

export const getInvoicePrintUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id);
  if (!invoice || !invoice.pdfUrl) {
    throw new ApiError(404, 'Invoice PDF not found or not generated');
  }

  return res.json(new ApiResponse(200, { pdfUrl: invoice.pdfUrl }, 'Print URL fetched'));
});

export const emailInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id).populate('vendor').populate('po');
  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  if (!invoice.pdfUrl) {
    throw new ApiError(400, 'Invoice PDF is not generated yet');
  }

  // Fetch file from ImageKit
  const response = await fetch(invoice.pdfUrl);
  if (!response.ok) {
    throw new ApiError(500, 'Failed to retrieve invoice PDF for emailing');
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await sendInvoiceEmail(invoice.vendor.email, invoice, buffer, `${invoice.invoiceNumber}.pdf`);

  invoice.sentAt = new Date();
  await invoice.save();

  await ActivityLog.create({
    action: 'INVOICE_EMAILED',
    entity: 'invoice',
    entityId: invoice._id,
    entityTitle: `${invoice.invoiceNumber} - ${invoice.vendor.companyName}`,
    performedBy: req.user._id,
  });

  return res.json(new ApiResponse(200, {}, 'Invoice email sent successfully'));
});

export const markInvoicePaid = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id).populate('vendor');
  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  if (invoice.status === 'paid') {
    throw new ApiError(400, 'Invoice is already marked as paid');
  }

  invoice.status = 'paid';
  invoice.paidAt = new Date();
  await invoice.save();

  await ActivityLog.create({
    action: 'INVOICE_MARKED_PAID',
    entity: 'invoice',
    entityId: invoice._id,
    entityTitle: `${invoice.invoiceNumber} - ${invoice.vendor.companyName}`,
    performedBy: req.user._id,
  });

  return res.json(new ApiResponse(200, invoice, 'Invoice marked as paid successfully'));
});
