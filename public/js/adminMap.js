let civilianMarkers = {}; 
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
// Combined Icon Function (similar to loadMap.js)
function createCombinedIcon(baseIcon, overlayIcon) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="position: relative;">
                <img src="${baseIcon.options.iconUrl}" style="width: ${baseIcon.options.iconSize[0]}px; height: ${baseIcon.options.iconSize[1]}px;">
                <img src="${overlayIcon}" style="position: absolute; top: -5px; right: -5px; width: 20px; height: 20px;"> <!-- Adjusted position -->
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

    // --- Initialize the Map ---
    const map = L.map('map').setView([38.2462420, 21.7350847], 16);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // --- Marker for Storage (Static) ---
    var markerStorage = L.marker([38.24600, 21.73500], { icon: StorageIcon }).addTo(map);
    markerStorage.bindPopup("Storage Location");
    document.getElementById('filterToggleButton').addEventListener('click', function () {
        const filterContainer = document.getElementById('filters');
        if (filterContainer.style.display === 'none' || filterContainer.style.display === '') {
            filterContainer.style.display = 'block';  // Show the filters
        } else {
            filterContainer.style.display = 'none';  // Hide the filters
        }
    });

    // --- Fetch and Display Rescuers on the Map ---
    try {
        const response = await fetch('/api/rescuer/all'); // Fetch all rescuers
        const data = await response.json();

        if (!data.success) {
            console.error('Failed to fetch rescuer data');
            return;
        }

        // Check if rescuers is defined
        if (!data.rescuers || !Array.isArray(data.rescuers)) {
            console.error('Rescuers data is undefined or not an array');
            return;
        }

        // Loop through the list of rescuers and add a marker for each one
        const rescuers = data.rescuers;
        rescuers.forEach(rescuer => {
            const { latitude, longitude, username, cargo = [], pendingTasks = [] } = rescuer;

            // Ensure cargo is an array
            if (!Array.isArray(cargo)) {
                console.warn('Cargo is not an array for rescuer:', username);
                return; // Skip this rescuer if cargo is invalid
            }

            // Create a marker for each rescuer
            let marker = L.marker([latitude, longitude], {
                icon: RescuerIcon,
                draggable: false
            }).addTo(map);

            // Create a string for the cargo details
            let cargoDetails = cargo.map(item => `${item.item || 'Unknown Item'} (Qty: ${item.quantity || 0})`).join('<br>');

            // Create a string for the pending tasks
            let pendingDetails = pendingTasks.length > 0
                ? pendingTasks.map(task => `Civilian ID: ${task.civilianId || 'Unknown'} (${task.type || 'Unknown'})`).join('<br>')
                : 'No Pending Tasks';

            // Bind a popup to each rescuer marker displaying their username, cargo, and pending tasks
            marker.bindPopup(`
                <strong>Rescuer: ${username || 'Unknown'}</strong><br>
                <strong>Cargo:</strong><br>${cargoDetails}<br>
                <strong>Pending Tasks:</strong><br>${pendingDetails}
            `).openPopup();
        });

    } catch (error) {
        console.error('Error fetching rescuers:', error);
    }

    // Fetch and display civilians on the map
    async function fetchAndDisplayCivilians() {
        try {
            const response = await fetch('/api/civilian/all');
            const data = await response.json();
    
            if (!data.success) {
                console.error('Failed to fetch civilian data');
                return;
            }
    
            const civilians = data.civilians;
            civilians.forEach(civilian => {
                const { location, tasks } = civilian;
                if (!location || !Array.isArray(location.coordinates) || location.coordinates.length < 2) {
                    console.warn('Invalid location for civilian:', civilian);
                    return;
                }
    
                const [latitude, longitude] = location.coordinates;
    
                // Create the default marker icon based on task status
                let baseIcon = CivilianPendingIcon;  // Default to pending
                tasks.forEach(task => {
                    if (task.status === 'processed') {
                        baseIcon = CivilianServedIcon;
                    } else if (task.type === 'donation') {
                        baseIcon = CivilianDonationIcon;
                    }
                });
    
                // Add the civilian marker to the map
                const marker = L.marker([latitude, longitude], { icon: baseIcon }).addTo(map);
    
                // Store the marker and tasks in the civilianMarkers object for filtering
                civilianMarkers[civilian._id] = { marker, tasks };
    
                // Optionally, add a popup with more details
                marker.bindPopup(`
                    <strong>Civilian:</strong> ${civilian.name || 'Unknown'}<br>
                    <strong>Tasks:</strong> ${tasks.length || 'No tasks available'}
                `);
            });
        } catch (error) {
            console.error('Error fetching civilians:', error);
        }
    }
    

    // Call the function to fetch and display civilians
    fetchAndDisplayCivilians();
    // Filter Application Logic (based on loadMap.js)
    function applyFilter() {
        const isPendingChecked = document.querySelector('.main-filter[value="pending"]').checked;
        const isServedChecked = document.querySelector('.main-filter[value="served"]').checked;
        const isRequestChecked = document.querySelector('.sub-filter[value="request"]').checked;
        const isDonationChecked = document.querySelector('.sub-filter[value="donation"]').checked;

        for (let civilianId in civilianMarkers) {
            const { marker, tasks } = civilianMarkers[civilianId];

            let showMarker = false;
            let baseIcon = CivilianPendingIcon;  // Default to Pending Icon

            tasks.forEach(task => {
                if (task.status === 'processed') {
                    baseIcon = CivilianServedIcon;
                } else if (task.type === 'donation') {
                    baseIcon = CivilianDonationIcon;
                }

                if (isRequestChecked && task.type === 'request') {
                    baseIcon = createCombinedIcon(baseIcon, '/maptry/icons/req.png');
                    showMarker = true;
                } else if (isDonationChecked && task.type === 'donation') {
                    baseIcon = createCombinedIcon(baseIcon, '/maptry/icons/donate.png');
                    showMarker = true;
                }

                if ((isPendingChecked && task.status === 'pending') || (isServedChecked && task.status === 'processed')) {
                    showMarker = true;
                }
            });

            // Update marker icon and visibility
            marker.setIcon(baseIcon);
            if (showMarker) {
                marker.addTo(map);
            } else {
                marker.remove();
            }
        }
    }

    // Attach event listeners to filter checkboxes
    const mainFilters = document.querySelectorAll('.main-filter');
    const subFilters = document.querySelectorAll('.sub-filter');

    mainFilters.forEach(filter => filter.addEventListener('change', applyFilter));
    subFilters.forEach(filter => filter.addEventListener('change', applyFilter));

    // Optional: Ensure map size is correctly calculated
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
});