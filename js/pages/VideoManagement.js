const VideoManagement = ({ 
  trainingVideos, 
  setTrainingVideos,
  setShowAddVideoModal,
  setEditingVideo,
  handleDeleteVideo,
  setErrorMessage,
  setSuccessMessage,
  formatFileSize,
  chapters
}) => {
  const { useState } = React;
  const [expandedSections, setExpandedSections] = useState({});

  // Group videos by section (not by module, similar to Training Videos)
  const groupedVideos = {};
  trainingVideos.forEach(video => {
    const sectionKey = video.section || 'Uncategorized';
    if (!groupedVideos[sectionKey]) {
      groupedVideos[sectionKey] = [];
    }
    groupedVideos[sectionKey].push(video);
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="w-full px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Video Management</h2>
          <p className="text-gray-500 mt-1">Supports uploading 20-30 minute long videos (recommended under 500MB)</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddVideoModal(true)}
            className="gradient-bg text-white px-4 md:px-6 py-3 rounded-lg font-medium hover:opacity-90 transition shadow-lg flex items-center space-x-2 whitespace-nowrap"
          >
            <div className="w-4 h-4"></div>
            <span className="hidden sm:inline">Upload Video</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>
      
      {Object.keys(groupedVideos).length === 0 ? (
        <EmptyState 
          title="No Videos"
          description="Click upload button to add the first training video"
          actionButton={
            <button
              onClick={() => setShowAddVideoModal(true)}
              className="gradient-bg text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              Upload Video
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedVideos).map(([section, videos]) => {
            const isExpanded = expandedSections[section] !== false; // Default expanded
            
            return (
              <div key={section} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{section}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{videos.length} videos</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-2xl ml-4">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>
                
                {/* Section videos - 直接显示所有视频，不按module分组 */}
                {isExpanded && (
                  <div className="border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                      {videos.map((video) => (
                        <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden video-card border border-gray-200">
                          <div className="thumbnail-preview relative h-48">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title} 
                              className="w-full h-full object-cover"
                              key={`thumb-${video.id}`}
                              onError={(e) => {
                                // 如果图片加载失败，添加nocache参数强制重新加载
                                if (e.target.src && !e.target.src.includes('nocache=')) {
                                  const baseUrl = e.target.src.split('?')[0];
                                  e.target.src = baseUrl + '?nocache=' + Date.now();
                                }
                              }}
                            />
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {video.duration}
                            </div>
                            <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                              {video.category}
                            </div>
                            {video.hasVideo && (
                              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                                <span>✓</span>
                                <span>{formatFileSize(video.fileSize)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">{video.title}</h3>
                            <p className="text-xs text-gray-500 mb-1">Module: {video.module || 'Uncategorized'}</p>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{video.description}</p>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingVideo({...video})}
                                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(video.id)}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};