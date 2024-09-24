$(document).ready(function () {
    // Fetch and populate categories in the dropdown
    function loadCategories() {
        $.ajax({
            url: '/api/items/categories',
            method: 'GET',
            success: function(categories) {
                const dropdown = $('#categoryDropdown');
                dropdown.empty(); // Clear previous options
                dropdown.append('<option value="">Select a category</option>');
                categories.forEach(category => {
                    dropdown.append(`<option value="${category.id}">${category.category_name}</option>`);
                });
            },
            error: function(xhr) {
                console.error('Error fetching categories:', xhr.responseText);
            }
        });
    }

    // Fetch items when a category is selected
    $('#categoryDropdown').change(function() {
        const categoryId = $(this).val(); // Get the selected category ID (categories.id)
        console.log('Selected category ID:', categoryId); // Log the selected ID
        if (categoryId) {
            $.ajax({
                url: `/api/items/categories/${categoryId}`, // Pass the categories.id
                method: 'GET',
                success: function(items) {
                    // Populate the items table with the received data
                    const tbody = $('#categoryItemsTable tbody');
                    tbody.empty(); // Clear previous items
                    items.forEach(item => {
                        tbody.append(`
                            <tr>
                                <td>${item.id}</td>
                                <td>${item.name}</td>
                                <td>${item.details}</td>
                                <td>${item.stock}</td>
                                <td><input type="checkbox" ${item.inCargo ? 'checked' : ''}></td> <!-- Use item.inCargo to determine checked status -->
                            </tr>
                        `);
                    });
                },
                error: function(xhr) {
                    console.error('Error fetching items:', xhr.responseText);
                }
            });
        }
    });

    // Load categories on page load
    loadCategories();

        // Handle the form submission for adding category and item from the modal
        $('#addCategoryForm').on('submit', function (event) {
            event.preventDefault(); // Prevent the default form submission
    
            const formData = {
                category_name: $('#newCategoryName').val(),
                item_name: $('#newItemName').val(),
                item_details: $('#newItemDetails').val(),
                item_stock: $('#newItemStock').val()
            };
    
            $.ajax({
                type: 'POST',
                url: '/api/items/categories', // URL to the route you created
                data: formData,
                success: function (response) {
                    alert(response.message);
                    $('#addCategoryForm')[0].reset();
                    $('#addCategoryModal').modal('hide');
                    
                    // Refresh the categories and items
                    refreshCategories();
                    refreshItems();
                },
                error: function (error) {
                    alert('Error: ' + error.responseJSON.error);
                }
            });
        });
    
        function refreshCategories() {
            $.ajax({
                type: 'GET',
                url: '/api/items/categories', // Adjust as needed
                success: function (categories) {
                    const categoryDropdown = $('#categoryDropdown');
                    categoryDropdown.empty();
                    categoryDropdown.append('<option value="">Select a category</option>'); // Default option
                    categories.forEach(category => {
                        categoryDropdown.append(`<option value="${category.id}">${category.category_name}</option>`);
                    });
                },
                error: function (error) {
                    console.error('Error fetching categories:', error);
                }
            });
        }
    
        function refreshItems() {
            $.ajax({
                type: 'GET',
                url: '/api/items', // Adjust to the route that fetches items
                success: function (items) {
                    const itemsTableBody = $('#itemsTable tbody');
                    itemsTableBody.empty();
                    items.forEach(item => {
                        itemsTableBody.append(`
                            <tr>
                                <td>${item.id}</td>
                                <td>${item.name}</td>
                                <td>${item.category}</td>
                                <td>${item.details.map(detail => `${detail.detail_name}: ${detail.detail_value}`).join(', ')}</td>
                                <td>${item.stock}</td>
                                <td><!-- Add action buttons here --></td>
                            </tr>
                        `);
                    });
                },
                error: function (error) {
                    console.error('Error fetching items:', error);
                }
            });
        }
    
        // Call these functions to populate the dropdown and items table on page load
        refreshCategories();
        refreshItems();

        $('button[data-toggle="modal"]').on('click', function () {
            console.log('Button clicked, showing modal.');
            $('#addCategoryModal').modal('show');
        });

});
