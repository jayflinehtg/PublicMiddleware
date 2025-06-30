const { initialize } = require("../utils/blockchain.js");
const { getUserData } = require("./authController.js");

async function addPlantData(req, res) {
  try {
    const userAddress = req.user.publicKey;
    console.log("Preparing addPlant transaction data for user:", userAddress);
    console.time("Prepare Add Plant TX Data Time");

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

    if (!name) {
      throw new Error("Data nama tidak boleh kosong.");
    }
    if (!namaLatin) {
      throw new Error("Data nama latin tidak boleh kosong.");
    }
    if (!komposisi) {
      throw new Error("Data komposisi tidak boleh kosong.");
    }
    if (!manfaat) {
      throw new Error("Data manfaat tidak boleh kosong.");
    }
    if (!dosis) {
      throw new Error("Data dosis tidak boleh kosong.");
    }
    if (!caraPengolahan) {
      throw new Error("Data cara pengolahan tidak boleh kosong.");
    }
    if (!efekSamping) {
      throw new Error("Data efek samping tidak boleh kosong.");
    }
    if (!ipfsHash) {
      throw new Error("Data ipfsHash tidak boleh kosong.");
    }

    const { contract } = await initialize();

    const txObject = contract.methods.addPlant(
      name,
      namaLatin,
      komposisi,
      manfaat,
      dosis,
      caraPengolahan,
      efekSamping,
      ipfsHash
    );
    const transactionDataHex = txObject.encodeABI();

    console.timeEnd("Prepare Add Plant TX Data Time");
    console.log("✅ TX data (ABI encoded) untuk addPlant disiapkan.");

    res.json({
      success: true,
      message: "Data transaksi untuk menambah tanaman telah siap.",
      data: {
        transactionData: transactionDataHex,
      },
    });
  } catch (error) {
    console.error("❌ Error in prepare addPlantData:", error);
    res.status(500).json({
      success: false,
      message: `Gagal mempersiapkan data transaksi: ${error.message}`,
    });
  }
}

// Fungsi untuk mengedit data tanaman herbal
async function editPlant(req, res) {
  try {
    const userAddress = req.user.publicKey;
    // plantId diambil dari req.params
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

    console.log(
      `Preparing editPlant TX data for plantId: ${plantId} by user: ${userAddress}`
    );
    console.time("Prepare Edit Plant TX Data Time");

    const { contract } = await initialize();

    // Validasi kepemilikan sebelum membuat encodedABI
    const plant = await contract.methods.getPlant(plantId).call();
    if (plant.owner.toLowerCase() !== userAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki hak untuk mengedit tanaman ini.",
      });
    }

    const txObject = contract.methods.editPlant(
      plantId,
      name,
      namaLatin,
      komposisi,
      manfaat,
      dosis,
      caraPengolahan,
      efekSamping,
      ipfsHash
    );
    const transactionDataHex = txObject.encodeABI();

    console.timeEnd("Prepare Edit Plant TX Data Time");
    console.log(`✅ TX data (ABI encoded) untuk editPlant disiapkan.`);

    res.json({
      success: true,
      message: "Data transaksi untuk mengedit tanaman telah siap.",
      data: {
        transactionData: transactionDataHex,
      },
    });
  } catch (error) {
    console.error("❌ Error in prepare editPlant:", error);
    res.status(500).json({
      success: false,
      message: `Gagal mempersiapkan data transaksi edit: ${error.message}`,
    });
  }
}

