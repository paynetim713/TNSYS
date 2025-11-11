// Video Player Page with Course Content Sidebar
const VideoPlayer = ({ 
  selectedVideo, 
  loadingVideoUrl, 
  currentUser, 
  completedVideos, 
  handleVideoComplete, 
  formatFileSize,
  trainingVideos,
  setSelectedVideo,
  setCurrentPage,
  loadVideoUrl
}) => {
  const { useState, useRef, useEffect } = React;
  const [expandedSections, setExpandedSections] = useState({});
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const videoRef = useRef(null);
  
  if (!selectedVideo) return null;

  // Group videos by section
  const groupedVideos = {};
  trainingVideos.forEach(video => {
    if (!groupedVideos[video.section]) {
      groupedVideos[video.section] = [];
    }
    groupedVideos[video.section].push(video);
  });

  // Calculate section progress
  const getSectionProgress = (sectionVideos) => {
    const completed = sectionVideos.filter(v => completedVideos.includes(v.id)).length;
    const total = sectionVideos.length;
    const totalMinutes = sectionVideos.reduce((sum, v) => {
      const mins = parseInt(v.duration) || 0;
      return sum + mins;
    }, 0);
    return { completed, total, totalMinutes };
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle video selection
  const handleVideoSelect = async (video) => {
    if (video.hasVideo) {
      const url = await loadVideoUrl(video.id);
      setSelectedVideo({...video, videoUrl: url});
    } else {
      setSelectedVideo(video);
    }
    // Reset completion state when switching videos
    setCanComplete(false);
    setVideoProgress(0);
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setVideoProgress(currentTime);
      setVideoDuration(duration);
      
      // Allow completion when video is 98% complete (to account for small timing differences)
      const progressPercentage = (currentTime / duration) * 100;
      const canCompleteNow = currentTime >= duration * 0.98;
      
      // Debug log (remove in production)
      console.log(`Video progress: ${progressPercentage.toFixed(1)}%, Can complete: ${canCompleteNow}`);
      
      setCanComplete(canCompleteNow);
    }
  };

  // Handle video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  // Reset completion state when video changes
  useEffect(() => {
    setCanComplete(false);
    setVideoProgress(0);
    setVideoDuration(0);
  }, [selectedVideo.id]);

  return (
    <div className="flex gap-4 min-h-0">
      {/* Left side - Video player */}
      <div className="flex-1 bg-white rounded-xl shadow-md flex flex-col">
        {/* Video area */}
        <div className="aspect-video bg-black flex items-center justify-center">
          {loadingVideoUrl ? (
            <LoadingSpinner message="Loading video..." />
          ) : selectedVideo.videoUrl ? (
            <video 
              ref={videoRef}
              src={selectedVideo.videoUrl} 
              controls 
              controlsList="nodownload"
              disablePictureInPicture
              className="w-full h-full"
              preload="metadata"
              onContextMenu={(e) => e.preventDefault()}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            >
              Your browser does not support video playback
            </video>
          ) : (
            <div className="text-white text-center p-8">
              <p className="text-6xl mb-4">🎹</p>
              <p className="text-xl mb-2">Video not uploaded yet</p>
              <p className="text-gray-400">Please contact administrator to upload video content</p>
            </div>
          )}
        </div>
        
        {/* Video info */}
        <div className="p-6 flex flex-col min-h-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1 rounded-full">
                  {selectedVideo.category}
                </span>
                <span className="text-gray-500 text-sm">{selectedVideo.duration}</span>
                {selectedVideo.fileSize && (
                  <span className="text-gray-500 text-sm">📦 {formatFileSize(selectedVideo.fileSize)}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedVideo.title}</h1>
              <div className="text-gray-600 whitespace-pre-wrap break-words">
                {selectedVideo.description}
              </div>
            </div>
            
            {currentUser.role === 'employee' && (
              <div className="ml-6">
                {!completedVideos.includes(selectedVideo.id) ? (
                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => {
                        console.log(`Complete button clicked. Can complete: ${canComplete}, Progress: ${videoDuration > 0 ? Math.round((videoProgress / videoDuration) * 100) : 0}%`);
                        if (canComplete) {
                          handleVideoComplete(selectedVideo.id);
                        } else {
                          console.log('Completion blocked - video not watched to 98%');
                          // Show a more obvious feedback
                          alert(`Please watch the video to 98% completion before marking as complete. Current progress: ${videoDuration > 0 ? Math.round((videoProgress / videoDuration) * 100) : 0}%`);
                        }
                      }}
                      disabled={!canComplete}
                      className={`px-6 py-3 rounded-lg font-medium transition shadow-lg flex items-center space-x-2 whitespace-nowrap ${
                        canComplete
                          ? 'gradient-bg text-white hover:opacity-90'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!canComplete ? 'Please watch the video to completion (98%) before marking as complete' : 'Mark this video as completed'}
                    >
                      <span>✓</span>
                      <span>Mark Complete</span>
                    </button>
                    {!canComplete && videoDuration > 0 && (
                      <div className="text-xs text-gray-500 text-right max-w-32">
                        Watch {Math.round((videoProgress / videoDuration) * 100)}% / 98% to complete
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => {
                        console.log(`Complete button clicked. Can complete: ${canComplete}, Progress: ${videoDuration > 0 ? Math.round((videoProgress / videoDuration) * 100) : 0}%`);
                        if (canComplete) {
                          handleVideoComplete(selectedVideo.id);
                        } else {
                          console.log('Completion blocked - video not watched to 98%');
                          // Show a more obvious feedback
                          alert(`Please watch the video to 98% completion before marking as complete. Current progress: ${videoDuration > 0 ? Math.round((videoProgress / videoDuration) * 100) : 0}%`);
                        }
                      }}
                      disabled={!canComplete}
                      className={`px-6 py-3 rounded-lg font-medium transition shadow-lg flex items-center space-x-2 whitespace-nowrap ${
                        canComplete
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!canComplete ? 'Please watch the video to completion (98%) before marking as complete' : 'Re-confirm completion or mark as reviewed again'}
                    >
                      <span>✓</span>
                      <span>Mark Complete</span>
                    </button>
                    {!canComplete && videoDuration > 0 && (
                      <div className="text-xs text-gray-500 text-right max-w-32">
                        Watch {Math.round((videoProgress / videoDuration) * 100)}% / 98% to complete
                      </div>
                    )}
                    {canComplete && (
                      <div className="text-xs text-green-600 text-right max-w-32">
                        ✓ Ready to re-confirm completion
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Course content */}
      <div className="w-96 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
        <div className="border-b px-4 py-4">
          <h2 className="text-lg font-bold text-gray-800">Course content</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {Object.entries(groupedVideos).map(([section, videos]) => {
            const progress = getSectionProgress(videos);
            const isExpanded = expandedSections[section] !== false; // Default expanded
            
            return (
              <div key={section} className="border-b">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-800 text-sm mb-1">{section}</div>
                    <div className="text-xs text-gray-500">
                      {progress.completed}/{progress.total} | {progress.totalMinutes}min
                    </div>
                  </div>
                  <span className="text-gray-400 text-xl">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>
                
                {/* Section videos */}
                {isExpanded && (
                  <div className="bg-gray-50">
                    {videos.map((video) => {
                      const isCompleted = completedVideos.includes(video.id);
                      const isSelected = selectedVideo.id === video.id;
                      
                      return (
                        <button
                          key={video.id}
                          onClick={() => handleVideoSelect(video)}
                          className={`w-full px-4 py-3 flex items-start space-x-3 hover:bg-gray-100 transition ${
                            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isCompleted 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300'
                            }`}>
                              {isCompleted && <span className="text-xs">✓</span>}
                            </div>
                          </div>
                          
                          {/* Video info */}
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-gray-800 mb-1">
                              {video.title}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>📹 {video.duration}</span>
                              {video.hasVideo && (
                                <span className="text-green-600">● Uploaded</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Back button */}
        <div className="border-t px-4 py-3">
          <button
            onClick={() => setCurrentPage('videos')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition"
          >
            ← Back to All Courses
          </button>
        </div>
      </div>
    </div>
  );
};