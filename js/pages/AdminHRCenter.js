
const AdminHRCenter = ({ 
  users 
}) => {
  const { useState, useEffect } = React;
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFolders, setUserFolders] = useState([]);
  const [userFiles, setUserFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadUserFolders = async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/hr-center.php?action=admin_folders&user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setUserFolders(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load user folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserFiles = async (userId, folderId = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const folderParam = folderId ? `&folder_id=${folderId}` : '';
      const response = await fetch(`/api/hr-center.php?action=admin_files&user_id=${userId}${folderParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setUserFiles(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load user files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setCurrentFolder(null);
    loadUserFolders(user.id);
    loadUserFiles(user.id);
  };

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
    loadUserFiles(selectedUser.id, folder.id);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📋';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov': return '🎬';
      case 'zip':
      case 'rar': return '📦';
      default: return '📄';
    }
  };

  return (
    <div className="w-full px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin HR Center</h2>
        <p className="text-gray-500 mt-1">View and manage all users' HR files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-4 h-fit">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select User</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {users.filter(user => user.role === 'employee').map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedUser?.id === user.id
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={getAvatarUrl(user)}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.department || 'No Department'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User's Files */}
        <div className="lg:col-span-3">
          {selectedUser ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}`}
                    alt=""
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedUser.department || 'No Department'} • {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              {currentFolder && (
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setCurrentFolder(null);
                        loadUserFiles(selectedUser.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      ← Back to Root
                    </button>
                    <span className="text-gray-400">/</span>
                    <span className="text-sm font-medium text-gray-700">{currentFolder.name}</span>
                  </div>
                </div>
              )}

              {/* Folders */}
              {!currentFolder && userFolders.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Folders</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition cursor-pointer"
                        onClick={() => handleFolderClick(folder)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-800">{folder.name}</h5>
                            <p className="text-sm text-gray-500">{folder.file_count || 0} files</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  {currentFolder ? `Files in "${currentFolder.name}"` : 'Files'}
                </h4>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading...</p>
                  </div>
                ) : userFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
                    </div>
                    <h5 className="text-lg font-semibold text-gray-600 mb-2">No Files</h5>
                    <p className="text-gray-500">No files found in this location</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userFiles.map((file) => (
                      <div key={file.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <div className="w-4 h-4 bg-gray-400 rounded"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-800 text-sm break-words" title={file.original_name}>
                              {file.original_name}
                            </h5>
                            <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(file.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <a
                            href={`/uploads/hr-center/${selectedUser.id}/${file.file_path}`}
                            download
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a User</h3>
              <p className="text-gray-500">Choose a user from the left panel to view their HR files</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
