const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  name: {
    type: String,
    required: [true, "Por favor, adicione o nome do produto"],
    trim: true,
  },
  sku: {
    type: String,
    required: true,
    default: "SKU",
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Por favor, adicione a categoria do produto"],
    trim: true,
  },
  quantity: {
    type: String,
    required: [true, "Por favor, adicione a quantidade do produto"],
    trim: true,
  },
  price: {
    type: String,
    required: [true, "Por favor, adicione o preço do produto"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Por favor, adicione a descrição do produto"],
    trim: true,
  },
  image: {
    type: Object,
    default: { }
  },
}, {
  timestamps: true,
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;