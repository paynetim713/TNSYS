<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

ensureDepartmentsTable($db);

switch ($method) {
    case 'GET':
        getDepartments($db);
        break;
    case 'POST':
        createDepartment($db);
        break;
    case 'PUT':
        updateDepartment($db);
        break;
    case 'DELETE':
        deleteDepartment($db);
        break;
    default:
        errorResponse('Method not allowed', 405);
}

function ensureDepartmentsTable(PDO $db): void {
    $sql = "
        CREATE TABLE IF NOT EXISTS departments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description VARCHAR(255) NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($sql);
}

function getDepartments(PDO $db): void {
    try {
        $stmt = $db->query("SELECT id, name, description, is_active, created_at, updated_at FROM departments ORDER BY name ASC");
        $rows = $stmt->fetchAll();

        // 如果部门表为空，自动从 users 表同步去重的部门名称
        if (!$rows || count($rows) === 0) {
            $distinct = $db->query("SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department <> '' ORDER BY department ASC")->fetchAll(PDO::FETCH_COLUMN);
            if ($distinct && count($distinct) > 0) {
                $insert = $db->prepare("INSERT IGNORE INTO departments (name, description, is_active) VALUES (:name, '', 1)");
                foreach ($distinct as $deptName) {
                    $insert->execute(['name' => $deptName]);
                }
                // 重新读取
                $stmt = $db->query("SELECT id, name, description, is_active, created_at, updated_at FROM departments ORDER BY name ASC");
                $rows = $stmt->fetchAll();
            }
        }
        successResponse($rows);
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function createDepartment(PDO $db): void {
    $user = getCurrentUser();
    if (!$user || $user['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    if ($name === '') {
        errorResponse('Department name is required', 400);
    }
    try {
        $stmt = $db->prepare("INSERT INTO departments (name, description) VALUES (:name, :description)");
        $stmt->execute(['name' => $name, 'description' => $description]);
        successResponse(['id' => (int)$db->lastInsertId()], 'Department created');
    } catch (PDOException $e) {
        if ((int)$e->getCode() === 23000) {
            errorResponse('Department name already exists', 409);
        }
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function updateDepartment(PDO $db): void {
    $user = getCurrentUser();
    if (!$user || $user['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $id = (int)($input['id'] ?? 0);
    if ($id <= 0) {
        errorResponse('Department ID is required', 400);
    }
    $fields = [];
    $params = ['id' => $id];
    if (isset($input['name'])) { $fields[] = 'name = :name'; $params['name'] = trim($input['name']); }
    if (isset($input['description'])) { $fields[] = 'description = :description'; $params['description'] = trim($input['description']); }
    if (isset($input['is_active'])) { $fields[] = 'is_active = :is_active'; $params['is_active'] = (int)!!$input['is_active']; }
    if (empty($fields)) {
        errorResponse('No fields to update', 400);
    }
    $sql = 'UPDATE departments SET ' . implode(', ', $fields) . ' WHERE id = :id';
    try {
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        successResponse(null, 'Department updated');
    } catch (PDOException $e) {
        if ((int)$e->getCode() === 23000) {
            errorResponse('Department name already exists', 409);
        }
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function deleteDepartment(PDO $db): void {
    $user = getCurrentUser();
    if (!$user || $user['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        errorResponse('Department ID is required', 400);
    }
    try {
        // Fetch department name first
        $get = $db->prepare('SELECT name FROM departments WHERE id = :id');
        $get->execute(['id' => $id]);
        $dept = $get->fetch(PDO::FETCH_ASSOC);

        // Delete department
        $stmt = $db->prepare('DELETE FROM departments WHERE id = :id');
        $stmt->execute(['id' => $id]);

        // If there are users who had this department, clear it
        if ($dept && !empty($dept['name'])) {
            $clear = $db->prepare('UPDATE users SET department = NULL WHERE department = :name');
            $clear->execute(['name' => $dept['name']]);
        }
        successResponse(null, 'Department deleted');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

?>


