document.addEventListener('DOMContentLoaded', function() {
    // Array to store disabled dates
    var disabledDates = [];

    // Function to initialize the calendar
    function initializeCalendar() {
        // Remove any existing calendar instances from the container
        var calendarEl = document.querySelector('#calendar');
        if (calendarEl && calendarEl.classList.contains('fc')) {
            calendarEl.innerHTML = '';
        }

        // Determine which calendar container to use based on viewport size
        var calendarContainer;
        if (window.innerWidth < 768) {
            // Mobile view
            calendarContainer = document.querySelector('.mobile #calendar-container');
        } else {
            // Desktop view
            calendarContainer = document.querySelector('.desktop #calendar-container');
        }

        if (calendarContainer) {
            calendarEl = calendarContainer.querySelector('#calendar');

            if (calendarEl) {
                // Create calendar instance
                var today = new Date();
                var todayISO = today.toISOString().split('T')[0];
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
                        // Always allow the booking modal to open
                        var bookingModalMobile = new bootstrap.Modal(document.getElementById('bookingModalMobile'));
                        var bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
                        bookingModal.show();
                        bookingModalMobile.show()
                        // Set the value of the hidden input field to the date clicked
                        document.getElementById('booking-date').value = info.dateStr;
                        document.getElementById('booking-date-mobile').value = info.dateStr;
                    },
                    datesSet: function() {
                        // Hide the "Today" button if screen width is less than 500px
                        if (window.innerWidth < 500) {
                            $('.fc-today-button').hide();
                        }
                    }
                });

                // Fetch events from Google Calendar and add to the calendar
                fetchEventsFromServer(calendar);
            }
        }
    }

    // Function to fetch events from Google Calendar via server-side and add them to the calendar
    async function fetchEventsFromServer(calendar) {
        try {
            const response = await fetch('/fetch-events');
            const events = await response.json();
            console.log('Fetched Events:', events);
            console.log('Total Events:', events.length);

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

    // Initialize calendar on DOMContentLoaded
    initializeCalendar();

    // Reinitialize on window resize
    window.addEventListener('resize', function() {
        initializeCalendar();
    });

    // Function to get reCAPTCHA response based on visibility
    function getRecaptchaResponse() {
        if (document.getElementById('recaptcha-desktop') && document.getElementById('recaptcha-desktop').style.display !== 'none') {
            console.log("its using desktop")
            return grecaptcha.getResponse(); // Desktop reCAPTCHA
        } else if (document.getElementById('recaptcha-mobile') && document.getElementById('recaptcha-mobile').style.display !== 'none') {
            console.log("its using mobile")
            return grecaptcha.getResponse(); // Mobile reCAPTCHA
        }
        return ''; // No reCAPTCHA token
    }

    // Handle form submission for desktop
    document.getElementById('booking-details').addEventListener('submit', function(event) {
        event.preventDefault();
        var eventDate = document.getElementById('booking-date').value;
        var name = document.getElementById('client-name').value;
        var email = document.getElementById('email').value;
        var phone = document.getElementById('phone').value;
        var details = document.getElementById('details').value;
        var recaptchaToken = getRecaptchaResponse(); // Get the reCAPTCHA token

        // Phone number validation
        var phoneNumberPattern = /^[0-9()+\- ]{0,20}$/;
        if (!phoneNumberPattern.test(phone)) {
            alert('Please enter a valid phone number (XXX-XXX-XXXX)');
            return;
        }

        // Client side form validation
        if (!eventDate || !name || !email || !phone || !details || !recaptchaToken) {
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
                grecaptcha.reset();
            } else {
                console.error('Booking submission failed');
            }
            var bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
            bookingModal.hide();
        })
        .catch(error => {
            console.error('Error submitting booking:', error);
        });
    });

    // Handle form submission for mobile
    document.getElementById('booking-details-mobile').addEventListener('submit', function(event) {
        event.preventDefault();
        var eventDate = document.getElementById('booking-date-mobile').value;
        var name = document.getElementById('client-name-mobile').value;
        var email = document.getElementById('email-mobile').value;
        var phone = document.getElementById('phone-mobile').value;
        var details = document.getElementById('details-mobile').value;
        var recaptchaToken = getRecaptchaResponse(); // Get the reCAPTCHA token

        // Phone number validation
        var phoneNumberPattern = /^[0-9()+\- ]{0,20}$/;
        if (!phoneNumberPattern.test(phone)) {
            alert('Please enter a valid phone number (XXX-XXX-XXXX)');
            return;
        }

        // Client side form validation
        if (!eventDate || !name || !email || !phone || !details || !recaptchaToken) {
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
                grecaptcha.reset();
            } else {
                console.error('Booking submission failed');
            }
            var bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
            bookingModal.hide();
        })
        .catch(error => {
            console.error('Error submitting booking:', error);
        });
    });
});
