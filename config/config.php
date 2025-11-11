<?php
// ACA培训平台 - 支持本地和生产环境配置

// 开启输出缓冲，确保可以在任何时候设置响应头
if (!ob_get_level()) {
    ob_start();
}

// 注册错误处理函数，确保所有错误都返回 JSON
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        // 清除之前的输出
        if (ob_get_level()) {
            ob_clean();
        }
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => 'Internal server error',
            'message' => 'A fatal error occurred. Please check the logs for details.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
});

// 错误报告设置
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// 检测环境：通过检查HTTP_HOST来判断是本地还是生产环境
$isLocal = (
    isset($_SERVER['HTTP_HOST']) && (
        $_SERVER['HTTP_HOST'] === 'localhost' || 
        $_SERVER['HTTP_HOST'] === '127.0.0.1' ||
        strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
        strpos($_SERVER['HTTP_HOST'], '.local') !== false
    )
) || (
    isset($_SERVER['SERVER_NAME']) && (
        $_SERVER['SERVER_NAME'] === 'localhost' ||
        $_SERVER['SERVER_NAME'] === '127.0.0.1' ||
        strpos($_SERVER['SERVER_NAME'], 'localhost') !== false ||
        strpos($_SERVER['SERVER_NAME'], '.local') !== false
    )
);

if ($isLocal) {
    // 本地环境配置
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'training');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('BASE_URL', 'http://localhost');
} else {
    // 生产环境配置
    define('DB_HOST', 'sc162.mschosting.cloud');
    define('DB_NAME', 'acamortg_training');
    define('DB_USER', 'acamortg_liaonan');
    define('DB_PASS', 'tf4&{5{PURz@VYe,');
    define('BASE_URL', 'https://acamortgageconsultancy.com.my');
}

// 应用程序设置
define('DB_CHARSET', 'utf8mb4');
define('TIMEZONE', 'Asia/Kuala_Lumpur');

// 安全设置
define('JWT_SECRET', 'ACA-Training-Production-Secret-Key-2025-' . md5('aca-training-platform-production-v1'));
define('JWT_EXPIRY', 86400);

// 文件上传设置 - 规范化路径以确保Windows兼容性
$uploadBasePath = realpath(__DIR__ . '/../uploads');
if ($uploadBasePath === false) {
    // 如果目录不存在，创建它
    $uploadBasePath = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'uploads';
    if (!file_exists($uploadBasePath)) {
        mkdir($uploadBasePath, 0755, true);
    }
    $uploadBasePath = realpath($uploadBasePath);
}
define('UPLOAD_DIR', $uploadBasePath . DIRECTORY_SEPARATOR);
define('VIDEO_DIR', UPLOAD_DIR . 'videos' . DIRECTORY_SEPARATOR);
define('THUMBNAIL_DIR', UPLOAD_DIR . 'thumbnails' . DIRECTORY_SEPARATOR);
define('MAX_VIDEO_SIZE', 500 * 1024 * 1024);
define('MAX_THUMBNAIL_SIZE', 5 * 1024 * 1024);

define('ALLOWED_VIDEO_EXTENSIONS', ['mp4', 'mov', 'avi', 'mkv', 'webm']);
define('ALLOWED_IMAGE_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif']);

// CORS设置 - 本地环境允许所有来源，生产环境限制
if ($isLocal) {
    define('ALLOW_ORIGIN', '*'); // 本地开发允许所有来源
} else {
    define('ALLOW_ORIGIN', 'https://acamortgageconsultancy.com.my');
}

// 初始化
date_default_timezone_set(TIMEZONE);

if (!file_exists(VIDEO_DIR)) {
    mkdir(VIDEO_DIR, 0755, true);
}
if (!file_exists(THUMBNAIL_DIR)) {
    mkdir(THUMBNAIL_DIR, 0755, true);
}

// 数据库连接类
class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch(PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            // 清除任何输出
            if (ob_get_level()) {
                ob_clean();
            }
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            die(json_encode([
                'success' => false,
                'error' => 'Database connection failed',
                'message' => 'Unable to connect to database. Please check your configuration.',
                'details' => $isLocal ? $e->getMessage() : 'Database connection error'
            ], JSON_UNESCAPED_UNICODE));
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->conn;
    }
}

// 安全头部设置 - 移除服务器签名（即使服务器不支持 .htaccess 也能工作）
@header_remove('X-Powered-By');
// 注意：Server header 需要在服务器配置层面移除（Nginx: server_tokens off; Apache: ServerTokens Prod）

