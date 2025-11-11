const ResourceCenter = ({ 
  currentUser 
}) => {
  const { useState, useEffect } = React;
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newResourceForm, setNewResourceForm] = useState({
    title: '',
    description: '',
    category: '',
    file: null,
    filePreview: null
  });
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadResources();
    loadCategories();
    loadFolders();
  }, []);

  useEffect(() => {
    loadResources();
  }, [currentFolder]);

  const loadResources = async () => {
    try {
      const token = localStorage.getItem('authToken');
      let url = '/api/resources.php';
      if (currentFolder) {
        url += `?folder_id=${currentFolder.id}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setResources(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources.php?action=categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources.php?action=folders', {
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



  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter folder name');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add_folder',
          name: newFolderName
        })
      });

      const result = await response.json();
      if (result.success) {
        setNewFolderName('');
        setShowAddFolderModal(false);
        loadFolders();
        alert('Folder created successfully');
      } else {
        alert('Failed to create folder: ' + result.error);
      }
    } catch (error) {
      alert('Failed to create folder: ' + error.message);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder? All files in this folder will be moved to the root directory.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources.php', {
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
        loadFolders();
        loadResources();
        if (currentFolder && currentFolder.id === folderId) {
          setCurrentFolder(null);
        }
        alert('Folder deleted successfully');
      } else {
        alert('Failed to delete folder: ' + result.error);
      }
    } catch (error) {
      alert('Failed to delete folder: ' + error.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewResourceForm({
        ...newResourceForm,
        file: file,
        filePreview: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });
    }
  };

  const handleAddResource = async () => {
    if (!newResourceForm.title || !newResourceForm.file) {
      alert('Please fill in title and select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('title', newResourceForm.title);
      formData.append('description', newResourceForm.description);
      formData.append('category', newResourceForm.category);
      formData.append('file', newResourceForm.file);
      if (currentFolder) {
        formData.append('folder_id', currentFolder.id);
      }

      // Simulate upload progress
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
      const response = await fetch('/api/resources.php', {
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
        setShowAddResourceModal(false);
        setNewResourceForm({
          title: '',
          description: '',
          category: '',
          file: null,
          filePreview: null
        });
        loadResources();
        alert('Resource uploaded successfully');
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

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/resources.php?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        loadResources();
        alert('Resource deleted successfully');
      } else {
        alert('Delete failed: ' + result.error);
      }
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  // Sort and filter resources
  const getSortedAndFilteredResources = () => {
    let filtered = resources;
    
    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === filterCategory);
    }
    
    // Sort resources
    switch (sortBy) {
      case 'newest':
        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'name':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'size':
        return filtered.sort((a, b) => b.file_size - a.file_size);
      default:
        return filtered;
    }
  };

  return (
    <div className="w-full px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Resource Center</h2>
            <p className="text-gray-500 mt-1">
              {currentFolder ? `Files in "${currentFolder.name}"` : 'Manage and share training resource files'}
            </p>
          </div>
          {currentFolder && (
            <button
              onClick={() => setCurrentFolder(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Sort and Filter Controls */}
          <div className="flex flex-wrap gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="size">Size (Large to Small)</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {currentUser.role === 'admin' && (
            <>
              {!currentFolder && (
                <button
                  onClick={() => setShowAddFolderModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition text-sm"
                >
                  Create Folder
                </button>
              )}
              <button
                onClick={() => setShowAddResourceModal(true)}
                className="gradient-bg text-white px-4 md:px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-lg flex items-center space-x-2 whitespace-nowrap"
              >
                <div className="w-4 h-4"></div>
                <span className="hidden sm:inline">Add Resource</span>
                <span className="sm:hidden">Add</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Folders Section - Only show when not in a folder */}
      {!currentFolder && folders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Folders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map((folder) => (
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
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
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
          </div>
        </div>
      )}

      {/* Resources Grid */}
      {getSortedAndFilteredResources().length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Resources</h3>
          <p className="text-gray-500">No resources found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getSortedAndFilteredResources().map((resource) => (
            <div key={resource.id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getFileIcon(resource.filename || resource.file_path)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 break-words text-sm leading-tight mb-1" title={resource.title}>
                      {resource.title}
                    </h4>
                    <p className="text-xs text-gray-500">{formatFileSize(resource.file_size)}</p>
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full mt-1">
                      {resource.category}
                    </span>
                  </div>
                </div>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteResource(resource.id)}
                    className="text-red-500 hover:text-red-700 p-1 flex-shrink-0 ml-2"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              {resource.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(resource.created_at).toLocaleDateString()}
                </span>
                <a
                  href={`/uploads/resources/${resource.file_path || resource.filename}`}
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

      {/* Add Resource Modal */}
      {showAddResourceModal && (
        <div className="modal-container">
          <div className="modal-content" style={{maxWidth: '32rem'}}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800">Add Resource</h3>
              <button 
                onClick={() => setShowAddResourceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newResourceForm.title}
                    onChange={(e) => setNewResourceForm({...newResourceForm, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Resource title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newResourceForm.category}
                    onChange={(e) => setNewResourceForm({...newResourceForm, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="Documents">Documents</option>
                    <option value="Videos">Videos</option>
                    <option value="Images">Images</option>
                    <option value="Presentations">Presentations</option>
                    <option value="Spreadsheets">Spreadsheets</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newResourceForm.description}
                    onChange={(e) => setNewResourceForm({...newResourceForm, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Resource description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File *</label>
                  <div 
                    className="upload-area rounded-lg p-6 text-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-purple-500 transition"
                    onClick={() => document.getElementById('resource-file-input').click()}
                  >
                    {newResourceForm.filePreview ? (
                      <div>
                        <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-green-600 font-medium">File selected</p>
                        <p className="text-xs text-gray-600 mt-1">{newResourceForm.filePreview.name}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                        </div>
                        <p className="text-gray-600">Click to upload file</p>
                        <p className="text-xs text-gray-500 mt-1">All file types supported</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="resource-file-input"
                    type="file"
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
                  onClick={handleAddResource}
                  disabled={isUploading}
                  className="flex-1 gradient-bg text-white py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload Resource'}
                </button>
                <button
                  onClick={() => setShowAddResourceModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showAddFolderModal && (
        <div className="modal-container">
          <div className="modal-content" style={{maxWidth: '28rem'}}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800">Create New Folder</h3>
              <button 
                onClick={() => setShowAddFolderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter folder name"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="flex space-x-3">
                <button
                  onClick={handleAddFolder}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Create Folder
                </button>
                <button
                  onClick={() => setShowAddFolderModal(false)}
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