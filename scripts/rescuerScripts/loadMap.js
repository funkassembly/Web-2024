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
// DOM event trigger
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

});