$(document).ready(function () {
    function checkLowStock() {
        $.ajax({
            url: '/api/items/low-stock',  // The backend route for low stock items
            type: 'GET',
            success: function(response) {
                // If there are low stock items, display an alert
                if (response.lowStockItems && response.lowStockItems.length > 0) {
                    let alertMessage = 'Warning: The following items are low in stock:\n';
                    
                    // Loop through the low stock items and add them to the alert message
                    response.lowStockItems.forEach(itemData => {
                        itemData.items.forEach(item => {
                            alertMessage += `Item Name: ${item.name}, Stock: ${item.stock}\n`;
                        });
                    });
                    
                    alert(alertMessage);
                } else if (response.message) {
                    console.log(response.message);  // Log if no low stock items
                }
            },
            error: function(error) {
                console.error('Error fetching low stock items:', error);
            }
        });
    }

    // Check for low stock items when the page is loaded
    checkLowStock();
    
    

});