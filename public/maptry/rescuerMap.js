document.addEventListener("DOMContentLoaded", function() {
// Define the custom icon
    const RescuerIcon = L.icon({
        iconUrl: '/maptry/transport.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });

    // Add a draggable marker to the map
    var marker = L.marker([38.24600, 21.73500], {
        icon: RescuerIcon,
        draggable: true
    }).addTo(map);

    // Display a popup when the marker is clicked
    marker.bindPopup('Drag me to your location').openPopup();

    // Event listener for when the marker is dragged and dropped
    marker.on('dragend', function(event) {
        var position = marker.getLatLng();
        console.log('Marker dropped at position: ', position.lat, position.lng);
        // You can send the position to the server or use it as needed
        alert('Position updated to: ' + position.lat + ', ' + position.lng);
    });


    // Get the modal
    var modal = document.getElementById("instructionsModal");

    // Get the button that opens the modal
    var btn = document.getElementById("instructionsLink");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on the button, open the modal
    btn.onclick = function() {
        modal.style.display = "block";
    }

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});