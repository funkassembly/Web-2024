const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Item, Data, Category } = require('../models/dataModel');
// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });
const { Rescuer } = require('../models/usersModel'); // Use Rescuer model
const mongoose = require('mongoose');

const checkInCargo = async (itemId) => {
  try {
      console.log(`Checking cargo for item ID: ${itemId}`);

      // Ensure itemId is treated as a string (since you're saving item IDs as strings)
      const itemIdString = itemId.toString(); // Convert to string if it's not already

      // Check if the item exists in any rescuer's cargo (assuming cargo.item stores IDs as strings)
      const rescuerWithItem = await Rescuer.findOne({ 'cargo.item': itemIdString }).exec();

      return !!rescuerWithItem; // Returns true if found, false otherwise
  } catch (error) {
      console.error(`Error in checkInCargo: ${error.message}`);
      return false; // In case of any error, assume the item is not in cargo
  }
};





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






// GET all items
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
      // Find the category by its ID
      const category = data.categories.find(cat => cat.id === item.category);
      // Check for null/undefined and provide fallback values
      const formattedDetails = item.details && Array.isArray(item.details)
        ? item.details.map(detail => `${detail.detail_name || 'Unknown'}: ${detail.detail_value || 'N/A'}`).join(', ')
        : 'No details available';  // Default message for empty or null details

      return {
        id: item.id,
        name: item.name || 'Unnamed Item',  // Default name if null
        category: category ? category.category_name : 'No Category',  // Default if category not found
        details: formattedDetails,
        stock: item.stock !== undefined ? item.stock : 0  // Ensure stock is always a valid number
      };
    });

    res.json(itemsWithCategories);
  } catch (err) {
    console.error('Error during retrieval:', err);
    res.status(500).json({ error: err.message });
  }
});


// GET an item by ID
router.get('/:id', async (req, res) => {
  const itemId = req.params.id;
  try {
    const data = await Data.findOne();  // Fetch the single document
    if (!data) {
      return res.status(404).json({ error: 'No data found' });
    }

    // Find the specific item by ID
    const item = data.items.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Format the item's details
    const category = data.categories.find(cat => cat.id === item.category);
    const formattedDetails = item.details.map(detail => ({
      detail_name: detail.detail_name,
      detail_value: detail.detail_value
    }));

    res.json({
      id: item.id,
      name: item.name,
      category: category ? category.category_name : 'Unknown',
      details: formattedDetails,
      stock: item.stock
    });
  } catch (err) {
    console.error('Error during retrieval:', err);
    res.status(500).json({ error: err.message });
  }
});


// GET items by category id


// Route to get items by category ID
router.get('/categories/:categoryId', async (req, res) => {
  const { categoryId } = req.params; // Get the category ID from the request parameters

  try {
      const data = await Data.findOne(); // Fetch the single document

      if (!data) {
          console.error('No data found in the collection');
          return res.status(404).json({ error: 'No data found' });
      }

      if (!data.items || !data.categories) {
          console.error('Items or categories are missing in the retrieved data');
          return res.status(500).json({ error: 'Data format is incorrect' });
      }

      // Find the category by its id in the categories array
      const category = data.categories.find(cat => cat.id === categoryId);
      if (!category) {
          return res.status(404).json({ error: 'Category not found' });
      }

      // Find all items that belong to this category using the category.id
      const filteredItems = data.items.filter(item => item.category === category.id);

      // Map filtered items to include formatted details and cargo status
      const itemsWithCategories = await Promise.all(filteredItems.map(async item => {
          const formattedDetails = item.details && Array.isArray(item.details)
              ? item.details.map(detail => `${detail.detail_name || 'Unknown'}: ${detail.detail_value || 'N/A'}`).join(', ')
              : 'No details available';

          const isInCargo = await checkInCargo(item.id); // Check if item is in cargo

          return {
              id: item.id,
              name: item.name || 'Unnamed Item',
              details: formattedDetails,
              stock: item.stock !== undefined ? item.stock : 0,
              inCargo: isInCargo // Add the cargo status (true/false)
          };
      }));

      res.json(itemsWithCategories);
  } catch (err) {
      console.error('Error during retrieval:', err);
      res.status(500).json({ error: err.message });
  }
});


// POST route to create a new category and item
// POST route to create a new category and an item

//working route
// router.post('/categories', async (req, res) => {
//   try {
//       const { category_name, item_name, item_details, item_stock } = req.body;

//       // Create a new category
//       const newCategory = new Category({
//           id: new mongoose.Types.ObjectId().toString(), // Generate a new ID for the category
//           category_name
//       });

//       // Create a new item
//       const detailsArray = item_details.split(',').map(detail => {
//           const [detail_name, detail_value] = detail.split(':').map(str => str.trim());
//           return { detail_name, detail_value };
//       });

//       const newItem = new Item({
//           id: new mongoose.Types.ObjectId().toString(), // Generate a new ID for the item
//           name: item_name,
//           category: newCategory.id, // Reference to the newly created category
//           details: detailsArray,
//           stock: Number(item_stock) // Ensure stock is a number
//       });

//       // Find the existing Data document
//       const data = await Data.findOne();

//       if (!data) {
//           return res.status(404).json({ error: 'Data not found' });
//       }

//       // Save the new category and item
//       await newCategory.save();
//       await newItem.save();

//       // Push the new category and item to the respective arrays
//       data.categories.push(newCategory);
//       data.items.push(newItem);

//       // Save the updated Data document
//       await data.save();

//       res.status(201).json({ message: 'Category and Item added successfully' });
//   } catch (err) {
//       res.status(500).json({ error: err.message });
//   }
// });



