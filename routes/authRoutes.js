const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  isUserLoggedIn,
  getUserData,
} = require("../controllers/authController.js");
const { verifyToken, requireFreshToken } = require("../jwtMiddleware.js");

const router = express.Router();

// Rute untuk registrasi
router.post("/register", async (req, res) => {
  try {
    // Middleware registerUser sekarang hanya butuh fullName dan password
    const { fullName, password, walletAddress } = req.body;
    const result = await registerUser(fullName, password, walletAddress);

    res.status(200).json({
      success: true,
      data: result, // Kirim kembali objek result yang berisi transactionData
      message: "Data transaksi registrasi siap, silakan lanjutkan dari klien.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { walletAddress, password } = req.body;

    if (!walletAddress || !password) {
      return res.status(400).json({
        success: false,
        message: "Wallet address dan password harus disertakan.",
      });
    }

    const result = await loginUser(walletAddress, password);

    console.log("Transaction sent:", result);

    res.status(200).json({
      success: true,
      message: "Verifikasi berhasil. Silakan konfirmasi transaksi on-chain.",
      ...result,
    });
  } catch (error) {
    // Tangkap error yang dilempar oleh loginUser (misal: "Pengguna belum terdaftar.")
    console.error(
      `Login attempt failed for ${req.body.walletAddress}: ${error.message}`
    );

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

// Rute untuk mendapatkan data pengguna berdasarkan wallet address
router.get("/user/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const userData = await getUserData(walletAddress);
    res.status(200).json({ success: true, userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Rute untuk logout (validasi token server & dapatkan data transaksi logout on-chain)
router.post("/logout", verifyToken, requireFreshToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const result = await logoutUser(token); // result berisi { message, logoutTransactionData, publicKey }

    // Kirim semua field dari result ke klien
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Logout route error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Rute untuk memeriksa status login pengguna (on-chain)
router.get("/isLoggedIn", verifyToken, requireFreshToken, async (req, res) => {
  try {
    const userAddress = req.user.publicKey;
    const isLoggedIn = await isUserLoggedIn(userAddress);
    res.status(200).json({ success: true, isLoggedIn });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
