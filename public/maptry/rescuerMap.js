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


//             const productModal = document.getElementById('productModal');
//             if (productModal) {
//                 console.log('productModal found:', productModal);
//             } else {
//                 console.error('productModal element not found');
//             }

//             const productTable = document.getElementById('productTable');
//             if (productTable) {
//                 console.log('productTable found:', productTable);
//             } else {
//                 console.error('productTable element not found');
            
//             }

//             productTable.innerHTML = '<tr><th>Product Name</th><th>Category</th><th>Details</th></tr>';

//             products.forEach(product => {
//                 const row = productTable.insertRow();
//                 row.insertCell(0).innerText = product.name;
//                 row.insertCell(1).innerText = product.category;
//                 row.insertCell(2).innerText = product.details.map(detail => `${detail.detail_name}: ${detail.detail_value}`).join(', ');
//             });

//             // Show the modal
//             document.getElementById('productModal').style.display = 'block';
//         } catch (error) {
//             console.error('Error fetching or displaying products:', error);
//         }
//     }
// });




var markerRescuer = L.marker([38.24600, 21.73500], {
    icon: RescuerIcon,
    draggable: true
}).addTo(map);
markerRescuer.bindPopup('Σύρε με στην τοποθεσία σου!').openPopup();


// Function to calculate the distance between two LatLng points in meters
function calculateDistance(latlng1, latlng2) {
    return map.distance(latlng1, latlng2);
}

// Function to update the Load button state based on distance
function updateLoadButtonState() {
    const storageLatLng = markerStorage.getLatLng();
    const rescuerLatLng = markerRescuer.getLatLng();
    console.log('Storage Location:', storageLatLng);
    console.log('Rescuer Location:', rescuerLatLng);

    const distance = calculateDistance(storageLatLng, rescuerLatLng);
    console.log(`Calculated Distance: ${distance} meters`);

    // Send a message to the parent window with the distance info
    window.parent.postMessage({
        type: 'updateLoadButtonState',
        distance: distance
    }, '*');
}

// Initially set the Load button state based on the initial position
updateLoadButtonState();

// Update Load button state whenever the rescuer marker is dragged
markerRescuer.on('drag', function() {
    updateLoadButtonState();
});

// Export the updateLoadButtonState function to the global window object
window.updateLoadButtonState = updateLoadButtonState;

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



// DummyMarkers with categories ! TO CHANGE: *** GET FROM DB *** !
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
    // Pending category with donate subcategory
    L.marker([38.24600, 21.73800], {
        icon: createCombinedIcon('icons/peoplePending.png', 'icons/donate.png'),
        mainCategory: 'pending',
        subCategory: 'donate'
    }).bindPopup('Pending Donate'),
];


console.log('Markers initialized:', Dummymarkers.length);

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



// Export the updateLoadButtonState function to the global window object
window.updateLoadButtonState = updateLoadButtonState;
