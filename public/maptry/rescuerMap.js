// map init
const map = L.map('map').setView([38.2462420, 21.7350847], 16);
        
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// General Storage Marker
const StorageIcon = L.icon({
    iconUrl: '/maptry/icons/Storage.png', 
    iconSize: [30, 30],
    iconAnchor: [15,8],
    popupAnchor: [0, 0]
});

var markerStorage = L.marker([38.24600, 21.73500], {icon: StorageIcon}).addTo(map);

markerStorage.bindPopup('Γενική Αποθήκη').openPopup(); 

// Rescuer draggable marker
const RescuerIcon = L.icon({
    iconUrl: '/maptry/icons/transport.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

var markerRescuer = L.marker([38.24600, 21.73500], {
    icon: RescuerIcon,
    draggable: true
}).addTo(map);

markerRescuer.bindPopup('Σύρε με στην τοποθεσία σου!').openPopup();

// Event listener for when the marker is dragged and dropped
markerRescuer.on('dragend', function(event) {
    var position = markerRescuer.getLatLng();
    console.log('Rescuer\'s location: ', position.lat, position.lng);
    
});

const FoodIcon = L.icon({
    iconUrl: '/maptry/icons/food.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const MedicalIcon = L.icon({
    iconUrl: '/maptry/icons/medical.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const DonateIcon = L.icon({
    iconUrl: '/maptry/icons/donate.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const peoplePendingIcon = L.icon({
    iconUrl: '/maptry/icons/peoplePending.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const peopleServedIcon = L.icon({
    iconUrl: '/maptry/icons/peopleServed.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const ShelterIcon = L.icon({
    iconUrl: '/maptry/icons/shelter.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

// Create markers with categories
const Dummymarkers = [
    L.marker([38.24600, 21.73500], { icon: FoodIcon, category: 'food' }).bindPopup('Τρόφιμα'),
    L.marker([38.24500, 21.73400], { icon: MedicalIcon, category: 'medical' }).bindPopup('Ιατρικός Εξοπλισμός'),
    L.marker([38.24700, 21.73600], { icon: ShelterIcon, category: 'shelter' }).bindPopup('Στέγαση'),
    L.marker([38.24700, 21.73600], { icon: peoplePendingIcon, category: 'requests' }).bindPopup('Ανάγκη'),
    L.marker([38.24700, 21.73600], { icon: DonateIcon, category: 'donations' }).bindPopup('Προσφορά'),
    L.marker([38.24700, 21.73600], { icon: peopleServedIcon, category: 'beingServed' }).bindPopup('Σε εξέλιξη')
];

console.log('Markers initialized:', Dummymarkers.length);

// Add markers to the map
Dummymarkers.forEach(marker => {
    marker.addTo(map);
    console.log('Marker added:', marker);
});

// Function to filter markers
function applyFilters() {
    const activeFilters = Array.from(document.querySelectorAll('.filter:checked')).map(cb => cb.value);
    
    // Check if no filters are selected
    if (activeFilters.length === 0) {
        // If no filters are selected, keep all markers on the map
        Dummymarkers.forEach(marker => {
            marker.addTo(map);
            console.log('Marker displayed:', marker.options.category);
        });
    } else {
        Dummymarkers.forEach(marker => {
            if (activeFilters.includes(marker.options.category)) {
                marker.addTo(map);
                console.log('Marker displayed:', marker.options.category);
            } else {
                map.removeLayer(marker);
                console.log('Marker removed:', marker.options.category);
            }
        });
    }
}
// Add event listeners to the filters
document.querySelectorAll('.filter').forEach(cb => {
    cb.addEventListener('change', applyFilters);
});

// Apply initial filters
applyFilters();