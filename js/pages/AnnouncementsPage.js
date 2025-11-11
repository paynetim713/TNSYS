// Announcements System Page - API Version
const AnnouncementsPage = ({ 
  currentUser, 
  announcements, 
  setAnnouncements,
  setSuccessMessage,
  setErrorMessage,
  refreshAnnouncements,
  apiCall
}) => {
  const { useState } = React;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showDetailPage, setShowDetailPage] = useState(false);
  
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'notice',
    isPublished: true
  });
  
  // ==================== 添加公告 ====================
  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      setErrorMessage('Please fill in complete announcement information');
      return;
    }
    
    try {
      await apiCall('/announcements.php', {
        method: 'POST',
        body: JSON.stringify({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          type: newAnnouncement.type,
          isPublished: newAnnouncement.isPublished
        })
      });
      
      setNewAnnouncement({
        title: '',
        content: '',
        type: 'notice',
        isPublished: true
      });
      setShowAddModal(false);
      setSuccessMessage('Announcement published successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // 刷新公告列表
      refreshAnnouncements();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to publish announcement');
    }
  };
  
  // ==================== 更新公告 ====================
  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement.title || !editingAnnouncement.content) {
      setErrorMessage('Please fill in complete announcement information');
      return;
    }
    
    try {
      await apiCall(`/announcements.php?id=${editingAnnouncement.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          type: editingAnnouncement.type,
          isPublished: editingAnnouncement.isPublished || editingAnnouncement.is_published
        })
      });
      
      setEditingAnnouncement(null);
      setSuccessMessage('Announcement updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // 刷新公告列表
      refreshAnnouncements();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update announcement');
    }
  };
  
  // ==================== 删除公告 ====================
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await apiCall(`/announcements.php?id=${id}`, {
        method: 'DELETE'
      });
      
      setSuccessMessage('Announcement deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // 刷新公告列表
      refreshAnnouncements();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete announcement');
    }
  };
  
  // ==================== 查看公告详情 ====================
  const handleViewAnnouncement = async (announcement) => {
    try {
      // 调用 API 增加浏览量
      const result = await apiCall(`/announcements.php?id=${announcement.id}`);
      setSelectedAnnouncement(result.data);
      setShowDetailPage(true);
      
      // 同时更新本地数据
      refreshAnnouncements();
    } catch (error) {
      console.error('Failed to load announcement:', error);
      setSelectedAnnouncement(announcement);
      setShowDetailPage(true);
    }
  };
  
  // ==================== 切换发布状态 ====================
  const handleTogglePublish = async (id) => {
    try {
      const announcement = announcements.find(a => a.id === id);
      if (!announcement) return;
      
      await apiCall(`/announcements.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isPublished: !announcement.is_published && !announcement.isPublished
        })
      });
      
      // 刷新公告列表
      refreshAnnouncements();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update publish status');
    }
  };
  
  // Filter announcements
  const filteredAnnouncements = announcements.filter(a => {
    const isPublished = a.is_published || a.isPublished;
    if (currentUser.role !== 'admin' && !isPublished) return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    return true;
  });
  
  // Get type info
  const getTypeInfo = (type) => {
    const types = {
      important: { name: 'Important', color: 'bg-red-100 text-red-700 border-red-200' },
      notice: { name: 'Notice', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      event: { name: 'Event', color: 'bg-green-100 text-green-700 border-green-200' },
      system: { name: 'System', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    };
    return types[type] || types.notice;
  };
  
  
  // 如果显示详情页面，渲染详情页面
  if (showDetailPage && selectedAnnouncement) {
    return (
      <AnnouncementDetailPage 
        announcement={selectedAnnouncement}
        onBack={() => {
          setShowDetailPage(false);
          setSelectedAnnouncement(null);
        }}
      />
    );
  }

  return (
    <div className="w-full px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Announcements</h2>
          <p className="text-gray-500 mt-1">View the latest system announcements and important notices</p>
        </div>
        
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="gradient-bg text-white px-4 md:px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-lg flex items-center space-x-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Publish Announcement</span>
          </button>
        )}
      </div>
      
      {/* Filter */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-600">Type:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterType === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('important')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterType === 'important' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Important
          </button>
          <button
            onClick={() => setFilterType('notice')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterType === 'notice' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Notice
          </button>
          <button
            onClick={() => setFilterType('event')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterType === 'event' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Event
          </button>
        </div>
      </div>
      
      {/* Announcements list */}
      {filteredAnnouncements.length === 0 ? (
        <EmptyState 
          title="No Announcements"
          description="No announcements published yet"
        />
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const typeInfo = getTypeInfo(announcement.type);
            const isPublished = announcement.is_published || announcement.isPublished;
            return (
              <div
                key={announcement.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium border ${typeInfo.color}`}>
                          {typeInfo.name}
                        </span>
                        {!isPublished && (
                          <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                            Unpublished
                          </span>
                        )}
                      </div>
                      
                      <h3 
                        className="text-xl font-bold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition"
                        onClick={() => handleViewAnnouncement(announcement)}
                      >
                        {announcement.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {announcement.content}
                      </p>
                      
                      <div className="flex items-center text-xs text-gray-500 gap-4">
                        <div className="flex items-center gap-2">
                          <img src={announcement.creator_avatar} alt="" className="w-5 h-5 rounded-full" />
                          <span>{announcement.creator_name}</span>
                        </div>
                        <span>Published {new Date(announcement.created_at).toLocaleString('en-US')}</span>
                      </div>
                    </div>
                    
                    {currentUser.role === 'admin' && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleTogglePublish(announcement.id)}
                          className={`p-2 rounded-lg transition ${
                            isPublished 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={isPublished ? 'Published' : 'Unpublished'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingAnnouncement({...announcement})}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleViewAnnouncement(announcement)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Add announcement modal */}
      {showAddModal && (
        <AnnouncementModal
          title="Publish New Announcement"
          announcement={newAnnouncement}
          setAnnouncement={setNewAnnouncement}
          onSave={handleAddAnnouncement}
          onClose={() => {
            setShowAddModal(false);
            setNewAnnouncement({
              title: '',
              content: '',
              type: 'notice',
              isPublished: true
            });
          }}
        />
      )}
      
      {/* Edit announcement modal */}
      {editingAnnouncement && (
        <AnnouncementModal
          title="Edit Announcement"
          announcement={editingAnnouncement}
          setAnnouncement={setEditingAnnouncement}
          onSave={handleUpdateAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
        />
      )}
      
    </div>
  );
};

// ==================== 公告编辑模态框 ====================
const AnnouncementModal = ({ title, announcement, setAnnouncement, onSave, onClose }) => {
  const isPublished = announcement.is_published || announcement.isPublished;
  
  return (
    <div className="modal-container">
      <div className="modal-content" style={{maxWidth: '48rem'}}>
        <div className="modal-header">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="modal-body">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Title *</label>
            <input
              type="text"
              value={announcement.title}
              onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter announcement title"
            />
          </div>
          
          <div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={announcement.type}
                onChange={(e) => setAnnouncement({...announcement, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="notice">Notice</option>
                <option value="important">Important</option>
                <option value="event">Event</option>
                <option value="system">System</option>
              </select>
            </div>
            
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
            <textarea
              value={announcement.content}
              onChange={(e) => setAnnouncement({...announcement, content: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="8"
              placeholder="Enter detailed announcement content..."
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setAnnouncement({...announcement, isPublished: e.target.checked, is_published: e.target.checked})}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
              Publish immediately (uncheck to save as draft)
            </label>
          </div>
          
        </div>
        
        <div className="modal-footer">
          <div className="flex space-x-3">
            <button
              onClick={onSave}
              className="flex-1 gradient-bg text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 公告详情页面 ====================
const AnnouncementDetailPage = ({ announcement, onBack }) => {
  const typeInfo = {
    important: { name: 'Important', color: 'bg-red-100 text-red-700 border-red-200' },
    notice: { name: 'Notice', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    event: { name: 'Event', color: 'bg-green-100 text-green-700 border-green-200' },
    system: { name: 'System', color: 'bg-gray-100 text-gray-700 border-gray-200' }
  }[announcement.type];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Announcements</span>
            </button>
            
            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded-full font-medium border ${typeInfo.color}`}>
                {typeInfo.name}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 主要内容 */}
      <div className="w-full px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 标题区域 */}
          <div className="px-8 py-8 border-b border-gray-200">
            <h1 className="text-4xl font-bold text-gray-800 mb-6 leading-tight">
              {announcement.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <img src={announcement.creator_avatar} alt="" className="w-8 h-8 rounded-full" />
                <span className="font-medium">{announcement.creator_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Published {new Date(announcement.created_at).toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>
          
          {/* 内容区域 */}
          <div className="px-8 py-8">
            <div className="prose max-w-none">
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                {announcement.content}
              </div>
            </div>
            
            {announcement.updated_at !== announcement.created_at && (
              <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Last updated {new Date(announcement.updated_at).toLocaleString('en-US')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};