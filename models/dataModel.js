const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the details schema for items
const DetailSchema = new Schema({
  detail_name: { type: String, required: true },
  detail_value: { type: String, required: true }
});

// Define the categories schema
const CategorySchema = new Schema({
  id: { type: String, required: true },
  category_name: { type: String, required: true }
});

// Define the items schema with a reference to categories
const ItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: Schema.Types.String, ref: 'Category', required: true }, // Reference to category id
  details: [DetailSchema], // Embedded array of details
  stock: { type: Number, required: true }
});

// Define the main schema containing both items and categories
const DataSchema = new Schema({
  items: [ItemSchema],
  categories: [CategorySchema]
});

// Create the models
const Category = mongoose.model('Category', CategorySchema);
const Data = mongoose.model('Data', DataSchema);

module.exports = { Category, Data };
