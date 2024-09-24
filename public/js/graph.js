$(document).ready(function () {
         // Fetch chart data and render the chart
         const today = new Date();
         const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString(); // First day of the current month
         const endDate = today.toISOString(); // Today
         fetchChartData(startDate, endDate);
     
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
     
         function renderChart(data) {
             const ctx = document.getElementById('task-chart').getContext('2d');
             new Chart(ctx, {
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
        });     