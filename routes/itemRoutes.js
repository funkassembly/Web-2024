const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Data, Category } = require('../models/dataModel');

// // Get all items with populated category names
// router.get('/', async (req, res) => {
//   try {
//     const data = await Data.findOne({})
//       .populate({
//         path: 'items.category',
//         model: 'Category',
//         select: 'category_name' // Only select the category_name field
//       })
//       .exec();
    
//     if (!data) return res.json([]);

//     const items = data.items.map(item => ({
//       id: item.id,
//       name: item.name,
//       category: item.category ? item.category.category_name : 'Unknown',
//       details: item.details,
//       stock: item.stock
//     }));

//     res.json(items);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Get item by ID with populated category name
// router.get('/:id', async (req, res) => {
//   const { id } = req.params;
//   try {
//     const data = await Data.findOne({ 'items.id': id })
//       .populate({
//         path: 'items.category',
//         model: 'Category',
//         select: 'category_name'
//       })
//       .exec();
    
//     if (data && data.items.length > 0) {
//       const item = data.items[0];
//       res.json({
//         id: item.id,
//         name: item.name,
//         category: item.category ? item.category.category_name : 'Unknown',
//         details: item.details,
//         stock: item.stock
//       });
//     } else {
//       res.status(404).json({ error: 'Item not found' });
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Add a new item
// router.post('/', async (req, res) => {
//   const { id, name, category, details, stock } = req.body;
//   try {
//     // Ensure the category ID exists in the Category collection
//     const categoryExists = await Category.exists({ id: category });
//     if (!categoryExists) {
//       return res.status(400).json({ error: 'Invalid category ID' });
//     }

//     const newItem = { id, name, category, details, stock };
//     await Data.updateOne({}, { $push: { items: newItem } });
//     res.status(201).json({ message: 'Item added successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Update an item
// router.put('/:id', async (req, res) => {
//   const { id } = req.params;
//   const { name, category, details, stock } = req.body;
  
//   try {
//     // Ensure the category ID exists in the Category collection
//     const categoryExists = await Category.exists({ id: category });
//     if (!categoryExists) {
//       return res.status(400).json({ error: 'Invalid category ID' });
//     }

//     await Data.updateOne(
//       { 'items.id': id },
//       { $set: { 'items.$.name': name, 'items.$.category': category, 'items.$.details': details, 'items.$.stock': stock } }
//     );
//     res.json({ message: 'Item updated successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Delete an item
// router.delete('/:id', async (req, res) => {
//   const { id } = req.params;
//   try {
//     await Data.updateOne({}, { $pull: { items: { id: id } } });
//     res.json({ message: 'Item deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET all categories
router.get('/categories', async (req, res) => {
  try {
    // Fetch all categories from the "Data" collection, where categories are stored
    const data = await Data.findOne();
    if (!data) return res.status(404).json({ error: 'No data found' });
    
    // Send the categories array
    res.json(data.categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// POST to import JSON data
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { items, categories } = JSON.parse(fileContent);

    // Clear existing data in the Data collection
    await Data.deleteMany({});

    // Insert the new items and categories into the Data collection
    const newData = new Data({
      items,
      categories
    });
    await newData.save();

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.json({ message: 'Data imported successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// router.post('/import', upload.single('file'), async (req, res) => {
//   try {
//     const filePath = path.join(__dirname, '../uploads', req.file.filename);
//     const fileContent = fs.readFileSync(filePath, 'utf8');
//     const { items, categories } = JSON.parse(fileContent);

//     // Clear existing data
//     await Data.deleteMany({});
//     await Category.deleteMany({});

//     // Import new categories
//     await Category.insertMany(categories);

//     // Import new items
//     await Data.insertMany(items);

//     // Clean up the uploaded file
//     fs.unlinkSync(filePath);

//     res.json({ message: 'Data imported successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// GET to export data as JSON
router.get('/export', async (req, res) => {
    try {
      const items = await Data.find().strictPopulate('category').exec();
      const categories = await Category.find();
  
      const jsonData = JSON.stringify({ items, categories });
  
      res.setHeader('Content-disposition', 'attachment; filename=data.json');
      res.setHeader('Content-type', 'application/json');
      res.send(jsonData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// GET all items
router.get('/', async (req, res) => {
  try {
    const data = await Data.findOne();  // Fetch the single document
    
    if (!data) {
      console.error('No data found in the collection');
      return res.status(404).json({ error: 'No data found' });
    }


    if (!data.items || !data.categories) {
      console.error('Items or categories are missing in the retrieved data');
      return res.status(500).json({ error: 'Data format is incorrect' });
    }

    // Map items to include category names and formatted details
    const itemsWithCategories = data.items.map(item => {
      const category = data.categories.find(cat => cat.id === item.category);
      const formattedDetails = item.details.map(detail => `${detail.detail_name}: ${detail.detail_value}`).join(', ');

      return {
        id: item.id,
        name: item.name,
        category: category ? category.category_name : 'Unknown',
        details: formattedDetails,
        stock: item.stock
      };
    });


    res.json(itemsWithCategories);
  } catch (err) {
    console.error('Error during retrieval:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
