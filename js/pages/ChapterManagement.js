const ChapterManagement = ({ 
  currentUser,
  chapters,
  refreshChapters
}) => {
  const { useState, useEffect } = React;
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [showEditChapterModal, setShowEditChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [newChapterForm, setNewChapterForm] = useState({
    name: '',
    modules: ['']
  });
  const [editChapterForm, setEditChapterForm] = useState({
    name: '',
    modules: ['']
  });
  const [loading, setLoading] = useState(false);

  const handleAddChapter = async () => {
    if (!newChapterForm.name.trim()) {
      alert('Please enter chapter name');
      return;
    }

    const validModules = newChapterForm.modules.filter(module => module.trim());
    if (validModules.length === 0) {
      alert('Please add at least one module');
      return;
    }

    const moduleNames = validModules.map(m => m.trim().toLowerCase());
    const uniqueModules = [...new Set(moduleNames)];
    if (moduleNames.length !== uniqueModules.length) {
      alert('Module names must be unique within a chapter');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/chapters.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newChapterForm.name,
          modules: validModules
        })
      });

      const result = await response.json();
      if (result.success) {
        setNewChapterForm({ name: '', modules: [''] });
        setShowAddChapterModal(false);
        refreshChapters();
        alert('Chapter created successfully');
      } else {
        alert('Failed to create chapter: ' + result.error);
      }
    } catch (error) {
      alert('Failed to create chapter: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setEditChapterForm({
      name: chapter.name,
      modules: chapter.modules ? chapter.modules.map(m => m.module_name) : ['']
    });
    setShowEditChapterModal(true);
  };

  const handleUpdateChapter = async () => {
    if (!editChapterForm.name.trim()) {
      alert('Please enter chapter name');
      return;
    }

    const validModules = editChapterForm.modules.filter(module => module.trim());
    if (validModules.length === 0) {
      alert('Please add at least one module');
      return;
    }

    // Check for duplicate modules
    const moduleNames = validModules.map(m => m.trim().toLowerCase());
    const uniqueModules = [...new Set(moduleNames)];
    if (moduleNames.length !== uniqueModules.length) {
      alert('Module names must be unique within a chapter');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/chapters.php?id=${editingChapter.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editChapterForm.name,
          modules: validModules
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowEditChapterModal(false);
        setEditingChapter(null);
        refreshChapters();
        alert('Chapter updated successfully');
      } else {
        alert('Failed to update chapter: ' + result.error);
      }
    } catch (error) {
      alert('Failed to update chapter: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm('Are you sure you want to delete this chapter? This will also delete all modules in this chapter.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/chapters.php?id=${chapterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        refreshChapters();
        alert('Chapter deleted successfully');
      } else {
        alert('Failed to delete chapter: ' + result.error);
      }
    } catch (error) {
      alert('Failed to delete chapter: ' + error.message);
    }
  };

  const addModule = (formType) => {
    if (formType === 'new') {
      setNewChapterForm(prev => ({
        ...prev,
        modules: [...prev.modules, '']
      }));
    } else {
      setEditChapterForm(prev => ({
        ...prev,
        modules: [...prev.modules, '']
      }));
    }
  };

  const updateModule = (index, value, formType) => {
    if (formType === 'new') {
      setNewChapterForm(prev => ({
        ...prev,
        modules: prev.modules.map((module, i) => i === index ? value : module)
      }));
    } else {
      setEditChapterForm(prev => ({
        ...prev,
        modules: prev.modules.map((module, i) => i === index ? value : module)
      }));
    }
  };

  const removeModule = (index, formType) => {
    if (formType === 'new') {
      setNewChapterForm(prev => ({
        ...prev,
        modules: prev.modules.filter((_, i) => i !== index)
      }));
    } else {
      setEditChapterForm(prev => ({
        ...prev,
        modules: prev.modules.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <div className="w-full px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Chapter Management</h2>
          <p className="text-gray-500 mt-1">Manage training chapters and modules</p>
        </div>
        <button
          onClick={() => setShowAddChapterModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-lg flex items-center space-x-2"
        >
          <div className="w-5 h-5"></div>
          <span>Add Chapter</span>
        </button>
      </div>

      {/* Chapters List */}
      {chapters.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Chapters</h3>
          <p className="text-gray-500">No chapters have been created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{chapter.name}</h3>
                  <p className="text-sm text-gray-500">{chapter.module_count || 0} modules</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditChapter(chapter)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(chapter.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {chapter.modules && chapter.modules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Modules:</h4>
                  <div className="space-y-1">
                    {chapter.modules.map((module, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                        {module.module_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created: {new Date(chapter.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Chapter Modal */}
      {showAddChapterModal && (
        <div className="modal-container">
          <div className="modal-content" style={{maxWidth: '32rem'}}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800">Create New Chapter</h3>
              <button 
                onClick={() => setShowAddChapterModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <div className="w-6 h-6"></div>
              </button>
            </div>
            
            <div className="modal-body">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Name
                </label>
                <input
                  type="text"
                  value={newChapterForm.name}
                  onChange={(e) => setNewChapterForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g.: Basic Training"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modules
                </label>
                <div className="space-y-2">
                  {newChapterForm.modules.map((module, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={module}
                        onChange={(e) => updateModule(index, e.target.value, 'new')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`Module ${index + 1}`}
                      />
                      {newChapterForm.modules.length > 1 && (
                        <button
                          onClick={() => removeModule(index, 'new')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <div className="w-5 h-5"></div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addModule('new')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                >
                  <div className="w-4 h-4"></div>
                  <span>+ Add Module</span>
                </button>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="flex space-x-3">
                <button
                  onClick={handleAddChapter}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Chapter'}
                </button>
                <button
                  onClick={() => setShowAddChapterModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Chapter Modal */}
      {showEditChapterModal && (
        <div className="modal-container">
          <div className="modal-content" style={{maxWidth: '32rem'}}>
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800">Edit Chapter</h3>
              <button 
                onClick={() => setShowEditChapterModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <div className="w-6 h-6"></div>
              </button>
            </div>
            
            <div className="modal-body">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Name
                </label>
                <input
                  type="text"
                  value={editChapterForm.name}
                  onChange={(e) => setEditChapterForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modules
                </label>
                <div className="space-y-2">
                  {editChapterForm.modules.map((module, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={module}
                        onChange={(e) => updateModule(index, e.target.value, 'edit')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={`Module ${index + 1}`}
                      />
                      {editChapterForm.modules.length > 1 && (
                        <button
                          onClick={() => removeModule(index, 'edit')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <div className="w-5 h-5"></div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addModule('edit')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                >
                  <div className="w-4 h-4"></div>
                  <span>+ Add Module</span>
                </button>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateChapter}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Chapter'}
                </button>
                <button
                  onClick={() => setShowEditChapterModal(false)}
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
