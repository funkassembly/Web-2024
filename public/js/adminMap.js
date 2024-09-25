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
                const { location, name, surname, cellphone, tasks } = civilian;

                // Ensure location is valid
                if (!location || !Array.isArray(location.coordinates) || location.coordinates.length < 2) {
                    console.warn('Invalid location for civilian:', civilian);
                    return; // Skip this civilian if location is invalid
                }

                const [latitude, longitude] = location.coordinates;

                // Choose the icon based on the task type
                let icon = CivilianPendingIcon; // Default to pending icon
                let taskDetails = '';

                // Identify the icon and details based on tasks
                if (tasks.length > 0) {
                    tasks.forEach(task => {
                        if (task.type === 'donation') {
                            icon = CivilianDonationIcon; // Use your donation icon
                            taskDetails = `Donation Request:<br>Item: ${task.item || 'Unknown'}<br>Quantity: ${task.quantity || 0}<br>Date Submitted: ${new Date(task.dateSubmitted).toLocaleString() || 'N/A'}`;
                        } else if (task.type === 'request' && task.status === 'pending') {
                            icon = CivilianPendingIcon; // Use your pending icon
                            taskDetails = `Pending Request:<br>Item: ${task.item || 'Unknown'}<br>Quantity: ${task.quantity || 0}<br>Date Submitted: ${new Date(task.dateSubmitted).toLocaleString() || 'N/A'}`;
                        } else if (task.status === 'processed') {
                            icon = CivilianServedIcon; // Use your served icon
                            taskDetails = `Served Request:<br>Item: ${task.item || 'Unknown'}<br>Quantity: ${task.quantity || 0}<br>Date Submitted: ${new Date(task.dateSubmitted).toLocaleString() || 'N/A'}<br>Served by: ${task.rescuerUsername || 'Unknown'}<br>Date Served: ${task.dateServed ? new Date(task.dateServed).toLocaleString() : 'N/A'}`;
                        }
                    });
                }

                // Create a marker for each civilian
                const marker = L.marker([latitude, longitude], {
                    icon: icon,
                    draggable: false
                }).addTo(map);

                // Bind a popup to each civilian marker displaying their info
                marker.bindPopup(`
                    <strong>Civilian: ${name || 'Unknown'} ${surname || 'N/A'}</strong><br>
                    <strong>Cellphone:</strong> ${cellphone || 'N/A'}<br>
                    ${taskDetails || 'No Tasks'}
                `).openPopup();
            });

        } catch (error) {
            console.error('Error fetching civilians:', error);
        }
    }

    // Call the function to fetch and display civilians
    fetchAndDisplayCivilians();

    // Optional: Force the map to revalidate its size if it renders incorrectly
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
});