// Debounce function to limit how often the location update is triggered
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
// Map Init
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
const DonateIcon = L.icon({
    iconUrl: '/icons/donate.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const map = L.map('map').setView([38.2462420, 21.7350847], 16);
let markerCivilian=null;
let currentTaskType = 'request';


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var markerStorage = L.marker([38.24600, 21.73500], {icon: StorageIcon}).addTo(map);
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
// Functions

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
        await populateAddress();
    
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
        markerCivilian.setIcon(peopleServedIcon);
        currentTaskType = 'request';  // Set task type to 'request'
    } else if (e.target.id === 'donateCheckbox') {
        document.getElementById('requestCheckbox').checked = false; // Uncheck the request option
        markerCivilian.setIcon(DonateIcon);
        currentTaskType = 'donation';  // Set task type to 'donation'
    }

    // Regenerate the form with the updated task type
    generateTaskForm(currentTaskType);
}

// Function 2: Filter items in the modal based on search input
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

// Populate form for creating a new task (request or donation)
async function generateTaskForm(taskType= 'request') {
    console.log('generateTaskForm is called with taskType:', taskType);
    const form = document.getElementById('dynamicForm');
    if (form) {
        form.innerHTML = `
            <h3>Post a Task</h3>
            
            <!-- Task Type Selection -->
            <div class="task-type-container">
                <label for="taskType">Task Type:</label>
                <input type="text" id="taskType" name="type" value="${taskType}" readonly>
            </div><br>

            <!-- Task Date and Time -->
            <div class="date-time-container">
                <label for="taskDate">Date:</label>
                <input type="text" id="taskDate" name="date" value="${new Date().toLocaleDateString('en-GB')}" readonly>

            </div><br>

            <!-- Address Display -->
            <div id="addressDisplay" class="address-display">
                <div class="address-row">
                    <label for="street">Street:</label>
                    <input type="text" id="street" name="street" >
                    <label for="number">Number:</label>
                    <input type="text" id="number" name="number" >
                </div>
                <div class="address-row">
                    <label for="city">City:</label>
                    <input type="text" id="city" name="city" >
                    <label for="country">Country:</label>
                    <input type="text" id="country" name="country" >
                </div>
                <div class="address-row">
                    <label for="zip">Postal Code:</label>
                    <input type="text" id="zip" name="zip" >
                </div>
            </div><br><br>

            <!-- Item Details -->
            <div class="item-details-container">
                <h4>Select Item</h4>
                <div class="item-select-container">
                    <label for="category">Category:</label>
                    <select id="category" name="itemCategory" class="category-select">
                         <option value="">All Categories</option>
                    </select>

                    <label for="itemName">Item:</label>
                    <select id="itemName" name="item" class="item-select" required>
                        <!-- Products populated dynamically based on category -->
                    </select>

                    <label for="quantity">Quantity:</label>
                    <input type="number" id="quantity" name="quantity" min="1" required>
                </div>
            </div><br><br>

            <!-- Submit Button -->
            <button type="submit" id="submitTaskButton" class="submit-task-button">Submit</button>
        `;
    }

    await populateAddress(); 
    // Fetch items and categories from your Data model
    await populateItemsAndCategories();
    
    if (!form.hasListener) {  // Adding a flag to check if the listener is already added
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            await submitTask();
        });
        form.hasListener = true;  // Setting the flag to true
    }

}

