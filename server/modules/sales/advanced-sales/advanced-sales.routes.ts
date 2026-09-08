import { Router, type Request, type Response, type NextFunction } from 'express';
import * as AdvancedSalesController from '../../../controllers/advanced-sales-controller';
import { requireAuth } from '../../system/auth';

const router = Router();
const requireOperator = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.user?.role === 'admin' || req.session?.user?.role === 'user') return next();
  return res.status(403).json({ success: false, error: 'Operazione riservata agli operatori autorizzati' });
};

// Operazioni vendita disponibili
router.get('/operations', AdvancedSalesController.getAvailableSaleOperations);
// Ceste attive vendibili selezionabili manualmente
router.get('/baskets', AdvancedSalesController.getAvailableSaleBaskets);

// Ordini disponibili per vendite
router.get('/orders', AdvancedSalesController.getAvailableOrders);

// Clienti per vendite
router.get('/customers', AdvancedSalesController.getCustomers);
router.get('/ddr-sequence', AdvancedSalesController.getDdrSequence);
router.put('/ddr-sequence', AdvancedSalesController.updateDdrSequence);
router.get('/order-reconciliation/preview', AdvancedSalesController.getOrderReconciliationPreview);
router.post('/order-reconciliation/apply', AdvancedSalesController.applyOrderReconciliation);
router.get('/order-reconciliation/manual/:saleId', AdvancedSalesController.getManualOrderReconciliation);
router.post('/order-reconciliation/manual/apply', AdvancedSalesController.applyManualOrderReconciliation);
router.post('/fic-billing-status', requireAuth, requireOperator, AdvancedSalesController.getFicBillingStatuses);

// CRUD vendite avanzate
router.get('/', AdvancedSalesController.getAdvancedSales);
router.get('/:id', AdvancedSalesController.getAdvancedSale);
router.post('/', AdvancedSalesController.createAdvancedSale);
router.post('/multi', AdvancedSalesController.createMultiCustomerSale);
router.patch('/:id/status', AdvancedSalesController.updateSaleStatus);
router.delete('/:id', AdvancedSalesController.deleteSale);

// Configurazione sacchi
router.post('/:saleId/bags', AdvancedSalesController.configureBags);

// Generazione e download PDF
router.get('/:id/generate-pdf', AdvancedSalesController.generateSalePDF);
router.get('/:id/download-pdf', AdvancedSalesController.downloadSalePDF);

// Generazione DDT e report PDF
router.post('/:id/generate-ddt', AdvancedSalesController.generateDDT);
router.get('/:id/report.pdf', AdvancedSalesController.generatePDFReport);
// Suite documentale operativa A4; le rotte PDF storiche restano disponibili.
router.get('/:id/documents/:kind.pdf', AdvancedSalesController.generateAdvancedSaleDocument);
router.get('/:id/traceability-links', requireAuth, requireOperator, AdvancedSalesController.getPublicTraceabilityLinks);
router.post('/:id/traceability-links/:linkId/revoke', requireAuth, requireOperator, AdvancedSalesController.revokePublicTraceabilityLink);

// Annullamento vendita (ripristino cesta e ciclo)
router.get('/operations/:operationId/details', AdvancedSalesController.getSaleOperationDetails);
router.post('/operations/:operationId/cancel', AdvancedSalesController.cancelSaleOperation);

// Note: DDT routes are handled separately in routes.ts due to different base path

export default router;
