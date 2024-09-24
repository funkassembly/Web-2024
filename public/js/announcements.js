$(document).ready(function () {
    $('#createAnnouncement').on('submit', function (e) {
        e.preventDefault();

        const date = $('#date').val();
        const announcement = $('#announcement').val();
        const items = $('#items').val();

        $.ajax({
            url: '/api/users/create-announcement', // Ensure this matches the route on the server
            method: 'POST',
            data: {
                date: date,
                announcement: announcement,
                items: items
            },
            success: function (response) {
                alert('Announcement added successfully!');
                // Optionally, reset the form or take some action
                $('#createAnnouncement')[0].reset();
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
                alert('There was an error submitting the announcement.');
            }
        });
    });
});