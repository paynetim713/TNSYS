<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

$user = null;
if ($method !== 'GET') {
    $user = getCurrentUser();
    if ($user['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
} else {
    $user = getCurrentUser();
}

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? '';
        if ($action === 'categories') {
            getCategories($db);
        } elseif ($action === 'folders') {
            getFolders($db);
        } else {
            getAllResources($db, $_GET['folder_id'] ?? null);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? $_POST['action'] ?? '';
        
        if ($action === 'add_category') {
            addCategory($db, $input);
        } elseif ($action === 'add_folder') {
            addFolder($db, $input);
        } else {
            createResource($db);
        }
        break;
        
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'update_category') {
            updateCategory($db, $input);
        } else {
            errorResponse('Invalid action', 400);
        }
        break;
        
    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'delete_category') {
            deleteCategory($db, $input);
        } elseif (isset($_GET['folder_id'])) {
            deleteFolder($db, $_GET['folder_id']);
        } elseif (isset($_GET['id'])) {
            deleteResource($db, $_GET['id']);
        } else {
            errorResponse('Resource ID, Folder ID, or action is required');
        }
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllResources($db, $folderId = null) {
    try {
        $sql = "
            SELECT id, title, description, category, filename, file_path, file_size, created_at, folder_id
            FROM resources
        ";
        
        $params = [];
        if ($folderId) {
            $sql .= " WHERE folder_id = :folder_id";
            $params['folder_id'] = $folderId;
        } else {
            $sql .= " WHERE folder_id IS NULL";
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $resources = $stmt->fetchAll();
        
        successResponse($resources);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function createResource($db) {
    $title = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $category = $_POST['category'] ?? 'Other';
    $folderId = $_POST['folder_id'] ?? null;
    
    if (empty($title)) {
        errorResponse('Title is required');
    }
    
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        errorResponse('No file uploaded or upload error');
    }
    
    $file = $_FILES['file'];
    
    // Check file size (max 50MB)
    if ($file['size'] > 50 * 1024 * 1024) {
        errorResponse('File exceeds 50MB limit');
    }
    
    try {
        // Create resources directory structure by year/month
        $year = date('Y');
        $month = date('m');
        $resourcesDir = __DIR__ . "/../uploads/resources/{$year}/{$month}/";
        if (!file_exists($resourcesDir)) {
            mkdir($resourcesDir, 0755, true);
        }
        
        // Generate unique filename
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = 'resource_' . time() . '_' . uniqid() . '.' . $ext;
        $filepath = $resourcesDir . $filename;
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            // Insert into database
            $stmt = $db->prepare("
                INSERT INTO resources (title, description, category, filename, file_path, file_size, folder_id)
                VALUES (:title, :description, :category, :filename, :file_path, :file_size, :folder_id)
            ");
            
            $stmt->execute([
                'title' => $title,
                'description' => $description,
                'category' => $category,
                'filename' => $filename,
                'file_path' => "{$year}/{$month}/{$filename}",
                'file_size' => $file['size'],
                'folder_id' => $folderId
            ]);
            
            $resourceId = $db->lastInsertId();
            successResponse(['resource_id' => $resourceId], 'Resource uploaded successfully');
        } else {
            errorResponse('Failed to save file');
        }
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteResource($db, $id) {
    try {
        // Get resource info
        $stmt = $db->prepare("SELECT filename, file_path FROM resources WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $resource = $stmt->fetch();
        
        if (!$resource) {
            errorResponse('Resource not found', 404);
        }
        
        // Delete file using file_path if available, otherwise use filename
        $filepath = $resource['file_path'] 
            ? __DIR__ . '/../uploads/resources/' . $resource['file_path']
            : __DIR__ . '/../uploads/resources/' . $resource['filename'];
            
        if (file_exists($filepath)) {
            unlink($filepath);
        }
        
        // Delete from database
        $stmt = $db->prepare("DELETE FROM resources WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        successResponse(null, 'Resource deleted successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function getCategories($db) {
    try {
        $stmt = $db->query("
            SELECT name 
            FROM categories 
            ORDER BY name
        ");
        
        $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        successResponse($categories);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function getFolders($db) {
    try {
        $stmt = $db->query("
            SELECT f.*, COUNT(r.id) as file_count
            FROM resource_folders f
            LEFT JOIN resources r ON f.id = r.folder_id
            GROUP BY f.id
            ORDER BY f.created_at DESC
        ");
        
        $folders = $stmt->fetchAll();
        
        successResponse($folders);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function addFolder($db, $input) {
    $name = $input['name'] ?? '';
    $description = $input['description'] ?? '';
    
    if (empty($name)) {
        errorResponse('Folder name is required');
    }
    
    try {
        $stmt = $db->prepare("
            INSERT INTO resource_folders (name, description)
            VALUES (:name, :description)
        ");
        
        $stmt->execute([
            'name' => $name,
            'description' => $description
        ]);
        
        $folderId = $db->lastInsertId();
        
        successResponse(['id' => $folderId], 'Folder created successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteFolder($db, $id) {
    try {
        // Delete all files in the folder first
        $stmt = $db->prepare("SELECT filename, file_path FROM resources WHERE folder_id = :folder_id");
        $stmt->execute(['folder_id' => $id]);
        $resources = $stmt->fetchAll();
        
        foreach ($resources as $resource) {
            $filepath = $resource['file_path'] 
                ? __DIR__ . '/../uploads/resources/' . $resource['file_path']
                : __DIR__ . '/../uploads/resources/' . $resource['filename'];
                
            if (file_exists($filepath)) {
                unlink($filepath);
            }
        }
        
        // Delete resources from database
        $stmt = $db->prepare("DELETE FROM resources WHERE folder_id = :folder_id");
        $stmt->execute(['folder_id' => $id]);
        
        // Delete folder
        $stmt = $db->prepare("DELETE FROM resource_folders WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        successResponse(null, 'Folder and all files deleted successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function addCategory($db, $input) {
    $name = $input['name'] ?? '';
    
    if (empty($name)) {
        errorResponse('Category name is required');
    }
    
    try {
        // Insert category into categories table
        $stmt = $db->prepare("INSERT INTO categories (name) VALUES (?)");
        $stmt->execute([$name]);
        
        successResponse(['name' => $name], 'Category added successfully');
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            errorResponse('Category already exists');
        } else {
            errorResponse('Database error: ' . $e->getMessage(), 500);
        }
    }
}

function updateCategory($db, $input) {
    $oldName = $input['old_name'] ?? '';
    $newName = $input['new_name'] ?? '';
    
    if (empty($oldName) || empty($newName)) {
        errorResponse('Old name and new name are required');
    }
    
    if ($oldName === $newName) {
        errorResponse('New name must be different from old name');
    }
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        // Check if new category name already exists
        $stmt = $db->prepare("SELECT COUNT(*) FROM categories WHERE name = ?");
        $stmt->execute([$newName]);
        if ($stmt->fetchColumn() > 0) {
            $db->rollBack();
            errorResponse('Category name already exists');
        }
        
        // Update category in categories table
        $stmt = $db->prepare("UPDATE categories SET name = ? WHERE name = ?");
        $stmt->execute([$newName, $oldName]);
        
        if ($stmt->rowCount() === 0) {
            $db->rollBack();
            errorResponse('Category not found');
        }
        
        // Update category in resources table
        $stmt = $db->prepare("UPDATE resources SET category = ? WHERE category = ?");
        $stmt->execute([$newName, $oldName]);
        
        $db->commit();
        successResponse(['old_name' => $oldName, 'new_name' => $newName], 'Category updated successfully');
    } catch (PDOException $e) {
        $db->rollBack();
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteCategory($db, $input) {
    $name = $input['name'] ?? '';
    
    if (empty($name)) {
        errorResponse('Category name is required');
    }
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        // Remove category from all resources
        $stmt = $db->prepare("UPDATE resources SET category = NULL WHERE category = ?");
        $stmt->execute([$name]);
        
        // Delete category from categories table
        $stmt = $db->prepare("DELETE FROM categories WHERE name = ?");
        $stmt->execute([$name]);
        
        if ($stmt->rowCount() === 0) {
            $db->rollBack();
            errorResponse('Category not found');
        }
        
        $db->commit();
        successResponse(['name' => $name], 'Category deleted successfully');
    } catch (PDOException $e) {
        $db->rollBack();
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
?>
