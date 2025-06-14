const { initialize } = require("../utils/blockchain.js");
const { isUserLoggedIn, getUserData } = require("./authController.js");

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

    // Ambil alamat publik user (kalau tersedia, bisa undefined untuk guest)
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
    const plantIdString = plantId.toString(); // Jika plantId merupakan BigInt
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
        ratingTotal: ratingTotalString, // Mengonversi BigInt menjadi string
        ratingCount: ratingCountString, // Mengonversi BigInt menjadi string
        likeCount: likeCountString, // Mengonversi BigInt menjadi string
        owner: plant.owner,
        plantId: plantIdString, // Mengembalikan plantId sebagai string
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

    // Menghitung rata-rata rating
    const totalRating = plant.ratingTotal; // Total rating yang diterima
    const ratingCount = plant.ratingCount; // Jumlah pengguna yang memberi rating

    // Jika tidak ada rating yang diberikan, rata-rata adalah 0
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    res.json({
      success: true,
      averageRating: averageRating.toString(), // Mengonversi rata-rata rating menjadi string
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
      dosis: plant.dosis || "Tidak Diketahui", // Menambahkan dosis
      caraPengolahan: plant.caraPengolahan || "Tidak Diketahui",
      efekSamping: plant.efekSamping || "Tidak Diketahui", // Menambahkan efek samping
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

    // 1. Dapatkan jumlah total komentar dari fungsi baru di kontrak
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

    // 2. Hitung startIndex dan endIndex
    const totalPages = Math.ceil(totalComments / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalComments);
    const commentsPromises = [];

    // 3. Loop untuk mengambil komentar satu per satu untuk halaman saat ini
    if (startIndex < totalComments) {
      for (let i = startIndex; i < endIndex; i++) {
        // Panggil fungsi baru getPlantCommentAtIndex
        commentsPromises.push(
          contract.methods.getPlantCommentAtIndex(plantId, i).call()
        );
      }
    }

    const resolvedComments = await Promise.all(commentsPromises);

    // 4. Ambil fullName untuk setiap komentator
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
};
