const Item = require('../models/itemsModel');

// Get all items
exports.getItems = async (req, res) => {
    try {
        const items = await Item.find().populate('category');
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new item
exports.createItem = async (req, res) => {
    const { id, name, category, details, stock } = req.body;
    try {
        const newItem = new Item({ id, name, category, details, stock });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update an item by ID
exports.updateItem = async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete an item by ID
exports.deleteItem = async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
