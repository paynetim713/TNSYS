
const ProfilePage = ({ 
  currentUser, 
  editingProfile, 
  setEditingProfile, 
  profileForm, 
  setProfileForm,
  handleUpdateProfile,
  handleAvatarUpload,
  apiCall,
  setSuccessMessage,
  setErrorMessage
}) => {
  const { useState } = React;
  
  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle change password
  const handleChangePassword = async () => {
    // Clear previous messages
    setPasswordError('');
    setPasswordSuccess('');
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await apiCall('/change-password.php', {
        method: 'POST',
        body: JSON.stringify(passwordForm)
      });
      
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header with Profile Title */}
          <div className="bg-gray-100 px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-700">Profile</h2>
          </div>
          
          {/* Profile Content */}
          <div className="p-6">
            {!editingProfile ? (
              // View Mode - Table Format
              <div>
                {/* Avatar Section */}
                <div className="flex items-center space-x-6 mb-6 pb-6 border-b">
                  <div className="relative">
                    <img 
                      src={getAvatarUrl(currentUser)} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full border-4 border-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentUser.name;
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{currentUser.name}</h3>
                    <p className="text-gray-600">{currentUser.email}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      currentUser.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {currentUser.role === 'admin' ? 'Administrator' : 'Employee'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mb-4">
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(true);
                      setProfileForm({
                        username: currentUser.username,
                        name: currentUser.name,
                        phone: currentUser.phone,
                        address: currentUser.address || currentUser.department,
                        rank: currentUser.rank || currentUser.role
                      });
                    }}
                    className="gradient-bg text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
                  >
                    Edit Profile
                  </button>
                </div>

                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 pr-8 text-gray-600 font-medium w-1/3">Last Login</td>
                      <td className="py-4 text-gray-800">{formatDate(currentUser.lastLogin || new Date().toISOString())}</td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-4 pr-8 text-gray-600 font-medium">Join Date</td>
                      <td className="py-4 text-gray-800">{formatDate(currentUser.created_at || currentUser.createdAt)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 pr-8 text-gray-600 font-medium">Username</td>
                      <td className="py-4 text-gray-800">{currentUser.username}</td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-4 pr-8 text-gray-600 font-medium">Agent Name</td>
                      <td className="py-4 text-gray-800">{currentUser.name}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 pr-8 text-gray-600 font-medium">Agent Code</td>
                      <td className="py-4 text-gray-800">{currentUser.employee_id || 'N/A'}</td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-4 pr-8 text-gray-600 font-medium">Agent Rank</td>
                      <td className="py-4 text-gray-800">{currentUser.rank || (currentUser.role === 'admin' ? 'System Administrator' : 'Agency Manager')}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 pr-8 text-gray-600 font-medium">Agent Contact</td>
                      <td className="py-4 text-gray-800">{currentUser.phone}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="py-4 pr-8 text-gray-600 font-medium">Agent Address</td>
                      <td className="py-4 text-gray-800">{currentUser.address || currentUser.department}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-4">
                {/* Avatar Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                  <div className="flex items-center space-x-4">
                    <img 
                      src={getAvatarUrl(currentUser)} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full border-2 border-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentUser.name;
                      }}
                    />
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
                      >
                        Upload New Photo
                      </label>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF (max 2MB)</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter username"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be your login username</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent Code</label>
                  <input
                    type="text"
                    value={currentUser.employee_id || 'N/A'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent Rank</label>
                  <input
                    type="text"
                    value={profileForm.rank}
                    onChange={(e) => setProfileForm({...profileForm, rank: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent Contact</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                    disabled={currentUser.role !== 'admin'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                      currentUser.role !== 'admin' 
                        ? 'bg-gray-50 cursor-not-allowed' 
                        : 'focus:ring-2 focus:ring-purple-500'
                    }`}
                  />
                  {currentUser.role !== 'admin' && (
                    <p className="text-xs text-gray-500 mt-1">Only administrators can change this field</p>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 gradient-bg text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileForm({});
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-container">
          <div className="modal-content" style={{maxWidth: '28rem'}}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
              <button 
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="space-y-4">
                {/* Error Message */}
                {passwordError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {passwordError}
                    </div>
                  </div>
                )}
                
                {/* Success Message */}
                {passwordSuccess && (
                  <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {passwordSuccess}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password *</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter current password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="flex space-x-3">
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
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