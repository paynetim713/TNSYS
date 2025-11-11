const HRCenter = ({ 
  currentUser 
}) => {
  const { useState, useEffect } = React;
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  
  useEffect(() => {
    loadFolders();
    if (currentFolder) {
      loadFiles(currentFolder.id);
    }
  }, [currentFolder]);

  const loadFolders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/hr-center.php?action=folders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setFolders(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadFiles = async (folderId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/hr-center.php?action=files&folder_id=${folderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setFiles(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter folder name');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/hr-center.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_folder',
          name: newFolderName
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowCreateFolderModal(false);
        setNewFolderName('');
        loadFolders();
        alert('Folder created successfully');
      } else {
        alert('Failed to create: ' + result.error);
      }
    } catch (error) {
      alert('Failed to create: ' + error.message);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const previews = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      
      setUploadFiles(files);
      setFilePreviews(previews);
    }
  };

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0 || !currentFolder) {
      alert('Please select files and folder');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('action', 'upload_files');
      formData.append('folder_id', currentFolder.id);
    
      uploadFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/hr-center.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();
      if (result.success) {
        setShowUploadModal(false);
        setUploadFiles([]);
        setFilePreviews([]);
        loadFiles(currentFolder.id);
        alert(`${uploadFiles.length} file(s) uploaded successfully`);
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/hr-center.php', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete_file',
          file_id: fileId
        })
      });

      const result = await response.json();
      if (result.success) {
        loadFiles(currentFolder.id);
        alert('File deleted successfully');
      } else {
        alert('Delete failed: ' + result.error);
      }
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder? All files in the folder will also be deleted.')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/hr-center.php', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete_folder',
          folder_id: folderId
        })
      });

      const result = await response.json();
      if (result.success) {
        if (currentFolder && currentFolder.id === folderId) {
          setCurrentFolder(null);
          setFiles([]);
        }
        loadFolders();
        alert('Folder deleted successfully');
      } else {
        alert('Delete failed: ' + result.error);
      }
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) {
      return (
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        </svg>
      );
    }

    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
          </svg>
        );
      case 'xls':
      case 'xlsx':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
          </svg>
        );
      case 'ppt':
      case 'pptx':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
          </svg>
        );
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
          </svg>
        );
      case 'zip':
      case 'rar':
      case '7z':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
          </svg>
        );
    }
  };


  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <h2 className="text-2xl font-bold text-gray-800">HR Center</h2>
            {currentFolder && (
              <button
                onClick={() => setCurrentFolder(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to Home</span>
              </button>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            {currentFolder ? `Files in "${currentFolder.name}"` : 'Personal File Management Center'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition text-sm"
          >
            <span className="hidden sm:inline">Create Folder</span>
            <span className="sm:hidden">Folder</span>
          </button>
          {currentFolder && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="gradient-bg text-white px-4 md:px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-lg flex items-center space-x-2 whitespace-nowrap"
            >
              <div className="w-4 h-4"></div>
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button
                onClick={() => setCurrentFolder(null)}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                Home
              </button>
            </li>
            {currentFolder && (
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-sm font-medium text-gray-500">{currentFolder.name}</span>
                </div>
              </li>
            )}
          </ol>
        </nav>
      </div>

      {/* Folders and Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Folders - only show in root directory */}
        {!currentFolder && folders.map((folder) => (
          <div
            key={folder.id}
            className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition cursor-pointer"
            onClick={() => setCurrentFolder(folder)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 truncate">{folder.name}</h4>
                  <p className="text-sm text-gray-500">{folder.file_count || 0} files</p>
                </div>
              </div>
              {currentUser.role === 'admin' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Created: {new Date(folder.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}

        {/* Files */}
        {currentFolder && files.map((file) => (
          <div key={file.id} className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-5 hover:shadow-xl hover:border-purple-200 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1 min-w-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.filename)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 break-words text-base leading-tight mb-2" title={file.original_name}>
                    {file.original_name}
                  </h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 px-2 py-1 rounded-full">
                      {formatFileSize(file.file_size)}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteFile(file.id)}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg flex-shrink-0 ml-2"
                title="Delete file"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Uploaded {new Date(file.created_at).toLocaleDateString()}
              </div>
              <a
                href={`/uploads/hr-center/${file.file_path}`}
                download
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
                <span>Download</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!currentFolder && folders.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-3">No Folders Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Create your first folder to organize your files and get started with HR Center</p>
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-700 transition-opacity shadow-lg"
          >
            Create Your First Folder
          </button>
        </div>
      )}

      {currentFolder && files.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-3">No Files in "{currentFolder.name}"</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Upload your first file to this folder to start organizing your documents</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="gradient-bg text-white px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
          >
            Upload Your First File
          </button>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="modal-container">
          <div className="modal-content" style={{maxWidth: '28rem'}}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800">Create Folder</h3>
              <button 
                onClick={() => setShowCreateFolderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Folder Name *</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter folder name"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateFolder}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Create Folder
                </button>
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && currentFolder && (
        <div className="modal-container">
          <div className="modal-content" style={{maxWidth: '28rem'}}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800">Upload Files</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload to: {currentFolder.name}</label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Files *</label>
                  <div 
                    className="upload-area rounded-lg p-6 text-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-purple-500 transition"
                    onClick={() => document.getElementById('hr-file-input').click()}
                  >
                    {filePreviews.length > 0 ? (
                      <div>
                        <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-green-600 font-medium">{filePreviews.length} file(s) selected</p>
                        <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                          {filePreviews.map((file, index) => (
                            <p key={index} className="text-xs text-gray-600">{file.name}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                        </div>
                        <p className="text-gray-600">Click to upload files</p>
                        <p className="text-xs text-gray-500 mt-1">Supports multiple files, all file types</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="hr-file-input"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                {isUploading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">Uploading...</span>
                      <span className="text-sm text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{width: `${uploadProgress}%`}}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="flex space-x-3">
                <button
                  onClick={handleUploadFiles}
                  disabled={isUploading || uploadFiles.length === 0}
                  className="flex-1 gradient-bg text-white py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : `Upload ${uploadFiles.length} File(s)`}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                    setFilePreviews([]);
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
