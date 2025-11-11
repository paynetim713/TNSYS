// Add User Page - For Admin to manually add users
const AddUserPage = ({ 
  currentUser, 
  setSuccessMessage,
  setErrorMessage,
  refreshUsers,
  apiCall
}) => {
  const { useState, useEffect } = React;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    employee_id: '',
    role: 'employee',
    password: '',
    confirmPassword: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  
  // 关闭弹窗时清除本地状态
  const handleCloseModal = () => {
    setShowAddModal(false);
    setLocalError('');
    setLocalSuccess('');
  };
  
  // 处理输入变化时清除错误消息
  const handleInputChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
    if (localError) {
      setLocalError('');
    }
  };
  
  // 获取部门数据
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch('/api/departments.php');
        const result = await response.json();
        if (result.success) {
          setDepartments(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load departments:', error);
      }
    };
    
    loadDepartments();
  }, []);
  
  // 自动生成Employee ID
  const generateEmployeeId = async (role) => {
    try {
      const response = await fetch('/api/users.php?stats=true');
      const result = await response.json();
      
      if (result.success) {
        const stats = result.data;
        const prefix = role === 'admin' ? 'ADM' : 'EMP';
        
        // 使用总用户数 + 1 来生成下一个ID，确保唯一性
        const totalUsers = stats.totalEmployees || 0;
        const nextId = `${prefix}${String(totalUsers + 1).padStart(3, '0')}`;
        
        setNewUser(prev => ({ ...prev, employee_id: nextId }));
      }
    } catch (error) {
      console.error('Failed to generate employee ID:', error);
      // 如果API失败，使用时间戳作为后备方案
      const timestamp = Date.now().toString().slice(-3);
      const prefix = role === 'admin' ? 'ADM' : 'EMP';
      setNewUser(prev => ({ ...prev, employee_id: `${prefix}${timestamp}` }));
    }
  };
  
  // 当角色改变时自动生成Employee ID
  const handleRoleChange = (role) => {
    setNewUser(prev => ({ ...prev, role }));
    generateEmployeeId(role);
  };
  
  // ==================== 添加用户 ====================
  const handleAddUser = async () => {
    // 清除之前的错误和成功消息
    setLocalError('');
    setLocalSuccess('');
    
    // 验证表单
    if (!newUser.name || !newUser.email || !newUser.password) {
      setLocalError('Please fill in all required fields');
      return;
    }
    
    if (newUser.password !== newUser.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    
    if (newUser.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await apiCall('/users.php', {
        method: 'POST',
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          department: newUser.department,
          employee_id: newUser.employee_id,
          role: newUser.role,
          password: newUser.password
        })
      });
      
      // 重置表单
      setNewUser({
        name: '',
        email: '',
        phone: '',
        department: '',
        employee_id: '',
        role: 'employee',
        password: '',
        confirmPassword: ''
      });
      setLocalSuccess('User added successfully');
      setTimeout(() => {
        setLocalSuccess('');
        setShowAddModal(false);
      }, 2000);
      
      // 刷新用户列表
      refreshUsers();
    } catch (error) {
      setLocalError(error.message || 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 生成随机密码
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser({...newUser, password, confirmPassword: password});
  };
  
  return (
    <div className="w-full px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Add New User</h2>
          <p className="text-gray-500 mt-1">Manually add new users to the system</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="gradient-bg text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-lg flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add User</span>
        </button>
      </div>
      
      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-container">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800">Add New User</h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              {/* 错误和成功消息 */}
              {localError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 font-medium">{localError}</span>
                  </div>
                </div>
              )}
              
              {localSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-700 font-medium">{localSuccess}</span>
                  </div>
                </div>
              )}
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={newUser.employee_id}
                      onChange={(e) => setNewUser({...newUser, employee_id: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      placeholder="Auto-generated based on role"
                      readOnly
                    />
                  
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Account Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Account Settings</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                  
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Generate random password"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={newUser.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>
              </div>
              
            </div>
            
            <div className="modal-footer">
              <div className="flex space-x-3">
                <button
                  onClick={handleAddUser}
                  disabled={isSubmitting}
                  className="flex-1 gradient-bg text-white py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Adding User...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add User</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
