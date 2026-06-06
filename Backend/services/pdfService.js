import PDFDocument from 'pdfkit';
import imagekit from '../config/imagekit.js';

export async function generateInvoicePDF(invoice, po, vendor) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          // Upload to ImageKit under /invoices/
          try {
            const result = await imagekit.upload({
              file: pdfBuffer,
              fileName: `${invoice.invoiceNumber}.pdf`,
              folder: '/invoices',
              useUniqueFileName: false,
            });
            resolve({ url: result.url, fileId: result.fileId, buffer: pdfBuffer });
          } catch (uploadError) {
            console.warn('ImageKit upload failed. Falling back to local generation. Error:', uploadError.message);
            resolve({ url: null, fileId: null, buffer: pdfBuffer });
          }
        } catch (err) {
          reject(err);
        }
      });
      
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('VendorBridge', 50, 50);
      doc.fontSize(10).text('Procurement & Vendor Management ERP', 50, 75);
      doc.moveTo(50, 95).lineTo(545, 95).stroke();

      // Invoice details
      doc.fontSize(16).text('TAX INVOICE', 400, 50);
      doc.fontSize(10)
        .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 75)
        .text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 400, 90)
        .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 400, 105)
        .text(`PO Number: ${po.poNumber}`, 400, 120);

      // Vendor details
      doc.fontSize(11).text('Vendor:', 50, 110);
      doc.fontSize(10)
        .text(vendor.companyName, 50, 125)
        .text(`GST: ${vendor.gstNumber}`, 50, 140)
        .text(vendor.address || '', 50, 155);

      // Line items table
      const tableTop = 200;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Item', 50, tableTop).text('Qty', 250, tableTop)
         .text('Unit Price', 320, tableTop).text('Total', 450, tableTop);
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      let y = tableTop + 25;
      doc.font('Helvetica');
      for (const item of invoice.lineItems) {
        doc.text(item.item, 50, y)
           .text(item.qty.toString(), 250, y)
           .text(`₹${item.unitPrice.toLocaleString('en-IN')}`, 320, y)
           .text(`₹${item.total.toLocaleString('en-IN')}`, 450, y);
        y += 20;
      }

      // Totals
      y += 10;
      doc.moveTo(50, y).lineTo(545, y).stroke();
      y += 10;
      doc.text(`Subtotal: ₹${invoice.subtotal.toLocaleString('en-IN')}`, 350, y);
      doc.text(`CGST (9%): ₹${invoice.cgst.toLocaleString('en-IN')}`, 350, y + 15);
      doc.text(`SGST (9%): ₹${invoice.sgst.toLocaleString('en-IN')}`, 350, y + 30);
      doc.font('Helvetica-Bold').fontSize(12)
         .text(`Grand Total: ₹${invoice.grandTotal.toLocaleString('en-IN')}`, 350, y + 50);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
