let map, markerStorage, markerRescuer, routingControl;  
let civilianMarkers = {}; 
let currentRescuerId = null;  // Declare a global variable

// Icons Init
const StorageIcon = L.icon({
    iconUrl: '/maptry/icons/Storage.png', 
    iconSize: [40, 40],
    iconAnchor: [15,8],
    popupAnchor: [0, 0]
});
const RescuerIcon = L.icon({
    iconUrl: '/maptry/icons/transport.png',
    iconSize: [40, 40],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const peopleServedIcon = L.icon({
    iconUrl: '/maptry/icons/peopleServed.png',
    iconSize: [35, 35],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const peoplePendingIcon = L.icon({
    iconUrl: '/maptry/icons/peoplePending.png',
    iconSize: [35, 35],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
document.addEventListener("DOMContentLoaded", async function() {
    console.log('DOM completed - Map is LOADING ...');
    try {
        const response = await fetch('/api/rescuer/current');
        const data = await response.json();
        if (!data.success) {
            console.error('Failed to fetch current rescuer ID');
            return;
        }
        currentRescuerId = data.rescuerId; // Store the current rescuer's ID globally
        console.log(currentRescuerId);
    } catch (error) {
        console.error('Error fetching current rescuer ID:', error);
    }
    // map init
    const map = L.map('map').setView([38.2462420, 21.7350847], 16);
            
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var markerStorage = L.marker([38.24600, 21.73500], {icon: StorageIcon}).addTo(map);    
    let markerRescuer = L.marker([38.24600, 21.73450], {
        icon: RescuerIcon,
        draggable: true
    }).addTo(map);
    markerRescuer.bindPopup('Drag and Drop me to your location!').openPopup();
    updateUnloadButtonState();
    fetchCivilianLocations();
    fetchCivilianInfo();
    
    // markerStorage on Click event *Trigger*
    markerStorage.on('click', async function() {
        console.log('markerStorage on click Event Triggered!')
        rescuerCurrentPosition = markerRescuer.getLatLng();
        const distance = calculateDistance(markerStorage.getLatLng(), rescuerCurrentPosition);
        console.log('Distance between rescuer, storage: ', distance)
    
        if (distance <= 100) {
            try {
                // Fetch request to get the items
            fetch('/api/items')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                return response.json(); // Return the JSON response (actual data)
            })
            .then(items => {  // Use the actual data as `items`
                console.log('Fetched items:', items);
                 // Show the storage modals
                showStorageModals();
            
                // Render items in the items modal
                renderItemsModal(items);
                // Send a message to the parent document to show the modal and populate it
                window.parent.postMessage({
                    type: 'showItemsModal',
                    items: items  // Pass the fetched items as products
                }, '*');
            })
            .catch(error => console.error('Error fetching items:', error));
    } catch (error) {
        console.error('Error fetching or displaying products:', error);
    }
        }
    });
    // markerRescuer on Drag event *Trigger*
    markerRescuer.on('drag', function() {
        updateUnloadButtonState();
        // fetchTasks();
    });
    // Event listener for when the marker is dragged and dropped
    markerRescuer.on('dragend', function(event) {
        fetchCivilianLocations();
        updateRouteForSelectedTasks();
        var position = markerRescuer.getLatLng();
        console.log('Rescuer\'s location: ', position.lat, position.lng);

        // Send an AJAX request to update the rescuer's location in the database
        fetch('/api/rescuer/updateRescuerLocation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lng: position.lat, lat: position.lng })
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Location updated successfully.');
                updateRouteForSelectedTasks();
            } else {
                console.error('Failed to update location:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));        
        // Update the Unload button state based on the new position
        updateUnloadButtonState();
    });
    
    


// Functions
// Function to calculate the distance between two LatLng points in meters
function calculateDistance(latlng1, latlng2) {
    return map.distance(latlng1, latlng2);
}
// Function to update the Unload button state based on distance
function updateUnloadButtonState() {
    const storageLatLng = markerStorage.getLatLng();
    const rescuerLatLng = markerRescuer.getLatLng();

    const distance = calculateDistance(storageLatLng, rescuerLatLng);

    // Send a message to the parent window with the distance info to enable/disable the Unload button
    window.parent.postMessage({
        type: 'updateUnloadButtonState',
        distance: distance
    }, '*');
}

// Function to update the route based on selected tasks and the rescuer's location
// Function to update the route based on selected tasks and the rescuer's location
// Function to update the route based on civilians with tasks assigned to the current rescuer
async function updateRouteForSelectedTasks() {
    const rescuerLatLng = markerRescuer.getLatLng();
    const selectedCivilianLocations = [];

    try {
        // Fetch the current rescuer's ID from the backend
        const response = await fetch('/api/rescuer/current');
        const data = await response.json();

        if (!data.success) {
            console.error('Failed to fetch current rescuer ID');
            return;
        }

        const currentRescuerId = data.rescuerId; // Get the current rescuer's ID from the backend

        // Loop through each civilian marker and check if the conditions match
        for (let civilianId in civilianMarkers) {
            const { marker, tasks } = civilianMarkers[civilianId]; // Retrieve both marker and tasks
            
            // Ensure tasks are defined before filtering
            if (tasks && Array.isArray(tasks)) {
                const matchingTasks = tasks.filter(task => task.status === 'processed' && task.rescuerUsername === currentRescuerId);
                
                // If civilian has any task with 'processed' status assigned to this rescuer, add their location
                if (matchingTasks.length > 0) {
                    const civilianLatLng = marker.getLatLng();
                    selectedCivilianLocations.push([civilianLatLng.lng, civilianLatLng.lat]);
                }
            } else {
                console.error(`Tasks not found for civilian ID: ${civilianId}`);
            }
        }

        // Draw route if there are selected civilians
        if (selectedCivilianLocations.length > 0) {
            drawRoute(rescuerLatLng, selectedCivilianLocations);
        } else {
            if (routingControl) {
                map.removeControl(routingControl);  // Remove the route if no tasks match
            }
        }

    } catch (error) {
        console.error('Error fetching current rescuer ID:', error);
    }
}

// Fetch civilian locations and add them to the map
async function fetchCivilianInfo() {
    try {
        const response = await fetch('/api/rescuer/civInfo');  // Correct route for rescuer
        const civilians = await response.json();

        if (response.ok) {
            civilians.forEach(civilian => {
                if (civilian.location && civilian.location.coordinates) {
                    const lat = civilian.location.coordinates[0];
                    const lng = civilian.location.coordinates[1];
                    const name = civilian.name;
                    const tasks = civilian.tasks;
                    const phone = civilian.cellphone;
                    const address = `${civilian.address.street}, ${civilian.address.number}, ${civilian.address.city}, ${civilian.address.zip}, ${civilian.address.country}`;
                    
                    const hasProcessedTask = tasks.some(task => task.status === 'processed' && task.rescuerUsername === currentRescuerId);
                    const hasPendingOnly = tasks.every(task => task.status === 'pending');
                    console.log(`hasProcessedTasks: ${hasProcessedTask}\nhasPendingOnly: ${hasPendingOnly}`);
                    // Set the appropriate icon based on task status
                    let icon;
                    if (hasProcessedTask) {
                        icon = peopleServedIcon; // Use peopleServedIcon if there is any processed task
                    } else if (hasPendingOnly) {
                        icon = peoplePendingIcon; // Use peoplePendingIcon if all tasks are pending
                    } else {
                        icon = peoplePendingIcon; // Default to peoplePendingIcon
                    }
                    
                    
                    
                    let tasksTable = `<table>
                                        <thead>
                                            <tr>
                                                <th>Select</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Item</th>
                                                <th>Category</th>
                                                <th>Quantity</th>
                                            </tr>
                                        </thead>
                                        <tbody>`;
                    tasks.forEach((task, index) => {
                        tasksTable += `
                            <tr>
                                <td><input type="checkbox" class="task-checkbox" value="${task._id}" id="task-${index}"></td>
                                <td>${task.type}</td>
                                <td>${task.status}</td>
                                <td>${task.item}</td>
                                <td>${task.itemCategory}</td>
                                <td>${task.quantity}</td>
                            </tr>`;
                    });
                    
                    tasksTable += `</tbody></table>`;
                    // Add the "Serve" button at the bottom of the popup
                    

                    // Add a marker for each civilian on the map with a popup showing their info
                    const marker = L.marker([lat, lng], { icon: icon }).addTo(map)
                      .bindPopup(`
                          <b>Name:</b> ${name}<br>
                          <b>Phone:</b> ${phone}<br>
                          <b>Address:</b> ${address}<br><br>
                          <b>Tasks:</b><br>
                          ${tasksTable}
                          <button onclick="serveTasks('${civilian._id}')">Select</button>
                    `);
                        // Store the marker in the civilianMarkers object
                    civilianMarkers[civilian._id] = {marker, tasks};
                }
            });
            // Draw the route connecting the rescuer to the civilians
            updateRouteForSelectedTasks();

        } else {
            console.log(civilians.message || 'No civilians found');
        }
    } catch (error) {
        console.error('Error fetching civilians locations:', error);
    }
}








// When task checkboxes are clicked, update the route accordingly
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('task-checkbox')) {
        updateRouteForSelectedTasks();  // Re-draw the route based on selected tasks
    }


});

    
    
        
});

// Function to fetch civilian locations and draw the route
async function fetchCivilianLocations() {
    if (!markerRescuer) {
        console.error('MarkerRescuer is undefined.');
        return;  // Return early if markerRescuer is not defined
    }
    
    const rescuerLatLng = markerRescuer.getLatLng(); // Safely call getLatLng only if markerRescuer is defined

    try {
        const response = await fetch(`/api/rescuer/civilian-locations/${currentRescuerId}`);
        const data = await response.json();

        if (data.success) {
            const civilianLocations = data.civilianLocations.map(loc => loc.location);

            // Draw the route based on the rescuer and civilian locations
            if (civilianLocations.length > 0) {
                drawRoute(rescuerLatLng, civilianLocations);
            } else {
                if (routingControl) {
                    map.removeControl(routingControl);  // Remove the route if no tasks match
                }
            }
        } else {
            console.error('No civilians found or error fetching civilians');
        }
    } catch (error) {
        console.error('Error fetching civilian locations:', error);
    }
}


// Function to draw a route between the rescuer and selected civilians
function drawRoute(rescuerLatLng, civilianLocations) {
    if (routingControl) {
        map.removeControl(routingControl); // Remove existing route
    }

    const waypoints = [
        L.latLng(rescuerLatLng.lat, rescuerLatLng.lng),   // Start with rescuer's location
        ...civilianLocations.map(loc => L.latLng(loc[1], loc[0]))  // Add selected civilian locations
    ];

    routingControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: false,
        show: true,
        addWaypoints: false,
        createMarker: function() { return null; }  // Don't create markers on the route itself
    }).addTo(map);
}



async function serveTasks(civilianId) {
    // Get all selected task checkboxes
    const selectedTasks = document.querySelectorAll('.task-checkbox:checked');
    const taskIds = Array.from(selectedTasks).map(checkbox => checkbox.value);

    if (taskIds.length === 0) {
        alert('Please select at least one task to serve.');
        return;
    }

    try {
        const response = await fetch('/api/rescuer/serveTasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ civilianId, taskIds })
        });

        if (response.ok) {
            alert('Tasks successfully served!');
        } else {
            const errorData = await response.json();
            alert(`Error serving tasks: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error serving tasks:', error);
        alert('Error serving tasks');
    }
}


