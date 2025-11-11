<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $action = $_GET['action'] ?? '';
        
        if ($action === 'login') {
            handleLogin($db);
        } elseif ($action === 'logout') {
            handleLogout();
        } else {
            errorResponse('Invalid action');
        }
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function handleLogin($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        errorResponse('Username and password are required');
    }
    
    try {
        $stmt = $db->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();
        
        // 检查用户是否存在
        if (!$user) {
            // 在本地环境提供更详细的错误信息
            $isLocal = (
                isset($_SERVER['HTTP_HOST']) && (
                    $_SERVER['HTTP_HOST'] === 'localhost' || 
                    strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
                    strpos($_SERVER['HTTP_HOST'], '.local') !== false
                )
            );
            
            if ($isLocal) {
                error_log("Login failed: User '{$username}' not found in database");
            }
            errorResponse('Invalid username or password', 401);
        }
        
        // 验证密码
        if (!password_verify($password, $user['password'])) {
            // 在本地环境记录密码验证失败
            $isLocal = (
                isset($_SERVER['HTTP_HOST']) && (
                    $_SERVER['HTTP_HOST'] === 'localhost' || 
                    strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
                    strpos($_SERVER['HTTP_HOST'], '.local') !== false
                )
            );
            
            if ($isLocal) {
                error_log("Login failed: Password mismatch for user '{$username}'");
                error_log("Password hash in DB: " . substr($user['password'], 0, 20) . "...");
            }
            errorResponse('Invalid username or password', 401);
        }
        
        // 更新最后登录时间
        $updateStmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
        $updateStmt->execute(['id' => $user['id']]);
        
        // 获取已完成的视频
        $progressStmt = $db->prepare("SELECT video_id FROM user_video_progress WHERE user_id = :user_id");
        $progressStmt->execute(['user_id' => $user['id']]);
        $completedVideos = $progressStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // 生成JWT令牌
        $token = generateToken($user['id'], $user['username'], $user['role']);
        
        // 准备用户数据（排除密码）
        unset($user['password']);
        $user['completedVideos'] = $completedVideos;
        $user['token'] = $token;
        
        // 处理用户数据，确保头像URL完整
        $user = processUserData($user);
        
        successResponse($user, 'Login successful');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function handleLogout() {
    // For JWT, logout is handled client-side by removing the token
    // Optionally, you can implement token blacklisting here
    successResponse(null, 'Logout successful');
}
?>