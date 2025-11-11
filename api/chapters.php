<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Handle OPTIONS preflight request
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$user = null;
if ($method !== 'GET') {
    $user = getCurrentUser();
    if ($user['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getChapter($db, $_GET['id']);
        } else {
            getAllChapters($db);
        }
        break;
        
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] === 'add_module') {
            addModule($db);
        } else {
            createChapter($db);
        }
        break;
        
    case 'PUT':
        if (!isset($_GET['id'])) {
            errorResponse('Chapter ID is required');
        }
        updateChapter($db, $_GET['id']);
        break;
        
    case 'DELETE':
        if (isset($_GET['module_id'])) {
            deleteModule($db, $_GET['module_id']);
        } elseif (isset($_GET['id'])) {
            deleteChapter($db, $_GET['id']);
        } else {
            errorResponse('ID is required');
        }
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

// ==================== Get All Chapters ====================
function getAllChapters($db) {
    try {
        // Get all chapters with their modules
        $stmt = $db->query("
            SELECT 
                c.id,
                c.name,
                c.display_order,
                c.created_at,
                COUNT(cm.id) as module_count,
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'id', cm.id,
                        'module_name', cm.module_name,
                        'display_order', cm.display_order
                    )
                    ORDER BY cm.display_order
                ) as modules
            FROM chapters c
            LEFT JOIN chapter_modules cm ON c.id = cm.chapter_id
            GROUP BY c.id
            ORDER BY c.display_order ASC, c.id ASC
        ");
        
        $chapters = $stmt->fetchAll();
        
        // Parse modules JSON
        foreach ($chapters as &$chapter) {
            if ($chapter['modules']) {
                $moduleArray = json_decode('[' . $chapter['modules'] . ']', true);
                // Keep full module objects for frontend
                $chapter['modules'] = $moduleArray;
            } else {
                $chapter['modules'] = [];
            }
            
            // Convert to expected format
            $chapter['id'] = (int)$chapter['id'];
            $chapter['createdAt'] = $chapter['created_at'];
            unset($chapter['display_order']);
            unset($chapter['created_at']);
        }
        
        successResponse($chapters);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// ==================== Get Single Chapter ====================
function getChapter($db, $id) {
    try {
        $stmt = $db->prepare("
            SELECT 
                c.id,
                c.name,
                c.display_order,
                c.created_at,
                GROUP_CONCAT(
                    cm.module_name 
                    ORDER BY cm.display_order
                ) as modules
            FROM chapters c
            LEFT JOIN chapter_modules cm ON c.id = cm.chapter_id
            WHERE c.id = :id
            GROUP BY c.id
        ");
        
        $stmt->execute(['id' => $id]);
        $chapter = $stmt->fetch();
        
        if (!$chapter) {
            errorResponse('Chapter not found', 404);
        }
        
        // Parse modules
        $chapter['modules'] = $chapter['modules'] 
            ? explode(',', $chapter['modules']) 
            : [];
        $chapter['id'] = (int)$chapter['id'];
        $chapter['createdAt'] = $chapter['created_at'];
        unset($chapter['display_order']);
        unset($chapter['created_at']);
        
        successResponse($chapter);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// ==================== Create Chapter ====================
function createChapter($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? '';
    $modules = $input['modules'] ?? ['Module 01'];
    
    if (empty($name)) {
        errorResponse('Chapter name is required');
    }
    
    try {
        $db->beginTransaction();
        
        // Get next display order
        $stmt = $db->query("SELECT MAX(display_order) as max_order FROM chapters");
        $result = $stmt->fetch();
        $nextOrder = ($result['max_order'] ?? 0) + 1;
        
        // Insert chapter
        $stmt = $db->prepare("
            INSERT INTO chapters (name, display_order) 
            VALUES (:name, :display_order)
        ");
        
        $stmt->execute([
            'name' => $name,
            'display_order' => $nextOrder
        ]);
        
        $chapterId = $db->lastInsertId();
        
        // Insert modules
        $moduleStmt = $db->prepare("
            INSERT INTO chapter_modules (chapter_id, module_name, display_order)
            VALUES (:chapter_id, :module_name, :display_order)
        ");
        
        foreach ($modules as $index => $moduleName) {
            $moduleStmt->execute([
                'chapter_id' => $chapterId,
                'module_name' => $moduleName,
                'display_order' => $index + 1
            ]);
        }
        
        $db->commit();
        
        successResponse([
            'id' => $chapterId,
            'name' => $name,
            'modules' => $modules
        ], 'Chapter created successfully');
    } catch (PDOException $e) {
        $db->rollBack();
        
        if ($e->getCode() === '23000') {
            errorResponse('A chapter with this name already exists');
        }
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// ==================== Update Chapter ====================
function updateChapter($db, $id) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $fields = [];
        $params = ['id' => $id];
        
        if (isset($input['name'])) {
            $fields[] = "name = :name";
            $params['name'] = $input['name'];
        }
        
        if (isset($input['display_order'])) {
            $fields[] = "display_order = :display_order";
            $params['display_order'] = $input['display_order'];
        }
        
        if (!empty($fields)) {
            $sql = "UPDATE chapters SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }
        
        // Update modules if provided
        if (isset($input['modules']) && is_array($input['modules'])) {
            $db->beginTransaction();
            
            // Delete existing modules
            $stmt = $db->prepare("DELETE FROM chapter_modules WHERE chapter_id = :chapter_id");
            $stmt->execute(['chapter_id' => $id]);
            
            // Insert new modules
            $moduleStmt = $db->prepare("
                INSERT INTO chapter_modules (chapter_id, module_name, display_order)
                VALUES (:chapter_id, :module_name, :display_order)
            ");
            
            foreach ($input['modules'] as $index => $moduleName) {
                $moduleStmt->execute([
                    'chapter_id' => $id,
                    'module_name' => $moduleName,
                    'display_order' => $index + 1
                ]);
            }
            
            $db->commit();
        }
        
        successResponse(null, 'Chapter updated successfully');
    } catch (PDOException $e) {
        if (isset($db) && $db->inTransaction()) {
            $db->rollBack();
        }
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// ==================== Delete Chapter ====================
function deleteChapter($db, $id) {
    try {
        // Check if chapter has associated videos
        $stmt = $db->prepare("
            SELECT COUNT(*) as video_count 
            FROM videos v
            JOIN chapters c ON v.section = c.name
            WHERE c.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if ($result['video_count'] > 0) {
            errorResponse('Cannot delete chapter with associated videos. Please reassign or delete videos first.');
        }
        
        // Delete chapter (modules will be deleted by cascade)
        $stmt = $db->prepare("DELETE FROM chapters WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Chapter not found', 404);
        }
        
        successResponse(null, 'Chapter deleted successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// ==================== Add Module to Chapter ====================
function addModule($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $chapterId = $input['chapter_id'] ?? null;
    $moduleName = $input['module_name'] ?? '';
    
    if (!$chapterId || empty($moduleName)) {
        errorResponse('Chapter ID and module name are required');
    }
    
    try {
        // Get next display order for this chapter
        $stmt = $db->prepare("
            SELECT MAX(display_order) as max_order 
            FROM chapter_modules 
            WHERE chapter_id = :chapter_id
        ");
        $stmt->execute(['chapter_id' => $chapterId]);
        $result = $stmt->fetch();
        $nextOrder = ($result['max_order'] ?? 0) + 1;
        
        // Insert module
        $stmt = $db->prepare("
            INSERT INTO chapter_modules (chapter_id, module_name, display_order)
            VALUES (:chapter_id, :module_name, :display_order)
        ");
        
        $stmt->execute([
            'chapter_id' => $chapterId,
            'module_name' => $moduleName,
            'display_order' => $nextOrder
        ]);
        
        $moduleId = $db->lastInsertId();
        
        successResponse([
            'id' => $moduleId,
            'module_name' => $moduleName
        ], 'Module added successfully');
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            errorResponse('This module already exists in the chapter');
        }
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// ==================== Delete Module ====================
function deleteModule($db, $moduleId) {
    try {
        // Check if module has associated videos
        $stmt = $db->prepare("
            SELECT COUNT(*) as video_count 
            FROM videos v
            JOIN chapter_modules cm ON v.module = cm.module_name
            WHERE cm.id = :id
        ");
        $stmt->execute(['id' => $moduleId]);
        $result = $stmt->fetch();
        
        if ($result['video_count'] > 0) {
            errorResponse('Cannot delete module with associated videos');
        }
        
        // Don't allow deleting the last module of a chapter
        $stmt = $db->prepare("
            SELECT chapter_id, 
                   (SELECT COUNT(*) FROM chapter_modules WHERE chapter_id = cm.chapter_id) as module_count
            FROM chapter_modules cm
            WHERE id = :id
        ");
        $stmt->execute(['id' => $moduleId]);
        $result = $stmt->fetch();
        
        if ($result && $result['module_count'] <= 1) {
            errorResponse('Cannot delete the last module of a chapter');
        }
        
        // Delete module
        $stmt = $db->prepare("DELETE FROM chapter_modules WHERE id = :id");
        $stmt->execute(['id' => $moduleId]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Module not found', 404);
        }
        
        successResponse(null, 'Module deleted successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
?>