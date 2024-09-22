const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close-modal');

// Helper Functions
// Function 1: filter items by name or category in real-time
function filterItemsModal() {
    const searchInput = document.getElementById('searchInput');
    const itemsTable = document.getElementById('itemsTable');
    const allRows = itemsTable.querySelectorAll('tbody tr');
    
    searchInput.addEventListener('input', function() {
        const filterText = this.value.toLowerCase();
        
        allRows.forEach(row => {
            const itemName = row.dataset.itemName.toLowerCase();
            const categoryName = row.dataset.categoryName.toLowerCase();

            if (itemName.includes(filterText) || categoryName.includes(filterText)) {
                row.style.display = '';  // Show row
            } else {
                row.style.display = 'none';  // Hide row
            }
        });
    });
}
// Function 2: Items Modal Render 'on click' @ General Storage Marker
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
        row.dataset.itemName = item.name;   // Needed for search filter
        row.dataset.categoryName = item.category;   // Needed for search filter

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
        // Add event listener to input for manual quantity input
        quantityInput.addEventListener('input', function () {
            let newQuantity = parseInt(quantityInput.value);

            // If the input is a valid number and greater than or equal to 0
            if (!isNaN(newQuantity) && newQuantity >= 0) {
                updateSelectedItemsModal(item, newQuantity);  // Update based on input
            } else {
                quantityInput.value = 0;  // If invalid input, reset to 0
                updateSelectedItemsModal(item, 0);  // Reset item in the modal
            }
        });
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
                updateSelectedItemsModal(item, 1);
            }
        });

        const decrementButton = document.createElement('button');
        decrementButton.innerText = '-';
        decrementButton.addEventListener('click', function () {
            let currentQuantity = parseInt(quantityInput.value);
            if (currentQuantity > 0) {
                quantityInput.value = currentQuantity - 1;
                updateSelectedItemsModal(item, -1);
            }
        });

        // Append buttons to the actions cell
        actionsCell.appendChild(incrementButton);
        actionsCell.appendChild(decrementButton);
        row.appendChild(actionsCell);

        // Add the row to the table body
        tableBody.appendChild(row);
    });

    // Call the filter function after rendering the items
    filterItemsModal();
}


// Function 3: Populate Cargo table Row
function createCargoRow(item, index) {
    const { item: itemName, itemCategory, quantity } = item;
    
    return `
        <tr>
            <td>
                <input type="checkbox" class="item-checkbox" data-item-name="${itemName}">
            </td>
            <td>${index + 1}</td>
            <td>${itemName}</td>
            <td>${itemCategory}</td>
            <td class="quantity-cell">${quantity}</td>
        </tr>`;
}
// Function 4: Cargo Tab population
function populateCargoTab(cargo) {
    const loadedItemsDiv = document.getElementById('loadedItems');
    // If no cargo, display empty message
    if (!cargo || cargo.length === 0) {
        loadedItemsDiv.innerHTML = '<p>Cargo is currently empty!</p>';
        return;
    }
    let itemTableHtml = `
        <table id="itemTable">
            <thead>
                <tr>
                    <th><input type="checkbox" id="selectAllCheckbox"></th>
                    <th> # </th>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Quantity</th>
                </tr>
            </thead>
            <tbody>
    `;
    cargo.forEach((item, index) => {
        itemTableHtml += createCargoRow(item, index);
    });
    
    itemTableHtml += '</tbody></table>';
    loadedItemsDiv.innerHTML = itemTableHtml;

    addCheckboxEventListeners();
    // Event Listener for Checkbox Select all to unload massively
    document.getElementById('selectAllCheckbox').addEventListener('change', function() {
        const isChecked = this.checked;
        
        // Select or deselect all checkboxes based on the header checkbox
        document.querySelectorAll('#itemTable tbody .item-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
            checkbox.dispatchEvent(new Event('change')); // Trigger change event to update quantity input fields if necessary
    });
});
}

