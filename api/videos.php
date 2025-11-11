<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'categories') {
            getVideoCategories($db);
        } elseif (isset($_GET['id'])) {
            getVideo($db, $_GET['id']);
        } elseif (isset($_GET['stream'])) {
            streamVideo($_GET['stream']);
        } else {
            getAllVideos($db);
        }
        break;
        
    case 'POST':
        $user = requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? $_POST['action'] ?? '';
        
        if ($action === 'add_category') {
            addVideoCategory($db, $input);
        } else {
            createVideo($db, $user);
        }
        break;
        
    case 'PUT':
        $user = requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'update_category') {
            updateVideoCategory($db, $input);
        } else {
            if (!isset($_GET['id'])) {
                errorResponse('Video ID is required');
            }
            updateVideo($db, $_GET['id']);
        }
        break;
        
    case 'DELETE':
        $user = requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'delete_category') {
            deleteVideoCategory($db, $input);
        } else {
            if (!isset($_GET['id'])) {
                errorResponse('Video ID is required');
            }
            deleteVideo($db, $_GET['id']);
        }
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getAllVideos($db) {
    try {
        $stmt = $db->query("SELECT * FROM videos ORDER BY display_order ASC, id ASC");
        $videos = $stmt->fetchAll();
        
        // 根据video_path添加hasVideo标志，并处理thumbnail URL
        foreach ($videos as &$video) {
            $video['hasVideo'] = !empty($video['video_path']) && file_exists(VIDEO_DIR . $video['video_path']);
            $video['order'] = $video['display_order'];
            // 将thumbnail路径转换为完整URL
            if (!empty($video['thumbnail'])) {
                $video['thumbnail'] = getFullThumbnailUrl($video['thumbnail']);
            }
        }
        
        successResponse($videos);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function getVideo($db, $id) {
    try {
        $stmt = $db->prepare("SELECT * FROM videos WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $video = $stmt->fetch();
        
        if (!$video) {
            errorResponse('Video not found', 404);
        }
        
        $video['hasVideo'] = !empty($video['video_path']) && file_exists(VIDEO_DIR . $video['video_path']);
        // 将thumbnail路径转换为完整URL
        if (!empty($video['thumbnail'])) {
            $video['thumbnail'] = getFullThumbnailUrl($video['thumbnail']);
        }
        successResponse($video);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function createVideo($db, $user) {
    // 处理multipart/form-data
    $title = $_POST['title'] ?? '';
    $category = $_POST['category'] ?? '';
    $section = $_POST['section'] ?? '';
    $module = $_POST['module'] ?? '';
    $duration = $_POST['duration'] ?? '';
    $description = $_POST['description'] ?? '';
    
    if (empty($title) || empty($category) || empty($section) || empty($module)) {
        errorResponse('Title, category, section, and module are required');
    }
    
    $thumbnailPath = null;
    $videoPath = null;
    $fileSize = null;
    
    try {
        // 处理缩略图上传
        if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
            $thumbnail = $_FILES['thumbnail'];
            if ($thumbnail['size'] > MAX_THUMBNAIL_SIZE) {
                errorResponse('Thumbnail size exceeds 5MB limit');
            }
            
            $ext = strtolower(pathinfo($thumbnail['name'], PATHINFO_EXTENSION));
            $allowedExts = ['jpg', 'jpeg', 'png', 'gif'];
            if (!in_array($ext, $allowedExts)) {
                errorResponse('Invalid thumbnail format');
            }
            
            $thumbnailPath = 'thumb_' . time() . '_' . uniqid() . '.' . $ext;
            move_uploaded_file($thumbnail['tmp_name'], THUMBNAIL_DIR . $thumbnailPath);
        }
        
        // 处理视频上传
        if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
            $video = $_FILES['video'];
            if ($video['size'] > MAX_VIDEO_SIZE) {
                errorResponse('Video size exceeds 500MB limit');
            }
            
            $ext = strtolower(pathinfo($video['name'], PATHINFO_EXTENSION));
            $allowedExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
            if (!in_array($ext, $allowedExts)) {
                errorResponse('Invalid video format');
            }
            
            $videoPath = 'video_' . time() . '_' . uniqid() . '.' . $ext;
            move_uploaded_file($video['tmp_name'], VIDEO_DIR . $videoPath);
            $fileSize = round($video['size'] / (1024 * 1024), 2); // Convert to MB
        }
        
        // 插入数据库
        $stmt = $db->prepare("
            INSERT INTO videos (title, duration, category, section, module, description, thumbnail, video_path, file_size)
            VALUES (:title, :duration, :category, :section, :module, :description, :thumbnail, :video_path, :file_size)
        ");
        
        $stmt->execute([
            'title' => $title,
            'duration' => $duration ?: 'TBD',
            'category' => $category,
            'section' => $section,
            'module' => $module,
            'description' => $description ?: 'No description',
            'thumbnail' => $thumbnailPath ? ('uploads/thumbnails/' . $thumbnailPath) : './js/components/logo/ACA Thumbnail.jpeg',
            'video_path' => $videoPath,
            'file_size' => $fileSize
        ]);
        
        $videoId = $db->lastInsertId();
        
        // 重置module编号以避免重复
        resetModuleNumbers($db, $section);
        
        successResponse(['id' => $videoId], 'Video created successfully');
    } catch (PDOException $e) {
        // 出错时清理上传的文件
        if ($thumbnailPath && file_exists(THUMBNAIL_DIR . $thumbnailPath)) {
            unlink(THUMBNAIL_DIR . $thumbnailPath);
        }
        if ($videoPath && file_exists(VIDEO_DIR . $videoPath)) {
            unlink(VIDEO_DIR . $videoPath);
        }
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function updateVideo($db, $id) {
    // 从JSON读取（不再支持文件上传）
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = [];
    }
    
    // 禁止上传视频文件和封面
    if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        errorResponse('Video file cannot be updated. Please delete and re-upload if you need to change it.');
    }
    if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
        errorResponse('Thumbnail cannot be updated. Please delete and re-upload if you need to change it.');
    }
    
    try {
        $stmt = $db->prepare("SELECT * FROM videos WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $video = $stmt->fetch();
        
        if (!$video) {
            errorResponse('Video not found', 404);
        }
        
        $fields = [];
        $params = ['id' => $id];
        
        // 只允许更新文本字段，不允许更新封面和视频文件
        if (array_key_exists('title', $input)) {
            $fields[] = "title = :title";
            $params['title'] = $input['title'];
        }
        if (array_key_exists('duration', $input)) {
            $fields[] = "duration = :duration";
            $params['duration'] = $input['duration'];
        }
        if (array_key_exists('category', $input)) {
            $fields[] = "category = :category";
            $params['category'] = $input['category'];
        }
        if (array_key_exists('section', $input)) {
            $fields[] = "section = :section";
            $params['section'] = $input['section'];
        }
        if (array_key_exists('module', $input)) {
            $fields[] = "module = :module";
            $params['module'] = $input['module'];
        }
        if (array_key_exists('description', $input)) {
            $fields[] = "description = :description";
            $params['description'] = $input['description'];
        }
        
        if (empty($fields)) {
            errorResponse('No fields to update');
        }
        
        $sql = "UPDATE videos SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        // 如果更新了section或module，重置module编号
        $targetSection = isset($input['section']) ? $input['section'] : $video['section'];
        resetModuleNumbers($db, $targetSection);
        
        successResponse(null, 'Video updated successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteVideo($db, $id) {
    try {
        $stmt = $db->prepare("SELECT video_path, thumbnail FROM videos WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $video = $stmt->fetch();
        
        if (!$video) {
            errorResponse('Video not found', 404);
        }
        
        // 删除文件
        if ($video['video_path'] && file_exists(VIDEO_DIR . basename($video['video_path']))) {
            unlink(VIDEO_DIR . basename($video['video_path']));
        }
        if ($video['thumbnail'] && strpos($video['thumbnail'], 'uploads') !== false) {
            // 处理路径格式：移除开头的../（如果有）
            $thumbnailPath = strpos($video['thumbnail'], '../') === 0 
                ? substr($video['thumbnail'], 3)
                : $video['thumbnail'];
            $thumbPath = __DIR__ . '/../' . $thumbnailPath;
            if (file_exists($thumbPath)) {
                unlink($thumbPath);
            }
        }
        
        // 从数据库删除
        $stmt = $db->prepare("DELETE FROM videos WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        successResponse(null, 'Video deleted successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function streamVideo($filename) {
    $filepath = VIDEO_DIR . basename($filename);
    
    if (!file_exists($filepath)) {
        errorResponse('Video file not found', 404);
    }
    
    // Set headers for video streaming
    header('Content-Type: video/mp4');
    header('Content-Length: ' . filesize($filepath));
    header('Accept-Ranges: bytes');
    
    // Handle range requests for seeking
    if (isset($_SERVER['HTTP_RANGE'])) {
        rangeDownload($filepath);
    } else {
        readfile($filepath);
    }
    exit();
}

function rangeDownload($file) {
    $size = filesize($file);
    $length = $size;
    $start = 0;
    $end = $size - 1;
    
    if (isset($_SERVER['HTTP_RANGE'])) {
        $c_start = $start;
        $c_end = $end;
        
        list(, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
        
        if (strpos($range, ',') !== false) {
            header('HTTP/1.1 416 Requested Range Not Satisfiable');
            header("Content-Range: bytes $start-$end/$size");
            exit();
        }
        
        if ($range == '-') {
            $c_start = $size - substr($range, 1);
        } else {
            $range = explode('-', $range);
            $c_start = $range[0];
            $c_end = (isset($range[1]) && is_numeric($range[1])) ? $range[1] : $size;
        }
        
        $c_end = ($c_end > $end) ? $end : $c_end;
        
        if ($c_start > $c_end || $c_start > $size - 1 || $c_end >= $size) {
            header('HTTP/1.1 416 Requested Range Not Satisfiable');
            header("Content-Range: bytes $start-$end/$size");
            exit();
        }
        
        $start = $c_start;
        $end = $c_end;
        $length = $end - $start + 1;
        
        header('HTTP/1.1 206 Partial Content');
    }
    
    header("Content-Range: bytes $start-$end/$size");
    header("Content-Length: $length");
    
    $buffer = 1024 * 8;
    $fp = fopen($file, 'rb');
    fseek($fp, $start);
    
    while (!feof($fp) && ($p = ftell($fp)) <= $end) {
        if ($p + $buffer > $end) {
            $buffer = $end - $p + 1;
        }
        echo fread($fp, $buffer);
        flush();
    }
    
    fclose($fp);
}

// ==================== Get Video Categories ====================
function getVideoCategories($db) {
    try {
        $stmt = $db->query("
            SELECT name 
            FROM video_categories 
            ORDER BY name
        ");
        
        $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        successResponse($categories);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function addVideoCategory($db, $input) {
    $name = $input['name'] ?? '';
    
    if (empty($name)) {
        errorResponse('Category name is required');
    }
    
    try {
        // Check if category already exists
        $stmt = $db->prepare("SELECT COUNT(*) FROM video_categories WHERE name = ?");
        $stmt->execute([$name]);
        if ($stmt->fetchColumn() > 0) {
            errorResponse('Category already exists');
        }
        
        // Insert new category
        $stmt = $db->prepare("INSERT INTO video_categories (name) VALUES (?)");
        $stmt->execute([$name]);
        
        successResponse(['name' => $name], 'Category added successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function updateVideoCategory($db, $input) {
    $oldName = $input['old_name'] ?? '';
    $newName = $input['new_name'] ?? '';
    
    if (empty($oldName) || empty($newName)) {
        errorResponse('Old name and new name are required');
    }
    
    if ($oldName === $newName) {
        errorResponse('New name must be different from old name');
    }
    
    try {
        $db->beginTransaction();
        
        // Check if new category name already exists
        $stmt = $db->prepare("SELECT COUNT(*) FROM video_categories WHERE name = ?");
        $stmt->execute([$newName]);
        if ($stmt->fetchColumn() > 0) {
            $db->rollBack();
            errorResponse('Category name already exists');
        }
        
        // Update category in video_categories table
        $stmt = $db->prepare("UPDATE video_categories SET name = ? WHERE name = ?");
        $stmt->execute([$newName, $oldName]);
        
        if ($stmt->rowCount() === 0) {
            $db->rollBack();
            errorResponse('Category not found');
        }
        
        // Update category in videos table
        $stmt = $db->prepare("UPDATE videos SET category = ? WHERE category = ?");
        $stmt->execute([$newName, $oldName]);
        
        $db->commit();
        successResponse(['old_name' => $oldName, 'new_name' => $newName], 'Category updated successfully');
    } catch (PDOException $e) {
        $db->rollBack();
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteVideoCategory($db, $input) {
    $name = $input['name'] ?? '';
    
    if (empty($name)) {
        errorResponse('Category name is required');
    }
    
    try {
        $db->beginTransaction();
        
        // Remove category from all videos
        $stmt = $db->prepare("UPDATE videos SET category = NULL WHERE category = ?");
        $stmt->execute([$name]);
        
        // Delete category from video_categories table
        $stmt = $db->prepare("DELETE FROM video_categories WHERE name = ?");
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

/**
 * 重置指定section下的module编号，避免重复
 * 如果检测到重复的module名称，按视频顺序重新编号为"Module 01", "Module 02"等
 */
function resetModuleNumbers($db, $section) {
    try {
        // 获取该section下的所有视频，按id排序
        $stmt = $db->prepare("
            SELECT id, module 
            FROM videos 
            WHERE section = :section 
            ORDER BY id ASC
        ");
        $stmt->execute(['section' => $section]);
        $videos = $stmt->fetchAll();
        
        if (empty($videos)) {
            return;
        }
        
        // 统计每个module出现的次数
        $moduleCounts = [];
        foreach ($videos as $video) {
            $moduleName = $video['module'] ?? '';
            if (!isset($moduleCounts[$moduleName])) {
                $moduleCounts[$moduleName] = 0;
            }
            $moduleCounts[$moduleName]++;
        }
        
        // 检查是否有重复的module
        $hasDuplicates = false;
        foreach ($moduleCounts as $count) {
            if ($count > 1) {
                $hasDuplicates = true;
                break;
            }
        }
        
        // 如果有重复，按视频顺序重新编号
        if ($hasDuplicates) {
            $db->beginTransaction();
            
            $moduleIndex = 1;
            foreach ($videos as $video) {
                $newModuleName = 'Module ' . str_pad($moduleIndex, 2, '0', STR_PAD_LEFT);
                
                $updateStmt = $db->prepare("
                    UPDATE videos 
                    SET module = :new_module 
                    WHERE id = :id
                ");
                $updateStmt->execute([
                    'id' => $video['id'],
                    'new_module' => $newModuleName
                ]);
                
                $moduleIndex++;
            }
            
            $db->commit();
        }
    } catch (PDOException $e) {
        if (isset($db) && $db->inTransaction()) {
            $db->rollBack();
        }
        // 静默失败，不影响主流程
        error_log('Failed to reset module numbers: ' . $e->getMessage());
    }
}
?>