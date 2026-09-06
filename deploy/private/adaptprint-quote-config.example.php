<?php
// Copy this file OUTSIDE public_html as:
// /home/CPANEL_USER/private/adaptprint-quote-config.php
// Do not commit the live configuration file.
return [
    'recipient' => 'adaptprintsales@gmail.com',
    // Create this mailbox in cPanel before launch, for example website@adaptprint.gr.
    'from' => 'website@adaptprint.gr',
    'allowed_origins' => [
        'https://adaptprint.gr',
        'https://www.adaptprint.gr',
    ],
];