// Function 5: Checkbox for editing the cargo items
function addCheckboxEventListeners() {
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const row = this.closest('tr');
            const quantityCell = row.querySelector('.quantity-cell');

            if (!quantityCell) {
                console.error('Quantity cell not found for row:', row);
                return;
            }

            // If the checkbox is checked, allow editing of quantity
            if (this.checked) {
                // Get the current quantity from the cell and store it
                let originalQuantity = parseInt(quantityCell.textContent, 10);
                if (isNaN(originalQuantity)) {
                    console.warn('Parsed quantity is NaN, defaulting to 0');
                    originalQuantity = 0;
                }
                // Store the original quantity in a data attribute for later use
                this.dataset.originalQuantity = originalQuantity;

                // Replace quantity text with an input field and buttons
                quantityCell.innerHTML = `
                    <input type="number" class="quantity-input" value="${originalQuantity}" min="0" style="width: 50px;">
                    <button class="increment-btn">+</button>
                    <button class="decrement-btn">-</button>
                `;

                // Add event listeners to the increment and decrement buttons
                const incrementBtn = quantityCell.querySelector('.increment-btn');
                const decrementBtn = quantityCell.querySelector('.decrement-btn');
                const quantityInput = quantityCell.querySelector('.quantity-input');

                incrementBtn.addEventListener('click', function() {
                    let currentQuantity = parseInt(quantityInput.value, 10);
                    quantityInput.value = currentQuantity + 1;
                });

                decrementBtn.addEventListener('click', function() {
                    let currentQuantity = parseInt(quantityInput.value, 10);
                    if (currentQuantity > 0) {
                        quantityInput.value = currentQuantity - 1;
                    }
                });

            } else {
                // If the checkbox is unchecked, restore the original quantity
                const originalQuantity = this.dataset.originalQuantity || 0;
                quantityCell.innerHTML = originalQuantity;
            }
        });
    });
}



// Function 6: Checkboxes @ Cargo editing - observing function
function observeCheckboxes() {
    document.addEventListener("DOMContentLoaded", function() {
        const targetNode = document.querySelector('#loadedItems tbody'); // Assuming checkboxes are within <tbody>
          
        if (!targetNode) {
            console.error("Target node (tbody) not found. Ensure it exists before observing.");
            return;
        }

        const config = { childList: true, subtree: true };

        const callback = function(mutationsList) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    addCheckboxEventListeners();
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    });
}
// Function 7: Load Current Rescuer's Cargo
(async function() {
    // Load rescuer's cargo from the database
    try {
        const response = await fetch('/api/rescuer/getCargo', { method: 'GET' });
        const data = await response.json();
        if (data.success) {
            populateCargoTab(data.cargo);
        } else {
            console.error('Failed to load cargo:', data.message);
        }
        const itemsResponse = await fetch('/api/items');
        const items = await itemsResponse.json();
        renderItemsModal(items);
    } catch (error) {
        console.error('Error loading cargo:', error);
    }

})();

// Function 8: to update selected items list when unloading in bulk
function updateSelectedItems(cargo) {
    const selectedItemsBody = document.getElementById('selectedItemsBody');
    selectedItemsBody.innerHTML = '';  // Clear current list

    cargo.forEach(item => {
        const row = document.createElement('tr');

        const itemNameCell = document.createElement('td');
        itemNameCell.textContent = item.itemName;
        row.appendChild(itemNameCell);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = item.categoryName;
        row.appendChild(categoryCell);

        const quantityCell = document.createElement('td');
        quantityCell.textContent = item.quantity;
        row.appendChild(quantityCell);

        selectedItemsBody.appendChild(row);
    });
}

// Close all modals by default
function closeAllModals() {
    console.log('Closing all modals'); // Debugging log
    document.querySelectorAll('.modal, .modal-container').forEach(modal => {
        modal.style.display = 'none';
    });
}

// // Handle clicking outside the modal to close it
function closeModalOnOutsideClick() {
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal, .modal-container');
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Show the instructions modal
document.getElementById('instructionsLink').addEventListener('click', function(event) {
    event.preventDefault();
    closeAllModals();  // Close any open modals
    document.getElementById('instructionsModal').style.display = "block";
});

// Close modals when clicking on the close button
document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        closeAllModals();
    });
});

