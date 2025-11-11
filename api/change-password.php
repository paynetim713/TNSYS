<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        changePassword($db);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function changePassword($db) {
    $user = getCurrentUser();
    
    if (!$user) {
        errorResponse('Authentication required', 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $currentPassword = $input['currentPassword'] ?? '';
    $newPassword = $input['newPassword'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';
    
    if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
        errorResponse('All password fields are required');
    }
    
    if ($newPassword !== $confirmPassword) {
        errorResponse('New password and confirmation do not match');
    }
    
    if (strlen($newPassword) < 6) {
        errorResponse('New password must be at least 6 characters long');
    }
    
    try {
        // 获取当前用户的密码
        $stmt = $db->prepare("SELECT password FROM users WHERE id = :id");
        $stmt->execute(['id' => $user['userId']]);
        $userData = $stmt->fetch();
        
        if (!$userData) {
            errorResponse('User not found', 404);
        }
        
        // Verify current password
        if (!password_verify($currentPassword, $userData['password'])) {
            errorResponse('Current password is incorrect');
        }
        
        // Hash new password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // Update password
        $updateStmt = $db->prepare("UPDATE users SET password = :password, updated_at = NOW() WHERE id = :id");
        $updateStmt->execute([
            'password' => $hashedPassword,
            'id' => $user['userId']
        ]);
        
        successResponse(null, 'Password changed successfully');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