// CORS和HTTP头部设置（先设置CORS，Content-Type在jsonResponse中设置）
header('Access-Control-Allow-Origin: ' . ALLOW_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
// 注意：Content-Type 在 jsonResponse 函数中设置，避免非 JSON 响应（如视频流）也强制设置为 JSON

// 处理 OPTIONS 预检请求（确保在所有环境下都能正常工作）
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 响应辅助函数
function jsonResponse($data, $statusCode = 200) {
    // 清除任何之前的输出
    if (ob_get_level()) {
        ob_clean();
    }
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function errorResponse($message, $statusCode = 400) {
    jsonResponse([
        'error' => $message,
        'success' => false
    ], $statusCode);
}

function successResponse($data, $message = 'Success') {
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
}

// JWT令牌函数
function generateToken($userId, $username, $role) {
    $issuedAt = time();
    $expire = $issuedAt + JWT_EXPIRY;
    
    $payload = [
        'iat' => $issuedAt,
        'exp' => $expire,
        'userId' => (int)$userId,
        'username' => $username,
        'role' => $role
    ];
    
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payloadEncoded = base64_encode(json_encode($payload));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payloadEncoded", JWT_SECRET, true));
    
    return "$header.$payloadEncoded.$signature";
}

function verifyToken($token) {
    if (!$token) {
        return false;
    }
    
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    
    $validSignature = base64_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    
    if ($signature !== $validSignature) {
        return false;
    }
    
    $payloadData = json_decode(base64_decode($payload), true);
    
    if (!isset($payloadData['exp']) || $payloadData['exp'] < time()) {
        return false;
    }
    
    return $payloadData;
}

// 授权头部函数
function getAuthorizationHeader() {
    $headers = null;
    
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    }
    elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    }
    elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        
        $requestHeaders = array_combine(
            array_map('ucwords', array_map('strtolower', array_keys($requestHeaders))),
            array_values($requestHeaders)
        );
        
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    elseif (function_exists('getallheaders')) {
        $requestHeaders = getallheaders();
        
        $requestHeaders = array_combine(
            array_map('ucwords', array_map('strtolower', array_keys($requestHeaders))),
            array_values($requestHeaders)
        );
        
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    
    return $headers;
}

function getBearerToken() {
    $headers = getAuthorizationHeader();
    
    if (!empty($headers)) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers, $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

// 身份验证函数
function getCurrentUser() {
    $token = getBearerToken();
    
    if (!$token) {
        errorResponse('Unauthorized - No token provided', 401);
    }
    
    $user = verifyToken($token);
    
    if (!$user) {
        errorResponse('Invalid or expired token', 401);
    }
    
    return $user;
}

function requireAdmin() {
    $user = getCurrentUser();
    
    if ($user['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
    
    return $user;
}

function isAuthenticated() {
    $token = getBearerToken();
    
    if (!$token) {
        return false;
    }
    
    $user = verifyToken($token);
    
    return $user !== false;
}

// 文件验证函数
function validateUploadedFile($file, $type = 'video') {
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['valid' => false, 'error' => 'File upload error'];
    }
    
    $maxSize = ($type === 'video') ? MAX_VIDEO_SIZE : MAX_THUMBNAIL_SIZE;
    if ($file['size'] > $maxSize) {
        $maxSizeMB = $maxSize / (1024 * 1024);
        return ['valid' => false, 'error' => "File size exceeds {$maxSizeMB}MB limit"];
    }
    
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowedExts = ($type === 'video') ? ALLOWED_VIDEO_EXTENSIONS : ALLOWED_IMAGE_EXTENSIONS;
    
    if (!in_array($ext, $allowedExts)) {
        return ['valid' => false, 'error' => 'Invalid file format'];
    }
    
    return ['valid' => true, 'extension' => $ext];
}

function generateUniqueFilename($prefix, $extension) {
    return $prefix . '_' . time() . '_' . uniqid() . '.' . $extension;
}

// 实用工具函数
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function logMessage($message, $level = 'INFO') {
    $logDir = __DIR__ . '/../logs/';
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . 'app_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// 头像URL处理函数
function getFullAvatarUrl($avatar) {
    if (empty($avatar)) {
        return null;
    }
    
    // 如果已经是完整URL，直接返回
    if (strpos($avatar, 'http') === 0) {
        return $avatar;
    }
    
    // 如果是相对路径，添加BASE_URL
    if (strpos($avatar, '/') === 0) {
        return BASE_URL . $avatar;
    }
    
    // 如果只是文件名，添加完整路径
    return BASE_URL . '/uploads/avatars/' . $avatar;
}

// 缩略图URL处理函数
function getFullThumbnailUrl($thumbnail) {
    if (empty($thumbnail)) {
        return null;
    }
    
    // 如果已经是完整URL，直接返回
    if (strpos($thumbnail, 'http') === 0) {
        return $thumbnail;
    }
    
    // 获取应用的基础路径
    $scriptPath = $_SERVER['SCRIPT_NAME'] ?? '/api/videos.php';
    // 从脚本路径中提取基础路径（例如：/aca-training(local)/api/videos.php -> /aca-training(local)）
    $basePath = dirname(dirname($scriptPath));
    
    // 规范化 basePath
    $basePath = str_replace('\\', '/', $basePath); // Windows路径转Unix格式
    $basePath = trim($basePath, '/');
    
    // 如果 basePath 是根目录、当前目录或空，设为空
    if ($basePath === '' || $basePath === '.' || $basePath === '/' || $basePath === '\\') {
        $basePath = '';
    } else {
        // 确保 basePath 以斜杠开头
        $basePath = '/' . $basePath;
    }
    
    // 规范化 thumbnail 路径
    $thumbnail = str_replace('\\', '/', $thumbnail); // Windows路径转Unix格式
    // 确保 thumbnail 路径以斜杠开头
    if (strpos($thumbnail, '/') !== 0) {
        $thumbnail = '/' . $thumbnail;
    }
    
    return BASE_URL . $basePath . $thumbnail;
}

// 处理用户数据，确保头像URL完整
function processUserData($user) {
    if (isset($user['avatar'])) {
        $user['avatar'] = getFullAvatarUrl($user['avatar']);
    }
    return $user;
}
?>