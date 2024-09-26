let civilianMarkers = {}; 
let rescuerMarkers = {};
let routingControl = null; // Declare globally

// --- Icons Initialization ---
const StorageIcon = L.icon({
    iconUrl: '/maptry/icons/Storage.png',
    iconSize: [40, 40],
    iconAnchor: [15, 8],
    popupAnchor: [0, 0]
});

const RescuerIcon = L.icon({
    iconUrl: '/maptry/icons/transport.png',
    iconSize: [40, 40],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

const CivilianPendingIcon = L.icon({
    iconUrl: '/maptry/icons/peoplePending.png',
    iconSize: [35, 35],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

const CivilianDonationIcon = L.icon({
    iconUrl: '/maptry/icons/peopleDonation.png',
    iconSize: [35, 35],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

const CivilianServedIcon = L.icon({
    iconUrl: '/maptry/icons/peopleServed.png',
    iconSize: [35, 35],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

const RequestIcon = L.icon({
    iconUrl: '/maptry/icons/req.png',
    iconSize: [40, 40],
    iconAnchor: [15, 8],
    popupAnchor: [0, 0]
});

const DonateIcon = L.icon({
    iconUrl: '/maptry/icons/donate.png',
    iconSize: [40, 40],
    iconAnchor: [15, 8],
    popupAnchor: [0, 0]
});

// Combined Icon Function
function createCombinedIcon(baseIcon, overlayIcon) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="position: relative;">
                <img src="${baseIcon.options.iconUrl}" style="width: ${baseIcon.options.iconSize[0]}px; height: ${baseIcon.options.iconSize[1]}px;">
                <img src="${overlayIcon}" style="position: absolute; top: -5px; right: -5px; width: 20px; height: 20px;">
            </div>
        `,
        iconSize: baseIcon.options.iconSize,
        iconAnchor: baseIcon.options.iconAnchor,
        popupAnchor: baseIcon.options.popupAnchor
    });
}

// --- Initialize Map when DOM is fully loaded ---
document.addEventListener("DOMContentLoaded", async function () {
    console.log('DOM completed - Map is LOADING ...');

    // Initialize the Map
    const map = L.map('map').setView([38.2462420, 21.7350847], 16);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // --- Marker for Storage (Static) ---
    var markerStorage = L.marker([38.24600, 21.73500], { icon: StorageIcon }).addTo(map);
    markerStorage.bindPopup("Storage Location");

    // Set filters as checked on page load (Processed and Pending)
    document.querySelector('.main-filter[value="pending"]').checked = true;
    document.querySelector('.main-filter[value="served"]').checked = true;

    // Fetch and display civilians and rescuers
    await fetchAndDisplayCivilians(map);
    await fetchAndDisplayRescuers(map);
    
    // Attach event listeners for filters after DOM is loaded
    const mainFilters = document.querySelectorAll('.main-filter');
    const subFilters = document.querySelectorAll('.sub-filter');
    const routeFilter = document.getElementById('routeFilter');

    // Add event listeners for changes in the filters
    mainFilters.forEach(filter => filter.addEventListener('change', applyFilter));
    subFilters.forEach(filter => filter.addEventListener('change', applyFilter));
    routeFilter.addEventListener('change', applyFilter);

    // Handle filter toggle button click
    document.getElementById('filterToggleButton').addEventListener('click', function () {
        const filterContainer = document.getElementById('filters');
        filterContainer.style.display = filterContainer.style.display === 'none' || filterContainer.style.display === '' ? 'block' : 'none';
    });

    // Optional: Ensure map size is correctly calculated
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
    
});

// --- Function to Fetch and Display Civilians ---
async function fetchAndDisplayCivilians(map) {
    try {
        const response = await fetch('/api/rescuer/civInfo');
        const civilians = await response.json();

        if (response.ok) {
            console.log('Fetched Civilians:', civilians);
            civilians.forEach(civilian => {
                if (civilian.location && civilian.location.coordinates) {
                    const lat = civilian.location.coordinates[0];
                    const lng = civilian.location.coordinates[1];
                    const name = civilian.name;
                    const tasks = civilian.tasks;
                    const phone = civilian.cellphone;
                    const address = `${civilian.address.street}, ${civilian.address.number}, ${civilian.address.city}, ${civilian.address.zip}, ${civilian.address.country}`;

                    // Determine icon based on task status
                    const hasProcessedTask = tasks.some(task => task.status === 'processed');
                    const hasPendingOnly = tasks.every(task => task.status === 'pending');
                    let icon = hasProcessedTask ? CivilianServedIcon : (hasPendingOnly ? CivilianPendingIcon : CivilianDonationIcon);

                    // Create the tasks table for the popup
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

                    // Add the civilian marker with the popup
                    const marker = L.marker([lat, lng], { icon: icon }).addTo(map)
                        .bindPopup(`
                            <b>Name:</b> ${name}<br>
                            <b>Phone:</b> ${phone}<br>
                            <b>Address:</b> ${address}<br><br>
                            <b>Tasks:</b><br>${tasksTable}
                            <button onclick="serveTasks('${civilian._id}')">Serve</button>
                        `);

                    // Store the marker for filtering
                    civilianMarkers[civilian._id] = { marker, tasks };
                }
                
            });
        } else {
            console.log('No civilians found');
        }
    } catch (error) {
        console.error('Error fetching civilians:', error);
    }
}

// --- Function to Fetch and Display Rescuers ---
async function fetchAndDisplayRescuers(map) {
    try {
        const response = await fetch('/api/rescuer/all');
        const data = await response.json();

        if (response.ok && data.rescuers && Array.isArray(data.rescuers)) {
            console.log('Fetched Rescuers:', data.rescuers);
            data.rescuers.forEach(rescuer => {
                const { latitude, longitude, username, email, cargo = [], pendingTasks = [] } = rescuer;

                // Create a marker for each rescuer
                let marker = L.marker([latitude, longitude], { icon: RescuerIcon }).addTo(map);

                // Create a string for cargo and tasks
                let cargoDetails = cargo.map(item => `${item.item || 'Unknown Item'} (Qty: ${item.quantity || 0})`).join('<br>');
                let pendingDetails = pendingTasks.length > 0
                    ? pendingTasks.map(task => `Civilian ID: ${task.civilianId || 'Unknown'} (${task.type || 'Unknown'})`).join('<br>')
                    : 'No Pending Tasks';

                // Bind a popup with the rescuer's details
                marker.bindPopup(`
                    <strong>Rescuer: ${username || 'Unknown'}</strong><br>
                    <strong>Email:</strong> ${email || 'N/A'}<br>
                    <strong>Cargo:</strong><br>${cargoDetails}<br>
                    <strong>Pending Tasks:</strong><br>${pendingDetails}
                `);

                // Store the marker for filtering
                rescuerMarkers[rescuer._id] = { marker, pendingTasks };
            });
        } else {
            console.error('Failed to fetch rescuer data');
        }
    } catch (error) {
        console.error('Error fetching rescuers:', error);
    }
}

// --- Function to Apply Filters ---
function applyFilter() {
    const isPendingChecked = document.querySelector('.main-filter[value="pending"]').checked;
    const isServedChecked = document.querySelector('.main-filter[value="served"]').checked;
    const isRequestChecked = document.querySelector('.sub-filter[value="request"]').checked;
    const isDonationChecked = document.querySelector('.sub-filter[value="donation"]').checked;
    const isRouteChecked = document.getElementById('routeFilter').checked;

    const servedCivilianLocations = [];
    const rescuerWaypoints = [];

    // Loop through civilian markers to update icons and visibility
    for (let civilianId in civilianMarkers) {
        const { marker, tasks } = civilianMarkers[civilianId];
        let showMarker = false;
        let baseIcon = CivilianPendingIcon;

        // Check if the marker is valid and hasn't been removed already
        

        const hasProcessedTask = tasks.some(task => task.status === 'processed');
        const hasOnlyDonateTasks = tasks.every(task => task.type === 'donation');

        if (hasProcessedTask) {
            baseIcon = CivilianServedIcon;
            if (isServedChecked) showMarker = true;
            servedCivilianLocations.push(marker.getLatLng());
        } else if (hasOnlyDonateTasks) {
            baseIcon = CivilianDonationIcon;
            if (isPendingChecked) showMarker = true;
        } else {
            baseIcon = CivilianPendingIcon;
            if (isPendingChecked) showMarker = true;
        }

        const requestCount = tasks.filter(task => task.type === 'request').length;
        const donateCount = tasks.filter(task => task.type === 'donation').length;

        if (isRequestChecked && requestCount > donateCount) {
            baseIcon = createCombinedIcon(baseIcon, '/maptry/icons/req.png');
        } else if (isDonationChecked && donateCount >= requestCount) {
            baseIcon = createCombinedIcon(baseIcon, '/maptry/icons/donate.png');
        }

        // Update the marker icon
        marker.setIcon(baseIcon);

        // Only add to the map if the marker should be visible
        
    }

    // Loop through rescuer markers to update visibility
    for (let rescuerId in rescuerMarkers) {
        const { marker, pendingTasks } = rescuerMarkers[rescuerId];
        let showMarker = false;

        // Check if the marker is valid and hasn't been removed already
        

        if (isPendingChecked && pendingTasks.length === 0) {
            showMarker = true; // Show rescuers with no tasks if pending is checked
        } else if (isServedChecked && pendingTasks.length > 0) {
            showMarker = true; // Show rescuers with tasks if served is checked
            rescuerWaypoints.push(marker.getLatLng());
        }

        // if (showMarker && !map.hasLayer(marker)) {
        //     marker.addTo(map);
        // } else if (!showMarker && map.hasLayer(marker)) {
        //     marker.remove();
        // }
    }

    // Handle Route Drawing
    if (isRouteChecked && isServedChecked && servedCivilianLocations.length > 0 && rescuerWaypoints.length > 0) {
        drawRouteBetweenMarkers(rescuerWaypoints, servedCivilianLocations);
    } else if (routingControl) {
        map.removeControl(routingControl);
    }
}

// --- Function to Draw Routes Between Markers ---
function drawRouteBetweenMarkers(rescuerWaypoints, civilianLocations) {
    if (routingControl) {
        map.removeControl(routingControl);
    }

    const waypoints = [...rescuerWaypoints, ...civilianLocations];

    routingControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true,
        show: false,
        createMarker: () => null
    }).addTo(map);
}

// Function to handle serving tasks
function serveTasks(civilianId) {
    alert(`Serving tasks for civilian ID: ${civilianId}`);
}
