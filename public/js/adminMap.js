
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
});