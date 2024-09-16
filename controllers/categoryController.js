const Category = require('../models/categoriesModel');

// Get all categories
//WORKING CODE OF API GET
exports.getCategories = async (req, res) => {
    try {
        const cat = await Category.find();
        res.json(cat);
       // console.log(cat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// exports.getCategories = async (req, res) => {
//     try {
//         const cat = await Category.find();
//         res.json(cat);
//         //console.log(typeof(cat));
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// };

// Create a new category

// Create a new category
exports.createCategory = async (req, res) => {
    // const { id, category_name } = req.body;  // Extract id and category_name from the request body

    // if (!id || !category_name) {
    //     return res.status(400).json({ error: 'Both ID and Category Name are required.' });
    // }

    try {
        const categoriesDoc = await Category.findOne();  // Find the document holding the categories array

        // Check if the ID already exists
        const existingCategory = categoriesDoc.categories.find(cat => cat.id === id);
        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this ID already exists.' });
        }

        // Add new category to the categories array
        categoriesDoc.categories.push({ id, category_name });
        await categoriesDoc.save();

        res.status(201).json({ message: 'Category added successfully', categories: categoriesDoc.categories });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// Update a category by ID
exports.updateCategory = async (req, res) => {
    const { id, category_name } = req.body;  // New ID and category name

    try {
        const categoriesDoc = await Category.findOne();  // Fetch the first document

        // Find the category by its original id from the params
        const categoryIndex = categoriesDoc.categories.findIndex(cat => cat.id === req.params.id);

        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if the new ID already exists in another category
        const existingCategory = categoriesDoc.categories.find(cat => cat.id === id && cat.id !== req.params.id);
        if (existingCategory) {
            return res.status(400).json({ error: 'The new ID already exists. It must be unique.' });
        }

        // Update the category at the found index
        categoriesDoc.categories[categoryIndex].id = id;
        categoriesDoc.categories[categoryIndex].category_name = category_name;

        await categoriesDoc.save();
        res.json({ message: 'Category updated successfully', category: categoriesDoc.categories[categoryIndex] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// exports.updateCategory = async (req, res) => {
//     try {
//         const updatedCategory = await Category.findByIdAndUpdate(req.params.id, { id: id, category_name: category_name }, { new: true });
//         res.json(updatedCategory);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// };

// Delete a category by ID
// Delete a category by ID
exports.deleteCategory = async (req, res) => {
    try {
        const categoriesDoc = await Category.findOne();  // Fetch the first document

        // Find the category by its id
        const categoryIndex = categoriesDoc.categories.findIndex(cat => cat.id === req.params.id);

        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Remove the category from the array
        categoriesDoc.categories.splice(categoryIndex, 1);

        await categoriesDoc.save();
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
