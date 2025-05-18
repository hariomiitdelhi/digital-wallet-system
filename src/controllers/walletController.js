const { 
  createWallet, 
  getWallet, 
  deposit, 
  withdraw, 
  transfer, 
  getTransactionHistory 
} = require('../services/walletService');

// Get user wallet
const getUserWallet = async (req, res) => {
  try {
    const { currency = 'USD' } = req.query;
    const result = await getWallet(req.user._id, currency);
    
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }
    
    res.status(200).json({ wallet: result.wallet });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new wallet
const createUserWallet = async (req, res) => {
  try {
    const { currency = 'USD' } = req.body;
    const result = await createWallet(req.user._id, currency);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.status(201).json({ 
      message: 'Wallet created successfully', 
      wallet: result.wallet 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Deposit funds
const depositFunds = async (req, res) => {
  try {
    const { walletId, amount, description } = req.body;
    
    if (!walletId || !amount) {
      return res.status(400).json({ message: 'Wallet ID and amount are required' });
    }
    
    const result = await deposit(req.user._id, walletId, amount, description);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.status(200).json({
      message: 'Deposit successful',
      transaction: result.transaction,
      newBalance: result.newBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Withdraw funds
const withdrawFunds = async (req, res) => {
  try {
    const { walletId, amount, description } = req.body;
    
    if (!walletId || !amount) {
      return res.status(400).json({ message: 'Wallet ID and amount are required' });
    }
    
    const result = await withdraw(req.user._id, walletId, amount, description);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.status(200).json({
      message: 'Withdrawal successful',
      transaction: result.transaction,
      newBalance: result.newBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Transfer funds
const transferFunds = async (req, res) => {
  try {
    const { recipientId, amount, description, currency = 'USD' } = req.body;
    
    if (!recipientId || !amount) {
      return res.status(400).json({ message: 'Recipient ID and amount are required' });
    }
    
    const result = await transfer(req.user._id, recipientId, amount, description, currency);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.status(200).json({
      message: 'Transfer successful',
      transaction: result.transaction,
      newBalance: result.newSenderBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get transaction history
const getHistory = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const result = await getTransactionHistory(req.user._id, parseInt(limit), parseInt(skip));
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.status(200).json({
      transactions: result.transactions,
      count: result.count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserWallet,
  createUserWallet,
  depositFunds,
  withdrawFunds,
  transferFunds,
  getHistory
};
