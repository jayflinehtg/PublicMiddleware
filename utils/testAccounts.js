const Web3 = require("web3").Web3;
const dotenv = require("dotenv");
dotenv.config();

// Initialize Web3 dengan Ganache
const web3 = new Web3(
  process.env.BLOCKCHAIN_RPC_URL || "https://tea-sepolia.g.alchemy.com/public"
);

// Nonce management variables (TAMBAHAN BARU)
const accountNonces = new Map(); // Menyimpan nonce per address
const nonceLocks = new Map(); // Lock mechanism untuk concurrent access

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

// Nonce management functions
async function getNextNonce(address) {
  // Wait for any existing lock
  if (nonceLocks.has(address)) {
    await nonceLocks.get(address);
  }

  // Create new lock
  const lockPromise = processNonce(address);
  nonceLocks.set(address, lockPromise);

  try {
    const nonce = await lockPromise;
    return nonce;
  } finally {
    nonceLocks.delete(address);
  }
}

async function processNonce(address) {
  try {
    // Jika belum ada nonce untuk address ini, ambil dari network
    if (!accountNonces.has(address)) {
      const networkNonce = await web3.eth.getTransactionCount(
        address,
        "pending"
      );
      accountNonces.set(address, BigInt(networkNonce));
      console.log(`🔍 Initial nonce for ${address}: ${networkNonce}`);
    }

    const currentNonce = accountNonces.get(address);

    const newNonce = currentNonce + BigInt(1);
    accountNonces.set(address, newNonce);

    console.log(`📈 Assigned nonce ${currentNonce.toString()} to ${address}`);

    return Number(currentNonce);
  } catch (error) {
    console.error(`❌ Error getting nonce for ${address}:`, error);
    throw error;
  }
}

async function syncNonce(address) {
  try {
    const networkNonce = await web3.eth.getTransactionCount(address, "pending");
    accountNonces.set(address, BigInt(networkNonce));
    console.log(`🔄 Synced nonce for ${address}: ${networkNonce}`);
    return Number(networkNonce);
  } catch (error) {
    console.error(`❌ Error syncing nonce for ${address}:`, error);
    throw error;
  }
}

async function resetAllNonces() {
  console.log("🔄 Resetting all nonces...");

  for (const account of TEST_ACCOUNTS) {
    const address = web3.eth.accounts.privateKeyToAccount(
      account.privateKey
    ).address;
    await syncNonce(address);
  }

  console.log("✅ All nonces reset successfully");
}

async function sendTransactionWithWallet(userId, transactionObject) {
  const account = getTestAccountFromWallet(userId);
  if (!account) {
    throw new Error(`Test account ${userId} not found`);
  }

  try {
    const nonce = await getNextNonce(account.address);

    transactionObject.from = account.address;
    transactionObject.nonce = Number(nonce);

    if (!transactionObject.gasPrice) {
      const gasPrice = await web3.eth.getGasPrice();
      transactionObject.gasPrice = gasPrice.toString();
    }

    console.log(
      `Sending transaction from ${account.fullName} (${account.address}) with nonce ${nonce}`
    );

    // Send transaction dengan retry mechanism
    let retries = 3;
    let receipt;

    while (retries > 0) {
      try {
        receipt = await web3.eth.sendTransaction(transactionObject);

        console.log(
          `✅ Transaction successful! Hash: ${receipt.transactionHash}, Nonce: ${nonce}`
        );
        return receipt;
      } catch (error) {
        retries--;

        if (error.message.includes("nonce too low")) {
          console.log(`Nonce too low error, syncing with network...`);
          await syncNonce(account.address);

          if (retries > 0) {
            // Get fresh nonce dan retry
            const newNonce = await getNextNonce(account.address);
            transactionObject.nonce = Number(newNonce);
            console.log(`Retrying with new nonce: ${newNonce}`);
          }
        } else if (
          error.message.includes("replacement transaction underpriced")
        ) {
          // Increase gas price by 10%
          const currentGasPrice = BigInt(transactionObject.gasPrice);
          transactionObject.gasPrice = (
            (currentGasPrice * BigInt(110)) /
            BigInt(100)
          ).toString();
          console.log(`Increased gas price to: ${transactionObject.gasPrice}`);
        } else if (retries === 0) {
          throw error;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error(
      `❌ Transaction failed for ${account.fullName}:`,
      error.message
    );
    throw error;
  }
}

module.exports = {
  TEST_ACCOUNTS,
  performanceWallet,
  web3,
  getTestAccountFromWallet,
  sendTransactionWithWallet,
  resetAllNonces,
  syncNonce,
  accountNonces,
};
