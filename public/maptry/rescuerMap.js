// map init
const map = L.map('map').setView([38.2462420, 21.7350847], 16);
        
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// General Storage Marker
const StorageIcon = L.icon({
    iconUrl: 'icons/Storage.png', 
    iconSize: [30, 30],
    iconAnchor: [15,8],
    popupAnchor: [0, 0]
});

var markerStorage = L.marker([38.24600, 21.73500], {icon: StorageIcon}).addTo(map);

markerStorage.bindPopup('Γενική Αποθήκη').openPopup(); 

// Rescuer draggable marker
const RescuerIcon = L.icon({
    iconUrl: 'icons/transport.png',
    iconSize: [35, 35],
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
    iconUrl: 'icons/food.png',
    iconSize: [20, 20],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const MedicalIcon = L.icon({
    iconUrl: 'icons/medical.png',
    iconSize: [20, 20],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const ShelterIcon = L.icon({
    iconUrl: 'icons/shelter.png',
    iconSize: [20, 20],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const DonateIcon = L.icon({
    iconUrl: 'icons/donate.png',
    iconSize: [20, 20],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const peoplePendingIcon = L.icon({
    iconUrl: 'icons/peoplePending.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const peopleServedIcon = L.icon({
    iconUrl: 'icons/peopleServed.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});


// DummyMarkers with categories
const Dummymarkers = [
    // Pending category with medical subcategory
    L.marker([38.24600, 21.73600], {
        icon: createCombinedIcon('icons/peoplePending.png', 'icons/medical.png'),
        mainCategory: 'pending',
        subCategory: 'medical'
    }).bindPopup('Pending Medical Assistance'),

    // Pending category with food subcategory
    L.marker([38.24400, 21.73300], {
        icon: createCombinedIcon('icons/peoplePending.png', 'icons/food.png'),
        mainCategory: 'pending',
        subCategory: 'food'
    }).bindPopup('Pending Food Supplies'),

    // Served category with shelter subcategory
    L.marker([38.24500, 21.73500], {
        icon: createCombinedIcon('icons/peopleServed.png', 'icons/shelter.png'),
        mainCategory: 'served',
        subCategory: 'shelter'
    }).bindPopup('Served Shelter'),

    // Add more markers as needed...
];


console.log('Markers initialized:', Dummymarkers.length);

// Add markers to the map
Dummymarkers.forEach(marker => {
    marker.addTo(map);
    console.log('Marker added:', marker);
});

function createCombinedIcon(mainCategoryIconUrl, subCategoryIconUrl) {
    return L.divIcon({
        html: `
            <div style="position: relative; width: 30px; height: 30px;">
                <img src="${mainCategoryIconUrl}" style="width: 100%; height: 100%;">
                <img src="${subCategoryIconUrl}" style="width: 15px; height: 15px; position: absolute; top: 0; right: 0;">
            </div>
        `,
        className: ''
    });
}
function applyFilters() {
    const activeMainFilters = Array.from(document.querySelectorAll('.main-filter:checked')).map(cb => cb.value);
    const activeSubFilters = Array.from(document.querySelectorAll('.sub-filter:checked')).map(cb => cb.value);

    Dummymarkers.forEach(marker => {
        const markerMainCategory = marker.options.mainCategory;
        const markerSubCategory = marker.options.subCategory;

        const showMarker =
            (activeMainFilters.length === 0 || activeMainFilters.includes(markerMainCategory)) &&
            (activeSubFilters.length === 0 || activeSubFilters.includes(markerSubCategory));

        if (showMarker) {
            marker.addTo(map);
        } else {
            map.removeLayer(marker);
        }
    });
}

// Attach event listeners to filters
document.querySelectorAll('.main-filter, .sub-filter').forEach(cb => {
    cb.addEventListener('change', applyFilters);
});

// Apply initial filters
applyFilters();
