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
            var civilianMarker = L.marker([lat, lng], { icon: peopleServedIcon }).addTo(map);

            // Add popup to the marker
            civilianMarker.bindPopup("<b>Is this your current location?</b>").openPopup();
            // Create bounds that include both the civilian marker and the general storage marker
            const bounds = L.latLngBounds([ [lat, lng], [38.24600, 21.73500] ]);

            // Adjust the map to fit both markers within the view
            map.fitBounds(bounds, { padding: [50, 50] }); // Optional padding for better view
        
        } else {
            console.error("No location data found for civilian.");
        }
    } catch (error) {
        console.error('Error fetching civilian location:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Call the function to get and place the civilian's location
    getCivilianLocation();
});