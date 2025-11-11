<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$user = getCurrentUser();

if ($user['role'] !== 'admin') {
    errorResponse('Admin access required', 403);
}

switch ($method) {
    case 'GET':
        getTerminations($db, $user);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getTerminations($db, $user) {
    try {
        $stmt = $db->query("
            SELECT 
                t.*,
                u.name as terminated_by_name
            FROM user_terminations t
            LEFT JOIN users u ON t.terminated_by = u.id
            ORDER BY t.terminated_at DESC
        ");
        
        $terminations = $stmt->fetchAll();
        
        successResponse($terminations);
        
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
?>
