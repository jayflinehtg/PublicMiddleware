const Web3 = require("web3").Web3;
const dotenv = require("dotenv");
dotenv.config();

// Initialize Web3 dengan Ganache
const web3 = new Web3(
  process.env.BLOCKCHAIN_RPC_URL || "https://tea-sepolia.g.alchemy.com/public"
);

// Hardcoded test accounts dari Ganache Anda
const TEST_ACCOUNTS = [
  {
    id: "testUser1",
    privateKey:
      "0x5acf8ddb872f9cda58be746b82dff8294671b1a9f95fc8b8b012cc7b047e59d9",
    fullName: "Test User 1 - Performance",
  },
  {
    id: "testUser2",
    privateKey:
      "0xdabab2195b384d2b9484771e1bd969981cd4097c73fec1b034ebf5d2f595b9bf",
    fullName: "Test User 2 - Performance",
  },
  {
    id: "testUser3",
    privateKey:
      "0x18706053d6c4fd950000013b8f7851b461c969df63c26e4d5820076871dce519",
    fullName: "Test User 3 - Performance",
  },
];

// Create wallet dengan test accounts
const performanceWallet = web3.eth.accounts.wallet.create(0); // Create empty wallet

// Add test accounts ke wallet
TEST_ACCOUNTS.forEach((account) => {
  try {
    performanceWallet.add(account.privateKey);
    console.log(
      `✅ Added ${account.id} to wallet: ${
        performanceWallet[performanceWallet.length - 1].address
      }`
    );
  } catch (error) {
    console.error(`❌ Error adding ${account.id} to wallet:`, error.message);
  }
});

// Debug: Print wallet contents
console.log(`🔍 Wallet contains ${performanceWallet.length} accounts`);
performanceWallet.forEach((account, index) => {
  console.log(`   Index ${index}: ${account.address}`);
});

// Fungsi untuk mendapatkan account dari wallet berdasarkan ID
function getTestAccountFromWallet(userId) {
  console.log(`🔍 Looking for userId: ${userId}`);
  console.log(
    `🔍 Available TEST_ACCOUNTS:`,
    TEST_ACCOUNTS.map((acc) => acc.id)
  );

  const accountIndex = TEST_ACCOUNTS.findIndex((acc) => acc.id === userId);
  console.log(`🔍 Found accountIndex: ${accountIndex}`);

  if (accountIndex === -1) return null;

  return {
    ...TEST_ACCOUNTS[accountIndex],
    address: performanceWallet[accountIndex].address,
    walletAccount: performanceWallet[accountIndex],
  };
}

// Fungsi untuk send transaction menggunakan wallet
async function sendTransactionWithWallet(userId, transactionObject) {
  const account = getTestAccountFromWallet(userId);
  if (!account) {
    throw new Error(`Test account ${userId} not found`);
  }

  // Set from address
  transactionObject.from = account.address;

  console.log(
    `🔄 Sending transaction from ${account.fullName} (${account.address})`
  );

  // Send transaction menggunakan wallet (otomatis signing)
  const receipt = await web3.eth.sendTransaction(transactionObject);

  console.log(`✅ Transaction successful! Hash: ${receipt.transactionHash}`);
  return receipt;
}

module.exports = {
  TEST_ACCOUNTS,
  performanceWallet,
  web3,
  getTestAccountFromWallet,
  sendTransactionWithWallet,
};
