$(document).ready(function () {
    // Initialize DataTables for Categories
    const categoryTable = $('#categoryTable').DataTable({
        ajax: '/api/categories',
        columns: [
            { data: 'id' },
            { data: 'category_name' },
            {
                data: null,
                render: function (data, type, row) {
                    return `<button class="editCategory" data-id="${row._id}">Edit</button> 
                            <button class="deleteCategory" data-id="${row._id}">Delete</button>`;
                }
            }
        ]
    });

    // Initialize DataTables for Items
    const itemTable = $('#itemTable').DataTable({
        ajax: '/api/items',
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'category.category_name' },
            { data: 'details', render: function(data) { 
                return data.map(detail => `${detail.detail_name}: ${detail.detail_value}`).join('<br>'); 
            }},
            { data: 'stock' },
            {
                data: null,
                render: function (data, type, row) {
                    return `<button class="editItem" data-id="${row._id}">Edit</button> 
                            <button class="deleteItem" data-id="${row._id}">Delete</button>`;
                }
            }
        ]
    });

    // File upload logic for Categories
    $('#uploadCategoryJson').on('change', function() {
        const formData = new FormData();
        formData.append('jsonFile', this.files[0]);

        $.ajax({
            url: '/api/upload/categories',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                alert(response.message);
                categoryTable.ajax.reload();
            }
        });
    });

    // File upload logic for Items
    $('#uploadItemJson').on('change', function() {
        const formData = new FormData();
        formData.append('jsonFile', this.files[0]);

        $.ajax({
            url: '/api/upload/items',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                alert(response.message);
                itemTable.ajax.reload();
            }
        });
    });

    // Toggle between sections
    $('.menu-item').on('click', function() {
        const section = $(this).data('section');
        $('.main-content > div').hide();
        $(`#${section}`).show();
    });

        // Leaflet Map Initialization
        let map = L.map('map').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    
        // Switch between sections
        $('.menu-item').on('click', function () {
            $('.menu-item').removeClass('active');
            $(this).addClass('active');
    
            let section = $(this).data('section');
            $('.main-content > div').hide();
            $('#' + section).show();
        });
    
        // Initially show the dashboard
        $('#dashboard').show();
});