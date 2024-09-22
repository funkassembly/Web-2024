// Debounce function to limit how often the location update is triggered
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
const StorageIcon = L.icon({
    iconUrl: '/icons/Storage.png', 
    iconSize: [40, 40],
    iconAnchor: [15,8],
    popupAnchor: [0, 0]
});
const peopleServedIcon = L.icon({
    iconUrl: '/icons/peoplePending.png',
    iconSize: [40, 40],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const map = L.map('map').setView([38.2462420, 21.7350847], 16);
let markerCivilian=null;
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var markerStorage = L.marker([38.24600, 21.73500], {icon: StorageIcon}).addTo(map);

// Fetch and place civilian marker
async function getCivilianLocation() {
    try {
        // Fetch the logged-in civilian's location from the server
        const response = await fetch('/api/civilian/location');  // Replace with your actual API endpoint
        const data = await response.json();
        
        if (data && data.location && data.location.coordinates) {
            const lat = data.location.coordinates[0];  // latitude
            const lng = data.location.coordinates[1];  // longitude

            // Place the civilian's marker
            markerCivilian = L.marker([lat, lng], { icon: peopleServedIcon, draggable: true }).addTo(map);

            // Add popup to the marker
            markerCivilian.bindPopup("<b>Is this your current location?</b>").openPopup();
            // Create bounds that include both the civilian marker and the general storage marker
            const bounds = L.latLngBounds([ [lat, lng], [38.24600, 21.73500] ]);

            // Adjust the map to fit both markers within the view
            map.fitBounds(bounds, { padding: [50, 50] }); // Optional padding for better view
            // Attach the debounced update function to the marker's 'moveend' event
            markerCivilian.on('moveend', debouncedUpdateAddress);
        
        } else {
            console.error("No location data found for civilian.");
        }
    } catch (error) {
        console.error('Error fetching civilian location:', error);
    }
};
// Debounced update function for marker movement
const debouncedUpdateAddress = debounce(async function() {
    if (markerCivilian) {
        const latLng = markerCivilian.getLatLng();
    
        try {
            const response = await fetch('/api/civilian/updateLocation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lat: latLng.lat,
                    lng: latLng.lng
                })
            });
            // Ensure the response status is OK
            if (!response.ok) {
                throw new Error('Failed to update location');
            }

            const data = await response.json();
            console.log('Location update response:', data); // Log response

            // Update success/failure message based on data
            if (data.message) {
                console.log(data.message); // Log the success message
            } else {
                console.error('Failed to update location: No message returned');
            }
        } catch (error) {
            console.error('Error:', error.message || 'Failed to update location');
        }
    }
}, 300); // 300ms debounce delay

// Function to toggle the marker icon based on checkbox selection
function toggleMarkerIcon(e) {
    if (e.target.id === 'requestCheckbox') {
        document.getElementById('donateCheckbox').checked = false; // Uncheck the donate option
        markerCivilian.setIcon(RequestIcon);
        generateRequestForm();
    } else if (e.target.id === 'donateCheckbox') {
        document.getElementById('requestCheckbox').checked = false; // Uncheck the request option
        markerCivilian.setIcon(DonateIcon);
        generateDonateForm();
    }
}

// Function 1: Filter items in the modal based on search input
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

// Function 2: Render items in the modal 'on click' of General Storage Marker
function renderItemsModal(items) {
    const itemsTable = document.getElementById('itemsTable');

    // Clear any existing rows in the table
    itemsTable.innerHTML = `
        <thead>
            <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Details</th>
                <th>In Stock?</th>
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

        // inStock (✓ for true, ✗ for false)
        const stockCell = document.createElement('td');
        stockCell.innerText = item.stock ? '✓' : '✗';
        row.appendChild(stockCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    });

    // Call the filter function after rendering the items
    filterItemsModal();
}

// Function 3: Show the items modal when General Storage Marker is clicked
function showItemsModal(items) {
    const itemsModal = document.getElementById('itemsModal');
    const closeBtn = document.querySelector('.close-modal');

    // Render the items in the modal
    renderItemsModal(items);

    // Display the modal
    itemsModal.style.display = 'block';

    // Add event listener to close the modal
    closeBtn.addEventListener('click', () => {
        itemsModal.style.display = 'none';
    });

    // Close modal when clicking outside of the content
    window.onclick = function(event) {
        if (event.target === itemsModal) {
            itemsModal.style.display = 'none';
        }
    };
}
// Fetch items from your API and show the modal when marker is clicked
markerStorage.on('click', async function() {
    try {
        // Fetch items from your API
        const itemsResponse = await fetch('/api/items');
        const items = await itemsResponse.json();

        // Show the items modal with the fetched items
        showItemsModal(items);
    } catch (error) {
        console.error('Error fetching items:', error);
    }
});


document.addEventListener('DOMContentLoaded', function () {
    // Call the function to get and place the civilian's location
    getCivilianLocation();
    // Event listeners for the checkboxes
    // document.getElementById('requestCheckbox').addEventListener('change', toggleMarkerIcon);
    // document.getElementById('donateCheckbox').addEventListener('change', toggleMarkerIcon);
});

