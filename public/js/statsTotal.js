$(document).ready(function () {
    $.ajax({
        url: '/api/stats/rescuer-civilian-count',
        method: 'GET',
        success: function(data) {
            $('#total-rescuers').text(data.totalRescuers);
            $('#total-civilians').text(data.totalCivilians);
        },
        error: function(err) {
            console.error('Error fetching counts:', err);
        }
    });
});