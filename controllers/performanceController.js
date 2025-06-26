const { initialize } = require("../utils/blockchain.js");
const {
  sendTransactionWithWallet,
  getTestAccountFromWallet,
  TEST_ACCOUNTS,
  web3,
} = require("../utils/testAccounts.js");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ==================== AUTH PERFORMANCE TESTING ====================

// Performance testing untuk register user
async function performanceRegisterUser(req, res) {
  try {
    const { userId, fullName, password } = req.body;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(`Performance Test: Registering user ${testAccount.fullName}`);
    console.time("Performance Registration Process Time");

    // Validasi input
    if (!fullName || fullName.trim() === "") {
      throw new Error("Nama lengkap tidak boleh kosong");
    }
    if (!password || password.trim() === "") {
      throw new Error("Password tidak boleh kosong");
    }

    const { contract } = await initialize();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const transactionObject = {
      to: process.env.SMART_CONTRACT_ADDRESS,
      data: contract.methods.registerUser(fullName, passwordHash).encodeABI(),
      gas: 3000000,
    };

    const receipt = await sendTransactionWithWallet(userId, transactionObject);

    res.json({
      success: true,
      message: "Performance test user registered successfully",
      publicTxHash: receipt.transactionHash,
      testUser: testAccount.fullName,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("❌ Performance test register error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk login user
async function performanceLoginUser(req, res) {
  try {
    const { userId } = req.body;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(`Performance Test: Login user ${testAccount.fullName}`);
    console.time("Performance Login Process Time");

    const { contract } = await initialize();

    const userInfo = await contract.methods
      .getUserInfo(testAccount.address)
      .call();
    if (!userInfo.isRegistered) {
      return res.status(400).json({
        success: false,
        message: "Pengguna belum terdaftar.",
      });
    }

    const token = jwt.sign(
      { publicKey: testAccount.address },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const transactionObject = {
      to: process.env.SMART_CONTRACT_ADDRESS,
      data: contract.methods.login().encodeABI(),
      gas: 2000000,
    };

    const receipt = await sendTransactionWithWallet(userId, transactionObject);

    res.json({
      success: true,
      message: "Performance test user logged in successfully",
      token: token,
      publicTxHash: receipt.transactionHash,
      testUser: testAccount.fullName,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("❌ Performance test login error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk logout user
async function performanceLogoutUser(req, res) {
  try {
    const userAddress = req.user.publicKey;

    const testAccount = TEST_ACCOUNTS.find((acc) => {
      const address = web3.eth.accounts.privateKeyToAccount(
        acc.privateKey
      ).address;
      return address.toLowerCase() === userAddress.toLowerCase();
    });

    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Test account not found for authenticated user",
      });
    }

    console.log(`Performance Test: Logout user ${testAccount.fullName}`);

    const { contract } = await initialize();

    const transactionObject = {
      to: process.env.SMART_CONTRACT_ADDRESS,
      data: contract.methods.logout().encodeABI(),
      gas: 2000000,
    };

    const receipt = await sendTransactionWithWallet(
      testAccount.id,
      transactionObject
    );

    res.json({
      success: true,
      message: "Performance test user logged out successfully",
      publicTxHash: receipt.transactionHash,
      testUser: testAccount.fullName,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
      operation: "performanceLogout",
    });
  } catch (error) {
    console.error("❌ Performance test logout error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== PLANT PERFORMANCE TESTING ====================

// Performance testing untuk add plant
async function performanceAddPlant(req, res) {
  try {
    const userAddress = req.user.publicKey;

    const {
      userId,
      name,
      namaLatin,
      komposisi,
      manfaat,
      dosis,
      caraPengolahan,
      efekSamping,
      ipfsHash,
    } = req.body;

    const testAccount = TEST_ACCOUNTS.find((acc) => {
      const address = web3.eth.accounts.privateKeyToAccount(
        acc.privateKey
      ).address;
      return address.toLowerCase() === userAddress.toLowerCase();
    });

    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Test account not found for authenticated user",
      });
    }

    console.log(`Performance Test: Adding plant by ${testAccount.fullName}`);

    const { contract } = await initialize();

    const transactionObject = {
      to: process.env.SMART_CONTRACT_ADDRESS,
      data: contract.methods
        .addPlant(
          name,
          namaLatin,
          komposisi,
          manfaat,
          dosis,
          caraPengolahan,
          efekSamping,
          ipfsHash
        )
        .encodeABI(),
      gas: 5000000,
    };

    const receipt = await sendTransactionWithWallet(
      testAccount.id,
      transactionObject
    );

    res.json({
      success: true,
      message: "Performance test plant added successfully",
      publicTxHash: receipt.transactionHash,
      testUser: testAccount.fullName,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
      operation: "performanceAddPlant",
    });
  } catch (error) {
    console.error("❌ Performance test add plant error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk edit plant
async function performanceEditPlant(req, res) {
  try {
    const userAddress = req.user.publicKey; // Dari JWT token

    const { plantId } = req.params;
    const {
      name,
      namaLatin,
      komposisi,
      manfaat,
      dosis,
      caraPengolahan,
      efekSamping,
      ipfsHash,
    } = req.body;

    // Find testAccount dari address
    const testAccount = TEST_ACCOUNTS.find((acc) => {
      const address = web3.eth.accounts.privateKeyToAccount(
        acc.privateKey
      ).address;
      return address.toLowerCase() === userAddress.toLowerCase();
    });

    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Test account not found for authenticated user",
      });
    }

    console.log(
      `Performance Test: Editing plant ${plantId} by ${testAccount.fullName}`
    );

    const { contract } = await initialize();

    const transactionObject = {
      to: process.env.SMART_CONTRACT_ADDRESS,
      data: contract.methods
        .editPlant(
          plantId,
          name,
          namaLatin,
          komposisi,
          manfaat,
          dosis,
          caraPengolahan,
          efekSamping,
          ipfsHash
        )
        .encodeABI(),
      gas: 4000000,
    };

    const receipt = await sendTransactionWithWallet(
      testAccount.id,
      transactionObject
    );

    res.json({
      success: true,
      message: "Performance test plant edited successfully",
      publicTxHash: receipt.transactionHash,
      plantId: plantId,
      testUser: testAccount.fullName,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
      operation: "performanceEditPlant",
    });
  } catch (error) {
    console.error("❌ Performance test edit plant error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk rate plant
async function performanceRatePlant(req, res) {
  try {
    const userAddress = req.user.publicKey;

    const { plantId, rating } = req.body;

    // Find testAccount dari address
    const testAccount = TEST_ACCOUNTS.find((acc) => {
      const address = web3.eth.accounts.privateKeyToAccount(
        acc.privateKey
      ).address;
      return address.toLowerCase() === userAddress.toLowerCase();
    });

    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Test account not found for authenticated user",
      });
    }

    console.log(
      `Performance Test: Rating plant ${plantId} by ${testAccount.fullName}`
    );

    const { contract } = await initialize();

    const transactionObject = {
      to: process.env.SMART_CONTRACT_ADDRESS,
      data: contract.methods.ratePlant(plantId, rating).encodeABI(),
      gas: 3000000,
    };

    const receipt = await sendTransactionWithWallet(
      testAccount.id,
      transactionObject
    );

    res.json({
      success: true,
      message: "Performance test rating added successfully",
      publicTxHash: receipt.transactionHash,
      plantId: plantId,
      rating: rating,
      testUser: testAccount.fullName,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
      operation: "performanceRatePlant",
    });
  } catch (error) {
    console.error("❌ Performance test rating error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk like plant
async function performanceLikePlant(req, res) {
  try {
    const userAddress = req.user.publicKey;

    const { plantId } = req.body;

    // Find testAccount dari address
    const testAccount = TEST_ACCOUNTS.find((acc) => {
      const address = web3.eth.accounts.privateKeyToAccount(
        acc.privateKey
      ).address;
      return address.toLowerCase() === userAddress.toLowerCase();
    });

    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Test account not found for authenticated user",
      });
    }

    console.log(
      `Performance Test: Liking plant ${plantId} by ${testAccount.fullName}`
    );

    const { contract } = await initialize();

    const transactionObject = {
      to: process.env.SMART_CONTRACT_ADDRESS,
      data: contract.methods.likePlant(plantId).encodeABI(),
      gas: 2500000,
    };

    const receipt = await sendTransactionWithWallet(
      testAccount.id,
      transactionObject
    );

    res.json({
      success: true,
      message: "Performance test like added successfully",
      publicTxHash: receipt.transactionHash,
      plantId: plantId,
      testUser: testAccount.fullName,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
      operation: "performanceLikePlant",
    });
  } catch (error) {
    console.error("❌ Performance test like error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk comment plant
async function performanceCommentPlant(req, res) {
  try {
    const userAddress = req.user.publicKey;

    const { plantId, comment } = req.body;

    // Find testAccount dari address
    const testAccount = TEST_ACCOUNTS.find((acc) => {
      const address = web3.eth.accounts.privateKeyToAccount(
        acc.privateKey
      ).address;
      return address.toLowerCase() === userAddress.toLowerCase();
    });

    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Test account not found for authenticated user",
      });
    }

    console.log(
      `Performance Test: Commenting on plant ${plantId} by ${testAccount.fullName}`
    );

    const { contract } = await initialize();

    const transactionObject = {
      to: process.env.SMART_CONTRACT_ADDRESS,
      data: contract.methods.commentPlant(plantId, comment).encodeABI(),
      gas: 3500000,
    };

    const receipt = await sendTransactionWithWallet(
      testAccount.id,
      transactionObject
    );

    res.json({
      success: true,
      message: "Performance test comment added successfully",
      publicTxHash: receipt.transactionHash,
      plantId: plantId,
      comment: comment,
      testUser: testAccount.fullName,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber,
      operation: "performanceCommentPlant",
    });
  } catch (error) {
    console.error("❌ Performance test comment error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== READ OPERATIONS PERFORMANCE TESTING ====================

// Performance testing untuk search plants
async function performanceSearchPlants(req, res) {
  try {
    const { userId, name, namaLatin, komposisi, manfaat } = req.body;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(
      `Performance Test: Searching plants by ${testAccount.fullName}`
    );
    console.time("Performance Search Plant Time");

    // Validasi parameter seperti di searchPlants original
    const validatedName = typeof name === "string" ? name : "";
    const validatedNamaLatin = typeof namaLatin === "string" ? namaLatin : "";
    const validatedKomposisi = typeof komposisi === "string" ? komposisi : "";
    const validatedManfaat = typeof manfaat === "string" ? manfaat : "";

    const { contract } = await initialize();
    const startTime = Date.now();

    // Panggil fungsi searchPlants dari kontrak (sama seperti original)
    const result = await contract.methods
      .searchPlants(
        validatedName,
        validatedNamaLatin,
        validatedKomposisi,
        validatedManfaat
      )
      .call();

    // Debug: Cek struktur hasil
    console.log("Raw result from contract:", result);

    // Ekstrak plantIds dan plants dari hasil
    const plantIds = result[0] || [];
    const plants = result[1] || [];

    // Format data untuk response (sama seperti original)
    const formattedPlants = plants.map((plant, index) => ({
      plantId: plantIds[index]?.toString() || "N/A",
      name: plant.name || "Tidak Diketahui",
      namaLatin: plant.namaLatin || "Tidak Diketahui",
      komposisi: plant.komposisi || "Tidak Diketahui",
      manfaat: plant.manfaat || "Tidak Diketahui",
      dosis: plant.dosis || "Tidak Diketahui",
      caraPengolahan: plant.caraPengolahan || "Tidak Diketahui",
      efekSamping: plant.efekSamping || "Tidak Diketahui",
      ipfsHash: plant.ipfsHash || "Tidak Diketahui",
      ratingTotal: (plant.ratingTotal || 0n)?.toString() || "0",
      ratingCount: (plant.ratingCount || 0n)?.toString() || "0",
      likeCount: (plant.likeCount || 0n)?.toString() || "0",
      owner: plant.owner || "Tidak Diketahui",
    }));

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test search completed successfully",
      plants: formattedPlants,
      resultsCount: formattedPlants.length,
      searchCriteria: {
        name: validatedName,
        namaLatin: validatedNamaLatin,
        komposisi: validatedKomposisi,
        manfaat: validatedManfaat,
      },
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "searchPlants",
    });

    console.timeEnd("Performance Search Plant Time");
    console.log("✅ Performance test search plants berhasil");
  } catch (error) {
    console.error("❌ Performance test search error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk get all plants
async function performanceGetAllPlants(req, res) {
  try {
    const { userId, page, limit } = req.body;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(
      `Performance Test: Getting all plants by ${testAccount.fullName}`
    );
    console.time("Performance Get All Plants Time");

    const { contract } = await initialize();
    const startTime = Date.now();

    // Konversi BigInt ke Number dengan aman (sama seperti original)
    const totalPlantsBigInt = await contract.methods.plantCount().call();
    const totalPlants = parseInt(totalPlantsBigInt.toString());

    // Paginasi (sama seperti original)
    const currentPage = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalPlants);

    // Ambil semua tanaman dengan filter paginasi (sama seperti original)
    const plants = [];
    for (let i = startIndex; i < endIndex; i++) {
      const plant = await contract.methods.getPlant(i).call();

      plants.push({
        plantId: i.toString(),
        name: plant.name || "Tidak Diketahui",
        namaLatin: plant.namaLatin || "Tidak Diketahui",
        komposisi: plant.komposisi || "Tidak Diketahui",
        manfaat: plant.manfaat || "Tidak Diketahui",
        dosis: plant.dosis || "Tidak Diketahui",
        caraPengolahan: plant.caraPengolahan || "Tidak Diketahui",
        efekSamping: plant.efekSamping || "Tidak Diketahui",
        ipfsHash: plant.ipfsHash || "Tidak Diketahui",
        ratingTotal: (plant.ratingTotal || 0n).toString(),
        ratingCount: (plant.ratingCount || 0n).toString(),
        likeCount: (plant.likeCount || 0n).toString(),
        owner: plant.owner || "Tidak Diketahui",
      });
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test get all plants completed successfully",
      total: totalPlants,
      currentPage: currentPage,
      pageSize: pageSize,
      plants: plants,
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getAllPlants",
    });

    console.timeEnd("Performance Get All Plants Time");
    console.log("✅ Performance test get all plants berhasil");
  } catch (error) {
    console.error("❌ Performance test get all plants error:", error);
    res.status(500).json({
      success: false,
      message: error.message.includes("BigInt")
        ? "Invalid data format from blockchain"
        : error.message,
    });
  }
}

// Performance testing untuk get single plant
async function performanceGetPlant(req, res) {
  try {
    const { userId } = req.body;
    const { plantId } = req.params; // Ambil plantId dari params seperti original

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(
      `Performance Test: Getting plant ${plantId} by ${testAccount.fullName}`
    );
    console.time("Performance Get Plant Time");

    // Ambil alamat publik test user (untuk isLikedByUser check)
    const userAddress = testAccount.address;

    const { contract } = await initialize();
    const startTime = Date.now();

    // Mengambil data tanaman herbal dari smart contract (sama seperti original)
    const plant = await contract.methods.getPlant(plantId).call();

    // Check apakah plant dilike oleh test user (sama seperti original)
    let isLikedByUser = false;
    if (userAddress) {
      isLikedByUser = await contract.methods
        .isPlantLikedByUser(plantId, userAddress)
        .call();
    }

    // Mengonversi nilai yang mungkin BigInt ke string (sama seperti original)
    const plantIdString = plantId.toString();
    const ratingTotalString = plant.ratingTotal.toString();
    const ratingCountString = plant.ratingCount.toString();
    const likeCountString = plant.likeCount.toString();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test get plant completed successfully",
      plant: {
        name: plant.name,
        namaLatin: plant.namaLatin,
        komposisi: plant.komposisi,
        manfaat: plant.manfaat,
        dosis: plant.dosis,
        caraPengolahan: plant.caraPengolahan,
        efekSamping: plant.efekSamping,
        ipfsHash: plant.ipfsHash,
        ratingTotal: ratingTotalString, // Mengonversi BigInt menjadi string
        ratingCount: ratingCountString, // Mengonversi BigInt menjadi string
        likeCount: likeCountString, // Mengonversi BigInt menjadi string
        owner: plant.owner,
        plantId: plantIdString, // Mengembalikan plantId sebagai string
        isLikedByUser,
      },
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getPlant",
    });

    console.timeEnd("Performance Get Plant Time");
    console.log("✅ Performance test get plant berhasil");
  } catch (error) {
    console.error("❌ Performance test get plant error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk get plant ratings
async function performanceGetPlantRatings(req, res) {
  try {
    const { userId } = req.body;
    const { plantId } = req.params; // Ambil plantId dari params seperti original

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(
      `Performance Test: Getting plant ratings for plant ${plantId} by ${testAccount.fullName}`
    );
    console.time("Performance Get Plant Rating Time");

    const { contract } = await initialize();
    const startTime = Date.now();

    // Mengambil data ratings dari smart contract berdasarkan plantId (sama seperti original)
    const ratings = await contract.methods.getPlantRatings(plantId).call();

    // Mengonversi ratings menjadi array angka (sama seperti original)
    const ratingsArray = ratings.map((rating) => Number(rating));

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test get plant ratings completed successfully",
      plantId: plantId,
      ratings: ratingsArray,
      ratingsCount: ratingsArray.length,
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getPlantRatings",
    });

    console.timeEnd("Performance Get Plant Rating Time");
    console.log("✅ Performance test get plant ratings berhasil");
  } catch (error) {
    console.error("❌ Performance test get plant ratings error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk get comments
async function performanceGetComments(req, res) {
  try {
    const { userId } = req.body;
    const { plantId } = req.params;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(
      `Performance Test: Getting comments for plant ${plantId} by ${testAccount.fullName}`
    );

    const { contract } = await initialize();
    const startTime = Date.now();

    const commentCount = await contract.methods
      .getPlantCommentCount(plantId)
      .call();
    const comments = [];

    for (let i = 0; i < commentCount; i++) {
      const comment = await contract.methods
        .getPlantCommentAtIndex(plantId, i)
        .call();
      comments.push({
        index: i,
        commenter: comment.commenter,
        comment: comment.comment,
        timestamp: comment.timestamp.toString(),
      });
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test get comments completed successfully",
      plantId: plantId,
      commentCount: commentCount.toString(),
      comments: comments,
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getComments",
    });
  } catch (error) {
    console.error("❌ Performance test get comments error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk get average rating
async function performanceGetAverageRating(req, res) {
  try {
    const { userId } = req.body;
    const { plantId } = req.params; // Ambil plantId dari params seperti original

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(
      `Performance Test: Getting average rating for plant ${plantId} by ${testAccount.fullName}`
    );
    console.time("Performance Get Average Rating Time");

    const { contract } = await initialize();
    const startTime = Date.now();

    // Mengambil total rating dan jumlah rating yang diberikan pada tanaman (sama seperti original)
    const plant = await contract.methods.getPlant(plantId).call();

    // Menghitung rata-rata rating dan error handling (sama seperti original)
    const totalRating = plant.ratingTotal ? Number(plant.ratingTotal) : 0;
    const ratingCount = plant.ratingCount ? Number(plant.ratingCount) : 0;

    // Validasi data (sama seperti original)
    if (isNaN(totalRating) || isNaN(ratingCount)) {
      throw new Error("Invalid rating data from smart contract");
    }

    // Jika tidak ada rating yang diberikan, rata-rata adalah 0 (sama seperti original)
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    // Pastikan rating dalam range yang valid (0-5) (sama seperti original)
    const validRating = Math.max(0, Math.min(5, averageRating));

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test get average rating completed successfully",
      plantId: plantId,
      averageRating: Math.round(validRating * 10) / 10, // Sama seperti original
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getAverageRating",
    });

    console.timeEnd("Performance Get Average Rating Time");
    console.log("✅ Performance test get average rating berhasil");
  } catch (error) {
    console.error("❌ Performance test get average rating error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk get file dari IPFS
async function performanceAddFileToIPFS(req, res) {
  try {
    const userAddress = req.user.publicKey;

    // Find testAccount dari address
    const testAccount = TEST_ACCOUNTS.find((acc) => {
      const address = web3.eth.accounts.privateKeyToAccount(
        acc.privateKey
      ).address;
      return address.toLowerCase() === userAddress.toLowerCase();
    });

    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Test account not found for authenticated user",
      });
    }

    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded for performance test",
      });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Hanya file gambar yang diperbolehkan untuk performance test!",
      });
    }

    console.log(
      `Performance Test: Adding file to IPFS by ${testAccount.fullName}`
    );
    console.time("Performance Add File to IPFS Time");

    const startTime = Date.now();

    const FormData = require("form-data");
    const fetch = require("node-fetch");

    const form = new FormData();
    form.append("file", req.file.buffer, "performance-test-file");

    const response = await fetch("http://172.27.80.247:5001/api/v0/add", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const rawResponse = await response.text();
    console.log("Raw response from IPFS:", rawResponse);

    const result = JSON.parse(rawResponse);

    if (!response.ok) {
      throw new Error("Gagal menambahkan file ke IPFS: " + result.Message);
    }

    const cid = result.Hash;
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test file added to IPFS successfully",
      cid: cid,
      fileSize: req.file.size,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "addFileToIPFS",
    });

    console.timeEnd("Performance Add File to IPFS Time");
    console.log(`✅ Performance test file added to IPFS with CID: ${cid}`);
  } catch (error) {
    console.error("❌ Performance test add file to IPFS error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk get file dari IPFS
async function performanceGetFileFromIPFS(req, res) {
  try {
    const { userId } = req.body;
    const { cid } = req.params;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    if (!cid) {
      return res.status(400).json({
        success: false,
        message: "CID is required for performance test",
      });
    }

    console.log(
      `Performance Test: Getting file from IPFS (CID: ${cid}) by ${testAccount.fullName}`
    );
    console.time("Performance Get File from IPFS Time");

    const startTime = Date.now();

    const FormData = require("form-data");
    const fetch = require("node-fetch");

    const form = new FormData();
    form.append("arg", cid);

    const response = await fetch("http://172.27.80.247:5001/api/v0/cat", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IPFS Error: ${error}`);
    }

    const fileData = await response.buffer();
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test file retrieved from IPFS successfully",
      cid: cid,
      fileSize: fileData.length,
      fileSizeFormatted: `${(fileData.length / 1024).toFixed(2)} KB`,
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getFileFromIPFS",
      note: "File data retrieved but not sent in response for performance testing",
    });

    console.timeEnd("Performance Get File from IPFS Time");
    console.log(`✅ Performance test file retrieved from IPFS: ${cid}`);
  } catch (error) {
    console.error("❌ Performance test get file from IPFS error:", error);
    res.status(500).json({
      success: false,
      message: error.message.includes("not found")
        ? "File tidak ditemukan di IPFS"
        : "Gagal mengambil file dari IPFS",
      cid: req.params.cid,
    });
  }
}

// Performance testing untuk get plant record
async function performanceGetPlantRecord(req, res) {
  try {
    const { userId } = req.body;
    const { recordIndex } = req.params;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(
      `Performance Test: Getting plant record ${recordIndex} by ${testAccount.fullName}`
    );

    const { contract } = await initialize();
    const startTime = Date.now();

    const record = await contract.methods.getPlantRecord(recordIndex).call();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test get plant record completed successfully",
      recordIndex: recordIndex,
      record: {
        publicTxHash: record.publicTxHash,
        plantId: record.plantId.toString(),
        userAddress: record.userAddress,
        timestamp: record.timestamp.toString(),
      },
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getPlantRecord",
    });
  } catch (error) {
    console.error("❌ Performance test get plant record error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk get all plant records
async function performanceGetAllPlantRecord(req, res) {
  try {
    const { userId } = req.body;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    const timeLabel = `Performance Get All Plant Records Time ${Date.now()}`;

    console.log(
      `Performance Test: Getting all plant records by ${testAccount.fullName}`
    );
    console.time(timeLabel);

    const { contract } = await initialize();
    const startTime = Date.now();

    const totalRecords = await contract.methods.recordCount().call();
    const total = parseInt(totalRecords.toString());

    const records = [];
    for (let i = 0; i < total; i++) {
      const record = await contract.methods.getPlantRecord(i).call();
      records.push({
        recordId: i.toString(),
        publicTxHash: record.publicTxHash,
        plantId: record.plantId.toString(),
        userAddress: record.userAddress,
        timestamp: record.timestamp.toString(),
      });
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test get all plant records completed successfully",
      totalRecords: total,
      records: records,
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getAllPlantRecord",
    });

    console.timeEnd(timeLabel);
    console.log("✅ Performance test get all plant records berhasil");
  } catch (error) {
    console.error("❌ Performance test get all plant records error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk get plant transaction history
async function performanceGetPlantTransactionHistory(req, res) {
  try {
    const { userId } = req.body;
    const { plantId } = req.params;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(
      `Performance Test: Getting transaction history for plant ${plantId} by ${testAccount.fullName}`
    );

    const { contract } = await initialize();
    const startTime = Date.now();

    const recordCount = await contract.methods.recordCount().call();
    const plantHistory = [];

    for (let i = 0; i < recordCount; i++) {
      const record = await contract.methods.getPlantRecord(i).call();
      if (record.plantId.toString() === plantId.toString()) {
        plantHistory.push({
          index: i,
          publicTxHash: record.publicTxHash,
          plantId: record.plantId.toString(),
          userAddress: record.userAddress,
          timestamp: record.timestamp.toString(),
        });
      }
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message:
        "Performance test get plant transaction history completed successfully",
      plantId: plantId,
      historyCount: plantHistory.length,
      history: plantHistory,
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getPlantTransactionHistory",
    });
  } catch (error) {
    console.error(
      "❌ Performance test get plant transaction history error:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Performance testing untuk get record count
async function performanceGetRecordCount(req, res) {
  try {
    const { userId } = req.body;

    const testAccount = getTestAccountFromWallet(userId);
    if (!testAccount) {
      return res.status(400).json({
        success: false,
        message: "Invalid test user ID",
      });
    }

    console.log(
      `Performance Test: Getting record count by ${testAccount.fullName}`
    );

    const { contract } = await initialize();
    const startTime = Date.now();

    const recordCount = await contract.methods.recordCount().call();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    res.json({
      success: true,
      message: "Performance test get record count completed successfully",
      recordCount: recordCount.toString(),
      testUser: testAccount.fullName,
      executionTime: executionTime,
      operation: "getRecordCount",
    });
  } catch (error) {
    console.error("❌ Performance test get record count error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  // Auth functions
  performanceRegisterUser,
  performanceLoginUser,
  performanceLogoutUser,

  // Plant functions
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
};
