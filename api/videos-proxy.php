<?php
/**
 * videos.php 的代理文件
 * 用于测试是否是文件名或文件内容导致的问题
 * 如果这个文件可以访问，说明问题可能在 videos.php 文件本身
 */

// 设置 CORS 头
header('Access-Control-Allow-Origin: https://acamortgageconsultancy.com.my');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 尝试包含并执行 videos.php
try {
    // 保存原始请求数据
    $originalMethod = $_SERVER['REQUEST_METHOD'];
    $originalGet = $_GET;
    $originalPost = $_POST;
    
    // 包含 videos.php
    require_once __DIR__ . '/videos.php';
    
} catch (Exception $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to load videos.php',
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

