$(document).ready(function () {
    $('#importBtn').on('click', function () {
        const inputFile = $('#importFile')[0].files[0];
    
        if (!inputFile) {
            alert('Please select a file to import');
            return;
        }
    
        const formData = new FormData();
        formData.append('file', inputFile);
    
        $.ajax({
            url: '/api/items/import',  // Update with the correct endpoint
            type: 'POST',
            data: formData,
            contentType: false,  // Required for file uploads
            processData: false,  // Prevent jQuery from processing the data
            success: function (response) {
                alert(response.message);
                table.ajax.reload();  // Reload the DataTable to reflect new data
            },
            error: function (xhr) {
                alert('Error: ' + xhr.responseJSON.error);
            }
        });
    });

    
// Handle edit button click
$('#itemsTable').on('click', '.edit-category', function() {
    const itemId = $(this).data('id');  // Get the item ID from the button's data attribute

    // Fetch the current item details to populate the modal
    $.ajax({
        url: `/api/items/${itemId}`,
        type: 'GET',
        success: function(item) {
            // Populate the modal fields with the item details
            $('#editItemModal #itemId').val(item.id);
            $('#editItemModal #itemName').val(item.name || "");  // Use empty string if name is null
            $('#editItemModal #itemDetails').val(item.details ? item.details.map(d => `${d.detail_name}: ${d.detail_value}`).join(', ') : "");  // Format details for display
            $('#editItemModal #itemStock').val(item.stock !== undefined ? item.stock : "");  // Use empty string if stock is null

            // Show the modal
            $('#editItemModal').modal('show');
        },
        error: function(xhr, status, error) {
            console.error('Error fetching item details:', xhr.responseText);
            alert('Error fetching item details.');
        }
    });
});

// Handle form submission to update the item
$('#editItemForm').on('submit', function(e) {
    e.preventDefault();

    const itemId = $('#editItemModal #itemId').val(); // Get the item ID from the modal
    const updatedItem = {
        name: $('#editItemModal #itemName').val() || "",  // Send an empty string if the name field is empty
        details: $('#editItemModal #itemDetails').val() || "",  // Send an empty string if the details field is empty
        stock: $('#editItemModal #itemStock').val() || null  // Use null for stock if not provided
    };

    // Send the AJAX request to update the item
    $.ajax({
        url: `/api/items/${itemId}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updatedItem),
        success: function(response) {
            // On success, reload the DataTable
            $('#itemsTable').DataTable().ajax.reload();  // Reload the DataTable
            // Hide the modal
            $('#editItemModal').modal('hide');
            // Optionally, show a success message
            alert(response.message);
        },
        error: function(xhr, status, error) {
            console.error('Error during update:', xhr.responseText);
            // Optionally, show an error message
            alert('Error updating item: ' + xhr.responseJSON.error);
        }
    });
});


      // Handle delete button click
$('#itemsTable').on('click', '.delete-category', function(e) {
    const itemId = $(this).data('id');
  
    if (confirm('Are you sure you want to delete this item?')) {
      $.ajax({
        url: `/api/items/${itemId}`,
        method: 'DELETE',
        success: function(response) {
            console.log('Item deleted:', response);
          $('#itemsTable').DataTable().ajax.reload(); // Reload data table after deletion
          alert('Item deleted successfully!');
        },
        error: function(error) {
          console.error('Error deleting item:', error);
          alert('Error deleting item. Please try again.');
        }
      });
    }
  });

  $('#exportBtn').on('click', function() {
    //window.location.href = 'http://usidas.ceid.upatras.gr/web/2023/export.php';
    window.open('http://usidas.ceid.upatras.gr/web/2023/export.php', '_blank');
});
  
  
});