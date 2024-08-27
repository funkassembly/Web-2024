const fs = require('fs');
const Product = require('./models/product_model'); // Assuming you created a Product model

async function createProducts() {
    try {
        const data = fs.readFileSync('productdb.json', 'utf-8');
        const products = JSON.parse(data).items;

        for (let product of products) {
            console.log('Processing product:', product);

            if (!product.name || !product.details || product.details.some(detail => !detail.detail_name || !detail.detail_value)) {
                console.error('Invalid product data:', product);
                continue; // Skip this product
            }
            // Check if the product already exists in the database
            const existingProduct = await Product.findOne({ id: product.id });
            if (existingProduct) {
                console.log(`Product with ID ${product.id} already exists, skipping.`);
                continue; // Skip if the product already exists
            }
            const newProduct = new Product({
                id: product.id,
                name: product.name,
                category: product.category,
                details: product.details
            });

            await newProduct.save();
            console.log(`Product with ID ${product.id} added to the database.`);
        }

        console.log('Product processing completed.');
    } catch (error) {
        console.error('Error creating products:', error);
    }
}

module.exports = createProducts;
