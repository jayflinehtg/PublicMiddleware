require("dotenv").config(); // Ensure dotenv is loaded first
const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;

module.exports = {
  networks: {
    development: {
      host: "0.0.0.0",
      port: 7545,
      network_id: "5777",
    },
    public: {
      // Nama jaringan ini bisa kamu sesuaikan, tapi 'public' itu deskriptif
      provider: () => {
        // Validasi keberadaan private key dan RPC URL
        if (!privateKey) {
          throw new Error(
            "ACCOUNT_PRIVATE_KEY tidak ditemukan di .env untuk jaringan public. Pastikan Anda sudah menambahkannya."
          );
        }
        if (!rpcUrl) {
          throw new Error(
            "BLOCKCHAIN_RPC_URL tidak ditemukan di .env untuk jaringan public. Pastikan Anda sudah menambahkannya."
          );
        }
        // HDWalletProvider untuk menghubungkan private key ke RPC URL
        return new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: rpcUrl,
          pollingInterval: 20000, // Nilai tetap 20 detik
          numberOfAddresses: 1,
          shareNonce: true,
          derivationPath: "m/44'/60'/0'/0/",
          chainId: 10218,
          timeout: 90000,
        });
      },
      network_id: 10218, // Specific network ID instead of "*"
      gas: 8000000,
      gasPrice: 20000000000, // 20 gwei
      confirmations: 1,
      timeoutBlocks: 300,
      networkCheckTimeout: 180000, // 3 menit
      deploymentPollingInterval: 20000, // 20 detik polling
      skipDryRun: true,
      disableConfirmationListener: true, // untuk mengurangi request
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",
    },
  },
  contracts_directory: path.join(__dirname, "contracts"),
  contracts_build_directory: path.join(__dirname, "build", "contracts"),
  mocha: {
    timeout: 300000, // 5 menit
    slow: 30000,
  },
};
