<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$user = getCurrentUser();

switch ($method) {
    case 'GET':
        getUserProgress($db, $user['userId']);
        break;
        
    case 'POST':
        markVideoComplete($db, $user['userId']);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getUserProgress($db, $userId) {
    try {
        $stmt = $db->prepare("
            SELECT video_id, completed_at 
            FROM user_video_progress 
            WHERE user_id = :user_id
            ORDER BY completed_at DESC
        ");
        $stmt->execute(['user_id' => $userId]);
        $progress = $stmt->fetchAll();
        
        successResponse($progress);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function markVideoComplete($db, $userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    $videoId = $input['video_id'] ?? null;
    
    if (!$videoId) {
        errorResponse('Video ID is required');
    }
    
    try {
        // Check if video exists
        $stmt = $db->prepare("SELECT id FROM videos WHERE id = :id");
        $stmt->execute(['id' => $videoId]);
        if (!$stmt->fetch()) {
            errorResponse('Video not found', 404);
        }
        
        // Insert or update progress
        $stmt = $db->prepare("
            INSERT INTO user_video_progress (user_id, video_id, completed_at)
            VALUES (:user_id, :video_id, NOW())
            ON DUPLICATE KEY UPDATE completed_at = NOW()
        ");
        
        $stmt->execute([
            'user_id' => $userId,
            'video_id' => $videoId
        ]);
        
        successResponse(null, 'Video marked as complete');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
?>