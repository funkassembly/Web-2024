$(document).ready(function () {
    // Fetch chart data with default dates (current month)
    const today = new Date();
    const startDateDefault = new Date(today.getFullYear(), today.getMonth(), 1).toISOString(); // First day of the current month
    const endDateDefault = today.toISOString(); // Today
    
    let chartInstance = null;  // Global variable to store the chart instance
    
    fetchChartData(startDateDefault, endDateDefault);
    
    // Function to fetch chart data
    function fetchChartData(startDate, endDate) {
        $.ajax({
            url: `/api/stats/chart-data`,
            method: 'GET',
            data: { startDate: startDate, endDate: endDate },
            success: function (data) {
                renderChart(data);
            },
            error: function (error) {
                console.error('Error fetching chart data:', error);
            }
        });
    }
    
    // Function to render chart
    function renderChart(data) {
        const ctx = document.getElementById('task-chart').getContext('2d');
        
        // Check if a chart instance exists and destroy it before creating a new one
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // Create new chart instance
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total Requests', 'Total Donations', 'Completed Requests', 'Completed Donations'],
                datasets: [{
                    label: 'Amount',
                    data: [data.totalRequests, data.totalDonations, data.completedRequests, data.completedDonations],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Event listener for updating chart based on selected date range
    $('#updateChart').on('click', function () {
        const startDate = $('#startDate').val(); // Corrected ID
        const endDate = $('#endDate').val();     // Corrected ID
        
        if (startDate && endDate) {
            const startISO = new Date(startDate).toISOString();
            const endISO = new Date(endDate).toISOString();
            
            fetchChartData(startISO, endISO);
        } else {
            alert('Please select both start and end dates.');
        }
    });
});