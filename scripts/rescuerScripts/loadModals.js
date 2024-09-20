const modals = document.querySelectorAll('.modal');
const closeButtons = document.querySelectorAll('.close-modal');

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
        console.log('itemsTable found:', itemsTable);

        renderItemsModal(items);
        itemsModal.style.display = 'block';
    }
    if (event.data.type === 'loadCiviliansMarkers') {
        const civilians = event.data.civilians;
        console.log("Civilians Data:", civilians); // Debugging line

        civilians.forEach(civilian => {
            const [lng, lat] = civilian.location.coordinates;

            // Choose the appropriate icon based on whether it's a request or donation
            let icon = civilian.requests.length > 0 ? peoplePendingIcon : DonateIcon;

            

            // Optionally bind a popup with more details
            let popupContent = `<strong>Action:</strong> ${civilian.requests.length > 0 ? 'Request' : 'Donation'}<br>`;
            popupContent += `<strong>Location:</strong> ${lng}, ${lat}<br>`;

            if (civilian.requests.length > 0) {
                // Add request details
                popupContent += `<strong>Requests:</strong><br><ul>`;
                civilian.requests.forEach(request => {
                    popupContent += `<li>${request.item}: ${request.quantity}</li>`;
                });
                popupContent += `</ul>`;
            } else if (civilian.donations.length > 0) {
                // Add donation details
                popupContent += `<strong>Donations:</strong><br><ul>`;
                civilian.donations.forEach(donation => {
                    popupContent += `<li>${donation.item}: ${donation.quantity}</li>`;
                });
                popupContent += `</ul>`;
            }
            console.log("Popup Content:", popupContent); // Debugging line
            // Add a marker for each civilian
            const marker = L.marker([lng, lat], { icon: icon }).addTo(map);
            marker.bindPopup(popupContent);
        });
    }
});

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