router.post('/categories', async (req, res) => {
  try {
    const { category_name, item_name, item_details, item_stock } = req.body;

    // Find the existing Data document first
    const data = await Data.findOne();

    if (!data) {
      return res.status(404).json({ error: 'Data not found' });
    }

    // Find the latest item and category to increment the ID
    const latestItem = data.items.length > 0
      ? parseInt(data.items[data.items.length - 1].id, 10) + 1
      : 1;

    const latestCategory = data.categories.length > 0
      ? parseInt(data.categories[data.categories.length - 1].id, 10) + 1
      : 1;

    // Create a new category object
    const newCategory = {
      id: latestCategory.toString(), // Increment the category ID
      category_name,
    };

    // Parse item details (if any)
    const detailsArray = item_details.split(',').map(detail => {
      const [detail_name, detail_value] = detail.split(':').map(str => str.trim());
      return { detail_name, detail_value };
    });

    // Create a new item object
    const newItem = {
      id: latestItem.toString(), // Increment the item ID
      name: item_name,
      category: newCategory.id, // Reference the new category ID
      details: detailsArray,
      stock: Number(item_stock), // Ensure stock is a number
    };

    // Push the new category and item to their respective arrays
    data.categories.push(newCategory);
    data.items.push(newItem);

    // Save the updated Data document
    await data.save();

    res.status(201).json({ message: 'Category and Item added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






// Route to import JSON data
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    // Check if a file is provided
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the uploaded file
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const fileData = fs.readFileSync(filePath, 'utf-8');

    // Parse JSON data
    const jsonData = JSON.parse(fileData);

    // Validate if JSON contains categories and items
    const { categories, items } = jsonData;
    if (!categories || !items) {
      return res.status(400).json({ error: 'Invalid JSON format. Must contain categories and items.' });
    }

    // Find the existing data document (assuming there's only one)
    let data = await Data.findOne();
    if (!data) {
      data = new Data({ categories: [], items: [] });
    }

    // Update or add categories
    categories.forEach(newCategory => {
      const existingCategory = data.categories.find(cat => cat.id === newCategory.id);
      if (existingCategory) {
        // Update existing category
        existingCategory.category_name = newCategory.category_name;
      } else {
        // Add new category
        data.categories.push(newCategory);
      }
    });

    // Update or add items
    items.forEach(newItem => {
      const existingItem = data.items.find(item => item.id === newItem.id);
      if (existingItem) {
        // Update existing item
        existingItem.name = newItem.name;
        existingItem.category = newItem.category;
        existingItem.details = newItem.details;
        existingItem.stock = newItem.stock;
      } else {
        // Add new item
        data.items.push(newItem);
      }
    });

    // Save the updated data to MongoDB
    await data.save();

    // Cleanup the uploaded file
    fs.unlinkSync(filePath);

    res.json({ message: 'Data imported successfully' });
  } catch (err) {
    console.error('Error during import:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update an item by ID
// PUT to update an item by ID
router.put('/:id', async (req, res) => {
  const itemId = req.params.id;
  const { name, details, stock } = req.body;  // Extract fields from request body

  try {
    // Find the item in the DataSchema
    const data = await Data.findOne();
    if (!data) {
      return res.status(404).json({ error: 'No data found' });
    }

    // Find the item to be updated
    const item = data.items.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update the item's attributes based on the request body
    if (req.body.hasOwnProperty('name')) {
      item.name = name === "" ? null : name;  // Set to null if empty string
    }
    if (req.body.hasOwnProperty('details')) {
      // If details is an empty string, set to null; otherwise, keep the value
      item.details = details === "" ? null : (Array.isArray(details) ? details : null);
    }
    if (req.body.hasOwnProperty('stock')) {
      item.stock = stock;  // Update stock regardless of its value
    }

    // Save the updated item
    await data.save();

    // Respond with the updated item
    res.json({
      message: 'Item updated successfully',
      item: {
        id: item.id,
        name: item.name,  // Can be null
        details: item.details,  // Can be null or an array
        stock: item.stock  // Can be the provided value
      }
    });
  } catch (err) {
    console.error('Error during update:', err);
    res.status(500).json({ error: err.message });
  }
});







router.delete('/:id', async (req, res) => {
  const itemId = String(req.params.id); // Ensure the id is treated as a string

  try {
    // Step 1: Find the document with the specific item using the correct query
    const data = await Data.findOne({ "items.id": itemId }, { "items.$": 1 });

    // Step 2: If no item is found, return a 404 error
    if (!data || !data.items.length) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Step 3: Remove the item with the matching ID
    const result = await Data.findOneAndUpdate(
      { "items.id": itemId }, // Find the document with the specific item
      { $pull: { items: { id: itemId } } }, // Use $pull to remove the item
      { new: true } // Return the updated document after the deletion
    );

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: err.message });
  }
});









// Route to check for low stock items
// Route to check for low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const data = await Data.findOne(); // Fetch the single document
    console.log('Fetched data:', data); // Log the fetched data

    if (!data) {
      console.error('No data found in the collection');
      return res.status(404).json({ error: 'No data found' });
    }

    if (!data.items || !Array.isArray(data.items)) {
      console.error('Items array is missing or not an array');
      return res.status(500).json({ error: 'Items data format is incorrect' });
    }

    // Filter out low stock items
    const lowStockItems = data.items.filter(item => item.stock <= 5);
    console.log('Low stock items:', lowStockItems); // Log the low stock items

    if (lowStockItems.length === 0) {
      return res.json({ message: 'No low stock items found.' });
    }

    res.json({ lowStockItems });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});






module.exports = router;
