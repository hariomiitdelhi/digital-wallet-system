const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getFlaggedTransactions,
  getTotalBalances,
  getTopUsersByBalance,
  getTopUsersByVolume,
  runFraudScan
} = require('../controllers/adminController');

/**
 * @swagger
 * /api/admin/flagged-transactions:
 *   get:
 *     summary: Get all flagged transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of transactions to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of transactions to skip
 *     responses:
 *       200:
 *         description: Flagged transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/flagged-transactions', auth, adminAuth, getFlaggedTransactions);

/**
 * @swagger
 * /api/admin/total-balances:
 *   get:
 *     summary: Get total user balances by currency
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total balances retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/total-balances', auth, adminAuth, getTotalBalances);

/**
 * @swagger
 * /api/admin/top-users-balance:
 *   get:
 *     summary: Get top users by balance
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [USD, EUR, GBP, BTC, ETH]
 *           default: USD
 *         description: Currency type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to return
 *     responses:
 *       200:
 *         description: Top users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/top-users-balance', auth, adminAuth, getTopUsersByBalance);

/**
 * @swagger
 * /api/admin/top-users-volume:
 *   get:
 *     summary: Get top users by transaction volume
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to return
 *     responses:
 *       200:
 *         description: Top users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privileges required
 *       500:
 *         description: Server error
 */
router.get('/top-users-volume', auth, adminAuth, getTopUsersByVolume);

/**
 * @swagger
 * /api/admin/run-fraud-scan:
 *   post:
 *     summary: Run daily fraud scan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fraud scan completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin privileges required
 *       500:
 *         description: Server error
 */
router.post('/run-fraud-scan', auth, adminAuth, runFraudScan);

module.exports = router;
