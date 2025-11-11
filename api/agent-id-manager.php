<?php
require_once '../config/config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'get_next_agent_id') {
            getNextAvailableAgentId($db);
        } else {
            errorResponse('Invalid action', 400);
        }
        break;
        
    case 'POST':
        if (isset($_POST['action']) && $_POST['action'] === 'assign_agent_id') {
            assignAgentId($db);
        } else {
            errorResponse('Invalid action', 400);
        }
        break;
        
    default:
        errorResponse('Method not allowed', 405);
}

function getNextAvailableAgentId($db) {
    try {
        // 获取所有当前员工的Agent ID
        $stmt = $db->query("SELECT employee_id FROM users WHERE role = 'employee' AND employee_id IS NOT NULL AND employee_id != '' ORDER BY employee_id");
        $currentAgentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // 获取所有已terminate员工的Agent ID
        $stmt = $db->query("SELECT employee_id FROM user_terminations WHERE employee_id IS NOT NULL AND employee_id != '' ORDER BY employee_id");
        $terminatedAgentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // 合并所有已使用的Agent ID
        $allUsedIds = array_merge($currentAgentIds, $terminatedAgentIds);
        $allUsedIds = array_unique($allUsedIds);
        sort($allUsedIds);
        
        // 优先返回可回收的Agent ID（已terminate的）
        $recyclableIds = array_diff($terminatedAgentIds, $currentAgentIds);
        if (!empty($recyclableIds)) {
            $nextId = reset($recyclableIds); // 返回第一个可回收的ID
            successResponse([
                'agent_id' => $nextId,
                'is_recycled' => true,
                'recyclable_ids' => array_values($recyclableIds)
            ], 'Found recyclable Agent ID');
            return;
        }
        
        // 如果没有可回收的，分配新的
        $nextId = 1;
        while (true) {
            $candidateId = 'EMP' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
            if (!in_array($candidateId, $allUsedIds)) {
                break;
            }
            $nextId++;
        }
        
        successResponse([
            'agent_id' => $candidateId,
            'is_recycled' => false,
            'recyclable_ids' => []
        ], 'Generated new Agent ID');
        
    } catch (Exception $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

function assignAgentId($db) {
    $userId = $_POST['user_id'] ?? null;
    
    if (!$userId) {
        errorResponse('User ID is required', 400);
    }
    
    try {
        // 获取下一个可用的Agent ID
        $stmt = $db->query("SELECT employee_id FROM users WHERE role = 'employee' AND employee_id IS NOT NULL AND employee_id != '' ORDER BY employee_id");
        $currentAgentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $stmt = $db->query("SELECT employee_id FROM user_terminations WHERE employee_id IS NOT NULL AND employee_id != '' ORDER BY employee_id");
        $terminatedAgentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $allUsedIds = array_merge($currentAgentIds, $terminatedAgentIds);
        $allUsedIds = array_unique($allUsedIds);
        
        // 优先使用可回收的ID
        $recyclableIds = array_diff($terminatedAgentIds, $currentAgentIds);
        $agentId = null;
        $isRecycled = false;
        
        if (!empty($recyclableIds)) {
            $agentId = reset($recyclableIds);
            $isRecycled = true;
        } else {
            // 分配新的ID
            $nextId = 1;
            while (true) {
                $candidateId = 'EMP' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
                if (!in_array($candidateId, $allUsedIds)) {
                    $agentId = $candidateId;
                    break;
                }
                $nextId++;
            }
        }
        
        // 更新用户的Agent ID
        $stmt = $db->prepare("UPDATE users SET employee_id = :agent_id WHERE id = :user_id");
        $stmt->execute([
            'agent_id' => $agentId,
            'user_id' => $userId
        ]);
        
        successResponse([
            'agent_id' => $agentId,
            'is_recycled' => $isRecycled
        ], 'Agent ID assigned successfully');
        
    } catch (Exception $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

// 使用config.php中已有的successResponse和errorResponse函数
?>
