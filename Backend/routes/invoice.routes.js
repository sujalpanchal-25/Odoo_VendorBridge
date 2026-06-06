import { Router } from 'express';
import { body } from 'express-validator';
import { listInvoices, generateInvoice, getInvoiceDetail, downloadInvoicePdf, getInvoicePrintUrl, emailInvoice, markInvoicePaid } from '../controllers/invoiceController.js';
import { verifyJWT, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(verifyJWT);

router.get('/', listInvoices);

router.post('/',
  allowRoles('officer', 'admin'),
  [
    body('poId').isMongoId().withMessage('Valid Purchase Order ID is required'),
  ],
  validate,
  generateInvoice
);

router.get('/:id', getInvoiceDetail);
router.get('/:id/download', downloadInvoicePdf);
router.get('/:id/print', getInvoicePrintUrl);
router.post('/:id/email', emailInvoice);
router.patch('/:id/mark-paid', allowRoles('officer', 'admin'), markInvoicePaid);

export default router;
