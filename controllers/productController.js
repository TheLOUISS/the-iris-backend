const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

// Criando produto
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  //   Validação
  if (!name || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Por favor, preencha todos os campos!");
  }

  // Gerenciando o upload de imagem
  let fileData = {};
  if (req.file) {
    // Salvando a imagem no cloudnary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Irís - Gerenciamento de Estoque",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Imagem não pode ser enviada!");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Criando produto
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  res.status(201).json(product);
});

// Pegando todos os produtos
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json(products);
});

// Pegando apenas um produto
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // Se o produto não existir
  if (!product) {
    res.status(404);
    throw new Error("Produto não encontrado");
  }
  // Combinando o produto com o seu usuario
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Usuário não autorizado");
  }
  res.status(200).json(product);
});

// Deletando o produto
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // Se o produto não existir
  if (!product) {
    res.status(404);
    throw new Error("Produto não encontrado");
  }
  // Combinando o produto com o seu usuario
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Usuário não autorizado");
  }
  await Product.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Produto deletado." });
});

// Atualizando o produto
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { id } = req.params;

  const product = await Product.findById(id);

  // Se o produto não existir
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Combinando o produto com o seu usuario
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  // Gerenciando o upload de imagem
  let fileData = {};
  if (req.file) {
    // Salvando imagem no cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Atualizando o produto
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedProduct);
});

// Atualizando a quantidade do produto
const updateProductQuantity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const product = await Product.findById(id);

  // Se o produto não existir
  if (!product) {
    res.status(404);
    throw new Error("Produto não encontrado");
  }

  // Combinando o produto com o seu usuário
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Usuário não autorizado");
  }

  // Atualizando a quantidade do produto
  product.quantity = quantity;
  await product.save();

  res.status(200).json({ message: "Quantidade do produto atualizada com sucesso" });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  updateProductQuantity
};
