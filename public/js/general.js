$(document).ready(function () {
    // Function to show the section based on stored data or default
    function showSection(section) {
        $('.main-content > div').hide(); // Hide all sections
        $('#' + section).show(); // Show the section passed as an argument
        $('.menu-item').removeClass('active'); // Remove active from all menu items
        $('a[data-section="' + section + '"]').addClass('active'); // Add active to the correct menu item
    }

    // Check if there's a stored section in localStorage
    var savedSection = localStorage.getItem('activeSection');
    if (savedSection) {
        showSection(savedSection); // Show saved section
    } else {
        showSection('dashboard-section'); // Default to dashboard section if nothing is saved
    }

    // Handle section switching on menu item click
    $('.menu-item').on('click', function(e) {
        e.preventDefault();
        var section = $(this).data('section');
        showSection(section); // Show the selected section

        // Save the selected section to localStorage
        localStorage.setItem('activeSection', section);

        $('.sidebar').removeClass('expanded'); // Hide sidebar after selection
    });

    // Logout button functionality
    $('#logoutBtn').on('click', function() {
        window.location.href = "/logout";
    });

    // Expand sidebar on hover
    $('.sidebar').hover(function() {
        $(this).addClass('expanded');
    }, function() {
        $(this).removeClass('expanded');
    });
});

