<?php
$path = isset($_GET['_path']) ? $_GET['_path'] : '/';
unset($_GET['_path']);
$query = http_build_query($_GET);
$target = 'http://127.0.0.1:5000/api' . $path . ($query ? '?' . $query : '');

$method = $_SERVER['REQUEST_METHOD'];
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';

$headers = [];
if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $headers[] = 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'];
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_HEADER, true);

if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    // File upload (multipart/form-data)
    if (stripos($contentType, 'multipart/form-data') !== false && !empty($_FILES)) {
        $postFields = [];
        // Add regular POST fields
        foreach ($_POST as $key => $value) {
            $postFields[$key] = $value;
        }
        // Add files
        foreach ($_FILES as $key => $file) {
            if ($file['error'] === UPLOAD_ERR_OK) {
                $postFields[$key] = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
            }
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        // Let curl set the Content-Type with boundary automatically
    } else {
        // JSON or other body
        $body = file_get_contents('php://input');
        $headers[] = 'Content-Type: ' . ($contentType ?: 'application/json');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

if (!empty($headers)) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

$raw = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$responseContentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

$response = substr($raw, $headerSize);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($method === 'OPTIONS') { http_response_code(200); exit(); }

if ($responseContentType) {
    header('Content-Type: ' . $responseContentType);
} else {
    header('Content-Type: application/json');
}

http_response_code($httpCode ?: 500);
echo $response;
?>
