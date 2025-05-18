const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const config = require('../config/config');

// Check for multiple transfers in a short period
const checkMultipleTransfers = async (userId) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentTransfers = await Transaction.countDocuments({
    sender: userId,
    type: 'TRANSFER',
    createdAt: { $gte: oneHourAgo },
    isActive: true
  });
  
  return recentTransfers >= config.FRAUD_DETECTION.MAX_TRANSFERS_PER_HOUR;
};

// Check for sudden large withdrawals
const checkLargeWithdrawal = async (userId, amount, walletId) => {
  const wallet = await Wallet.findOne({ _id: walletId, user: userId, isActive: true });
  
  if (!wallet) return false;
  
  // If withdrawal is more than 70% of current balance, flag it
  const withdrawalRatio = amount / wallet.balance;
  return withdrawalRatio >= config.FRAUD_DETECTION.SUSPICIOUS_WITHDRAWAL_THRESHOLD;
};

// Check for large transfers
const checkLargeTransfer = (amount) => {
  return amount >= config.FRAUD_DETECTION.LARGE_TRANSFER_THRESHOLD;
};

// Main fraud detection service
const detectFraud = async (transaction) => {
  const { sender, type, amount, walletId } = transaction;
  let isFraudulent = false;
  let reason = null;
  
  // Check for multiple transfers
  if (type === 'TRANSFER') {
    const hasMultipleTransfers = await checkMultipleTransfers(sender);
    if (hasMultipleTransfers) {
      isFraudulent = true;
      reason = 'Multiple transfers in a short period';
    }
    
    // Check for large transfers
    const isLargeTransfer = checkLargeTransfer(amount);
    if (isLargeTransfer) {
      isFraudulent = true;
      reason = reason ? `${reason}, Large transfer amount` : 'Large transfer amount';
    }
  }
  
  // Check for large withdrawals
  if (type === 'WITHDRAWAL') {
    const isLargeWithdrawal = await checkLargeWithdrawal(sender, amount, walletId);
    if (isLargeWithdrawal) {
      isFraudulent = true;
      reason = 'Sudden large withdrawal';
    }
  }
  
  return { isFraudulent, reason };
};

// Daily fraud scan (for scheduled job)
const dailyFraudScan = async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Find all transactions from the last 24 hours
  const recentTransactions = await Transaction.find({
    createdAt: { $gte: oneDayAgo },
    isActive: true,
    flagged: false // Only check non-flagged transactions
  });
  
  let flaggedCount = 0;
  
  // Check each transaction for fraud
  for (const transaction of recentTransactions) {
    const { isFraudulent, reason } = await detectFraud(transaction);
    
    if (isFraudulent) {
      transaction.flagged = true;
      transaction.flagReason = reason;
      transaction.status = 'FLAGGED';
      await transaction.save();
      flaggedCount++;
    }
  }
  
  return {
    scannedCount: recentTransactions.length,
    flaggedCount,
    timestamp: new Date()
  };
};

module.exports = {
  detectFraud,
  dailyFraudScan
};
