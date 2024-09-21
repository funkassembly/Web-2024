const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close-modal');

function renderItemsModal(items) {
    const itemsTable = document.getElementById('itemsTable');
    
    // Clear any existing rows in the table
    itemsTable.innerHTML = `
        <thead>
            <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Details</th>
                <th>Stock</th>
                <th>Quantity</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tableBody = itemsTable.querySelector('tbody');

    // Loop through each product and create a row
    items.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.itemId = item.id;
        row.dataset.itemName = item.name;
        row.dataset.categoryName = item.category;
        // console.log(`*Row: item.id: ${row.dataset.itemId}, categoryID: ${row.dataset.categoryId}`)

        // Product Name
        const nameCell = document.createElement('td');
        nameCell.innerText = item.name;
        row.appendChild(nameCell);

        // Category
        const categoryCell = document.createElement('td');
        categoryCell.innerText = item.category;
        row.appendChild(categoryCell);

        // Details
        const detailsCell = document.createElement('td');
        detailsCell.innerText = item.details;
        row.appendChild(detailsCell);

        // Stock
        const stockCell = document.createElement('td');
        stockCell.innerText = item.stock;
        row.appendChild(stockCell);

        // Quantity Input Field
        const quantityCell = document.createElement('td');
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.value = 0;
        quantityInput.min = 0;
        quantityInput.max = item.stock || 0; // Fallback to 0 if stock is not defined
        quantityInput.style.width = '50px';
        quantityCell.appendChild(quantityInput);
        row.appendChild(quantityCell);

        // Increment/Decrement Buttons
        const actionsCell = document.createElement('td');
        const incrementButton = document.createElement('button');
        incrementButton.innerText = '+';
        incrementButton.addEventListener('click', function () {
            let currentQuantity = parseInt(quantityInput.value);
            if (currentQuantity < item.stock) {
                quantityInput.value = currentQuantity + 1;
            }
        });

        const decrementButton = document.createElement('button');
        decrementButton.innerText = '-';
        decrementButton.addEventListener('click', function () {
            let currentQuantity = parseInt(quantityInput.value);
            if (currentQuantity > 0) {
                quantityInput.value = currentQuantity - 1;
            }
        });

        // Append buttons to the actions cell
        actionsCell.appendChild(incrementButton);
        actionsCell.appendChild(decrementButton);
        row.appendChild(actionsCell);

        // Add the row to the table body
        tableBody.appendChild(row);
    });
}

// Open Instructions Modal
document.getElementById('instructionsLink').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('instructionsModal').style.display = "block";
});

// Close modals
closeButtons.forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        closeBtn.closest('.modal').style.display = 'none';
    });
});

// Close modals when clicking outside of the modal content
window.addEventListener('click', function(event) {
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
});

// Handle Load Button
document.getElementById('loadButton').addEventListener('click', async function() {
    const cargoTab = document.getElementById('cargoTab');
    const rows = document.querySelectorAll('#itemsModal table tbody tr');
    let cargo = [];

    rows.forEach((row, index) => {
        
        const quantityInput = row.querySelector('input[type="number"]');
        if (quantityInput) {
            const quantity = parseInt(quantityInput.value);
            
            if (quantity > 0) {
                const itemId = row.dataset.itemId;
                const itemName = row.dataset.itemName;
                const categoryName = row.dataset.categoryName;
                console.log(`Item id: ${itemId}, Item Name: ${itemName}, Category ID: ${categoryName}, Quantity: ${quantity}`);
                
                if (itemId && categoryName) {
                    cargo.push({ itemId: itemId, categoryName: categoryName, quantity: quantity });
                }
            } 
        
        } 
    });
    console.log('Cargo to be saved:', JSON.stringify(cargo));
    // Save cargo to the database via an AJAX request
    try {
        const response = await fetch('/api/rescuer/saveCargo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cargo: cargo })
        });
        const data = await response.json();
        
        console.log('Cargo saved successfully:', data);
        if (!data.success) {
            console.error('Cargo save failed:', data.message);
        } else {
        // Fetch updated products to reflect the new stock
        const itemsResponse = await fetch('/api/items');
        const updatedItems = await itemsResponse.json();

        // Re-render the product modal with updated stock
        renderItemsModal(updatedItems);
        // populateCargoTab(cargo);
        }

        let tableBody = document.querySelector('#loadedItems table tbody');
        
        // If the table doesn't exist, create it with headers
        if (!tableBody) {
            let loadedItemsHtml = '<h3>Loaded Items:</h3>';
            loadedItemsHtml += '<table><thead><tr><th> # </th><th>Item Name</th><th>Category</th><th>Details</th><th>Quantity</th></tr></thead><tbody>';
            document.getElementById('loadedItems').innerHTML = loadedItemsHtml;
            tableBody = document.querySelector('#loadedItems table tbody');
        }
            
        
        // Append each new product as a row
        cargo.forEach(item => {
            const row = Array.from(rows).find(row => row.dataset.itemId === item.itemId);
            if (row) {
                const itemName = row.cells[0].innerText;
                const itemCategory = row.cells[1].innerText;
                const itemDetails = row.cells[2].innerText;

                const newRowHtml = `<tr>
                    <td><input type="checkbox" class="product-checkbox" data-product-id="${item.itemId}"></td>
                    <td>${itemName}</td>
                    <td>${itemCategory}</td>
                    <td>${itemDetails}</td>
                    <td>${item.quantity}</td>
                </tr>`;
                
                tableBody.insertAdjacentHTML('beforeend', newRowHtml); // Append the new row
            } else {
                console.warn('No matching row found for productId:', item.itemId);  // Debugging aid
            }
        });
        
        


        // Optionally, close the modal after loading products
        document.getElementById('itemsModal').style.display = 'none';

    } catch (error) {
        console.error('Error saving cargo:', error);
    }


});

document.getElementById('unloadButton').addEventListener('click', async function () {
const selectedItems = [];

// Iterate over each row in the cargo table
document.querySelectorAll('#loadedItems tr').forEach(row => {
    const checkbox = row.querySelector('.product-checkbox');
    const quantityInput = row.querySelector('.quantity-input');

    if (checkbox && checkbox.checked && quantityInput) {
        const quantityToReturn = parseInt(quantityInput.value, 10) || 0;
        if (quantityToReturn > 0) {
            const itemId = checkbox.dataset.itemId;
            selectedItems.push({
                itemId,
                quantity: quantityToReturn
            });
        }
    }
});

if (selectedItems.length === 0) {
    alert('No products selected or quantity is zero.');
    return;
}

try {
    const response = await fetch('/unloadCargo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: selectedItems })
    });

    const result = await response.json();
    if (result.success) {
        alert('Products unloaded successfully!');

        // Refresh the cargo and product modals to reflect the changes
        const cargoResponse = await fetch('/getCargo');
        const cargoData = await cargoResponse.json();
        populateCargoTab(cargoData.cargo);

        const productsResponse = await fetch('/getProducts');
        const productsData = await productsResponse.json();
        renderProductModal(productsData);
    } else {
        alert('Failed to unload products: ' + result.message);
    }
} catch (error) {
    console.error('Error unloading cargo:', error);
    alert('An error occurred while unloading cargo.');
}
});


// Handle messages from the iframe
window.addEventListener('message', function(event) {
    if (event.data.type === 'updateUnloadButtonState') {
        const unloadButton = document.getElementById('unloadButton');
        const distance = event.data.distance;

        if (unloadButton) {
            if (distance <= 100) {
                unloadButton.classList.remove('inactive');
                unloadButton.classList.add('active');
                unloadButton.disabled = false;
            } else {
                unloadButton.classList.remove('active');
                unloadButton.classList.add('inactive');
                unloadButton.disabled = true;
            }
        } else {
            console.log('Unload button not found in the DOM');
        }
    }

    if (event.data.type === 'showItemsModal') {
        const items = event.data.items;

        const itemsModal = document.getElementById('itemsModal');
        if (!itemsModal) {
            console.error('itemsModal element not found');
            return;
        }

        const itemsTable = document.getElementById('itemsTable');
        if (!itemsTable) {
            console.error('itemsTable element not found');
            return;
        }

        renderItemsModal(items);
        itemsModal.style.display = 'block';
    }
});

    
