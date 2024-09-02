document.addEventListener('DOMContentLoaded', function() {
    // Array to store disabled dates
    var disabledDates = [];

    // Function to fetch events from Google Calendar via server-side and initialize the calendar
    async function fetchEventsFromServer() {
        try {
            const response = await fetch('/fetch-events');
            const events = await response.json();
            console.log('Fetched Events:', events);
            console.log('Total Events:', events.length);

            // Create calendar instance
            var today = new Date();
            var todayISO = today.toISOString().split('T')[0];
            var calendarEl = document.getElementById('calendar');
            var calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                validRange: {
                    start: todayISO, // Restrict the calendar to start from the current date
                    end: new Date(today.getFullYear() + 3, today.getMonth(), today.getDate()).toISOString().split('T')[0] // Limit the calendar to three years in advance
                },
                navLinks: true, // Enable navigation links
                dayMaxEventRows: true, // Allow multiple events in a day to be displayed
                eventDidMount: function(info) {
                    // Attach custom data to the rendered event
                    info.el.dataset.eventDate = info.event.start.toISOString().split('T')[0];
                },
                dateClick: function(info) {
                    // Check if the clicked date is in the array of disabled dates
                    var clickedDate = info.dateStr;
                    if (disabledDates.includes(clickedDate)) {
                        // Date is disabled, prevent opening the booking modal
                        return;
                    }
                    
                    // Show the booking modal when a date is clicked
                    var bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
                    bookingModal.show();
                    // Set the value of the hidden input field to the date clicked
                    document.getElementById('booking-date').value = clickedDate;
                },
                datesSet: function() {
                    // Hide the "Today" button if screen width is less than 500px
                    if (window.innerWidth < 500) {
                        $('.fc-today-button').hide();
                    }
                }
            });


            // Add events to the calendar
            events.forEach(event => {
                calendar.addEvent({
                    title: event.summary,
                    start: event.start.date || event.start.dateTime,
                    end: event.end.date || event.end.dateTime,
                    color: '#CCCCCC' // Gray out events from Google Calendar
                });

                // Add event dates to the array of disabled dates
                disabledDates.push(event.start.date || event.start.dateTime);
            });

            // Render the calendar
            calendar.render();
        } catch (error) {
            console.error('Error fetching events from server:', error);
        }
    }

    // Fetch events from Google Calendar via server-side and initialize the calendar
    fetchEventsFromServer();

    // Handle form submission
    document.getElementById('booking-details').addEventListener('submit', function(event) {
        event.preventDefault();
        // Get the booking details from the form
        var eventDate = document.getElementById('booking-date').value; // Get the booking date from the hidden input field
        var name = document.getElementById('client-name').value;
        var email = document.getElementById('email').value;
        var phone = document.getElementById('phone').value;
        var details = document.getElementById('details').value;
        var recaptchaToken = grecaptcha.getResponse(); // Get the reCAPTCHA token
  
        // Phone number validation
        // Regex pattern to match numbers, parentheses, plus sign, hyphen, and space with a maximum of 20 characters
        var phoneNumberPattern = /^[0-9()+\- ]{0,20}$/;
        if (!phoneNumberPattern.test(phone)) {
            // Display an error message for invalid phone number
            alert('Please enter a valid phone number (XXX-XXX-XXXX)');
            return;
        }
  
        // Client side form validation
        if (!eventDate || !name || !email || !phone || !details || !recaptchaToken) {
            // Display an error message for incomplete fields
            alert('Please fill out all fields');
            return;
        }
  
        // Make a POST request to submit the booking details
        fetch('/submit-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventDate: eventDate,
                name: name,
                email: email,
                phone: phone,
                details: details,
                recaptchaToken: recaptchaToken
            })
        })
        .then(response => {
            if (response.ok) {
                console.log('Booking submitted successfully');
                // Clear reCAPTCHA token after successful submission
                grecaptcha.reset();
            } else {
            }
            // Close the modal after form submission
            var bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
            bookingModal.hide();
        })
        .catch(error => {
            console.error('Error submitting booking:', error);
        });
    });
});
