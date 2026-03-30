<?php
// Auto-restart backend if not running
function ensureBackendRunning() {
    $health = @file_get_contents('http://127.0.0.1:5000/api/health');
    if (!$health) {
        $node_path = '/opt/alt/alt-nodejs20/root/usr/bin';
        $pm2 = '/home/u591726268/node_modules/.bin/pm2';
        $dir = '/home/u591726268/domains/crmpulseeducation.in/backend';
        $cmd = "export PATH={$node_path}:\$PATH && cd {$dir} && {$pm2} start server.js --name crm-backend >> /home/u591726268/backend.log 2>&1";
        $desc = [['pipe','r'],['pipe','w'],['pipe','w']];
        $proc = proc_open('/bin/bash', $desc, $pipes);
        if (is_resource($proc)) {
            fwrite($pipes[0], $cmd . "\n");
            fclose($pipes[0]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            proc_close($proc);
        }
        sleep(4);
    }
}

ensureBackendRunning();

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
    if (stripos($contentType, 'multipart/form-data') !== false && !empty($_FILES)) {
        $postFields = [];
        foreach ($_POST as $key => $value) {
            $postFields[$key] = $value;
        }
        foreach ($_FILES as $key => $file) {
            if ($file['error'] === UPLOAD_ERR_OK) {
                $postFields[$key] = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
            }
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    } else {
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
