const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    updateProduct,
    updateProductQuantity
    } = require("../controllers/productController");
const router = express.Router();
const { upload } = require("../utils/fileUpload");

router.post("/", protect, upload.single("image"), createProduct);
router.patch("/:id", protect, upload.single("image"), updateProduct);
router.patch("/:id/quantity", protect, updateProductQuantity);
router.get("/", protect, getProducts);
router.get("/:id", protect, getProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;