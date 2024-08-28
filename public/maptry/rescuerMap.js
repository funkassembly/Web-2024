// map init
const map = L.map('map').setView([38.2462420, 21.7350847], 16);
        
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Markers Init
// General Storage Marker
const StorageIcon = L.icon({
    iconUrl: 'icons/Storage.png', 
    iconSize: [30, 30],
    iconAnchor: [15,8],
    popupAnchor: [0, 0]
});
// Rescuer draggable marker
const RescuerIcon = L.icon({
    iconUrl: 'icons/transport.png',
    iconSize: [35, 35],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
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


var markerStorage = L.marker([38.24600, 21.73500], {icon: StorageIcon}).addTo(map);

markerStorage.on('click', async function() {
    const distance = calculateDistance(markerStorage.getLatLng(), markerRescuer.getLatLng());
    if (distance <= 100) {
        try {
            const response = await fetch('/getProducts');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            const products = await response.json();

            // Send a message to the parent document to show the modal and populate it
            window.parent.postMessage({
                type: 'showProductModal',
                products: products
            }, '*');
        } catch (error) {
            console.error('Error fetching or displaying products:', error);
        }
    }
});



var markerRescuer = L.marker([38.24600, 21.73500], {
    icon: RescuerIcon,
    draggable: true
}).addTo(map);
markerRescuer.bindPopup('Σύρε με στην τοποθεσία σου!').openPopup();


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

// Initially set the Unload button state based on the initial position
updateUnloadButtonState();

// Update Unload button state whenever the rescuer marker is dragged
markerRescuer.on('drag', function() {
    updateUnloadButtonState();
});

// Export the updateUnloadButtonState function to the global window object
window.updateUnloadButtonState = updateUnloadButtonState;


// Event listener for when the marker is dragged and dropped
markerRescuer.on('dragend', function(event) {
    var position = markerRescuer.getLatLng();
    console.log('Rescuer\'s location: ', position.lat, position.lng);

     // Send an AJAX request to update the rescuer's location in the database
     fetch('/updateRescuerLocation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lat: position.lat, lng: position.lng })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Location updated successfully.');
        } else {
            console.error('Failed to update location:', data.error);
        }
    })
    .catch(error => console.error('Error:', error));
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
window.applyFilters = function(activeMainFilters=[], activeSubFilters=[]) {

    Dummymarkers.forEach(marker => {
        const markerMainCategory = marker.options.mainCategory;
        const markerSubCategory = marker.options.subCategory;

        const showMarker =
            (activeMainFilters.length === 0 || activeMainFilters.includes(markerMainCategory)) &&
            (activeSubFilters.length === 0 || activeSubFilters.includes(markerSubCategory));

        if (showMarker) {
            marker.addTo(map);
        } 
        else {
            map.removeLayer(marker);
        }
    });
};

// Attach event listeners to filters
document.querySelectorAll('.main-filter, .sub-filter').forEach(cb => {
    cb.addEventListener('change', applyFilters);
});

// Apply initial filters
applyFilters();



