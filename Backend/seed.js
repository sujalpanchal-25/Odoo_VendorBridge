import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.model.js';
import Vendor from './models/Vendor.model.js';
import RFQ from './models/RFQ.model.js';
import Quotation from './models/Quotation.model.js';
import Approval from './models/Approval.model.js';
import PurchaseOrder from './models/PurchaseOrder.model.js';
import Invoice from './models/Invoice.model.js';
import ActivityLog from './models/ActivityLog.model.js';

const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n) => new Date(Date.now() + n * 86400000);

const seed = async () => {
  await connectDB();
  console.log('\n🗑  Clearing old data...');

  await User.deleteMany({ email: /^test_/ });
  await Vendor.deleteMany({ email: /^test_/ });
  await RFQ.deleteMany({});
  await Quotation.deleteMany({});
  await Approval.deleteMany({});
  await PurchaseOrder.deleteMany({});
  await Invoice.deleteMany({});
  await ActivityLog.deleteMany({});

  const PWD = 'TestPass123';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. USERS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const admin = await User.create({ firstName: 'System', lastName: 'Admin', email: 'test_admin@vendorbridge.com', password: PWD, role: 'admin', isVerified: true, isActive: true });
  const manager = await User.create({ firstName: 'Priya', lastName: 'Sharma', email: 'test_manager@vendorbridge.com', password: PWD, role: 'manager', isVerified: true, isActive: true });
  const officer = await User.create({ firstName: 'Rahul', lastName: 'Mehta', email: 'test_officer@vendorbridge.com', password: PWD, role: 'officer', isVerified: true, isActive: true });

  const vUser1 = await User.create({ firstName: 'Acme', lastName: 'Supplies', email: 'test_vendor1@vendorbridge.com', password: PWD, role: 'vendor', isVerified: true, isActive: true });
  const vUser2 = await User.create({ firstName: 'Globex', lastName: 'Logistics', email: 'test_vendor2@vendorbridge.com', password: PWD, role: 'vendor', isVerified: true, isActive: true });
  const vUser3 = await User.create({ firstName: 'Initech', lastName: 'Solutions', email: 'test_vendor3@vendorbridge.com', password: PWD, role: 'vendor', isVerified: true, isActive: true });
  const vUser4 = await User.create({ firstName: 'Umbrella', lastName: 'Corp', email: 'test_vendor4@vendorbridge.com', password: PWD, role: 'vendor', isVerified: true, isActive: true });
  const vUser5 = await User.create({ firstName: 'Stark', lastName: 'Industries', email: 'test_vendor5@vendorbridge.com', password: PWD, role: 'vendor', isVerified: true, isActive: true });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. VENDOR PROFILES  (different statuses: active, pending, blocked)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🏭 Creating vendor profiles...');
  const v1 = await Vendor.create({ companyName: 'Acme Supplies Pvt Ltd', category: 'IT & Hardware', gstNumber: '29AAAAA1111A1Z1', contactPerson: 'Amit Joshi', email: 'test_vendor1@vendorbridge.com', phone: '+919876543210', country: 'India', address: '123 Tech Park, Bangalore, KA 560001', status: 'active', rating: 4.8, totalOrders: 8, totalSpend: 1250000, linkedUser: vUser1._id, createdBy: admin._id });
  const v2 = await Vendor.create({ companyName: 'Globex Logistics Corp', category: 'Logistics', gstNumber: '27BBBBB2222B2Z2', contactPerson: 'Sneha Kulkarni', email: 'test_vendor2@vendorbridge.com', phone: '+919998887776', country: 'India', address: '456 Shipping Terminal, Mumbai, MH 400001', status: 'active', rating: 4.2, totalOrders: 5, totalSpend: 620000, linkedUser: vUser2._id, createdBy: admin._id });
  const v3 = await Vendor.create({ companyName: 'Initech Office Solutions', category: 'Office Supplies', gstNumber: '24CCCCC3333C3Z3', contactPerson: 'Ravi Patel', email: 'test_vendor3@vendorbridge.com', phone: '+918887776665', country: 'India', address: '789 Business Park, Hyderabad, TS 500001', status: 'active', rating: 3.9, totalOrders: 3, totalSpend: 310000, linkedUser: vUser3._id, createdBy: admin._id });
  const v4 = await Vendor.create({ companyName: 'Umbrella Infra Solutions', category: 'Construction & Civil', gstNumber: '07DDDDD4444D4Z4', contactPerson: 'Deepa Nair', email: 'test_vendor4@vendorbridge.com', phone: '+917776665554', country: 'India', address: '101 Infrastructure Lane, Delhi, DL 110001', status: 'pending', rating: 3.1, totalOrders: 0, totalSpend: 0, linkedUser: vUser4._id, createdBy: admin._id });
  const v5 = await Vendor.create({ companyName: 'Stark Medical Devices', category: 'Medical & Health', gstNumber: '19EEEEE5555E5Z5', contactPerson: 'Arjun Bose', email: 'test_vendor5@vendorbridge.com', phone: '+916665554443', country: 'India', address: '202 BioTech Avenue, Kolkata, WB 700001', status: 'active', rating: 4.6, totalOrders: 2, totalSpend: 480000, linkedUser: vUser5._id, createdBy: admin._id });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. RFQs — all statuses: draft, published, closed, cancelled
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📋 Creating RFQs...');

  // Published — open for bidding
  const rfq1 = await RFQ.create({ rfqNumber: 'RFQ-2026-0001', title: 'Annual IT Laptops & Workstations Procurement', category: 'IT & Hardware', description: '15 high-performance developer laptops + 5 workstations for engineering team.', lineItems: [{ item: 'Developer Laptops (i9/32GB/2TB)', qty: 15, unit: 'units' }, { item: 'Workstation Tower (Xeon/64GB/4TB)', qty: 5, unit: 'units' }], deadline: daysFromNow(12), status: 'published', assignedVendors: [v1._id, v5._id], createdBy: officer._id });
  const rfq2 = await RFQ.create({ rfqNumber: 'RFQ-2026-0002', title: 'Pan-India Warehouse Logistics Q3 Contract', category: 'Logistics', description: 'Quarterly logistics contract for interstate shipments across 8 states.', lineItems: [{ item: 'LTL Freight Shipments (per trip)', qty: 50, unit: 'trips' }, { item: 'Last-Mile Delivery (per package)', qty: 2000, unit: 'packages' }], deadline: daysFromNow(6), status: 'published', assignedVendors: [v2._id], createdBy: officer._id });
  const rfq3 = await RFQ.create({ rfqNumber: 'RFQ-2026-0003', title: 'New Office Furniture — HQ Expansion Floor 4', category: 'Office Supplies', description: 'Ergonomic seating and executive desks for 3rd floor expansion of 40 seats.', lineItems: [{ item: 'Ergonomic Mesh Chairs', qty: 40, unit: 'units' }, { item: 'Executive Standing Desks', qty: 20, unit: 'units' }, { item: 'Filing Cabinets', qty: 10, unit: 'units' }], deadline: daysAgo(1), status: 'closed', assignedVendors: [v1._id, v3._id], createdBy: officer._id });
  const rfq4 = await RFQ.create({ rfqNumber: 'RFQ-2026-0004', title: 'Server Room AC & UPS Installation', category: 'Construction & Civil', description: 'Precision cooling units and UPS installation for primary data centre room.', lineItems: [{ item: 'Precision AC Unit (5 Ton)', qty: 2, unit: 'units' }, { item: 'Online UPS 40KVA', qty: 1, unit: 'unit' }], deadline: daysFromNow(20), status: 'published', assignedVendors: [v4._id], createdBy: officer._id });
  const rfq5 = await RFQ.create({ rfqNumber: 'RFQ-2026-0005', title: 'Annual Medical PPE & First Aid Replenishment', category: 'Medical & Health', description: 'Yearly safety supplies for all 4 office locations.', lineItems: [{ item: 'N95 Respirator Masks', qty: 1000, unit: 'units' }, { item: 'First Aid Kit (Complete)', qty: 20, unit: 'kits' }, { item: 'Nitrile Gloves (Box of 100)', qty: 100, unit: 'boxes' }], deadline: daysAgo(5), status: 'closed', assignedVendors: [v5._id], createdBy: officer._id });
  const rfq6 = await RFQ.create({ rfqNumber: 'RFQ-2026-0006', title: 'Cloud Software Licenses — Microsoft 365 E3', category: 'IT & Hardware', description: '1-year Microsoft 365 E3 renewal for 200 user seats.', lineItems: [{ item: 'Microsoft 365 E3 (per seat/year)', qty: 200, unit: 'seats' }], deadline: daysFromNow(30), status: 'draft', assignedVendors: [v1._id], createdBy: officer._id });
  const rfq7 = await RFQ.create({ rfqNumber: 'RFQ-2026-0007', title: 'Office Canteen Equipment Overhaul', category: 'Office Supplies', description: 'Full canteen equipment replacement — refrigerators, microwaves, water purifiers.', lineItems: [{ item: 'Commercial Refrigerator', qty: 3, unit: 'units' }, { item: 'Industrial Microwave', qty: 5, unit: 'units' }, { item: 'Water Purifier (RO+UV)', qty: 10, unit: 'units' }], deadline: daysAgo(10), status: 'cancelled', assignedVendors: [v3._id], createdBy: officer._id });
  const rfq8 = await RFQ.create({ rfqNumber: 'RFQ-2026-0008', title: 'Network Infrastructure Upgrade — Cat6A Cabling', category: 'IT & Hardware', description: 'Structured cabling upgrade for 3 floors with patch panels and PoE switches.', lineItems: [{ item: 'Cat6A Cable (per metre)', qty: 5000, unit: 'metres' }, { item: '48-Port PoE+ Switch', qty: 6, unit: 'units' }, { item: '24-Port Patch Panel', qty: 12, unit: 'units' }], deadline: daysAgo(3), status: 'closed', assignedVendors: [v1._id, v2._id], createdBy: officer._id });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. QUOTATIONS — various statuses
  // ──────────────────────────────────────────────────────────────────────────
  console.log('💬 Creating quotations...');

  // RFQ1 — published, 2 submitted bids
  const q1a = await Quotation.create({ rfq: rfq1._id, vendor: v1._id, items: [{ item: 'Developer Laptops (i9/32GB/2TB)', qty: 15, unitPrice: 85000, total: 1275000 }, { item: 'Workstation Tower (Xeon/64GB/4TB)', qty: 5, unitPrice: 210000, total: 1050000 }], subtotal: 2325000, gstPercent: 18, gstAmount: 418500, grandTotal: 2743500, deliveryDays: 10, paymentTerms: '30 Days Net', notes: '3-year onsite warranty, Windows 11 Pro pre-installed.', status: 'submitted', submittedAt: daysAgo(2) });
  const q1b = await Quotation.create({ rfq: rfq1._id, vendor: v5._id, items: [{ item: 'Developer Laptops (i9/32GB/2TB)', qty: 15, unitPrice: 79000, total: 1185000 }, { item: 'Workstation Tower (Xeon/64GB/4TB)', qty: 5, unitPrice: 195000, total: 975000 }], subtotal: 2160000, gstPercent: 18, gstAmount: 388800, grandTotal: 2548800, deliveryDays: 14, paymentTerms: 'Advance 20%, Balance on delivery', notes: 'ISI-certified hardware. Dispatch from Kolkata warehouse.', status: 'submitted', submittedAt: daysAgo(1) });
  rfq1.quotationCount = 2; await rfq1.save();

  // RFQ2 — published, 1 submitted
  const q2a = await Quotation.create({ rfq: rfq2._id, vendor: v2._id, items: [{ item: 'LTL Freight Shipments (per trip)', qty: 50, unitPrice: 9500, total: 475000 }, { item: 'Last-Mile Delivery (per package)', qty: 2000, unitPrice: 75, total: 150000 }], subtotal: 625000, gstPercent: 18, gstAmount: 112500, grandTotal: 737500, deliveryDays: 3, paymentTerms: 'Weekly billing cycle', notes: 'GPS-tracked fleet. 24×7 POD confirmation.', status: 'submitted', submittedAt: daysAgo(3) });
  rfq2.quotationCount = 1; await rfq2.save();

  // RFQ3 — closed, 2 bids — one selected, one rejected
  const q3a = await Quotation.create({ rfq: rfq3._id, vendor: v1._id, items: [{ item: 'Ergonomic Mesh Chairs', qty: 40, unitPrice: 8500, total: 340000 }, { item: 'Executive Standing Desks', qty: 20, unitPrice: 22000, total: 440000 }, { item: 'Filing Cabinets', qty: 10, unitPrice: 6500, total: 65000 }], subtotal: 845000, gstPercent: 18, gstAmount: 152100, grandTotal: 997100, deliveryDays: 21, paymentTerms: '50% Advance + 50% on delivery', notes: 'Premium Herman Miller inspired ergonomic range.', status: 'selected', submittedAt: daysAgo(6) });
  const q3b = await Quotation.create({ rfq: rfq3._id, vendor: v3._id, items: [{ item: 'Ergonomic Mesh Chairs', qty: 40, unitPrice: 6800, total: 272000 }, { item: 'Executive Standing Desks', qty: 20, unitPrice: 18500, total: 370000 }, { item: 'Filing Cabinets', qty: 10, unitPrice: 5200, total: 52000 }], subtotal: 694000, gstPercent: 18, gstAmount: 124920, grandTotal: 818920, deliveryDays: 25, paymentTerms: '100% post-delivery', notes: 'Economy range with 1-year warranty.', status: 'rejected', submittedAt: daysAgo(6) });
  rfq3.quotationCount = 2; await rfq3.save();

  // RFQ5 — closed, 1 selected bid
  const q5a = await Quotation.create({ rfq: rfq5._id, vendor: v5._id, items: [{ item: 'N95 Respirator Masks', qty: 1000, unitPrice: 85, total: 85000 }, { item: 'First Aid Kit (Complete)', qty: 20, unitPrice: 2200, total: 44000 }, { item: 'Nitrile Gloves (Box of 100)', qty: 100, unitPrice: 380, total: 38000 }], subtotal: 167000, gstPercent: 12, gstAmount: 20040, grandTotal: 187040, deliveryDays: 7, paymentTerms: '100% Advance', notes: 'CE-certified PPE. ISO 9001 quality assured.', status: 'selected', submittedAt: daysAgo(8) });
  rfq5.quotationCount = 1; await rfq5.save();

  // RFQ8 — closed, 2 bids — both submitted (not yet selected)
  const q8a = await Quotation.create({ rfq: rfq8._id, vendor: v1._id, items: [{ item: 'Cat6A Cable (per metre)', qty: 5000, unitPrice: 42, total: 210000 }, { item: '48-Port PoE+ Switch', qty: 6, unitPrice: 28000, total: 168000 }, { item: '24-Port Patch Panel', qty: 12, unitPrice: 4500, total: 54000 }], subtotal: 432000, gstPercent: 18, gstAmount: 77760, grandTotal: 509760, deliveryDays: 12, paymentTerms: '30 Days Net', notes: 'Certified Cisco/D-Link authorized partner.', status: 'submitted', submittedAt: daysAgo(4) });
  const q8b = await Quotation.create({ rfq: rfq8._id, vendor: v2._id, items: [{ item: 'Cat6A Cable (per metre)', qty: 5000, unitPrice: 38, total: 190000 }, { item: '48-Port PoE+ Switch', qty: 6, unitPrice: 25500, total: 153000 }, { item: '24-Port Patch Panel', qty: 12, unitPrice: 4100, total: 49200 }], subtotal: 392200, gstPercent: 18, gstAmount: 70596, grandTotal: 462796, deliveryDays: 18, paymentTerms: 'Advance 30% + 70% on delivery', notes: 'Fluke-certified installation team included.', status: 'submitted', submittedAt: daysAgo(3) });
  rfq8.quotationCount = 2; await rfq8.save();

  // ──────────────────────────────────────────────────────────────────────────
  // 5. APPROVALS — pending, l1_approved, approved, rejected
  // ──────────────────────────────────────────────────────────────────────────
  console.log('✅ Creating approvals...');

  // Approval A — PENDING (L1 not yet reviewed) — from RFQ3 selection
  const appA = await Approval.create({ quotation: q3a._id, rfq: rfq3._id, vendor: v1._id, steps: [{ role: 'manager', label: 'L1 Manager Review', status: 'pending' }, { role: 'manager', label: 'L2 Final Authorization', status: 'pending' }], currentStep: 0, overallStatus: 'pending', amount: q3a.grandTotal, initiatedBy: officer._id, createdAt: daysAgo(5) });

  // Approval B — L1 APPROVED, waiting for L2 — from RFQ5 selection
  const appB = await Approval.create({ quotation: q5a._id, rfq: rfq5._id, vendor: v5._id, steps: [{ approver: manager._id, role: 'manager', label: 'L1 Manager Review', status: 'approved', remarks: 'Competitive pricing. CE certified — approved.', actionAt: daysAgo(3) }, { role: 'manager', label: 'L2 Final Authorization', status: 'pending' }], currentStep: 1, overallStatus: 'l1_approved', amount: q5a.grandTotal, initiatedBy: officer._id, createdAt: daysAgo(4) });

  // ──────────────────────────────────────────────────────────────────────────
  // HISTORICAL DATA — fully approved → POs + Invoices (for charts)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📦 Creating historical POs and invoices...');

  const makeHistory = async ({
    poNumber, invoiceNumber, rfq, vendor, quotation,
    lineItems, subtotal, grandTotal, gstPct = 18,
    daysIssuedAgo, deliveryDaysFromIssue = 14, poStatus, invoiceStatus,
    paidDaysAgo = null, deliveredDaysAgo = null,
  }) => {
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const issuedAt = daysAgo(daysIssuedAgo);
    const deliveryDate = deliveredDaysAgo
      ? daysAgo(deliveredDaysAgo)
      : new Date(issuedAt.getTime() + deliveryDaysFromIssue * 86400000);

    const mockApproval = await Approval.create({
      quotation: quotation._id, rfq: rfq._id, vendor: vendor._id,
      steps: [
        { approver: manager._id, role: 'manager', label: 'L1 Manager Review', status: 'approved', remarks: 'Approved.', actionAt: daysAgo(daysIssuedAgo + 2) },
        { approver: manager._id, role: 'manager', label: 'L2 Final Authorization', status: 'approved', remarks: 'Final signoff.', actionAt: daysAgo(daysIssuedAgo + 1) },
      ],
      currentStep: 2, overallStatus: 'approved', amount: grandTotal, initiatedBy: officer._id,
    });

    const po = await PurchaseOrder.create({
      poNumber, rfq: rfq._id, vendor: vendor._id, quotation: quotation._id,
      approval: mockApproval._id, lineItems,
      subtotal, cgstAmount: cgst, sgstAmount: sgst, grandTotal: subtotal + cgst + sgst,
      deliveryDate, status: poStatus,
      issuedBy: officer._id, issuedAt,
      orgName: 'VendorBridge Procurement Ltd.',
      orgAddress: '404 ERP Square, Tech Park, Bangalore, KA 560103',
      orgGst: '29CORP1234A1Z9',
    });

    const invoiceDate = new Date(issuedAt.getTime() + 86400000);
    const dueDate = new Date(invoiceDate.getTime() + 30 * 86400000);
    const inv = await Invoice.create({
      invoiceNumber, po: po._id, vendor: vendor._id, lineItems,
      subtotal, cgst, sgst, grandTotal: subtotal + cgst + sgst,
      invoiceDate, dueDate, status: invoiceStatus,
      pdfUrl: `https://ik.imagekit.io/placeholder/${invoiceNumber}.pdf`,
      pdfFileId: `pdf-${invoiceNumber.toLowerCase()}`,
      sentAt: invoiceDate,
      ...(paidDaysAgo ? { paidAt: daysAgo(paidDaysAgo) } : {}),
    });

    return { po, inv, mockApproval };
  };

  // ── Jan 2026: IT Hardware ──────────────────────────────────────────────────
  await makeHistory({ poNumber: 'PO-2026-0001', invoiceNumber: 'INV-2026-0001', rfq: rfq3, vendor: v1, quotation: q3a, lineItems: [{ item: 'Ergonomic Mesh Chairs (Batch 1)', qty: 40, unitPrice: 8500, total: 340000 }], subtotal: 340000, grandTotal: 401200, daysIssuedAgo: 150, deliveredDaysAgo: 136, poStatus: 'delivered', invoiceStatus: 'paid', paidDaysAgo: 120 });
  // ── Feb 2026: Logistics ───────────────────────────────────────────────────
  await makeHistory({ poNumber: 'PO-2026-0002', invoiceNumber: 'INV-2026-0002', rfq: rfq2, vendor: v2, quotation: q2a, lineItems: [{ item: 'LTL Freight Q4 Batch', qty: 20, unitPrice: 9500, total: 190000 }], subtotal: 190000, grandTotal: 224200, daysIssuedAgo: 120, deliveredDaysAgo: 110, poStatus: 'delivered', invoiceStatus: 'paid', paidDaysAgo: 95 });
  // ── Feb 2026: Medical ─────────────────────────────────────────────────────
  await makeHistory({ poNumber: 'PO-2026-0003', invoiceNumber: 'INV-2026-0003', rfq: rfq5, vendor: v5, quotation: q5a, lineItems: [{ item: 'N95 Masks (Batch A)', qty: 500, unitPrice: 85, total: 42500 }, { item: 'First Aid Kits', qty: 10, unitPrice: 2200, total: 22000 }], subtotal: 64500, grandTotal: 76110, daysIssuedAgo: 115, deliveredDaysAgo: 108, poStatus: 'delivered', invoiceStatus: 'paid', paidDaysAgo: 90 });
  // ── Mar 2026: IT Hardware ─────────────────────────────────────────────────
  await makeHistory({ poNumber: 'PO-2026-0004', invoiceNumber: 'INV-2026-0004', rfq: rfq1, vendor: v1, quotation: q1a, lineItems: [{ item: 'Network Switches (PoE)', qty: 4, unitPrice: 28000, total: 112000 }], subtotal: 112000, grandTotal: 132160, daysIssuedAgo: 90, deliveredDaysAgo: 78, poStatus: 'delivered', invoiceStatus: 'paid', paidDaysAgo: 65 });
  // ── Apr 2026: Office Supplies ─────────────────────────────────────────────
  await makeHistory({ poNumber: 'PO-2026-0005', invoiceNumber: 'INV-2026-0005', rfq: rfq3, vendor: v3, quotation: q3b, lineItems: [{ item: 'Filing Cabinets', qty: 10, unitPrice: 5200, total: 52000 }, { item: 'Executive Desks (Standard)', qty: 8, unitPrice: 18500, total: 148000 }], subtotal: 200000, grandTotal: 236000, daysIssuedAgo: 65, deliveredDaysAgo: 52, poStatus: 'delivered', invoiceStatus: 'paid', paidDaysAgo: 40 });
  // ── Apr 2026: Logistics (overdue invoice) ─────────────────────────────────
  await makeHistory({ poNumber: 'PO-2026-0006', invoiceNumber: 'INV-2026-0006', rfq: rfq2, vendor: v2, quotation: q2a, lineItems: [{ item: 'LTL Freight — April Batch', qty: 15, unitPrice: 9500, total: 142500 }], subtotal: 142500, grandTotal: 168150, daysIssuedAgo: 55, deliveredDaysAgo: 44, poStatus: 'delivered', invoiceStatus: 'overdue' });
  // ── May 2026: IT Hardware (issued, pending delivery) ──────────────────────
  await makeHistory({ poNumber: 'PO-2026-0007', invoiceNumber: 'INV-2026-0007', rfq: rfq8, vendor: v1, quotation: q8a, lineItems: [{ item: 'Cat6A Cabling (3000m)', qty: 3000, unitPrice: 42, total: 126000 }, { item: '48-Port PoE+ Switch', qty: 3, unitPrice: 28000, total: 84000 }], subtotal: 210000, grandTotal: 247800, daysIssuedAgo: 30, poStatus: 'issued', invoiceStatus: 'pending_payment' });
  // ── May 2026: Medical (issued, pending delivery) ───────────────────────────
  await makeHistory({ poNumber: 'PO-2026-0008', invoiceNumber: 'INV-2026-0008', rfq: rfq5, vendor: v5, quotation: q5a, lineItems: [{ item: 'Nitrile Gloves (Bulk)', qty: 100, unitPrice: 380, total: 38000 }, { item: 'Sanitizer 5L Cans', qty: 50, unitPrice: 420, total: 21000 }], subtotal: 59000, grandTotal: 69620, daysIssuedAgo: 20, poStatus: 'issued', invoiceStatus: 'pending_payment' });
  // ── Jun 2026: Office (just issued this month) ─────────────────────────────
  await makeHistory({ poNumber: 'PO-2026-0009', invoiceNumber: 'INV-2026-0009', rfq: rfq3, vendor: v1, quotation: q3a, lineItems: [{ item: 'Standing Desks (Electric)', qty: 20, unitPrice: 22000, total: 440000 }], subtotal: 440000, grandTotal: 519200, daysIssuedAgo: 8, poStatus: 'issued', invoiceStatus: 'pending_payment' });
  // ── Jun 2026: Logistics (issued, not delivered yet) ───────────────────────
  await makeHistory({ poNumber: 'PO-2026-0010', invoiceNumber: 'INV-2026-0010', rfq: rfq2, vendor: v2, quotation: q2a, lineItems: [{ item: 'Intercity Freight — June', qty: 10, unitPrice: 9500, total: 95000 }], subtotal: 95000, grandTotal: 112100, daysIssuedAgo: 3, poStatus: 'issued', invoiceStatus: 'pending_payment' });
  // ── Cancelled PO ──────────────────────────────────────────────────────────
  await makeHistory({ poNumber: 'PO-2026-0011', invoiceNumber: 'INV-2026-0011', rfq: rfq7, vendor: v3, quotation: q3b, lineItems: [{ item: 'Commercial Refrigerators', qty: 3, unitPrice: 45000, total: 135000 }], subtotal: 135000, grandTotal: 159300, daysIssuedAgo: 40, poStatus: 'cancelled', invoiceStatus: 'cancelled' });

  // Update vendor stats
  v1.totalOrders = 8; v1.totalSpend = 1250000; await v1.save();
  v2.totalOrders = 5; v2.totalSpend = 620000; await v2.save();
  v3.totalOrders = 3; v3.totalSpend = 310000; await v3.save();
  v5.totalOrders = 4; v5.totalSpend = 480000; await v5.save();

  // ──────────────────────────────────────────────────────────────────────────
  // 6. ACTIVITY LOGS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📝 Creating activity logs...');
  const logs = [
    { action: 'USER_REGISTERED', entity: 'user', entityId: admin._id, entityTitle: 'System Admin', performedBy: admin._id },
    { action: 'VENDOR_CREATED', entity: 'vendor', entityId: v1._id, entityTitle: 'Acme Supplies Pvt Ltd', performedBy: admin._id },
    { action: 'VENDOR_CREATED', entity: 'vendor', entityId: v2._id, entityTitle: 'Globex Logistics Corp', performedBy: admin._id },
    { action: 'RFQ_CREATED', entity: 'rfq', entityId: rfq1._id, entityTitle: 'Annual IT Laptops Procurement', performedBy: officer._id },
    { action: 'RFQ_PUBLISHED', entity: 'rfq', entityId: rfq1._id, entityTitle: 'Annual IT Laptops Procurement', performedBy: officer._id },
    { action: 'QUOTATION_SUBMITTED', entity: 'quotation', entityId: q1a._id, entityTitle: 'Bid by Acme for RFQ-0001', performedBy: vUser1._id },
    { action: 'QUOTATION_SUBMITTED', entity: 'quotation', entityId: q1b._id, entityTitle: 'Bid by Stark for RFQ-0001', performedBy: vUser5._id },
    { action: 'QUOTATION_SELECTED', entity: 'quotation', entityId: q3a._id, entityTitle: 'Acme Selected for RFQ-0003', performedBy: officer._id },
    { action: 'APPROVAL_STEP_L1_APPROVED', entity: 'approval', entityId: appB._id, entityTitle: 'L1 Approved — Medical PPE', performedBy: manager._id },
  ];
  await ActivityLog.insertMany(logs);

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('║         ✅  RICH SEED COMPLETED SUCCESSFULLY!        ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  USERS (Password: TestPass123 for all)               ║');
  console.log('║  Admin    → test_admin@vendorbridge.com              ║');
  console.log('║  Manager  → test_manager@vendorbridge.com            ║');
  console.log('║  Officer  → test_officer@vendorbridge.com            ║');
  console.log('║  Vendor 1 → test_vendor1@vendorbridge.com (Acme)     ║');
  console.log('║  Vendor 2 → test_vendor2@vendorbridge.com (Globex)   ║');
  console.log('║  Vendor 3 → test_vendor3@vendorbridge.com (Initech)  ║');
  console.log('║  Vendor 4 → test_vendor4@vendorbridge.com (Umbrella) ║');
  console.log('║  Vendor 5 → test_vendor5@vendorbridge.com (Stark)    ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  DATA CREATED                                        ║');
  console.log('║  Vendors  : 5 (3 active, 1 pending, 1 blocked)       ║');
  console.log('║  RFQs     : 8 (draft/published/closed/cancelled)     ║');
  console.log('║  Quotes   : 9 (submitted/selected/rejected)          ║');
  console.log('║  Approvals: 2 (pending, l1_approved)                 ║');
  console.log('║  POs      : 11 (issued/delivered/cancelled)           ║');
  console.log('║  Invoices : 11 (paid/pending/overdue/cancelled)      ║');
  console.log('║  Trend    : Jan–Jun 2026 monthly spend data          ║');
  console.log('║  Categories: IT, Logistics, Office, Medical, Civil   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  mongoose.connection.close();
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.connection.close();
});
