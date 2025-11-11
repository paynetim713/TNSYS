
const VideosPage = ({ 
  trainingVideos, 
  completedVideos = [], 
  setCurrentPage, 
  setSelectedVideo, 
  loadVideoUrl 
}) => {
  const { useState } = React;
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});
  //获取所有分类
  const categories = ['all', ...new Set(trainingVideos.map(v => v.category))];
  //过滤视频
  const filteredVideos = filterCategory === 'all' 
    ? trainingVideos 
    : trainingVideos.filter(v => v.category === filterCategory);
    
  const groupedVideos = {};
  filteredVideos.forEach(video => {
    if (!groupedVideos[video.section]) {
      groupedVideos[video.section] = [];
    }
    groupedVideos[video.section].push(video);
  });

  const getSectionProgress = (sectionVideos) => {
    const completed = sectionVideos.filter(v => completedVideos.includes(v.id)).length;
    const total = sectionVideos.length;
    const totalMinutes = sectionVideos.reduce((sum, v) => {
      const mins = parseInt(v.duration) || 0;
      return sum + mins;
    }, 0);
    return { completed, total, totalMinutes };
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleVideoClick = async (video) => {
    if (video.hasVideo) {
      const url = await loadVideoUrl(video.id);
      setSelectedVideo({...video, videoUrl: url});
      setCurrentPage('video-player');
    } else {
      setSelectedVideo(video);
      setCurrentPage('video-player');
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mobile-space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mobile-text-xl">Training Courses</h2>
          <p className="text-gray-500 mt-1 mobile-text-sm">Select a course to start learning</p>
        </div>
        
        {/* Category filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All</option>
            {categories.filter(c => c !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Statistics info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 mb-6 text-white mobile-card">
        <div className="flex items-center justify-between mobile-flex-col mobile-space-y-4">
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1 mobile-text-sm">Total Courses</p>
            <p className="text-3xl font-bold mobile-text-2xl">{filteredVideos.length}</p>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1 mobile-text-sm">Completed</p>
            <p className="text-3xl font-bold mobile-text-2xl">{completedVideos.length}</p>
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm mb-1 mobile-text-sm">Completion Rate</p>
            <p className="text-3xl font-bold mobile-text-2xl">
              {trainingVideos.length > 0 ? Math.round((completedVideos.length / trainingVideos.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Course sections */}
      {Object.keys(groupedVideos).length === 0 ? (
        <EmptyState 
          title="No Courses"
          description="No courses available in this category yet"
        />
      ) : (
        <div className="space-y-4 mobile-space-y-3">
          {Object.entries(groupedVideos).map(([section, videos]) => {
            const progress = getSectionProgress(videos);
            const isExpanded = expandedSections[section] !== false; // Default expanded
            const progressPercentage = (progress.completed / progress.total) * 100;
            
            return (
              <div key={section} className="bg-white rounded-xl shadow-md overflow-hidden mobile-card">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{section}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{progress.completed}/{progress.total} completed</span>
                      <span>•</span>
                      <span>{progress.totalMinutes}min total</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-500 h-2 rounded-full transition-all"
                        style={{width: `${progressPercentage}%`}}
                      ></div>
                    </div>
                  </div>
                  <span className="text-gray-400 text-2xl ml-4">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>
                
                {/* Section videos */}
                {isExpanded && (
                  <div className="border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 max-h-none">
                      {videos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          showCompleted={true}
                          isCompleted={completedVideos.includes(video.id)}
                          onClick={() => handleVideoClick(video)}
                        />
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