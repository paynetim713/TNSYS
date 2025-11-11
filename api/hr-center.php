<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$user = getCurrentUser();

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? '';
        switch ($action) {
            case 'folders':
                getFolders($db, $user);
                break;
            case 'files':
                getFiles($db, $user);
                break;
            case 'admin_folders':
                if ($user['role'] !== 'admin') {
                    errorResponse('Admin access required', 403);
                }
                getAdminFolders($db, $_GET['user_id']);
                break;
            case 'admin_files':
                if ($user['role'] !== 'admin') {
                    errorResponse('Admin access required', 403);
                }
                getAdminFiles($db, $_GET['user_id'], $_GET['folder_id'] ?? null);
                break;
            default:
                errorResponse('Invalid action');
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? $_POST['action'] ?? '';
        
        switch ($action) {
            case 'create_folder':
                createFolder($db, $user, $input);
                break;
            case 'upload_file':
                uploadFile($db, $user);
                break;
            case 'upload_files':
                uploadFiles($db, $user);
                break;
            default:
                errorResponse('Invalid action');
        }
        break;
        
    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'delete_folder':
                deleteFolder($db, $user, $input);
                break;
            case 'delete_file':
                deleteFile($db, $user, $input);
                break;
            default:
                errorResponse('Invalid action');
        }
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getFolders($db, $user) {
    try {
        $stmt = $db->prepare("
            SELECT f.*, COUNT(files.id) as file_count
            FROM hr_folders f
            LEFT JOIN hr_files files ON f.id = files.folder_id
            WHERE f.user_id = :user_id
            GROUP BY f.id
            ORDER BY f.created_at DESC
        ");
        
        $stmt->execute(['user_id' => $user['userId']]);
        $folders = $stmt->fetchAll();
        
        successResponse($folders);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function getFiles($db, $user) {
    $folderId = $_GET['folder_id'] ?? null;
    
    if (!$folderId) {
        errorResponse('Folder ID is required');
    }
    
    try {
        // Verify folder belongs to user
        $stmt = $db->prepare("SELECT id FROM hr_folders WHERE id = :folder_id AND user_id = :user_id");
        $stmt->execute(['folder_id' => $folderId, 'user_id' => $user['userId']]);
        if (!$stmt->fetch()) {
            errorResponse('Folder not found or access denied', 404);
        }
        
        $stmt = $db->prepare("
            SELECT * FROM hr_files
            WHERE folder_id = :folder_id
            ORDER BY created_at DESC
        ");
        
        $stmt->execute(['folder_id' => $folderId]);
        $files = $stmt->fetchAll();
        
        successResponse($files);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function createFolder($db, $user, $input) {
    $name = $input['name'] ?? '';
    
    if (empty($name)) {
        errorResponse('Folder name is required');
    }
    
    try {
        $stmt = $db->prepare("
            INSERT INTO hr_folders (user_id, name)
            VALUES (:user_id, :name)
        ");
        
        $stmt->execute([
            'user_id' => $user['userId'],
            'name' => $name
        ]);
        
        $folderId = $db->lastInsertId();
        
        successResponse(['id' => $folderId], 'Folder created successfully');
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            errorResponse('Folder with this name already exists');
        }
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function uploadFile($db, $user) {
    $folderId = $_POST['folder_id'] ?? null;
    
    if (!$folderId) {
        errorResponse('Folder ID is required');
    }
    
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        errorResponse('File upload is required');
    }
    
    $file = $_FILES['file'];
    
    // Check file size (max 100MB)
    if ($file['size'] > 100 * 1024 * 1024) {
        errorResponse('File size exceeds 100MB limit');
    }
    
    try {
        // Verify folder belongs to user
        $stmt = $db->prepare("SELECT id FROM hr_folders WHERE id = :folder_id AND user_id = :user_id");
        $stmt->execute(['folder_id' => $folderId, 'user_id' => $user['userId']]);
        if (!$stmt->fetch()) {
            errorResponse('Folder not found or access denied', 404);
        }
        
        // Create hr-center directory structure by user/year/month
        $year = date('Y');
        $month = date('m');
        $hrDir = __DIR__ . "/../uploads/hr-center/{$user['userId']}/{$year}/{$month}/";
        if (!file_exists($hrDir)) {
            mkdir($hrDir, 0755, true);
        }
        
        // Generate unique filename
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = 'hr_file_' . time() . '_' . uniqid() . '.' . $ext;
        $filepath = $hrDir . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            errorResponse('Failed to save file');
        }
        
        // Insert into database
        $stmt = $db->prepare("
            INSERT INTO hr_files (folder_id, user_id, original_name, filename, file_path, file_size)
            VALUES (:folder_id, :user_id, :original_name, :filename, :file_path, :file_size)
        ");
        
        $stmt->execute([
            'folder_id' => $folderId,
            'user_id' => $user['userId'],
            'original_name' => $file['name'],
            'filename' => $filename,
            'file_path' => "{$user['userId']}/{$year}/{$month}/{$filename}",
            'file_size' => $file['size']
        ]);
        
        $fileId = $db->lastInsertId();
        
        successResponse(['id' => $fileId], 'File uploaded successfully');
    } catch (PDOException $e) {
        // Clean up uploaded file on error
        if (isset($filepath) && file_exists($filepath)) {
            unlink($filepath);
        }
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function uploadFiles($db, $user) {
    $folderId = $_POST['folder_id'] ?? null;
    
    if (!$folderId) {
        errorResponse('Folder ID is required');
    }
    
    if (!isset($_FILES['files'])) {
        errorResponse('No files uploaded');
    }
    
    try {
        // Verify folder belongs to user
        $stmt = $db->prepare("SELECT id FROM hr_folders WHERE id = :folder_id AND user_id = :user_id");
        $stmt->execute(['folder_id' => $folderId, 'user_id' => $user['userId']]);
        if (!$stmt->fetch()) {
            errorResponse('Folder not found or access denied', 404);
        }
        
        // Create hr-center directory structure by user/year/month
        $year = date('Y');
        $month = date('m');
        $hrDir = __DIR__ . "/../uploads/hr-center/{$user['userId']}/{$year}/{$month}/";
        if (!file_exists($hrDir)) {
            mkdir($hrDir, 0755, true);
        }
        
        $uploadedFiles = [];
        $errors = [];
        $files = $_FILES['files'];
        $fileCount = count($files['name']);
        
        for ($i = 0; $i < $fileCount; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $file = [
                    'name' => $files['name'][$i],
                    'type' => $files['type'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'error' => $files['error'][$i],
                    'size' => $files['size'][$i]
                ];
                
                // Check file size (max 100MB)
                if ($file['size'] > 100 * 1024 * 1024) {
                    $errors[] = "File {$file['name']} exceeds 100MB limit";
                    continue;
                }
                
                // Generate unique filename
                $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                $filename = 'hr_file_' . time() . '_' . uniqid() . '.' . $ext;
                $filepath = $hrDir . $filename;
                
                // Move uploaded file
                if (move_uploaded_file($file['tmp_name'], $filepath)) {
                    // Insert into database
                    $stmt = $db->prepare("
                        INSERT INTO hr_files (folder_id, user_id, original_name, filename, file_path, file_size)
                        VALUES (:folder_id, :user_id, :original_name, :filename, :file_path, :file_size)
                    ");
                    
                    $stmt->execute([
                        'folder_id' => $folderId,
                        'user_id' => $user['userId'],
                        'original_name' => $file['name'],
                        'filename' => $filename,
                        'file_path' => "{$user['userId']}/{$year}/{$month}/{$filename}",
                        'file_size' => $file['size']
                    ]);
                    
                    $uploadedFiles[] = $db->lastInsertId();
                } else {
                    $errors[] = "Failed to save file {$file['name']}";
                }
            }
        }
        
        if (empty($uploadedFiles)) {
            errorResponse('No files were uploaded successfully. ' . implode(', ', $errors));
        }
        
        $message = count($uploadedFiles) . ' file(s) uploaded successfully';
        if (!empty($errors)) {
            $message .= '. Errors: ' . implode(', ', $errors);
        }
        
        successResponse(['ids' => $uploadedFiles], $message);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteFolder($db, $user, $input) {
    $folderId = $input['folder_id'] ?? null;
    
    if (!$folderId) {
        errorResponse('Folder ID is required');
    }
    
    try {
        // Verify folder belongs to user
        $stmt = $db->prepare("SELECT id FROM hr_folders WHERE id = :folder_id AND user_id = :user_id");
        $stmt->execute(['folder_id' => $folderId, 'user_id' => $user['userId']]);
        if (!$stmt->fetch()) {
            errorResponse('Folder not found or access denied', 404);
        }
        
        // Get all files in folder to delete them
        $stmt = $db->prepare("SELECT file_path FROM hr_files WHERE folder_id = :folder_id");
        $stmt->execute(['folder_id' => $folderId]);
        $files = $stmt->fetchAll();
        
        // Delete files from filesystem
        foreach ($files as $file) {
            $filepath = __DIR__ . '/../uploads/hr-center/' . $file['file_path'];
            if (file_exists($filepath)) {
                unlink($filepath);
            }
        }
        
        // Delete folder (files will be deleted by cascade)
        $stmt = $db->prepare("DELETE FROM hr_folders WHERE id = :folder_id AND user_id = :user_id");
        $stmt->execute(['folder_id' => $folderId, 'user_id' => $user['userId']]);
        
        successResponse(null, 'Folder deleted successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteFile($db, $user, $input) {
    $fileId = $input['file_id'] ?? null;
    
    if (!$fileId) {
        errorResponse('File ID is required');
    }
    
    try {
        // Get file info and verify ownership
        $stmt = $db->prepare("SELECT file_path FROM hr_files WHERE id = :file_id AND user_id = :user_id");
        $stmt->execute(['file_id' => $fileId, 'user_id' => $user['userId']]);
        $file = $stmt->fetch();
        
        if (!$file) {
            errorResponse('File not found or access denied', 404);
        }
        
        // Delete file from filesystem
        $filepath = __DIR__ . '/../uploads/hr-center/' . $file['file_path'];
        if (file_exists($filepath)) {
            unlink($filepath);
        }
        
        // Delete from database
        $stmt = $db->prepare("DELETE FROM hr_files WHERE id = :file_id AND user_id = :user_id");
        $stmt->execute(['file_id' => $fileId, 'user_id' => $user['userId']]);
        
        successResponse(null, 'File deleted successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// ==================== Admin Functions ====================

function getAdminFolders($db, $userId) {
    try {
        $stmt = $db->prepare("
            SELECT f.*, COUNT(hf.id) as file_count
            FROM hr_folders f
            LEFT JOIN hr_files hf ON f.id = hf.folder_id
            WHERE f.user_id = :user_id
            GROUP BY f.id
            ORDER BY f.created_at DESC
        ");
        $stmt->execute(['user_id' => $userId]);
        
        $folders = $stmt->fetchAll();
        successResponse($folders);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function getAdminFiles($db, $userId, $folderId = null) {
    try {
        if ($folderId) {
            $stmt = $db->prepare("
                SELECT * FROM hr_files 
                WHERE user_id = :user_id AND folder_id = :folder_id
                ORDER BY created_at DESC
            ");
            $stmt->execute(['user_id' => $userId, 'folder_id' => $folderId]);
        } else {
            $stmt = $db->prepare("
                SELECT * FROM hr_files 
                WHERE user_id = :user_id AND folder_id IS NULL
                ORDER BY created_at DESC
            ");
            $stmt->execute(['user_id' => $userId]);
        }
        
        $files = $stmt->fetchAll();
        successResponse($files);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
?>
