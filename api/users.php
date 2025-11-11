<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$user = getCurrentUser();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getUser($db, $_GET['id'], $user);
        } elseif (isset($_GET['stats'])) {
            getUserStats($db, $user);
        } else {
            getAllUsers($db, $user);
        }
        break;
        
    case 'PUT':
        if (!isset($_GET['id'])) {
            errorResponse('User ID is required');
        }
        updateUser($db, $_GET['id'], $user);
        break;
        
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] === 'upload_avatar') {
            if (!isset($_GET['id'])) {
                errorResponse('User ID is required');
            }
            uploadAvatar($db, $_GET['id'], $user);
        } else {
            // 创建新用户
            createUser($db, $user);
        }
        break;
        
    case 'DELETE':
        if (!isset($_GET['id'])) {
            errorResponse('User ID is required');
        }
        deleteUser($db, $_GET['id'], $user);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllUsers($db, $user) {
    // 只有管理员可以获取所有用户
    if ($user['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
    
    try {
        $stmt = $db->query(
            "SELECT u.*, d.name AS valid_department, GROUP_CONCAT(p.video_id) as completed_video_ids
             FROM users u
             LEFT JOIN user_video_progress p ON u.id = p.user_id
             LEFT JOIN departments d ON d.name = u.department AND d.is_active = 1
             GROUP BY u.id
             ORDER BY u.id ASC"
        );
        
        $users = $stmt->fetchAll();
        
        // 格式化已完成的视频并移除密码
        foreach ($users as &$user) {
            unset($user['password']);
            $user['completedVideos'] = $user['completed_video_ids'] 
                ? array_map('intval', explode(',', $user['completed_video_ids']))
                : [];
            unset($user['completed_video_ids']);
            // 覆盖无效/已删除部门
            $user['department'] = isset($user['valid_department']) ? $user['valid_department'] : null;
            unset($user['valid_department']);
            
            // 处理用户数据，确保头像URL完整
            $user = processUserData($user);
        }
        
        successResponse($users);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function getUser($db, $id, $currentUser) {
    // 用户只能查看自己的个人资料，除非是管理员
    if ($currentUser['role'] !== 'admin' && $currentUser['userId'] != $id) {
        errorResponse('Access denied', 403);
    }
    
    try {
        $stmt = $db->prepare(
            "SELECT u.*, GROUP_CONCAT(p.video_id) as completed_video_ids
             FROM users u
             LEFT JOIN user_video_progress p ON u.id = p.user_id
             WHERE u.id = :id
             GROUP BY u.id"
        );
        
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            errorResponse('User not found', 404);
        }
        
        unset($user['password']);
        $user['completedVideos'] = $user['completed_video_ids'] 
            ? array_map('intval', explode(',', $user['completed_video_ids']))
            : [];
        unset($user['completed_video_ids']);
        
        // 处理用户数据，确保头像URL完整
        $user = processUserData($user);
        
        successResponse($user);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function updateUser($db, $id, $currentUser) {
    // 用户只能更新自己的个人资料，除非是管理员
    if ($currentUser['role'] !== 'admin' && $currentUser['userId'] != $id) {
        errorResponse('Access denied', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $fields = [];
        $params = ['id' => $id];
        
        // 只允许更新特定字段
        $allowedFields = ['username', 'name', 'email', 'phone', 'department', 'address', 'rank'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                // 如果正在更新用户名，检查用户名唯一性
                if ($field === 'username') {
                    $checkStmt = $db->prepare("SELECT id FROM users WHERE username = :username AND id != :id");
                    $checkStmt->execute(['username' => $input[$field], 'id' => $id]);
                    if ($checkStmt->fetch()) {
                        errorResponse('Username already exists');
                    }
                }
                
                $fields[] = "$field = :$field";
                $params[$field] = $input[$field];
            }
        }
        
        // 管理员可以更新角色，但不能把自己降级
        if ($currentUser['role'] === 'admin' && isset($input['role'])) {
            if ((string)$id === (string)$currentUser['userId'] && $input['role'] !== 'admin') {
                errorResponse('Admins cannot change their own role to non-admin');
            }
            $fields[] = "role = :role";
            $params['role'] = $input['role'];
        }
        
        if (empty($fields)) {
            errorResponse('No fields to update');
        }
        
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        successResponse(null, 'User updated successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function uploadAvatar($db, $id, $currentUser) {
    // 用户只能上传自己的头像，除非是管理员
    if ($currentUser['role'] !== 'admin' && $currentUser['userId'] != $id) {
        errorResponse('Access denied', 403);
    }
    
    if (!isset($_FILES['avatar'])) {
        errorResponse('No avatar file uploaded');
    }
    
    $file = $_FILES['avatar'];
    
    // 检查上传错误
    if ($file['error'] !== UPLOAD_ERR_OK) {
        errorResponse('File upload failed');
    }
    
    // 检查文件大小（2MB）
    if ($file['size'] > 2 * 1024 * 1024) {
        errorResponse('File size must be less than 2MB');
    }
    
    // 检查文件类型
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        errorResponse('Only JPG, PNG and GIF files are allowed');
    }
    
    // 如果上传目录不存在则创建
    $uploadDir = '../uploads/avatars/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // 生成唯一文件名
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'avatar_' . $id . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // 移动上传的文件
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        errorResponse('Failed to save avatar file');
    }
    
    // 更新数据库
    try {
        $avatarUrl = '/uploads/avatars/' . $filename;
        $fullAvatarUrl = BASE_URL . $avatarUrl;
        
        $stmt = $db->prepare("UPDATE users SET avatar = :avatar WHERE id = :id");
        $stmt->execute([
            'avatar' => $avatarUrl,
            'id' => $id
        ]);
        
        successResponse(['avatar_url' => $fullAvatarUrl], 'Avatar uploaded successfully');
    } catch (PDOException $e) {
        // 如果数据库更新失败则删除上传的文件
        unlink($filepath);
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function getUserStats($db, $user) {
    try {
        $stats = [];
        
        // 总视频数
        $stmt = $db->query("SELECT COUNT(*) as total FROM videos");
        $stats['totalVideos'] = $stmt->fetch()['total'];
        
        // 用户已完成的视频
        $stmt = $db->prepare("SELECT COUNT(*) as completed FROM user_video_progress WHERE user_id = :user_id");
        $stmt->execute(['user_id' => $user['userId']]);
        $stats['completedVideos'] = $stmt->fetch()['completed'];
        
        // 完成率
        $stats['completionRate'] = $stats['totalVideos'] > 0 
            ? round(($stats['completedVideos'] / $stats['totalVideos']) * 100) 
            : 0;
        
        // 如果是管理员，获取整体统计
        if ($user['role'] === 'admin') {
            $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role = 'employee'");
            $stats['totalEmployees'] = $stmt->fetch()['total'];
            
            // 平均完成率
            $stmt = $db->query(
                "SELECT AVG(completion_rate) as avg_rate
                 FROM (
                     SELECT 
                         u.id,
                         COUNT(p.video_id) * 100.0 / (SELECT COUNT(*) FROM videos) as completion_rate
                     FROM users u
                     LEFT JOIN user_video_progress p ON u.id = p.user_id
                     WHERE u.role = 'employee'
                     GROUP BY u.id
                 ) as rates"
            );
            $result = $stmt->fetch();
            $stats['avgCompletionRate'] = $result['avg_rate'] ? round($result['avg_rate']) : 0;
        }
        
        successResponse($stats);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteUser($db, $id, $currentUser) {
    // 只有管理员可以删除用户
    if ($currentUser['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
    
    // 防止管理员删除自己
    if ($currentUser['userId'] == $id) {
        errorResponse('You cannot delete your own account', 400);
    }
    
    try {
        // 删除前获取用户信息用于日志记录（包括员工ID用于代理ID）
        $stmt = $db->prepare("SELECT username, name, email, employee_id FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $userToDelete = $stmt->fetch();
        
        if (!$userToDelete) {
            errorResponse('User not found', 404);
        }
        
        // 创建终止记录（包括代理ID以供将来参考）
        $stmt = $db->prepare(
            "INSERT INTO user_terminations (user_id, username, name, email, employee_id, terminated_by, terminated_at, reason)
             VALUES (:user_id, :username, :name, :email, :employee_id, :terminated_by, NOW(), :reason)"
        );
        $stmt->execute([
            'user_id' => $id,
            'username' => $userToDelete['username'],
            'name' => $userToDelete['name'],
            'email' => $userToDelete['email'],
            'employee_id' => $userToDelete['employee_id'], // 保存代理ID以供参考
            'terminated_by' => $currentUser['userId'],
            'reason' => 'Terminated by admin'
        ]);
        
        // 删除用户（级联将处理相关记录）
        $stmt = $db->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        successResponse(null, 'User terminated successfully');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function createUser($db, $currentUser) {
    // 只有管理员可以创建用户
    if ($currentUser['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // 验证必填字段
    $requiredFields = ['name', 'email', 'password'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty(trim($input[$field]))) {
            errorResponse("Field '$field' is required");
        }
    }
    
    // 验证邮箱格式
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        errorResponse('Invalid email format');
    }
    
    // 验证密码长度
    if (strlen($input['password']) < 6) {
        errorResponse('Password must be at least 6 characters long');
    }
    
    try {
        // 检查邮箱是否已存在于活跃用户中（未终止）
        $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
        $stmt->execute(['email' => $input['email']]);
        if ($stmt->fetch()) {
            errorResponse('Email already exists');
        }
        
        // 从邮箱生成用户名（@之前的部分）
        $username = explode('@', $input['email'])[0];
        
        // 检查用户名是否已存在于活跃用户中，如需要则使其唯一
        $originalUsername = $username;
        $counter = 1;
        while (true) {
            $stmt = $db->prepare("SELECT id FROM users WHERE username = :username");
            $stmt->execute(['username' => $username]);
            if (!$stmt->fetch()) {
                break; // 用户名可用
            }
            $username = $originalUsername . $counter;
            $counter++;
        }
        
        // 如果未提供则自动生成员工ID
        $employeeId = $input['employee_id'] ?? '';
        if (empty($employeeId)) {
            $role = $input['role'] ?? 'employee';
            $prefix = ($role === 'admin') ? 'ADM' : 'EMP';
            
            // 获取此前缀的最高现有编号以避免重复
            $stmt = $db->prepare("
                SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id, 4) AS UNSIGNED)), 0) as max_num
                FROM users 
                WHERE employee_id LIKE :pattern AND employee_id REGEXP '^[A-Z]{3}[0-9]{3}$'
            ");
            $stmt->execute(['pattern' => $prefix . '%']);
            $maxNum = $stmt->fetch()['max_num'];
            
            $employeeId = $prefix . str_pad($maxNum + 1, 3, '0', STR_PAD_LEFT);
            
            // 再次检查以确保生成的ID不存在
            $stmt = $db->prepare("SELECT id FROM users WHERE employee_id = :employee_id");
            $stmt->execute(['employee_id' => $employeeId]);
            $counter = 1;
            while ($stmt->fetch()) {
                $employeeId = $prefix . str_pad($maxNum + 1 + $counter, 3, '0', STR_PAD_LEFT);
                $stmt->execute(['employee_id' => $employeeId]);
                $counter++;
            }
        }
        
        // 哈希密码
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
        
        // 准备插入数据
        $userData = [
            'username' => $username,
            'name' => sanitizeInput($input['name']),
            'email' => $input['email'],
            'password' => $hashedPassword,
            'phone' => isset($input['phone']) ? sanitizeInput($input['phone']) : null,
            'department' => isset($input['department']) ? sanitizeInput($input['department']) : null,
            'employee_id' => $employeeId,
            'role' => isset($input['role']) && in_array($input['role'], ['employee', 'admin']) ? $input['role'] : 'employee',
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        // 插入新用户
        $fields = array_keys($userData);
        $placeholders = ':' . implode(', :', $fields);
        $sql = "INSERT INTO users (" . implode(', ', $fields) . ") VALUES ($placeholders)";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($userData);
        
        $newUserId = $db->lastInsertId();
        
        // 获取创建的用户（不含密码）
        $stmt = $db->prepare("SELECT id, username, name, email, phone, department, employee_id, role, created_at FROM users WHERE id = :id");
        $stmt->execute(['id' => $newUserId]);
        $newUser = $stmt->fetch();
        
        successResponse($newUser, 'User created successfully');
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
?>