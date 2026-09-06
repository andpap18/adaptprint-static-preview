<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function json_response(int $status, array $body) {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_field(array $input, string $key, int $max = 2000): string {
    $value = trim((string)($input[$key] ?? ''));
    return mb_substr($value, 0, $max, 'UTF-8');
}

function origin_allowed(string $origin, array $allowedOrigins): bool {
    foreach ($allowedOrigins as $allowedOrigin) {
        if (is_string($allowedOrigin) && hash_equals($allowedOrigin, $origin)) {
            return true;
        }
    }
    return false;
}

function rate_limit(string $ip): bool {
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'adaptprint-rate-limit';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        return false;
    }
    $file = $directory . DIRECTORY_SEPARATOR . hash('sha256', $ip) . '.json';
    $now = time();
    $window = 600;
    $limit = 5;
    $handle = fopen($file, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        return false;
    }
    $stored = stream_get_contents($handle);
    $attempts = json_decode($stored ?: '[]', true);
    $attempts = is_array($attempts) ? array_values(array_filter($attempts, fn($at) => is_int($at) && $at > $now - $window)) : [];
    if (count($attempts) >= $limit) {
        flock($handle, LOCK_UN);
        fclose($handle);
        return false;
    }
    $attempts[] = $now;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($attempts));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    return true;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(405, ['ok' => false, 'message' => 'Η μέθοδος δεν επιτρέπεται.']);
}

$contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
if (strpos($contentType, 'application/json') !== 0) {
    json_response(415, ['ok' => false, 'message' => 'Μη έγκυρη μορφή αιτήματος.']);
}

$configPath = dirname(__DIR__, 2) . '/private/adaptprint-quote-config.php';
if (!is_file($configPath)) {
    json_response(503, ['ok' => false, 'message' => 'Η φόρμα δεν είναι ακόμη διαθέσιμη. Καλέστε μας ή στείλτε email.']);
}
$config = require $configPath;
if (!is_array($config) || empty($config['recipient']) || empty($config['from']) || empty($config['allowed_origins'])) {
    json_response(503, ['ok' => false, 'message' => 'Η φόρμα δεν είναι ακόμη διαθέσιμη. Καλέστε μας ή στείλτε email.']);
}

$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin === '' || !origin_allowed($origin, $config['allowed_origins'])) {
    json_response(403, ['ok' => false, 'message' => 'Το αίτημα δεν επιτρέπεται από αυτήν την προέλευση.']);
}

$input = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($input)) {
    json_response(400, ['ok' => false, 'message' => 'Μη έγκυρα στοιχεία φόρμας.']);
}
if (request_field($input, 'website', 100) !== '') { // honeypot
    json_response(200, ['ok' => true, 'message' => 'Το αίτημά σας στάλθηκε.']);
}

$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (!rate_limit($ip)) {
    json_response(429, ['ok' => false, 'message' => 'Πάρα πολλές προσπάθειες. Δοκιμάστε ξανά σε λίγα λεπτά ή καλέστε μας.']);
}

$name = request_field($input, 'name', 160);
$contact = request_field($input, 'contact', 180);
$service = request_field($input, 'service', 160);
$quantity = request_field($input, 'quantity', 200);
$deadline = request_field($input, 'deadline', 160);
$fileLink = request_field($input, 'file_link', 1000);
$message = request_field($input, 'message', 5000);
$serviceContext = request_field($input, 'service_context', 160);
$projectContext = request_field($input, 'project_context', 240);

$isEmail = filter_var($contact, FILTER_VALIDATE_EMAIL) !== false;
$isPhone = preg_match('/^\+?[0-9][0-9\s().-]{6,}$/', $contact) === 1;
if ($name === '' || (!$isEmail && !$isPhone)) {
    json_response(422, ['ok' => false, 'message' => 'Συμπληρώστε ονοματεπώνυμο και έγκυρο email ή τηλέφωνο.']);
}
if ($fileLink !== '' && filter_var($fileLink, FILTER_VALIDATE_URL) === false) {
    json_response(422, ['ok' => false, 'message' => 'Το link αρχείου πρέπει να είναι έγκυρο URL.']);
}

$subject = 'Νέο αίτημα προσφοράς από adaptprint.gr';
$lines = [
    'Νέο αίτημα προσφοράς',
    '',
    'Όνομα / εταιρεία: ' . $name,
    'Επικοινωνία: ' . $contact,
    'Υπηρεσία: ' . $service,
    'Ποσότητα / μέτρα / τεμάχια: ' . $quantity,
    'Προθεσμία: ' . $deadline,
    'Link αρχείου: ' . $fileLink,
    'Υπηρεσία από σελίδα: ' . $serviceContext,
    'Έργο από portfolio: ' . $projectContext,
    '',
    'Σχόλια:',
    $message,
];
$headers = [
    'From: ' . $config['from'],
    'Content-Type: text/plain; charset=UTF-8',
];
if ($isEmail) {
    $headers[] = 'Reply-To: ' . $contact;
}

$sent = mail((string)$config['recipient'], $subject, implode("\n", $lines), implode("\r\n", $headers));
if (!$sent) {
    json_response(502, ['ok' => false, 'message' => 'Δεν ήταν δυνατή η αποστολή αυτή τη στιγμή. Καλέστε μας ή στείλτε email.']);
}
json_response(200, ['ok' => true, 'message' => 'Το αίτημά σας στάλθηκε. Θα επικοινωνήσουμε μαζί σας σύντομα.']);