// Function to dynamically populate categories and items in the dropdown
async function populateItemsAndCategories() {
    try {
        const response = await fetch('/api/items');  // Fetch from the new Data-based route
        const data = await response.json();
        
        const categories = Array.from(new Set(data.map(item => item.category)));
        const categorySelect = document.getElementById('category');
        const itemSelect = document.getElementById('itemName');
        
        // Populate categories for user selection
        categorySelect.innerHTML = '<option value="">All Categories</option>'; // Default to all categories
        categories.forEach(category => {
            if (category) {  // Ensure category is valid
                const option = document.createElement('option');
                option.value = category;  // Use category as value
                option.text = category;  // Display category name
                categorySelect.appendChild(option);
            }
        });

        // Populate items when a category is selected
        categorySelect.addEventListener('change', function() {
            const selectedCategory = categorySelect.value;
            itemSelect.innerHTML = ''; // Clear the item select options

            // Filter items based on the selected category
            const filteredItems = selectedCategory 
                ? data.filter(item => item.category === selectedCategory)
                : data;  // Show all items if no category selected

            filteredItems.forEach(item => {
                if (item && item.id && item.name && item.category) {  // Ensure item has valid properties
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.text = item.name;
                    option.setAttribute('data-category', item.category);  // Attach the category id to the item
                    itemSelect.appendChild(option);
                }
            });
        });

        // Automatically populate the items with no category filter by default
        data.forEach(item => {
            if (item && item.id && item.name && item.category) {  // Ensure item has valid properties
                const option = document.createElement('option');
                option.value = item.id;
                option.text = item.name;
                option.setAttribute('data-category', item.category);  // Attach the category id to the item
                itemSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error fetching items and categories:', error);
    }
}


// Function to fetch the civilian's address and populate the form
async function populateAddress() {
    try {
        console.log("Attempting to fetch address from /api/civilian/address...");
        const response = await fetch('/api/civilian/address');
        const data = await response.json();
        console.log("Address data received:", data);  // Log to ensure we're getting the correct data

        // Check if data exists before setting values
        if (data) {
            // Check if each field exists in the DOM before setting its value
            const streetField = document.getElementById('street');
            const numberField = document.getElementById('number');
            const cityField = document.getElementById('city');
            const countryField = document.getElementById('country');
            const zipField = document.getElementById('zip');

            if (streetField) streetField.value = data.street || '';
            if (numberField) numberField.value = data.number || '';  // Handle null value for 'number'
            if (cityField) cityField.value = data.city || '';
            if (countryField) countryField.value = data.country || '';
            if (zipField) zipField.value = data.zip || '';
        } else {
            console.error('No address data found.');
        }
    } catch (error) {
        console.error('Error fetching address:', error);
    }
}
let civilianId = null;
// Fetch the civilian ID from the session
async function fetchCivilianId() {
    try {
        const response = await fetch('/api/civilian/id');
        const data = await response.json();
        
        if (data.civilianId) {
            civilianId = data.civilianId;
            console.log("Civilian ID fetched from session:", civilianId);
        } else {
            console.error('User is not authenticated');
        }
    } catch (error) {
        console.error('Error fetching civilian ID:', error);
    }
}

// Function to submit task
async function submitTask() {
    const taskType = document.getElementById('taskType').value;
    const itemSelect = document.getElementById('itemName');
    
    // Ensure itemSelect exists and has a value
    if (!itemSelect || !itemSelect.value || !civilianId) {
        console.error("Item select element, its value, or civilianId is missing.");
        return;
    }

    const itemId = itemSelect.value;  // The selected item id
    
    const selectedItemOption = itemSelect.options[itemSelect.selectedIndex];
    const itemName = selectedItemOption.textContent;  // Get the item name
    // Check if the selected option has the 'data-category' attribute
    if (!selectedItemOption || !selectedItemOption.getAttribute('data-category')) {
        console.error("No valid item selected or item is missing its category.");
        return;
    }

    const itemCategory = selectedItemOption.getAttribute('data-category');
    const quantity = document.getElementById('quantity').value;

    if (!itemCategory) {
        alert('Item category is missing. Please try selecting the item again.');
        return;
    }

    const street = document.getElementById('street').value;
    const number = document.getElementById('number').value;
    const city = document.getElementById('city').value;
    const country = document.getElementById('country').value;
    const zip = document.getElementById('zip').value;

    const taskData = {
        type: taskType,
        status: 'pending',
        civilianId: civilianId,
        address: { street, number, city, zip, country },
        item: itemName,  // Pass the selected item id
        itemCategory: itemCategory,  // Use the category id associated with the selected item
        quantity,
        rescuerUsername: null, 
        dateServed: null 
    };

    console.log("Submitting task data:", taskData);

    try {
        const response = await fetch('/api/civilian/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData),
        });

        if (response.ok) {
            alert('Task submitted successfully!');
        } else {
            const errorData = await response.json();
            console.error('Error submitting task:', errorData);
            alert('Error submitting task: ' + errorData.message);
        }
    } catch (error) {
        console.error('Error submitting task:', error);
        alert('Error submitting task');
    }
}

async function fetchTasks() {
    try {
        const response = await fetch('/api/civilian/loadtasks'); // API to get the civilian's tasks
        const data = await response.json();
        
        const tasks = data.tasks;

        if (response.ok && tasks.length > 0) {
            renderTaskTable(tasks);  // Call to render tasks in the table
        } 
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

function renderTaskTable(tasks) {
    const taskTableDiv = document.getElementById('taskHistoryTable'); // The div where the table will be placed

    if (!tasks || tasks.length === 0) {
        taskTableDiv.innerHTML = '<p>No tasks found</p>';
        return;
    }

    // Create the table structure with the headers and an empty body
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Type</th>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Date Submitted</th>
                    <th>Status</th>
                    <th>Rescuer</th>
                    <th>Date Served</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Loop through the tasks and create rows for each task
    tasks.forEach((task, index) => {
        tableHTML += `
            <tr>
                <td>${index+1}</td>
                <td>${task.type}</td>
                <td>${task.item}</td>
                <td>${task.itemCategory}</td>
                <td>${task.quantity}</td>
                <td>${new Date(task.dateSubmitted).toLocaleDateString()}</td>
                <td>${task.status}</td>
                <td>${task.rescuerUsername || 'N/A'}</td>
                <td>${task.dateServed ? new Date(task.dateServed).toLocaleDateString() : 'N/A'}</td>
            </tr>
        `;
    });

    // Close the table body and table tag
    tableHTML += `
            </tbody>
        </table>
    `;

    // Insert the table into the div
    taskTableDiv.innerHTML = tableHTML;
}

// Function to fetch announcements from the API and render them in the table
async function fetchAnnouncements() {
    try {
        const response = await fetch('/api/civilian/announcements'); // API route to fetch announcements
        const announcements = await response.json();
        renderAnnouncementsTable(announcements);
        
    } catch (error) {
        console.error('Error fetching announcements:', error);
    }
}

// Function to render announcements in the table
function renderAnnouncementsTable(announcements) {
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Announcement</th>
                    <th>Items</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Loop through the announcements and create rows for each announcement
    announcements.forEach((announcementObj) => {
        announcementObj.type.forEach(announcement => {
            tableHTML += `
                <tr>
                    <td>${announcement.date}</td>
                    <td>${announcement.announcement}</td>
                    <td>${announcement.items}</td>
                </tr>
            `;
        });
    });

    // Close the table
    tableHTML += `
        </tbody>
        </table>
    `;

    // Insert the table into the DOM (you need to specify where to insert the tableHTML)
    document.getElementById('announcementContent').innerHTML = tableHTML;
}




document.addEventListener('DOMContentLoaded', function () {
    fetchCivilianId();
    getCivilianLocation();
    generateTaskForm(currentTaskType); // Initialize with 'request'
    

    // Event listeners for request/donate checkboxes
    document.getElementById('requestCheckbox').addEventListener('change', toggleMarkerIcon);
    document.getElementById('donateCheckbox').addEventListener('change', toggleMarkerIcon);
    // Open the Request tab by default
    openTab('requestTab', document.getElementById('requestTabBtn'));
});

