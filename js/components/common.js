// 通知消息组件
const Notification = ({ message, type, onClose }) => {
  if (!message) return null;
  
  const bgColor = type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700';
  
  return (
    <div className={`${bgColor} border-l-4 px-4 py-3 rounded mb-6 flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className={type === 'success' ? 'text-green-700 hover:text-green-900' : 'text-red-700 hover:text-red-900'}>✕</button>
    </div>
  );
};

// 加载动画组件
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="text-center py-8">
      <div className="loading-spinner mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};


// 视频卡片组件
const VideoCard = ({ video, onClick, showCompleted = false, isCompleted = false }) => {
  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden video-card cursor-pointer mobile-video-card"
      onClick={onClick}
    >
      <div className="relative h-48 mobile-video-card img">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover"
          key={`card-thumb-${video.id}`}
        />
        {showCompleted && isCompleted && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            <span>Done</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {video.duration}
        </div>
        {video.hasVideo && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Uploaded
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition flex items-center justify-center">
            <div className="w-0 h-0 border-l-8 border-l-white border-y-4 border-y-transparent ml-1"></div>
          </div>
        </div>
      </div>
      
      <div className="p-4 mobile-video-card-content">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
            {video.category}
          </span>
        </div>
        <h4 className="font-semibold text-gray-800 mb-2 mobile-video-card h3">{video.title}</h4>
        <p className="text-sm text-gray-600 line-clamp-2 mobile-video-card p">{video.description}</p>
      </div>
    </div>
  );
};

// 上传进度条组件
const UploadProgress = ({ progress, isUploading }) => {
  if (!isUploading) return null;
  
  return (
    <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-700">Uploading...</span>
        <span className="text-sm text-blue-600">{progress}%</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div className="progress-bar bg-blue-600 h-2 rounded-full" style={{width: `${progress}%`}}></div>
      </div>
    </div>
  );
};

const EmptyState = ({ title, description, actionButton }) => {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
        <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {actionButton && actionButton}
    </div>
  );
};