$(document).ready(function () {
    // Initialize DataTable for Items
    window.table = $('#itemsTable').DataTable({
        ajax: {
            url: '/api/items',
            dataSrc: ''
        },
        columns: [
            { data: 'id' },   // ID column
            { 
                data: 'name',
                defaultContent: 'Unnamed Item'  // Fallback for null or empty name
            },
            { 
                data: 'category',
                defaultContent: 'No Category'   // Fallback for missing category
            },
            { 
                data: 'details',
                defaultContent: 'No details available'  // Fallback for missing details
            },
            { 
                data: 'stock',
                defaultContent: '0'  // Default for stock if missing
            },
            {
                data: null,
                render: function(data, type, row) {
                    return `
                        <i class="fas fa-edit edit-category" data-id="${row.id}" title="Edit"></i>
                        <i class="fas fa-trash delete-category" data-id="${row.id}" title="Delete"></i>
                    `;
                }
            }
        ]
    });
});
