// Example for fetching rescuer tasks (in loadTasks.js)
fetch('/api/rescuer/tasks')
    .then(response => response.json())
    .then(data => {
        // Populate the tasks table with the received data
        const tasksTable = document.querySelector('#tasksTable tbody');
        tasksTable.innerHTML = ''; // Clear existing content

        data.tasks.forEach((task, index) => {
            tasksTable.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${task.type}</td>
                    <td>${task.civilianId.name}</td>
                    <td>${task.civilianId.cellphone}</td>
                    <td>${task.dateSubmitted}</td>
                    <td>${task.status}</td>
                </tr>
            `;
        });
    })
    .catch(error => console.error('Error fetching tasks:', error));
