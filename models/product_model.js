const mongoose = require('mongoose');

// Product Detail Schema
const productDetailSchema = new mongoose.Schema({
    detail_name: { type: String, required: true },
    detail_value: { type: String, required: true }
});

// Product Schema
const productSchema = new mongoose.Schema({
    // id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    details: {
        type: Array,
        default: []
    },
    stock: { type: Number, required: true },
});
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;