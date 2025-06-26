const express = require("express");
const {
  // Auth performance functions
  performanceRegisterUser,
  performanceLoginUser,
  performanceLogoutUser,

  // Plant performance functions
  performanceAddPlant,
  performanceEditPlant,
  performanceRatePlant,
  performanceLikePlant,
  performanceCommentPlant,

  // Read operations functions
  performanceSearchPlants,
  performanceGetAllPlants,
  performanceGetPlant,
  performanceGetPlantRatings,
  performanceGetComments,
  performanceGetAverageRating,
  performanceGetPlantRecord,
  performanceGetAllPlantRecord,
  performanceGetPlantTransactionHistory,
  performanceGetRecordCount,

  performanceAddFileToIPFS,
  performanceGetFileFromIPFS,
} = require("../controllers/performanceController.js");

const { verifyToken } = require("../jwtMiddleware.js");

const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diperbolehkan!"), false);
    }
    cb(null, true);
  },
});

// ==================== AUTH PERFORMANCE ROUTES ====================
// Performance testing untuk register user
router.post("/auth/register", performanceRegisterUser);

// Performance testing untuk login user
router.post("/auth/login", performanceLoginUser);

// Performance testing untuk logout user
router.post("/auth/logout", verifyToken, performanceLogoutUser);

// ==================== PLANT PERFORMANCE ROUTES ====================
// Performance testing untuk add plant
router.post("/plant/add", verifyToken, performanceAddPlant);

// Performance testing untuk edit plant
router.put("/plant/edit/:plantId", verifyToken, performanceEditPlant);

// Performance testing untuk rate plant
router.post("/plant/rate", verifyToken, performanceRatePlant);

// Performance testing untuk like plant
router.post("/plant/like", verifyToken, performanceLikePlant);

// Performance testing untuk comment plant
router.post("/plant/comment", verifyToken, performanceCommentPlant);

// ==================== READ OPERATIONS PERFORMANCE ROUTES ====================
// Performance testing untuk search plants
router.post("/plant/search", performanceSearchPlants);

// Performance testing untuk get all plants
router.post("/plant/getAll", performanceGetAllPlants);

// Performance testing untuk get average rating
router.post("/plant/averageRating/:plantId", performanceGetAverageRating);

// Performance testing untuk get plant ratings
router.post("/plant/ratings/:plantId", performanceGetPlantRatings);

// Performance testing untuk get comments
router.post("/plant/comments/:plantId", performanceGetComments);

// Performance testing untuk get single plant
router.post("/plant/:plantId", performanceGetPlant);

// Performance testing untuk add gambar ke IPFS
router.post("/ipfs/upload", upload.single("file"), verifyToken, performanceAddFileToIPFS);

// Performance testing untuk get gambar dari IPFS
router.post("/ipfs/getFile/:cid", performanceGetFileFromIPFS);

// Performance testing untuk get all plant records
router.post("/record/getAll", performanceGetAllPlantRecord);

// Performance testing untuk get record count
router.post("/record/count", performanceGetRecordCount);

// Performance testing untuk get plant transaction history
router.post("/record/history/:plantId", performanceGetPlantTransactionHistory);

// Performance testing untuk get plant record
router.post("/record/:recordIndex", performanceGetPlantRecord);

// ==================== UTILITY ROUTES ====================
// Get test accounts info
router.get("/test-accounts", (req, res) => {
  const { TEST_ACCOUNTS } = require("../utils/testAccounts.js");
  const accounts = TEST_ACCOUNTS.map((acc) => ({
    id: acc.id,
    fullName: acc.fullName,
  }));

  res.json({
    success: true,
    message: "Available test accounts for performance testing",
    testAccounts: accounts,
  });
});

// ==================== NONCE MANAGEMENT ROUTES ====================
// Reset nonces untuk debugging
router.post("/reset-nonces", async (req, res) => {
  try {
    const { resetAllNonces } = require("../utils/testAccounts.js");
    await resetAllNonces();

    res.json({
      success: true,
      message: "All nonces reset successfully",
    });
  } catch (error) {
    console.error("❌ Error resetting nonces:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get nonce status untuk debugging
router.get("/nonce-status", async (req, res) => {
  try {
    const {
      TEST_ACCOUNTS,
      web3,
      accountNonces,
    } = require("../utils/testAccounts.js");

    const status = [];
    for (const account of TEST_ACCOUNTS) {
      const address = web3.eth.accounts.privateKeyToAccount(
        account.privateKey
      ).address;
      const networkNonce = await web3.eth.getTransactionCount(
        address,
        "pending"
      );
      const localNonce = accountNonces.get(address) || "Not set";

      status.push({
        userId: account.id,
        address: address,
        networkNonce: networkNonce,
        localNonce: localNonce,
        fullName: account.fullName,
      });
    }

    res.json({
      success: true,
      nonceStatus: status,
    });
  } catch (error) {
    console.error("❌ Error getting nonce status:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
