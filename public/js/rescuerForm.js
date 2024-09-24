$(document).ready(function () {
      // Form submission logic for creating a new rescuer  --WORKING
      $('#createRescuerForm').on('submit', function(e) {
        e.preventDefault();

        const formData = {
            username: $('#username').val(),
            email: $('#email').val(),
            password: $('#password').val(),
            role: $('#role').val() // Hidden field for the role
        };

        $.ajax({
            url: '/api/users/create', // API endpoint to create a user
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                alert('Rescuer created successfully');
                // Clear form after success
                $('#createRescuerForm')[0].reset();
            },
            error: function (xhr) {
                // Safely access the responseText
                let errorMessage = 'An error occurred while creating the rescuer.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                } else if (xhr.responseText) {
                    errorMessage = xhr.responseText;
                }
                alert('Error: ' + errorMessage);
            }
        });
    });
});