import { Router, Request, Response } from 'express';
import { hosexpertsApi } from '../services/hosexpertsApi';
import { hosexpertsSync } from '../services/hosexpertsSync';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * Health / connectivity test with company's apiv2.php
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const status = await hosexpertsApi.ping();
    res.json({
      service: 'HoseXperts API Gateway',
      target: process.env.HOSEXPERTS_API_URL || 'https://api.hosexperts.com:85/apiv2.php',
      connected: status.ok,
      details: status
    });
  } catch (err: any) {
    res.status(502).json({
      service: 'HoseXperts API Gateway',
      connected: false,
      error: err.message
    });
  }
});

/**
 * Query company tables (Managers only)
 * e.g., fetching Z_SalesOrder records
 */
router.post('/query', requireAuth, requireRole('MANAGER'), async (req: Request, res: Response) => {
  try {
    const { table, columns, where, filters, joins, orderBy, page, limit, top, fetchAll } = req.body;
    if (!table) {
      return res.status(400).json({ error: 'Table is required' });
    }

    const result = await hosexpertsApi.select({
      table,
      columns,
      where,
      filters,
      joins,
      orderBy,
      page,
      limit,
      top,
      fetchAll
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[HoseXperts Query Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to query company API' });
  }
});

/**
 * List active Sales Orders from Z_SalesOrder
 */
router.get('/sales-orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const result = await hosexpertsApi.select({
      table: 'Z_SalesOrder',
      limit,
      page,
      orderBy: req.query.orderBy as string || 'DocEntry DESC'
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[HoseXperts SalesOrders Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch sales orders' });
  }
});

/**
 * Execute SP_FMS_ALTimeStampStatus (Drivers or Managers)
 * Records arrival/departure or stage milestones against company ERP/FMS
 */
router.post('/timestamp', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      PLTimeStamp,
      ALTimeStamp,
      DoerCode,
      RowID,
      AppID,
      StageNo,
      LeadTimeMins,
      KPIApplicable,
      ALHelper
    } = req.body;

    if (!DoerCode || !RowID || !AppID || !StageNo) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['DoerCode', 'RowID', 'AppID', 'StageNo']
      });
    }

    const result = await hosexpertsApi.executeALTimeStampStatus({
      PLTimeStamp,
      ALTimeStamp,
      DoerCode,
      RowID: Number(RowID),
      AppID,
      StageNo,
      LeadTimeMins: LeadTimeMins ? Number(LeadTimeMins) : 0,
      KPIApplicable,
      ALHelper
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[HoseXperts Timestamp SP Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to execute timestamp status SP' });
  }
});

/**
 * Execute SP_FMS_Pack2Dispatch_S2 (Managers only)
 */
router.post('/pack2dispatch', requireAuth, requireRole('MANAGER'), async (req: Request, res: Response) => {
  try {
    const { DocEntrySO } = req.body;
    if (!DocEntrySO) {
      return res.status(400).json({ error: 'DocEntrySO is required' });
    }

    const result = await hosexpertsApi.executePack2Dispatch(Number(DocEntrySO));
    return res.json(result);
  } catch (err: any) {
    console.error('[HoseXperts Pack2Dispatch Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to execute Pack2Dispatch SP' });
  }
});

/**
 * Bulk sync all local operational data to SQL Server via HoseXperts API Gateway
 */
router.post('/sync-all', requireAuth, requireRole('MANAGER'), async (_req: Request, res: Response) => {
  try {
    const summary = await hosexpertsSync.syncAll();
    return res.json({
      message: 'Bulk synchronization completed successfully',
      summary
    });
  } catch (err: any) {
    console.error('[HoseXperts Bulk Sync Error]', err);
    return res.status(500).json({ error: err.message || 'Bulk sync failed' });
  }
});

export default router;
