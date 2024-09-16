const express = require('express');
const router = express.Router();
const { Category } = require('../models/dataModel');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST to create a new category
router.post('/', async (req, res) => {
  const { id, category_name } = req.body;
  try {
    const newCategory = new Category({ id, category_name });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT to update a category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  try {
    const category = await Category.findOneAndUpdate({ id }, { category_name }, { new: true });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Category.findOneAndDelete({ id });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

