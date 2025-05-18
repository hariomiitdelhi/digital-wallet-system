const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { dailyFraudScan } = require('../services/fraudDetection');

// Get all flagged transactions
const getFlaggedTransactions = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    
    const flaggedTransactions = await Transaction.find({
      flagged: true,
      isActive: true
    })
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .populate('sender', 'username email')
    .populate('recipient', 'username email');
    
    const count = await Transaction.countDocuments({
      flagged: true,
      isActive: true
    });
    
    res.status(200).json({
      flaggedTransactions,
      count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get total user balances
const getTotalBalances = async (req, res) => {
  try {
    const balances = await Wallet.aggregate([
      { $match: { isActive: true } },
      { $group: {
          _id: '$currency',
          totalBalance: { $sum: '$balance' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({ balances });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get top users by balance
const getTopUsersByBalance = async (req, res) => {
  try {
    const { currency = 'USD', limit = 10 } = req.query;
    
    const topUsers = await Wallet.find({
      currency,
      isActive: true
    })
    .sort({ balance: -1 })
    .limit(parseInt(limit))
    .populate('user', 'username email');
    
    res.status(200).json({ topUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get top users by transaction volume
const getTopUsersByVolume = async (req, res) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const topUsers = await Transaction.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          isActive: true
        } 
      },
      {
        $group: {
          _id: '$sender',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    // Populate user details
    const populatedUsers = await User.populate(topUsers, {
      path: '_id',
      select: 'username email'
    });
    
    res.status(200).json({ topUsers: populatedUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Run daily fraud scan
const runFraudScan = async (req, res) => {
  try {
    const result = await dailyFraudScan();
    
    res.status(200).json({
      message: 'Fraud scan completed successfully',
      result
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getFlaggedTransactions,
  getTotalBalances,
  getTopUsersByBalance,
  getTopUsersByVolume,
  runFraudScan
};
