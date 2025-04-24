# ParcelChain

A decentralized package tracking system built on Solana blockchain.

## Project URLs

Github : https://github.com/mahermeg17/MyParcelChain/tree/master

Devnet : https://explorer.solana.com/tx/5vFV2Pt5y2WoWhRPRj2NaaqGS7qMJDYfmznvbN7UeDSz7JpP7KdfjND9eCvWsba6BX1XGNqq6tPV7w3JmqxyFrYJ?cluster=devnet

Vircel : https://my-parcel-chain.vercel.app/

TRX sample: https://explorer.solana.com/tx/43jzkK5rVDW91CLe9HvSNzoEKBqKhqNXQmGj1fBprsD7znocQM9B2hJeUtUFnMCAxYTkuF6KsmCpTQzyetPe1DJr?cluster=devnet

## Project Structure

```
ParcelProject/
├── parcelchain-dapp/        # Solana program (Rust)
├── parcelchain-frontend/    # React frontend application
└── README.md                # This file
```

## Prerequisites

- Node.js (v16 or later)
- Rust (latest stable version)
- Solana CLI tools
- Anchor framework
- Yarn or npm package manager

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ParcelProject
```

### 2. Install Dependencies

#### Frontend
```bash
cd parcelchain-frontend
yarn install
```

#### Solana Program
```bash
cd parcelchain-dapp
yarn install
```

### 3. Build and Deploy

#### Build the Solana Program
```bash
cd parcelchain-dapp
anchor build
```

#### Deploy the Program
```bash
anchor deploy
```

### 4. Run the Frontend
```bash
cd parcelchain-frontend
yarn dev
```

## Features

- Package Registration
- Package Tracking
- Status Updates
- Package History
- Wallet Integration

## Smart Contract (parcelchain-dapp)

The Solana program handles:
- Package registration
- Status updates
- Package tracking
- Package history

## Frontend (parcelchain-frontend)

The React application provides:
- User-friendly interface
- Real-time package tracking
- Package management
- Wallet connection
- Transaction handling

## Development

### Running Tests
```bash
cd parcelchain-dapp
anchor test
```

### Building for Production
```bash
cd parcelchain-frontend
yarn build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 