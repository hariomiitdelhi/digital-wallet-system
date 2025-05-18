const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { detectFraud } = require('../services/fraudDetection');

// Create a new wallet for a user
const createWallet = async (userId, currency = 'USD') => {
  try {
    const existingWallet = await Wallet.findOne({ 
      user: userId, 
      currency, 
      isActive: true 
    });
    
    if (existingWallet) {
      return { success: false, message: 'Wallet already exists for this currency' };
    }
    
    const wallet = new Wallet({
      user: userId,
      balance: 0,
      currency
    });
    
    await wallet.save();
    return { success: true, wallet };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get wallet by user ID and currency
const getWallet = async (userId, currency = 'USD') => {
  try {
    const wallet = await Wallet.findOne({ 
      user: userId, 
      currency, 
      isActive: true 
    });
    
    if (!wallet) {
      return { success: false, message: 'Wallet not found' };
    }
    
    return { success: true, wallet };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Deposit funds to wallet
const deposit = async (userId, walletId, amount, description = '') => {
  try {
    const wallet = await Wallet.findOne({ 
      _id: walletId, 
      user: userId, 
      isActive: true 
    });
    
    if (!wallet) {
      return { success: false, message: 'Wallet not found' };
    }
    
    if (amount <= 0) {
      return { success: false, message: 'Deposit amount must be positive' };
    }
    
    // Create transaction record
    const transaction = new Transaction({
      sender: userId,
      recipient: userId,
      walletId,
      type: 'DEPOSIT',
      amount,
      currency: wallet.currency,
      description,
      status: 'COMPLETED'
    });
    
    // Check for fraud
    const { isFraudulent, reason } = await detectFraud(transaction);
    if (isFraudulent) {
      transaction.flagged = true;
      transaction.flagReason = reason;
      transaction.status = 'FLAGGED';
      await transaction.save();
      return { success: false, message: 'Transaction flagged for review', transaction };
    }
    
    // Update wallet balance
    wallet.balance += amount;
    await wallet.save();
    await transaction.save();
    
    return { success: true, transaction, newBalance: wallet.balance };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Withdraw funds from wallet
const withdraw = async (userId, walletId, amount, description = '') => {
  try {
    const wallet = await Wallet.findOne({ 
      _id: walletId, 
      user: userId, 
      isActive: true 
    });
    
    if (!wallet) {
      return { success: false, message: 'Wallet not found' };
    }
    
    if (amount <= 0) {
      return { success: false, message: 'Withdrawal amount must be positive' };
    }
    
    if (wallet.balance < amount) {
      return { success: false, message: 'Insufficient funds' };
    }
    
    // Create transaction record
    const transaction = new Transaction({
      sender: userId,
      recipient: userId,
      walletId,
      type: 'WITHDRAWAL',
      amount,
      currency: wallet.currency,
      description,
      status: 'PENDING'
    });
    
    // Check for fraud
    const { isFraudulent, reason } = await detectFraud(transaction);
    if (isFraudulent) {
      transaction.flagged = true;
      transaction.flagReason = reason;
      transaction.status = 'FLAGGED';
      await transaction.save();
      return { success: false, message: 'Transaction flagged for review', transaction };
    }
    
    // Update wallet balance
    wallet.balance -= amount;
    transaction.status = 'COMPLETED';
    await wallet.save();
    await transaction.save();
    
    return { success: true, transaction, newBalance: wallet.balance };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Transfer funds between users
const transfer = async (senderId, recipientId, amount, description = '', currency = 'USD') => {
  try {
    if (senderId === recipientId) {
      return { success: false, message: 'Cannot transfer to yourself' };
    }
    
    // Check if recipient exists
    const recipient = await User.findOne({ _id: recipientId, isActive: true });
    if (!recipient) {
      return { success: false, message: 'Recipient not found' };
    }
    
    // Get sender's wallet
    const senderWalletResult = await getWallet(senderId, currency);
    if (!senderWalletResult.success) {
      return senderWalletResult;
    }
    const senderWallet = senderWalletResult.wallet;
    
    // Check if sender has enough funds
    if (senderWallet.balance < amount) {
      return { success: false, message: 'Insufficient funds' };
    }
    
    // Get or create recipient's wallet
    let recipientWalletResult = await getWallet(recipientId, currency);
    if (!recipientWalletResult.success) {
      recipientWalletResult = await createWallet(recipientId, currency);
      if (!recipientWalletResult.success) {
        return recipientWalletResult;
      }
    }
    const recipientWallet = recipientWalletResult.wallet;
    
    // Create transaction record
    const transaction = new Transaction({
      sender: senderId,
      recipient: recipientId,
      walletId: senderWallet._id,
      type: 'TRANSFER',
      amount,
      currency,
      description,
      status: 'PENDING'
    });
    
    // Check for fraud
    const { isFraudulent, reason } = await detectFraud(transaction);
    if (isFraudulent) {
      transaction.flagged = true;
      transaction.flagReason = reason;
      transaction.status = 'FLAGGED';
      await transaction.save();
      return { success: false, message: 'Transaction flagged for review', transaction };
    }
    
    // Update wallet balances (atomic operation)
    senderWallet.balance -= amount;
    recipientWallet.balance += amount;
    transaction.status = 'COMPLETED';
    
    await senderWallet.save();
    await recipientWallet.save();
    await transaction.save();
    
    return { success: true, transaction, newSenderBalance: senderWallet.balance };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get transaction history for a user
const getTransactionHistory = async (userId, limit = 20, skip = 0) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { recipient: userId }],
      isActive: true
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const count = await Transaction.countDocuments({
      $or: [{ sender: userId }, { recipient: userId }],
      isActive: true
    });
    
    return { success: true, transactions, count };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  createWallet,
  getWallet,
  deposit,
  withdraw,
  transfer,
  getTransactionHistory
};
