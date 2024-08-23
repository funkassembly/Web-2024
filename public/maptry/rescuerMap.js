// map init
const map = L.map('map').setView([38.2462420, 21.7350847], 16);
        
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// General Storage Marker
const dbIcon = L.icon({
    iconUrl: 'dbicon_blue.png', 
    iconSize: [30, 30],
    iconAnchor: [15,8],
    popupAnchor: [0, 0]
});

var marker = L.marker([38.24600, 21.73500], {icon: dbIcon}).addTo(map);

marker.bindPopup('Γενική Αποθήκη').openPopup(); 

// Rescuer draggable marker
const RescuerIcon = L.icon({
    iconUrl: '/maptry/transport.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

var marker = L.marker([38.24600, 21.73500], {
    icon: RescuerIcon,
    draggable: true
}).addTo(map);

marker.bindPopup('Drag me to your location').openPopup();

// Event listener for when the marker is dragged and dropped
marker.on('dragend', function(event) {
    var position = marker.getLatLng();
    console.log('Marker dropped at position: ', position.lat, position.lng);
    // You can send the position to the server or use it as needed
    alert('Position updated to: ' + position.lat + ', ' + position.lng);
});