const HomePage = ({ 
  currentUser, 
  users, 
  trainingVideos, 
  setCurrentPage, 
  setSelectedVideo, 
  loadVideoUrl, 
  getCompletionRate,
  refreshUsers
}) => {
  const { useEffect, useRef } = React;
  
  // 使用 ref 来跟踪是否已经初始化加载，避免重复调用
  const hasInitialized = useRef(false);
  
  // 刷新用户数据以确保统计信息是最新的
  // 只在管理员角色且用户列表为空时才刷新一次
  useEffect(() => {
    if (currentUser?.role === 'admin' && users.length === 0 && !hasInitialized.current) {
      refreshUsers();
      hasInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]); // 只在角色改变时检查，避免循环调用
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  
  const currentUserData = currentUser.role === 'admin' 
    ? users.find(u => u.id === currentUser.id) 
    : currentUser;
  const completedVideos = currentUserData?.completedVideos || [];
  const completionRate = getCompletionRate(completedVideos);

  const getTotalStudyTime = () => {
    return completedVideos.reduce((total, videoId) => {
      const video = trainingVideos.find(v => v.id === videoId);
      return total + (parseInt(video?.duration) || 0);
    }, 0);
  };

  const incompleteVideos = trainingVideos.filter(video => 
    !completedVideos.includes(video.id)
  );

  if (currentUser.role === 'admin') {
    const avgCompletionRate = Math.round(
      users.filter(u => u.role === 'employee')
        .reduce((acc, u) => acc + getCompletionRate(u.completedVideos), 0) / totalEmployees
    ) || 0;
    
    const completedTrainingCount = users.filter(
      u => u.role === 'employee' && (u.completedVideos?.length || 0) === trainingVideos.length
    ).length;

    return (
      <div className="space-y-6 mobile-space-y-4 max-h-full overflow-visible">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border mobile-card">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 mobile-text-xl">Admin Dashboard</h1>
          <p className="text-gray-600 mobile-text-sm">Manage your training platform and monitor employee progress</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mobile-grid-1">
          <div className="bg-white rounded-lg p-4 shadow-sm border mobile-stat-card fixed-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 mobile-text-sm">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900 mobile-text-2xl">{totalEmployees}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-lg">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border mobile-stat-card fixed-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 mobile-text-sm">Training Courses</p>
                <p className="text-2xl font-bold text-gray-900 mobile-text-2xl">{trainingVideos.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <span className="text-lg">🎬</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border mobile-stat-card fixed-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 mobile-text-sm">Avg Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mobile-text-2xl">{avgCompletionRate}%</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border mobile-stat-card fixed-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 mobile-text-sm">Completed Training</p>
                <p className="text-2xl font-bold text-gray-900 mobile-text-2xl">{completedTrainingCount}</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <span className="text-lg">✅</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions Panel */}
        <div className="bg-white rounded-lg p-6 shadow-sm border fixed-actions-panel">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 fixed-actions-grid">
            <button 
              onClick={() => setCurrentPage('video-management')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center border hover:shadow-sm transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🎬</span>
              </div>
              <div className="font-medium text-gray-800 mb-1">Upload Video</div>
              <div className="text-sm text-gray-600">Add new training content</div>
            </button>
            
            <button 
              onClick={() => setCurrentPage('employee-management')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center border hover:shadow-sm transition-colors"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">👥</span>
              </div>
              <div className="font-medium text-gray-800 mb-1">Manage Users</div>
              <div className="text-sm text-gray-600">View and manage employees</div>
            </button>
            
            <button 
              onClick={() => setCurrentPage('resource-center')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center border hover:shadow-sm transition-colors"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📁</span>
              </div>
              <div className="font-medium text-gray-800 mb-1">Resources</div>
              <div className="text-sm text-gray-600">Manage files and documents</div>
            </button>
            
            <button 
              onClick={() => setCurrentPage('announcements')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center border hover:shadow-sm transition-colors"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📢</span>
              </div>
              <div className="font-medium text-gray-800 mb-1">Announcements</div>
              <div className="text-sm text-gray-600">Create and manage notices</div>
            </button>
          </div>
        </div>

      </div>
    );
  }
//员工页面
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome back, {currentUser.name}!
            </h1>
            <p className="text-gray-600 mb-4">Continue your learning journey and improve your skills</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-lg">📚</span>
                <span className="text-sm font-medium text-gray-700">Learning Path</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm font-medium text-gray-700">Personal Goals</span>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="text-center bg-gray-50 rounded-lg p-6 border">
              <div className="text-4xl font-bold text-gray-800 mb-2">{completionRate}%</div>
              <p className="text-gray-600 font-medium">Overall Progress</p>
              <div className="mt-3 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{width: `${completionRate}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mobile-card-grid">
        <div className="bg-white rounded-lg p-4 shadow-sm border fixed-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{trainingVideos.length}</p>
              <p className="text-xs text-gray-500 mt-1">Available to learn</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border fixed-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedVideos.length}</p>
              <p className="text-xs text-gray-500 mt-1">Courses finished</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border fixed-stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Study Time</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalStudyTime()}</p>
              <p className="text-xs text-gray-500 mt-1">Minutes learned</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <span className="text-xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Learning Progress</h2>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Overall Progress</span>
              <span className="text-xl font-bold text-gray-900">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{width: `${completionRate}%`}}
              ></div>
            </div>
          </div>
          
          {/* Progress Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mobile-card-grid">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{completedVideos.length}</div>
                  <div className="text-sm text-green-600">Completed Courses</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📚</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-700">{incompleteVideos.length}</div>
                  <div className="text-sm text-orange-600">Remaining Courses</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mobile-card-grid">
        {/* Incomplete Courses */}
        <div className="bg-white rounded-lg p-6 shadow-sm border scrollable-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Continue Learning</h2>
            <button 
              onClick={() => setCurrentPage('videos')}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 rounded-lg transition-colors"
            >
              <span className="font-medium">View All</span>
              <span>→</span>
            </button>
          </div>
          
          <div className="space-y-3 scrollable-content">
            {incompleteVideos.slice(0, 3).map((video) => (
              <div key={video.id} className="flex items-center space-x-3 p-3 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer border hover:border-orange-200"
                onClick={async () => {
                  if (video.hasVideo) {
                    const url = await loadVideoUrl(video.id);
                    setSelectedVideo({...video, videoUrl: url});
                    setCurrentPage('video-player');
                  } else {
                    setSelectedVideo(video);
                    setCurrentPage('video-player');
                  }
                }}>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600">📚</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{video.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center space-x-2">
                    <span>⏱️ {video.duration}min</span>
                    <span>•</span>
                    <span className="text-orange-600 font-medium">Not completed</span>
                  </p>
                </div>
                <div className="text-orange-500">
                  <span>Start →</span>
                </div>
              </div>
            ))}
            {incompleteVideos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Congratulations!</h3>
                <p>You've completed all available courses!</p>
              </div>
            )}
          </div>
        </div>

        {/* Important Announcements */}
        <div className="bg-white rounded-lg p-6 shadow-sm border scrollable-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Important Announcements</h2>
            <button 
              onClick={() => setCurrentPage('announcements')}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg transition-colors"
            >
              <span className="font-medium">View All</span>
              <span>→</span>
            </button>
          </div>
          <div className="space-y-4 scrollable-content">
            {/* Mock announcement data - you can replace this with real data from props */}
            {[
              {
                id: 1,
                title: "New Training Module Available",
                content: "We've added a new advanced training module on project management. All employees are encouraged to complete it by the end of the month.",
                date: "2025-01-10",
                priority: "high"
              },
              {
                id: 2,
                title: "System Maintenance Notice",
                content: "Scheduled maintenance will occur this weekend. The system will be unavailable from 2 AM to 6 AM on Sunday.",
                date: "2025-01-08",
                priority: "medium"
              },
              {
                id: 3,
                title: "Training Completion Reminder",
                content: "Please ensure all mandatory training courses are completed by the end of this quarter.",
                date: "2025-01-05",
                priority: "high"
              }
            ].map((announcement) => (
              <div key={announcement.id} className="flex items-start space-x-3 p-4 rounded-lg border-l-4 bg-blue-50 border-blue-400 hover:bg-blue-100 transition-colors hover:shadow-sm">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
                  <span className="text-sm text-blue-600">
                    📢
                  </span>
                </div>
                <div className="flex-1">
                  <div className="mb-2">
                    <h3 className="font-medium text-gray-800">{announcement.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 leading-relaxed">{announcement.content}</p>
                  <p className="text-xs text-gray-500 flex items-center space-x-2">
                    <span>📅 {new Date(announcement.date).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};