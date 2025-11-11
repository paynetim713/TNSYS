<?php
/**
 * Authorization Header 测试文件
 * 用于检查服务器是否正确传递 Authorization header
 *
 * 使用方法：
 * 1. 在浏览器或Postman中访问: https://acamortgageconsultancy.com.my/api/test-auth.php
 * 2. 添加 Authorization header: Bearer YOUR_TOKEN_HERE
 * 3. 查看返回的 JSON 结果
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://acamortgageconsultancy.com.my');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 收集所有可能的 Authorization header 来源
$authSources = [
    'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? null,
    'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
    'Authorization' => $_SERVER['Authorization'] ?? null,
];

// 尝试从 Apache 函数获取
if (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $authSources['apache_request_headers'] = $headers['Authorization'] ?? $headers['authorization'] ?? null;
}

// 尝试从 getallheaders 获取
if (function_exists('getallheaders')) {
    $allHeaders = getallheaders();
    $authSources['getallheaders'] = $allHeaders['Authorization'] ?? $allHeaders['authorization'] ?? null;
}

// 检查是否有任何 Authorization header
$foundAuth = null;
foreach ($authSources as $source => $value) {
    if (!empty($value)) {
        $foundAuth = [
            'source' => $source,
            'value' => $value,
            'bearer_token' => preg_match('/Bearer\s+(.*)$/i', $value, $matches) ? $matches[1] : null
        ];
        break;
    }
}

// 准备响应
$response = [
    'success' => !empty($foundAuth),
    'timestamp' => date('Y-m-d H:i:s'),
    'message' => !empty($foundAuth)
        ? '✅ Authorization header 成功接收！'
        : '❌ 未检测到 Authorization header',
    'auth_detected' => $foundAuth,
    'all_sources' => $authSources,
    'server_info' => [
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'CONTENT_TYPE' => $_SERVER['CONTENT_TYPE'] ?? 'unknown',
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'SERVER_SOFTWARE' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    ],
    'instructions' => [
        'zh' => '使用 Postman 或浏览器插件发送请求时，添加 Authorization header: Bearer YOUR_TOKEN',
        'en' => 'When sending request via Postman or browser extension, add Authorization header: Bearer YOUR_TOKEN',
    ]
];

// 输出结果
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
