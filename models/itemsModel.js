
// const mongoose = require('mongoose');

// // Schema for item details
// const detailSchema = new mongoose.Schema({
//     detail_name: { type: String, required: true },
//     detail_value: { type: String, required: true }
// }, { _id: false });

// // Schema for items
// const itemSchema = new mongoose.Schema({
//     id: { type: String, required: true, unique: true },
//     name: { type: String, required: true },
//     category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
//     details: { type: [detailSchema], default: [] },
//     stock: { type: Number, required: true }
// });

// module.exports = mongoose.model('Item', itemSchema);