// Function to show the modals when the General Storage marker is clicked
function showStorageModals() {
    console.log('Showing storage modals'); // Debugging log
    closeAllModals();  // Close any open modals first
    document.getElementsByClassName('modal-container')[0].style.display = 'block';
    const itemsModal = document.getElementById('itemsModal');
    const searchModal = document.getElementById('searchModal');
    const selectedItemsList = document.getElementById('selectedItemsList');

    if (itemsModal && searchModal && selectedItemsList) {
        // Show items modal over the map container
        const mapContainer = document.querySelector('.map-container');
        const cargoContainer = document.querySelector('.cargo-container');

        if (mapContainer && cargoContainer) {
            // Set the items modal to cover the map
            itemsModal.style.display = 'block';
            itemsModal.style.width = mapContainer.offsetWidth + 'px';
            itemsModal.style.height = mapContainer.offsetHeight + 'px';
            itemsModal.style.top = mapContainer.offsetTop + 'px';
            itemsModal.style.left = mapContainer.offsetLeft + 55 + 'px'; 

            // Set the search and selected items modals over the cargo container
            searchModal.style.display = 'block';
            selectedItemsList.style.display = 'block';

            // Positioning searchModal and selectedItemsList on cargo container
            searchModal.style.width = cargoContainer.offsetWidth + 'px';
            searchModal.style.height = (cargoContainer.offsetHeight / 2) + 'px'; // Top half
            searchModal.style.top = cargoContainer.offsetTop + 'px';
            searchModal.style.left = cargoContainer.offsetLeft -200 + 'px';

            selectedItemsList.style.width = cargoContainer.offsetWidth + 'px';
            selectedItemsList.style.height = (cargoContainer.offsetHeight / 2) + 'px'; // Bottom half
            selectedItemsList.style.top = (cargoContainer.offsetTop + (cargoContainer.offsetHeight / 2)) -250 + 'px';
            selectedItemsList.style.left = cargoContainer.offsetLeft -200 + 'px';

            console.log('Modals are now visible');
        } else {
            console.error('Map or cargo container not found'); // Debugging log
        }
    } else {
        console.error('Modal elements not found'); // Debugging log if any modal is missing
    }
}

// Function to update selected items modal
function updateSelectedItemsModal(item, quantity) {
    const selectedItemsBody = document.getElementById('selectedItemsBody');

    // Check if the item is already in the selected items list
    let existingRow = Array.from(selectedItemsBody.children).find(row => {
        return row.querySelector('td:first-child').textContent.trim() === item.name;
    });

    if (existingRow) {
        // If the item exists, update the quantity
        const quantityCell = existingRow.querySelector('.quantity-cell');
        let currentQuantity = parseInt(quantityCell.textContent);
        quantityCell.textContent = currentQuantity + parseInt(quantity);
    } else {
        // If the item doesn't exist, create a new row
        const row = document.createElement('tr');

        const itemNameCell = document.createElement('td');
        itemNameCell.textContent = item.name;
        row.appendChild(itemNameCell);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = item.category;
        row.appendChild(categoryCell);

        const quantityCell = document.createElement('td');
        quantityCell.textContent = quantity;
        quantityCell.classList.add('quantity-cell');
        row.appendChild(quantityCell);

        selectedItemsBody.appendChild(row);
    }

    // If quantity is 0, remove the item from the selected items list
    if (quantity === 0) {
        existingRow?.remove();
    }
}




