const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the details schema for items
const DetailSchema = new Schema({
  detail_name: { type: String, default: null },
  detail_value: { type: String, default: null }
});

// Define the categories schema
const CategorySchema = new Schema({
  id: { type: String, required: true },
  category_name: { type: String, default: null }
});

// Define the items schema with a reference to categories
const ItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, default: null },
  category: { type: Schema.Types.String, ref: 'Category', default: null}, // Reference to category id
  details: { type: [DetailSchema], default: null }, // Embedded array of details
  stock: { type: Number, default: null }
});

// Define the main schema containing both items and categories
const DataSchema = new Schema({
  items: [ItemSchema],
  categories: [CategorySchema]
});

// Create the models
const Item = mongoose.model('Item', ItemSchema);
const Category = mongoose.model('Category', CategorySchema);
const Data = mongoose.model('Data', DataSchema);

module.exports = { Item, Category, Data };
