require("dotenv").config(); // Ensure dotenv is loaded first
const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;

module.exports = {
  networks: {
    development: {
      host: "0.0.0.0",
      port: 7545, // Ganache default port
      network_id: "5777", // Match any network id
    },
    "tea-assam": {
      // Nama jaringan ini bisa kamu sesuaikan, tapi 'tea-assam' itu deskriptif
      provider: () => {
        // Validasi keberadaan private key dan RPC URL
        if (!privateKey) {
          throw new Error(
            "ACCOUNT_PRIVATE_KEY tidak ditemukan di .env untuk jaringan Tea-Assam. Pastikan Anda sudah menambahkannya."
          );
        }
        if (!rpcUrl) {
          throw new Error(
            "BLOCKCHAIN_RPC_URL tidak ditemukan di .env untuk jaringan Tea-Assam. Pastikan Anda sudah menambahkannya."
          );
        }
        // Gunakan HDWalletProvider untuk menghubungkan private key ke RPC URL
        return new HDWalletProvider(privateKey, rpcUrl);
      },
      network_id: "*", // Mengizinkan ID jaringan apa pun. Atau bisa spesifik jika Tea-Assam punya chain ID yang tetap.
      confirmations: 2, // Jumlah blok yang harus ditunggu untuk konfirmasi transaksi
      timeoutBlocks: 200, // Timeout untuk transaksi dalam blok
      skipDryRun: true, // Lewati dry run untuk jaringan publik (menghemat waktu dan sumber daya)
    },
  },
  compilers: {
    solc: {
      version: "0.8.0", // Specify the version of Solidity you are using
    },
  },
  contracts_directory: path.join(__dirname, "contracts"),
  contracts_build_directory: path.join(__dirname, "build", "contracts"),
  mocha: {
    // Configure testing timeout if needed
    // timeout: 100000
  },
};