document.addEventListener('DOMContentLoaded', function () {
    // Ensure the load button exists before trying to add an event listener
    closeModalOnOutsideClick();
    const loadButton = document.getElementById('loadButton');
    if (loadButton) {
        loadButton.addEventListener('click', async function () {
            const rows = document.querySelectorAll('#itemsModal table tbody tr');
            let cargo = [];

            // Collecting the cargo data
            rows.forEach((row) => {
                const quantityInput = row.querySelector('input[type="number"]');
                if (quantityInput) {
                    const quantity = parseInt(quantityInput.value);

                    if (quantity > 0) {
                        const itemId = row.dataset.itemId;
                        const itemName = row.dataset.itemName;
                        const categoryName = row.dataset.categoryName;

                        if (itemId && categoryName && itemName) {  // Check all values
                            cargo.push({ itemId: itemId, itemName: itemName, categoryName: categoryName, quantity: quantity });
                        }
                    }
                }
            });

            console.log('Cargo to be saved:', JSON.stringify(cargo));
            // Update the selected items list under the search modal
            updateSelectedItems(cargo); // Function to populate selected items

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
                    // Check if "Cargo is currently empty!" message is there and remove it
                    const emptyMessage = document.querySelector('#loadedItems p');
                    if (emptyMessage) {
                        emptyMessage.remove(); // Remove the empty message
                    }

                    // Check if the cargo table exists, if not, create it
                    let tableBody = document.querySelector('#itemTable tbody');
                    if (!tableBody) {
                        let loadedItemsHtml = `
                            <table id="itemTable">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>#</th>
                                        <th>Item</th>
                                        <th>Category</th>
                                        <th>Quantity</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        `;
                        document.getElementById('loadedItems').innerHTML = loadedItemsHtml;
                        tableBody = document.querySelector('#itemTable tbody');  // Get the new table body
                    }

                    // Update the cargo table
                    cargo.forEach(item => {
                        let existingRow = null;
                        const itemRows = document.querySelectorAll('#itemTable tbody tr');

                        // Loop through the rows and find if the item already exists
                        itemRows.forEach(row => {
                            const itemNameCell = row.querySelector('td:nth-child(3)'); // Assuming the item name is in the 3rd column
                            if (itemNameCell && itemNameCell.textContent.trim() === item.itemName) {
                                existingRow = row;
                            }
                        });

                        if (existingRow) {
                            // Update the quantity if item already exists
                            const quantityCell = existingRow.querySelector('.quantity-cell');
                            const currentQuantity = parseInt(quantityCell.textContent);
                            quantityCell.textContent = currentQuantity + item.quantity;
                        } else {
                            // If item doesn't exist, add a new row
                            const newRowHtml = `
                                <tr>
                                    <td><input type="checkbox" class="item-checkbox" data-item-id="${item.itemId}"></td>
                                    <td>${tableBody.rows.length + 1}</td>
                                    <td>${item.itemName}</td>
                                    <td>${item.categoryName}</td>
                                    <td class="quantity-cell">${item.quantity}</td>
                                </tr>`;
                            tableBody.insertAdjacentHTML('beforeend', newRowHtml);
                        }
                    });

                    // Optionally, close the modal after loading products
                    document.querySelector('.modal-container').style.display = 'none';
                }
                

            } catch (error) {
                console.error('Error saving cargo:', error);
            }
        });
    } else {
        console.error('Load button not found');
    }

    
    // Add other event listeners here, such as for the unloadButton, if necessary
});



// Unload Cargo Button Event listener
document.getElementById('unloadButton').addEventListener('click', async function () {
    const selectedItems = [];

    // Iterate over each row in the cargo table
    document.querySelectorAll('#itemTable tbody tr').forEach(row => {
        const checkbox = row.querySelector('.item-checkbox');
        const quantityInput = row.querySelector('.quantity-input');

        if (checkbox && checkbox.checked && quantityInput) {
            const quantityToReturn = parseInt(quantityInput.value, 10) || 0;
            if (quantityToReturn > 0) {
                const itemName = checkbox.dataset.itemName;
                selectedItems.push({
                    itemName,
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
        const response = await fetch('/api/rescuer/unloadCargo', {
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
            const cargoResponse = await fetch('/api/rescuer/getCargo');
            const cargoData = await cargoResponse.json();
            populateCargoTab(cargoData.cargo);

            const dataDoc = await fetch('/api/items');
            const itemsData = await dataDoc.json();
            renderItemsModal(itemsData);
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

        showStorageModals();

        
    }
});



    