// Fungsi untuk mengambil data tanaman herbal
async function getPlant(req, res) {
  try {
    console.time("Get Plant Time");
    const { plantId } = req.params;

    // Ambil alamat publik user
    const userAddress = req.user?.publicKey;

    const { contract } = await initialize();

    // Mengambil data tanaman herbal dari smart contract
    const plant = await contract.methods.getPlant(plantId).call();

    let isLikedByUser = false;
    if (userAddress) {
      isLikedByUser = await contract.methods
        .isPlantLikedByUser(plantId, userAddress)
        .call();
    }

    // Mengonversi nilai yang mungkin BigInt ke string
    const plantIdString = plantId.toString();
    const ratingTotalString = plant.ratingTotal.toString();
    const ratingCountString = plant.ratingCount.toString();
    const likeCountString = plant.likeCount.toString();

    res.json({
      success: true,
      plant: {
        name: plant.name,
        namaLatin: plant.namaLatin,
        komposisi: plant.komposisi,
        manfaat: plant.manfaat,
        dosis: plant.dosis,
        caraPengolahan: plant.caraPengolahan,
        efekSamping: plant.efekSamping,
        ipfsHash: plant.ipfsHash,
        ratingTotal: ratingTotalString,
        ratingCount: ratingCountString,
        likeCount: likeCountString,
        owner: plant.owner,
        plantId: plantIdString,
        isLikedByUser,
      },
    });
    console.timeEnd("Get Plant Time");
  } catch (error) {
    console.error("❌ Error in getPlant:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function ratePlant(req, res) {
  try {
    const userAddress = req.user.publicKey;
    const { plantId, rating } = req.body;
    console.log(
      `Preparing ratePlant TX data for plantId: ${plantId} by user: ${userAddress}`
    );
    console.time("Prepare Rate Plant TX Data Time");

    const { contract } = await initialize();

    // Anda bisa menambahkan validasi di sini jika perlu, misal cek rating 1-5
    if (rating < 1 || rating > 5) {
      throw new Error("Rating harus antara 1 dan 5.");
    }

    const txObject = contract.methods.ratePlant(plantId, rating);
    const transactionDataHex = txObject.encodeABI();

    console.timeEnd("Prepare Rate Plant TX Data Time");
    console.log(`✅ TX data (ABI encoded) untuk ratePlant disiapkan.`);

    res.json({
      success: true,
      message: "Data transaksi untuk memberi rating telah siap.",
      data: {
        transactionData: transactionDataHex,
      },
    });
  } catch (error) {
    console.error("❌ Error in prepare ratePlant:", error);
    res.status(500).json({
      success: false,
      message: `Gagal mempersiapkan data rating: ${error.message}`,
    });
  }
}

// Function untuk mendapatkan rata-rata rating dari sebuah tanaman herbal
async function getAverageRating(req, res) {
  try {
    console.time("Get Average Rating Time");
    const { plantId } = req.params;
    const { contract } = await initialize();

    // Mengambil total rating dan jumlah rating yang diberikan pada tanaman
    const plant = await contract.methods.getPlant(plantId).call();

    // Menghitung rata-rata rating dan error handling
    const totalRating = plant.ratingTotal ? Number(plant.ratingTotal) : 0;
    const ratingCount = plant.ratingCount ? Number(plant.ratingCount) : 0;

    // Validasi data
    if (isNaN(totalRating) || isNaN(ratingCount)) {
      throw new Error("Invalid rating data from smart contract");
    }

    // Jika tidak ada rating yang diberikan, rata-rata adalah 0
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    // Pastikan rating dalam range yang valid (0-5)
    const validRating = Math.max(0, Math.min(5, averageRating));

    res.json({
      success: true,
      averageRating: Math.round(validRating * 10) / 10,
    });
    console.timeEnd("Get Average Rating Time");
  } catch (error) {
    console.error("❌ Error in getAverageRating:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Fungsi untuk mendapatkan ratings tanaman berdasarkan plantId
async function getPlantRatings(req, res) {
  try {
    console.time("Get Plant Rating Time");
    const { plantId } = req.params;
    const { contract } = await initialize();

    // Mengambil data ratings dari smart contract berdasarkan plantId
    const ratings = await contract.methods.getPlantRatings(plantId).call();

    // Mengonversi ratings menjadi array angka
    const ratingsArray = ratings.map((rating) => Number(rating));

    res.json({
      success: true,
      ratings: ratingsArray, // Mengembalikan ratings dalam bentuk array
    });
    console.timeEnd("Get Plant Rating Time");
  } catch (error) {
    console.error("❌ Error in getPlantRatings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function likePlant(req, res) {
  try {
    const userAddress = req.user.publicKey;
    const { plantId } = req.body;
    console.log(
      `Preparing likePlant TX data for plantId: ${plantId} by user: ${userAddress}`
    );
    console.time("Prepare Like Plant TX Data Time");

    const { contract } = await initialize();

    const txObject = contract.methods.likePlant(plantId);
    const transactionDataHex = txObject.encodeABI();

    console.timeEnd("Prepare Like Plant TX Data Time");
    console.log(`✅ TX data (ABI encoded) untuk likePlant disiapkan.`);

    res.json({
      success: true,
      message: "Data transaksi untuk menyukai tanaman telah siap.",
      data: {
        transactionData: transactionDataHex,
      },
    });
  } catch (error) {
    console.error("❌ Error in prepare likePlant:", error);
    res.status(500).json({
      success: false,
      message: `Gagal mempersiapkan data like: ${error.message}`,
    });
  }
}

// Function untuk memberikan komentar pada sebuah data tanaman herbal
async function commentPlant(req, res) {
  try {
    const userAddress = req.user.publicKey;
    const { plantId, comment } = req.body;
    console.log(
      `Preparing commentPlant TX data for plantId: ${plantId} by user: ${userAddress}`
    );
    console.time("Prepare Comment Plant TX Data Time");

    if (!comment || comment.trim() === "") {
      throw new Error("Komentar tidak boleh kosong.");
    }

    const { contract } = await initialize();

    const txObject = contract.methods.commentPlant(plantId, comment);
    const transactionDataHex = txObject.encodeABI();

    console.timeEnd("Prepare Comment Plant TX Data Time");
    console.log(`✅ TX data (ABI encoded) untuk commentPlant disiapkan.`);

    res.json({
      success: true,
      message: "Data transaksi untuk memberi komentar telah siap.",
      data: {
        transactionData: transactionDataHex,
      },
    });
  } catch (error) {
    console.error("❌ Error in prepare commentPlant:", error);
    res.status(500).json({
      success: false,
      message: `Gagal mempersiapkan data komentar: ${error.message}`,
    });
  }
}

// Fungsi untuk mengambil semua data tanaman dari smart contract
async function getAllPlants(req, res) {
  try {
    console.time("Get All Plants Time");
    const { contract } = await initialize();

    // Konversi BigInt ke Number dengan aman
    const totalPlantsBigInt = await contract.methods.plantCount().call();
    const totalPlants = parseInt(totalPlantsBigInt.toString());

    // Paginasi
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalPlants);

    // Ambil semua tanaman dengan filter paginasi
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

    res.json({
      success: true,
      total: totalPlants,
      currentPage: page,
      pageSize: limit,
      plants: plants,
    });

    console.timeEnd("Get All Plants Time");
  } catch (error) {
    console.error("❌ Error in getAllPlants:", error);
    res.status(500).json({
      success: false,
      message: error.message.includes("BigInt")
        ? "Invalid data format from blockchain"
        : error.message,
    });
  }
}

// Fungsi untuk mencari tanaman berdasarkan nama, nama latin, komposisi, atau manfaat
async function searchPlants(req, res) {
  try {
    console.time("Search Plant Time");
    const { name, namaLatin, komposisi, manfaat } = req.query;

    // Validasi parameter
    const validatedName = typeof name === "string" ? name : "";
    const validatedNamaLatin = typeof namaLatin === "string" ? namaLatin : "";
    const validatedKomposisi = typeof komposisi === "string" ? komposisi : "";
    const validatedmanfaat = typeof manfaat === "string" ? manfaat : "";

    const { contract } = await initialize();

    // Panggil fungsi searchPlants dari kontrak
    const result = await contract.methods
      .searchPlants(
        validatedName,
        validatedNamaLatin,
        validatedKomposisi,
        validatedmanfaat
      )
      .call();

    // Debug: Cek struktur hasil
    console.log("Raw result from contract:", result);

    // Ekstrak plantIds dan plants dari hasil
    const plantIds = result[0] || [];
    const plants = result[1] || [];

    // Format data untuk response
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

    res.json({ success: true, plants: formattedPlants });

    console.timeEnd("Search Plant Time");
    console.log("✅ Berhasil mencari tanaman");
  } catch (error) {
    console.error("❌ Error in searchPlants:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Function untuk mendapatkan komentar dari sebuah data tanaman herbal
async function getComments(req, res) {
  try {
    console.time("Get Paginated Comments Time");
    const { plantId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { contract } = await initialize();

    // Dapatkan jumlah total komentar dari fungsi baru di kontrak
    const totalCommentsBigInt = await contract.methods
      .getPlantCommentCount(plantId)
      .call();
    const totalComments = parseInt(totalCommentsBigInt.toString());

    if (totalComments === 0) {
      return res.json({
        success: true,
        total: 0,
        currentPage: page,
        pageSize: limit,
        totalPages: 0,
        comments: [],
      });
    }

    // Hitung startIndex dan endIndex
    const totalPages = Math.ceil(totalComments / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalComments);
    const commentsPromises = [];

    // Loop untuk mengambil komentar satu per satu untuk halaman saat ini
    if (startIndex < totalComments) {
      for (let i = startIndex; i < endIndex; i++) {
        // Panggil fungsi baru getPlantCommentAtIndex
        commentsPromises.push(
          contract.methods.getPlantCommentAtIndex(plantId, i).call()
        );
      }
    }

    const resolvedComments = await Promise.all(commentsPromises);

    // Ambil fullName untuk setiap komentator
    const commentsWithStringValues = await Promise.all(
      resolvedComments.map(async (comment) => {
        try {
          const userInfo = await getUserData(comment.user);
          return {
            publicKey: comment.user,
            fullName: userInfo.fullName || "Pengguna Tidak Dikenal",
            comment: comment.comment,
            timestamp: comment.timestamp.toString(),
          };
        } catch (error) {
          return {
            publicKey: comment.user,
            fullName: "Pengguna Tidak Dikenal",
            comment: comment.comment,
            timestamp: comment.timestamp.toString(),
          };
        }
      })
    );

    res.json({
      success: true,
      total: totalComments,
      currentPage: page,
      pageSize: limit,
      totalPages: totalPages,
      comments: commentsWithStringValues,
    });
    console.timeEnd("Get Paginated Comments Time");
  } catch (error) {
    console.error("❌ Error di getComments (paginasi):", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Fungsi untuk mengambil record transaksi berdasarkan recordId
async function getPlantRecord(req, res) {
  try {
    console.time("Get Plant Record Time");
    const { recordId } = req.params;

    const { contract } = await initialize();

    // Mengambil data record dari smart contract
    const record = await contract.methods.getPlantRecord(recordId).call();

    res.json({
      success: true,
      record: {
        publicTxHash: record.publicTxHash,
        plantId: record.plantId.toString(),
        userAddress: record.userAddress,
        timestamp: record.timestamp.toString(),
      },
    });

    console.timeEnd("Get Plant Record Time");
  } catch (error) {
    console.error("❌ Error in getPlantRecord:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Fungsi untuk mendapatkan semua plant records
async function getAllPlantRecord(req, res) {
  try {
    console.time("Get All Plant Records Time");

    const { contract } = await initialize();
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

    res.json({
      success: true,
      totalRecords: total,
      records: records,
    });

    console.timeEnd("Get All Plant Records Time");
  } catch (error) {
    console.error("❌ Error in getAllPlantRecord:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function updatePlantRecordHash(req, res) {
  try {
    const { recordId, txHash } = req.body;
    const userAddress = req.user.publicKey;

    console.log("Preparing update transaction hash date for user:", userAddress);
    console.log(`Updating plant record ${recordId} with txHash: ${txHash}`);

    const { contract } = await initialize();

    // Prepare transaction untuk update record hash
    const txObject = contract.methods.updatePlantRecordHash(recordId, txHash);
    const transactionDataHex = txObject.encodeABI();

    res.json({
      success: true,
      message: "Plant record hash update transaction prepared",
      data: {
        transactionData: transactionDataHex,
      },
    });
  } catch (error) {
    console.error("❌ Error updating plant record hash:", error);
    res.status(500).json({
      success: false,
      message: `Failed to update plant record hash: ${error.message}`,
    });
  }
}

// Fungsi untuk mendapatkan transaction history berdasarkan plantId dengan pagination
async function getPlantTransactionHistory(req, res) {
  try {
    console.time("Get Plant Transaction History Time");
    const { plantId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { contract } = await initialize();
    const totalRecords = await contract.methods.recordCount().call();
    const total = parseInt(totalRecords.toString());

    // Filter records berdasarkan plantId
    const plantRecords = [];

    for (let i = 0; i < total; i++) {
      const record = await contract.methods.getPlantRecord(i).call();

      // Filter hanya record yang sesuai dengan plantId
      if (record.plantId.toString() === plantId.toString()) {
        plantRecords.push({
          recordId: i.toString(),
          publicTxHash: record.publicTxHash,
          plantId: record.plantId.toString(),
          userAddress: record.userAddress,
          timestamp: record.timestamp.toString(),
        });
      }
    }

    // Sort berdasarkan timestamp (terbaru dulu)
    plantRecords.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

    // pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = plantRecords.slice(startIndex, endIndex);

    // Tentukan jenis transaksi berdasarkan urutan
    const recordsWithType = paginatedRecords.map((record) => {
      const allRecordsForPlant = plantRecords.filter(
        (r) => r.plantId === record.plantId
      );
      const sortedByTimestamp = allRecordsForPlant.sort(
        (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
      );
      const recordIndex = sortedByTimestamp.findIndex(
        (r) => r.recordId === record.recordId
      );

      return {
        ...record,
        transactionType: recordIndex === 0 ? "Add Plant" : "Edit Plant",
        icon: recordIndex === 0 ? "🌱" : "✏️",
      };
    });

    // Format timestamp menjadi readable format
    const formattedRecords = recordsWithType.map((record) => {
      const date = new Date(parseInt(record.timestamp) * 1000);
      const formattedDate =
        date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        ", " +
        date.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

      return {
        ...record,
        formattedTimestamp: formattedDate,
      };
    });

    res.json({
      success: true,
      plantId: plantId,
      data: formattedRecords,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(plantRecords.length / limit),
        totalRecords: plantRecords.length,
        hasNextPage: endIndex < plantRecords.length,
        hasPreviousPage: page > 1,
      },
    });

    console.timeEnd("Get Plant Transaction History Time");
  } catch (error) {
    console.error("❌ Error in getPlantTransactionHistory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Fungsi untuk mendapatkan total record count
async function getRecordCount(req, res) {
  try {
    console.time("Get Record Count Time");
    const { contract } = await initialize();

    const count = await contract.methods.recordCount().call();

    res.json({
      success: true,
      recordCount: count.toString(),
    });

    console.timeEnd("Get Record Count Time");
  } catch (error) {
    console.error("❌ Error in getRecordCount:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  addPlantData,
  editPlant,
  ratePlant,
  getAverageRating,
  getPlantRatings,
  likePlant,
  commentPlant,
  getPlant,
  searchPlants,
  getComments,
  getAllPlants,
  getPlantRecord,
  updatePlantRecordHash,
  getAllPlantRecord,
  getPlantTransactionHistory,
  getRecordCount,
};
