<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$user = getCurrentUser();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getAnnouncement($db, $_GET['id'], $user);
        } else {
            getAllAnnouncements($db, $user);
        }
        break;
        
    case 'POST':
        requireAdmin();
        createAnnouncement($db, $user);
        break;
        
    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            errorResponse('Announcement ID is required');
        }
        updateAnnouncement($db, $_GET['id']);
        break;
        
    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            errorResponse('Announcement ID is required');
        }
        deleteAnnouncement($db, $_GET['id']);
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllAnnouncements($db, $user) {
    try {
        // Non-admin users can only see published announcements
        $sql = "SELECT * FROM announcements";
        $params = [];
        
        if ($user['role'] !== 'admin') {
            $sql .= " WHERE is_published = 1";
        }
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $announcements = $stmt->fetchAll();
        
        // Convert boolean fields
        foreach ($announcements as &$announcement) {
            $announcement['is_published'] = (bool)$announcement['is_published'];
        }
        
        successResponse($announcements);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function getAnnouncement($db, $id, $user) {
    try {
        $stmt = $db->prepare("SELECT * FROM announcements WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $announcement = $stmt->fetch();
        
        if (!$announcement) {
            errorResponse('Announcement not found', 404);
        }
        
        // Check access for non-published announcements
        if (!$announcement['is_published'] && $user['role'] !== 'admin') {
            errorResponse('Announcement not found', 404);
        }
        
        // Increment views
        $updateStmt = $db->prepare("UPDATE announcements SET views = views + 1 WHERE id = :id");
        $updateStmt->execute(['id' => $id]);
        $announcement['views']++;
        
        $announcement['is_published'] = (bool)$announcement['is_published'];
        
        successResponse($announcement);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function createAnnouncement($db, $user) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $title = $input['title'] ?? '';
    $content = $input['content'] ?? '';
    $type = $input['type'] ?? 'notice';
    $priority = $input['priority'] ?? 'normal';
    $isPublished = $input['isPublished'] ?? true;
    
    if (empty($title) || empty($content)) {
        errorResponse('Title and content are required');
    }
    
    try {
        // Get user details
        $userStmt = $db->prepare("SELECT name, avatar FROM users WHERE id = :id");
        $userStmt->execute(['id' => $user['userId']]);
        $userData = $userStmt->fetch();
        
        $stmt = $db->prepare("
            INSERT INTO announcements (
                title, content, type, priority, is_published,
                created_by, creator_name, creator_avatar, views
            ) VALUES (
                :title, :content, :type, :priority, :is_published,
                :created_by, :creator_name, :creator_avatar, 0
            )
        ");
        
        $stmt->execute([
            'title' => $title,
            'content' => $content,
            'type' => $type,
            'priority' => $priority,
            'is_published' => $isPublished ? 1 : 0,
            'created_by' => $user['userId'],
            'creator_name' => $userData['name'],
            'creator_avatar' => $userData['avatar']
        ]);
        
        $announcementId = $db->lastInsertId();
        
        successResponse(['id' => $announcementId], 'Announcement created successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function updateAnnouncement($db, $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $fields = [];
        $params = ['id' => $id];
        
        if (isset($input['title'])) {
            $fields[] = "title = :title";
            $params['title'] = $input['title'];
        }
        if (isset($input['content'])) {
            $fields[] = "content = :content";
            $params['content'] = $input['content'];
        }
        if (isset($input['type'])) {
            $fields[] = "type = :type";
            $params['type'] = $input['type'];
        }
        if (isset($input['priority'])) {
            $fields[] = "priority = :priority";
            $params['priority'] = $input['priority'];
        }
        if (isset($input['isPublished'])) {
            $fields[] = "is_published = :is_published";
            $params['is_published'] = $input['isPublished'] ? 1 : 0;
        }
        
        if (empty($fields)) {
            errorResponse('No fields to update');
        }
        
        $sql = "UPDATE announcements SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        successResponse(null, 'Announcement updated successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteAnnouncement($db, $id) {
    try {
        $stmt = $db->prepare("DELETE FROM announcements WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Announcement not found', 404);
        }
        
        successResponse(null, 'Announcement deleted successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
?>