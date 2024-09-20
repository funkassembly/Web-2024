let map, markerStorage, markerRescuer;
// Icons Init
const StorageIcon = L.icon({
    iconUrl: '/icons/Storage.png', 
    iconSize: [40, 40],
    iconAnchor: [15,8],
    popupAnchor: [0, 0]
});
const RescuerIcon = L.icon({
    iconUrl: '/icons/transport.png',
    iconSize: [40, 40],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});
const peopleServedIcon = L.icon({
    iconUrl: '/icons/peopleServed.png',
    iconSize: [35, 35],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

document.addEventListener("DOMContentLoaded", function() {
    console.log('DOM completed - Map is LOADING ...');
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
    updateUnloadButtonState();
    
    // markerStorage on Click event *Trigger*
    markerStorage.on('click', async function() {
        console.log('markerStorage on click Event Triggered!')
        rescuerCurrentPosition = markerRescuer.getLatLng();
        const distance = calculateDistance(markerStorage.getLatLng(), rescuerCurrentPosition);
        console.log('Distance between rescuer, storage: ', distance)
    
        if (distance <= 100) {
            try {
                // Fetch request to get the items
            fetch('/api/items')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                return response.json(); // Return the JSON response (actual data)
            })
            .then(items => {  // Use the actual data as `items`
                console.log('Fetched items:', items);
                
                // Send a message to the parent document to show the modal and populate it
                window.parent.postMessage({
                    type: 'showItemsModal',
                    items: items  // Pass the fetched items as products
                }, '*');
            })
            .catch(error => console.error('Error fetching items:', error));
    } catch (error) {
        console.error('Error fetching or displaying products:', error);
    }
        }
    });
    // markerRescuer on Drag event *Trigger*
    markerRescuer.on('drag', function() {
        updateUnloadButtonState();
        // fetchTasks();
    });
    // Event listener for when the marker is dragged and dropped
    markerRescuer.on('dragend', function(event) {
        var position = markerRescuer.getLatLng();
        console.log('Rescuer\'s location: ', position.lat, position.lng);

        // Send an AJAX request to update the rescuer's location in the database
        fetch('/api/rescuer/updateRescuerLocation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lng: position.lat, lat: position.lng })
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Location updated successfully.');
            } else {
                console.error('Failed to update location:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));        
        // Update the Unload button state based on the new position
        updateUnloadButtonState();
    });
    
    


// Functions
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

// Event Listeners
// DOM event *trigger*

    
    
        
});






