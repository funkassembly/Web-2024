// map init
const map = L.map('map').setView([38.2462420, 21.7350847], 16);
        
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// General Storage Marker
const dbIcon = L.icon({
    iconUrl: '/maptry/icons/dbicon_blue.png', 
    iconSize: [30, 30],
    iconAnchor: [15,8],
    popupAnchor: [0, 0]
});

var marker1 = L.marker([38.24600, 21.73500], {icon: dbIcon}).addTo(map);

marker1.bindPopup('Γενική Αποθήκη').openPopup(); 

// Rescuer draggable marker
const RescuerIcon = L.icon({
    iconUrl: '/maptry/icons/transport.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

var marker2 = L.marker([38.24600, 21.73500], {
    icon: RescuerIcon,
    draggable: true
}).addTo(map);

marker2.bindPopup('Σύρε με στην τοποθεσία σου!').openPopup();

// Event listener for when the marker is dragged and dropped
marker2.on('dragend', function(event) {
    var position = marker.getLatLng();
    console.log('Rescuer\'s location: ', position.lat, position.lng);
    
});