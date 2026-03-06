<?php
/**
 * ConsentKit — consent-log.php
 *
 * Drop this file on any PHP host (shared hosting, cPanel, GoDaddy, etc.)
 * It appends one row per consent event to consent-log.csv in the same folder.
 *
 * Point the widget at it via data-log-url:
 *   <script src="/consentkit/widget.js"
 *           data-config="/consentkit/consentkit.config.json"
 *           data-log-url="/consentkit/consent-log.php"
 *           defer></script>
 *
 * READ THE LOG:
 *   Open consent-log.csv in Excel, LibreOffice, or any text editor.
 *   Or download it from your hosting file manager.
 *
 * SECURITY:
 *   Rename or move consent-log.csv outside the web root if your host allows it.
 *   The script does NOT allow reading the log via HTTP — POST only.
 */

// ── CORS headers (widget may be on a different domain) ────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// POST only
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Parse body ────────────────────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// ── Validate required fields ──────────────────────────────────────────────────
$visitorId     = isset($body['visitorId'])     ? (string) $body['visitorId']     : '';
$timestamp     = isset($body['timestamp'])     ? (string) $body['timestamp']     : '';
$choices       = isset($body['choices'])       ? $body['choices']                : null;
$bannerVersion = isset($body['bannerVersion']) ? (string) $body['bannerVersion'] : '';
$userAgent     = isset($body['userAgent'])     ? (string) $body['userAgent']     : '';

// visitorId must look like a UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
if (!preg_match('/^[0-9a-f\-]{36}$/i', $visitorId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid visitorId']);
    exit;
}

if (empty($timestamp) || !is_array($choices)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// ── Sanitise ──────────────────────────────────────────────────────────────────
$visitorId     = preg_replace('/[^0-9a-f\-]/i', '', $visitorId);
$timestamp     = preg_replace('/[^0-9T:\.\-Z]/', '', $timestamp);
$bannerVersion = preg_replace('/[^0-9a-zA-Z\.\-_]/', '', $bannerVersion);
$userAgent     = mb_substr($userAgent, 0, 512);   // cap length
$choicesJson   = json_encode($choices);
$loggedAt      = gmdate('Y-m-d\TH:i:s\Z');

// ── Write to CSV ──────────────────────────────────────────────────────────────
$logFile = __DIR__ . '/consent-log.csv';
$isNew   = !file_exists($logFile);

// fopen with 'a' + exclusive lock for safe concurrent writes
$fh = fopen($logFile, 'a');
if (!$fh) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not open log file. Check folder permissions.']);
    exit;
}

if (flock($fh, LOCK_EX)) {
    // Write header row on first write
    if ($isNew) {
        fputcsv($fh, ['visitor_id', 'timestamp', 'choices', 'banner_version', 'user_agent', 'logged_at']);
    }
    fputcsv($fh, [$visitorId, $timestamp, $choicesJson, $bannerVersion, $userAgent, $loggedAt]);
    flock($fh, LOCK_UN);
}
fclose($fh);

// ── Enforce retention (delete rows older than retentionDays) ──────────────────
// We only run the cleanup ~1% of the time to keep it fast
if (mt_rand(1, 100) === 1 && file_exists($logFile)) {
    $retentionDays = 1825; // 5 years default — change to match your config

    $lines  = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $header = array_shift($lines);
    $cutoff = gmdate('Y-m-d\TH:i:s\Z', strtotime("-{$retentionDays} days"));

    $kept = array_filter($lines, function ($line) use ($cutoff) {
        // logged_at is the last column; compare lexicographically (ISO 8601 sorts correctly)
        $cols = str_getcsv($line);
        $loggedAt = end($cols);
        return $loggedAt >= $cutoff;
    });

    $fh = fopen($logFile, 'w');
    if ($fh && flock($fh, LOCK_EX)) {
        fputcsv($fh, ['visitor_id', 'timestamp', 'choices', 'banner_version', 'user_agent', 'logged_at']);
        foreach ($kept as $line) {
            fwrite($fh, $line . "\n");
        }
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}

http_response_code(201);
echo json_encode(['ok' => true]);
