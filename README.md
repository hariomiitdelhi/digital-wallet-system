# Digital Wallet System

A digital wallet system with cash management and fraud detection capabilities. This platform allows users to register, deposit/withdraw virtual cash, and transfer funds to other users. The backend handles transaction processing, session security, and basic fraud detection logic.

## Features

- **User Authentication & Session Management**
  - Secure user registration and login with bcrypt password hashing
  - JWT token authentication
  - Protected endpoints with authentication middleware

- **Wallet Operations**
  - Deposit and withdraw virtual cash
  - Transfer funds between users
  - Transaction history tracking
  - Support for multiple currencies

- **Transaction Processing & Validation**
  - Atomic transactions
  - Validations to prevent overdrafts, negative deposits, and invalid transfers

- **Fraud Detection Logic**
  - Detection of multiple transfers in a short period
  - Flagging of sudden large withdrawals
  - Monitoring of suspicious transaction patterns

- **Admin & Reporting APIs**
  - View flagged transactions
  - Aggregate total user balances
  - View top users by balance or transaction volume

- **Bonus Features**
  - Scheduled job for daily fraud scans
  - Soft delete for accounts and transactions

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest and Supertest

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/digital-wallet-system.git
cd digital-wallet-system
```

2. Install dependencies
```
npm install
```

3. Set up environment variables
```
cp .env.example .env
```
Edit the `.env` file with your configuration.

4. Start the server
```
npm start
```

5. Access the API documentation
```
http://localhost:3000/api-docs
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `DELETE /api/auth/delete` - Delete user account (soft delete)

### Wallet
- `GET /api/wallet` - Get user wallet
- `POST /api/wallet` - Create a new wallet
- `POST /api/wallet/deposit` - Deposit funds to wallet
- `POST /api/wallet/withdraw` - Withdraw funds from wallet
- `POST /api/wallet/transfer` - Transfer funds to another user
- `GET /api/wallet/history` - Get transaction history

### Admin
- `GET /api/admin/flagged-transactions` - Get all flagged transactions
- `GET /api/admin/total-balances` - Get total user balances
- `GET /api/admin/top-users-balance` - Get top users by balance
- `GET /api/admin/top-users-volume` - Get top users by transaction volume
- `POST /api/admin/run-fraud-scan` - Run daily fraud scan

## Testing

Run the test suite:
```
npm test
```

## Project Structure

```
digital-wallet-system/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── app.js          # Express app
├── tests/              # Test files
├── .env                # Environment variables
├── .env.example        # Example environment variables
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting to prevent brute force attacks
- Input validation
- Fraud detection algorithms

## Future Enhancements

- Real-time notifications for transactions
- Two-factor authentication
- Enhanced fraud detection with machine learning
- Mobile app integration
- Support for more currencies and exchange rates
