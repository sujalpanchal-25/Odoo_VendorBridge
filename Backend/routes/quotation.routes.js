import { Router } from 'express';
import { body } from 'express-validator';
import { listQuotations, submitQuotation, getQuotationDetail, editQuotation, selectQuotation, compareQuotations } from '../controllers/quotationController.js';
import { verifyJWT, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(verifyJWT);

router.get('/', listQuotations);

router.post('/',
  allowRoles('vendor'),
  [
    body('rfq').isMongoId().withMessage('Valid RFQ ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one line item is required'),
    body('items.*.item').notEmpty().withMessage('Item name is required'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').isFloat({ min: 0.01 }).withMessage('Unit price must be positive'),
    body('deliveryDays').isInt({ min: 1 }).withMessage('Delivery days must be at least 1'),
    body('gstPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('GST percent must be between 0 and 100'),
  ],
  validate,
  submitQuotation
);

router.get('/:id', getQuotationDetail);

router.patch('/:id',
  allowRoles('vendor'),
  [
    body('items').optional().isArray({ min: 1 }).withMessage('Line items must be an array'),
    body('items.*.item').optional().notEmpty().withMessage('Item name cannot be empty'),
    body('items.*.qty').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').optional().isFloat({ min: 0.01 }).withMessage('Unit price must be positive'),
    body('deliveryDays').optional().isInt({ min: 1 }).withMessage('Delivery days must be at least 1'),
    body('gstPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('GST percent must be between 0 and 100'),
  ],
  validate,
  editQuotation
);

router.post('/:id/select', allowRoles('officer'), selectQuotation);
router.get('/compare/:rfqId', compareQuotations);

export default router;
