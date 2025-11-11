const { useState, useEffect, useCallback } = React;

// 动态检测 API 基础路径（支持子目录部署和虚拟主机）
function getApiBaseUrl() {
  // 方案1: 尝试直接使用相对路径（如果 index.html 和 api 在同一目录下）
  const host = window.location.host;
  const pathname = window.location.pathname;
  
  // 如果 pathname 是 / 或 /index.html，可能是在根目录或虚拟主机
  if (pathname === '/' || pathname === '/index.html') {
    // 检查是否可以通过 /api 访问（虚拟主机配置）
    console.log('Detected root or index.html, trying /api');
    return '/api';
  }
  
  // 方案2: 从当前路径提取基础路径
  // 例如: /aca-training(local)/index.html -> /aca-training(local)/api
  let basePath = pathname;
  
  // 移除文件名
  if (basePath.includes('/')) {
    const lastSlash = basePath.lastIndexOf('/');
    basePath = basePath.substring(0, lastSlash + 1);
  }
  
  // 构建 API 路径
  const apiPath = basePath.replace(/\/$/, '') + '/api';
  
  console.log('API Base URL detected:', apiPath, 'from pathname:', pathname, 'host:', host);
  
  return apiPath;
}

const API_BASE_URL = getApiBaseUrl(); 

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders = {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`Making API call to: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let result;
    if (isJson) {
      result = await response.json();
    } else {
      // 如果不是 JSON，读取文本内容用于调试
      const text = await response.text();
      console.error(`API returned non-JSON response (${response.status}):`, text.substring(0, 500));
      console.error(`Full URL attempted: ${fullUrl}`);
      console.error(`Content-Type received: ${contentType || 'unknown'}`);
      
      // 如果是 404，提供更具体的错误信息
      if (response.status === 404) {
        throw new Error(`API endpoint not found: ${fullUrl}. Please check:\n1. The file exists at ${fullUrl}\n2. The API_BASE_URL is correct (currently: ${API_BASE_URL})\n3. You're accessing the app from the correct URL`);
      }
      
      throw new Error(`API endpoint ${endpoint} returned ${response.status} (${response.statusText}). Expected JSON but got ${contentType || 'unknown'}`);
    }
    
    if (!response.ok || result.error) {
      throw new Error(result.error || `Request failed with status ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    console.error(`Failed URL: ${fullUrl}`);
    throw error;
  }
}

// 头像URL处理函数
function getAvatarUrl(user) {
  if (!user || !user.avatar) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user ? user.name : 'default'}`;
  }
  
  // 如果已经是完整URL，直接返回
  if (user.avatar.startsWith('http')) {
    return user.avatar;
  }
  
  // 如果是相对路径，添加BASE_URL
  if (user.avatar.startsWith('/')) {
    return API_BASE_URL.replace('/api', '') + user.avatar;
  }
  
  // 如果只是文件名，添加完整路径
  return API_BASE_URL.replace('/api', '') + '/uploads/avatars/' + user.avatar;
}

function TrainingPlatform() {
  const [currentPage, setCurrentPageState] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // 移动端默认关闭侧边栏，桌面端默认打开
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return true;
  });
  const [chapters, setChapters] = useState([]);
  const [users, setUsers] = useState([]);
  const [trainingVideos, setTrainingVideos] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [resourceCategories, setResourceCategories] = useState([]);
  const [videoCategories, setVideoCategories] = useState([]);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '', remember: false });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const setCurrentPage = (page) => {
    setCurrentPageState(page);
    setErrorMessage('');
    setSuccessMessage('');
  };
  
  // 个人资料编辑
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  
  // 视频相关状态
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [loadingVideoUrl, setLoadingVideoUrl] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [newVideoForm, setNewVideoForm] = useState({
    title: '',
    duration: '',
    category: '',
    section: '',
    module: '',
    description: '',
    thumbnail: null,
    thumbnailPreview: '',
    videoFile: null,
    fileSize: null
  });

  useEffect(() => {
    // 检查URL参数，如果是分享链接，清除认证信息并显示登录页
    const urlParams = new URLSearchParams(window.location.search);
    const isSharedLink = urlParams.has('shared') || urlParams.has('forceLogin');
    
    if (isSharedLink) {
      // 清除所有认证信息
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('sessionAuthenticated');
      // 清除URL参数，避免刷新后再次触发
      window.history.replaceState({}, document.title, window.location.pathname);
      setCurrentPageState('login');
      setIsLoggedIn(false);
      setCurrentUser(null);
      return;
    }
    
    // 检查现有登录会话
    const authToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    const sessionAuth = sessionStorage.getItem('sessionAuthenticated');
    
    // 如果sessionStorage中没有标记，说明是新会话，需要重新验证
    if (authToken && savedUser && sessionAuth === 'true') {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        setCurrentPageState('home');
        loadAllData();
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('sessionAuthenticated');
      }
    } else if (authToken && savedUser && !sessionAuth) {
      // 有localStorage但没有sessionStorage，说明是新会话，清除认证
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('sessionAuthenticated');
      setCurrentPageState('login');
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
    
    // 监听窗口大小变化，自动调整侧边栏状态
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadAllData = async () => {
    try {
      // 并行加载所有数据
      const [videosRes, announcementsRes, chaptersRes, resourceCategoriesRes, videoCategoriesRes] = await Promise.all([
        apiCall('/videos.php'),
        apiCall('/announcements.php'),
        apiCall('/chapters.php'),
        apiCall('/resources.php?action=categories'),
        apiCall('/videos.php?action=categories')
      ]);
      
      setTrainingVideos(videosRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setChapters(chaptersRes.data || []);
      setResourceCategories(resourceCategoriesRes.data || []);
      setVideoCategories(videoCategoriesRes.data || []);
      
      // 如果是管理员，加载用户数据
      if (currentUser?.role === 'admin') {
        const usersRes = await apiCall('/users.php');
        setUsers(usersRes.data || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setErrorMessage('Failed to load data');
    }
  };

  const refreshVideos = async () => {
    try {
      const res = await apiCall('/videos.php');
      // 为每个视频的缩略图URL添加缓存破坏参数（使用视频ID）
      const videosWithCacheBust = (res.data || []).map(video => ({
        ...video,
        thumbnail: video.thumbnail 
          ? (video.thumbnail.includes('?') 
              ? video.thumbnail.split('?')[0] + `?v=${video.id}&_=${Date.now()}` 
              : `${video.thumbnail}?v=${video.id}&_=${Date.now()}`)
          : video.thumbnail
      }));
      setTrainingVideos(videosWithCacheBust);
    } catch (error) {
      console.error('Failed to refresh videos:', error);
    }
  };


  const refreshAnnouncements = async () => {
    try {
      const res = await apiCall('/announcements.php');
      setAnnouncements(res.data || []);
    } catch (error) {
      console.error('Failed to refresh announcements:', error);
    }
  };

  const refreshChapters = async () => {
    try {
      const res = await apiCall('/chapters.php');
      setChapters(res.data || []);
    } catch (error) {
      console.error('Failed to refresh chapters:', error);
    }
  };

  const refreshResourceCategories = async () => {
    try {
      const res = await apiCall('/resources.php?action=categories');
      setResourceCategories(res.data || []);
    } catch (error) {
      console.error('Failed to refresh resource categories:', error);
    }
  };

  const refreshVideoCategories = async () => {
    try {
      const res = await apiCall('/videos.php?action=categories');
      setVideoCategories(res.data || []);
    } catch (error) {
      console.error('Failed to refresh video categories:', error);
    }
  };

  const refreshUsers = useCallback(async () => {
    try {
      const res = await apiCall('/users.php');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Failed to refresh users:', error);
    }
  }, []); // 空依赖数组，因为 setUsers 是稳定的

  const getCompletionRate = (completedVideos) => {
    if (trainingVideos.length === 0) return 0;
    return Math.round(((completedVideos?.length || 0) / trainingVideos.length) * 100);
  };

  const formatFileSize = (mb) => {
    if (!mb) return '';
    if (mb < 1) return `${(mb * 1024).toFixed(0)}KB`;
    return `${mb}MB`;
  };

  const loadVideoUrl = async (videoId) => {
    setLoadingVideoUrl(true);
    try {
      // 从 API 获取视频流 URL
      const video = trainingVideos.find(v => v.id === videoId);
      if (video && video.video_path) {
        return `${API_BASE_URL}/videos.php?stream=${encodeURIComponent(video.video_path)}`;
      }
      return null;
    } catch (error) {
      console.error('Load video error:', error);
      return null;
    } finally {
      setLoadingVideoUrl(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    
    try {
      const result = await apiCall('/auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        })
      });
      
      if (result.success && result.data) {
        localStorage.setItem('authToken', result.data.token);
        localStorage.setItem('currentUser', JSON.stringify(result.data));
        // 标记当前会话已认证
        sessionStorage.setItem('sessionAuthenticated', 'true');
        
        setCurrentUser(result.data);
        setIsLoggedIn(true);
        setCurrentPageState('home');
        setEditingProfile(false);
        setProfileForm({});
        
        loadAllData();
      }
    } catch (error) {
      setErrorMessage(error.message || 'Invalid username or password');
    }
  };

  const handleLogout = async () => {
    try {
      await apiCall('/auth.php?action=logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('sessionAuthenticated');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentPageState('login');
      setLoginForm({ username: '', password: '', remember: false });
      setEditingProfile(false);
      setProfileForm({});
    }
  };

  const handleVideoComplete = async (videoId) => {
    try {
      await apiCall('/progress.php', {
        method: 'POST',
        body: JSON.stringify({ video_id: videoId })
      });
      
      // 更新本地用户数据 - 确保每个视频ID只出现一次
      const currentCompleted = currentUser.completedVideos || [];
      const updatedCompleted = currentCompleted.includes(videoId) 
        ? currentCompleted // 如果已经存在，保持原样
        : [...currentCompleted, videoId]; // 如果不存在，添加新的
      
      const updatedUser = {
        ...currentUser,
        completedVideos: updatedCompleted
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      setSuccessMessage('Marked as completed');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to mark as complete');
    }
  };

  const handleThumbnailChange = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Thumbnail cannot exceed 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditing && editingVideo) {
          setEditingVideo({
            ...editingVideo,
            thumbnail: reader.result,
            thumbnailFile: file
          });
        } else {
          setNewVideoForm({
            ...newVideoForm,
            thumbnail: file,
            thumbnailPreview: reader.result
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMessage('Please select a valid image file');
    }
  };

  const handleVideoFileChange = async (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid video file');
      return;
    }
    
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    if (file.size > 500 * 1024 * 1024) {
      if (!window.confirm(`Video file is large (${fileSizeMB}MB), upload may take time. Continue?`)) {
        return;
      }
    }
    
    if (isEditing && editingVideo) {
      setEditingVideo({
        ...editingVideo,
        videoFile: file,
        fileSize: fileSizeMB
      });
    } else {
      setNewVideoForm({
        ...newVideoForm,
        videoFile: file,
        fileSize: fileSizeMB
      });
    }
  };

  const handleAddVideo = async () => {
    setErrorMessage('');
    
    if (!newVideoForm.title || !newVideoForm.category || !newVideoForm.section || !newVideoForm.module) {
      setErrorMessage('Please fill in video title, category, section and module');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append('title', newVideoForm.title);
      formData.append('duration', newVideoForm.duration || 'TBD');
      formData.append('category', newVideoForm.category);
      formData.append('section', newVideoForm.section);
      formData.append('module', newVideoForm.module);
      formData.append('description', newVideoForm.description || 'No description');
      
      if (newVideoForm.thumbnail) {
        formData.append('thumbnail', newVideoForm.thumbnail);
      }
      
      if (newVideoForm.videoFile) {
        formData.append('video', newVideoForm.videoFile);
      }
      
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      await apiCall('/videos.php', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setShowAddVideoModal(false);
        setNewVideoForm({
          title: '',
          duration: '',
          category: '',
          section: '',
          module: '',
          description: '',
          thumbnail: null,
          thumbnailPreview: '',
          videoFile: null,
          fileSize: null
        });
        setSuccessMessage('Video added successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        refreshVideos();
      }, 500);
      
    } catch (error) {
      setErrorMessage(error.message || 'Failed to add video');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateVideo = async () => {
    if (!editingVideo) return;
    
    setIsUploading(true);
    
    try {
      // 只发送JSON数据，不再支持文件上传
      await apiCall(`/videos.php?id=${editingVideo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingVideo.title,
          duration: editingVideo.duration || 'TBD',
          category: editingVideo.category,
          section: editingVideo.section,
          module: editingVideo.module,
          description: editingVideo.description || 'No description'
        })
      });
      
      setIsUploading(false);
      setEditingVideo(null);
      setSuccessMessage('Video information updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      refreshVideos();
    } catch (error) {
      setIsUploading(false);
      setErrorMessage(error.message || 'Update failed');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await apiCall(`/videos.php?id=${videoId}`, {
        method: 'DELETE'
      });
      
      setSuccessMessage('Video deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      refreshVideos();
    } catch (error) {
      setErrorMessage(error.message || 'Delete failed');
    }
  };


  const handleUpdateProfile = async () => {
    try {
      await apiCall(`/users.php?id=${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          username: profileForm.username,
          name: profileForm.name,
          phone: profileForm.phone,
          address: profileForm.address,
          rank: profileForm.rank
        })
      });
      
      const updatedUser = {
        ...currentUser,
        username: profileForm.username,
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
        rank: profileForm.rank
      };
      
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setEditingProfile(false);
      setProfileForm({});
      setSuccessMessage('Personal information updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.message || 'Update failed');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('File size must be less than 2MB');
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users.php?id=${currentUser.id}&action=upload_avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        const updatedUser = {
          ...currentUser,
          avatar: result.data.avatar_url
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setSuccessMessage('Avatar updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      setErrorMessage('Failed to upload avatar: ' + error.message);
    }
  };

  if (!isLoggedIn && (currentPage === 'login')) {
    return (
      <LoginPage
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        handleLogin={handleLogin}
        errorMessage={errorMessage}
        setCurrentPage={setCurrentPage}
      />
    );
  }

  if (isLoggedIn) {
    const completedVideos = currentUser?.completedVideos || [];
    

    return (
      <div className="flex h-screen bg-gray-50 relative">
        {sidebarOpen && (
          <div 
            className="sidebar-overlay lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Sidebar 
          sidebarOpen={sidebarOpen}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
        />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden main-content-mobile">
          <Header 
            currentPage={currentPage}
            setSidebarOpen={setSidebarOpen}
            sidebarOpen={sidebarOpen}
            currentUser={currentUser}
            handleLogout={handleLogout}
            setCurrentPage={setCurrentPage}
          />
          
          <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-y-auto overflow-x-hidden mobile-padding pb-20 lg:pb-6">
            <Notification 
              message={successMessage} 
              type="success" 
              onClose={() => setSuccessMessage('')} 
            />
            <Notification 
              message={errorMessage} 
              type="error" 
              onClose={() => setErrorMessage('')} 
            />
            
            {currentPage === 'home' && (
              <HomePage
                currentUser={currentUser}
                users={users}
                trainingVideos={trainingVideos}
                setCurrentPage={setCurrentPage}
                setSelectedVideo={setSelectedVideo}
                loadVideoUrl={loadVideoUrl}
                getCompletionRate={getCompletionRate}
                refreshUsers={refreshUsers}
              />
            )}
            
            {currentPage === 'videos' && (
              <VideosPage
                trainingVideos={trainingVideos}
                completedVideos={completedVideos}
                setCurrentPage={setCurrentPage}
                setSelectedVideo={setSelectedVideo}
                loadVideoUrl={loadVideoUrl}
              />
            )}
            
            {currentPage === 'video-player' && (
              <VideoPlayer
                selectedVideo={selectedVideo}
                loadingVideoUrl={loadingVideoUrl}
                currentUser={currentUser}
                completedVideos={completedVideos}
                handleVideoComplete={handleVideoComplete}
                formatFileSize={formatFileSize}
                trainingVideos={trainingVideos}
                setSelectedVideo={setSelectedVideo}
                setCurrentPage={setCurrentPage}
                loadVideoUrl={loadVideoUrl}
              />
            )}
            
            
            {currentPage === 'video-management' && currentUser.role === 'admin' && (
              <VideoManagement
                trainingVideos={trainingVideos}
                setTrainingVideos={setTrainingVideos}
                setShowAddVideoModal={setShowAddVideoModal}
                setEditingVideo={setEditingVideo}
                handleDeleteVideo={handleDeleteVideo}
                setErrorMessage={setErrorMessage}
                setSuccessMessage={setSuccessMessage}
                formatFileSize={formatFileSize}
                chapters={chapters}
              />
            )}
            
            {currentPage === 'employee-management' && currentUser.role === 'admin' && (
              <EmployeeManagement
                users={users}
                trainingVideos={trainingVideos}
                getCompletionRate={getCompletionRate}
                refreshUsers={refreshUsers}
                currentUser={currentUser}
              />
            )}
            
            {currentPage === 'termination-records' && currentUser.role === 'admin' && (
              <TerminationRecordsPage
                currentUser={currentUser}
              />
            )}
            
            
            {currentPage === 'department-management' && currentUser.role === 'admin' && (
              <AdminDepartmentsPage
                currentUser={currentUser}
              />
            )}

            
            {currentPage === 'announcements' && (
              <AnnouncementsPage
                currentUser={currentUser}
                announcements={announcements}
                setAnnouncements={setAnnouncements}
                setSuccessMessage={setSuccessMessage}
                setErrorMessage={setErrorMessage}
                refreshAnnouncements={refreshAnnouncements}
                apiCall={apiCall}
              />
            )}
            
            {currentPage === 'resource-center' && (
              <ResourceCenter
                currentUser={currentUser}
              />
            )}
            
            {currentPage === 'category-management' && (
              <CategoryManagement
                currentUser={currentUser}
              />
            )}
            
            {currentPage === 'video-category-management' && (
              <VideoCategoryManagement
                currentUser={currentUser}
                refreshVideoCategories={refreshVideoCategories}
              />
            )}
            
            {currentPage === 'chapter-management' && (
              <ChapterManagement
                currentUser={currentUser}
                chapters={chapters}
                refreshChapters={refreshChapters}
              />
            )}
            
            {currentPage === 'hr-center' && (
              <HRCenter 
                currentUser={currentUser}
              />
            )}
            
            {currentPage === 'admin-hr-center' && currentUser.role === 'admin' && (
              <AdminHRCenter 
                users={users}
              />
            )}
            
            {currentPage === 'add-user' && currentUser.role === 'admin' && (
              <AddUserPage
                currentUser={currentUser}
                setSuccessMessage={setSuccessMessage}
                setErrorMessage={setErrorMessage}
                refreshUsers={refreshUsers}
                apiCall={apiCall}
              />
            )}
            
            
            {currentPage === 'profile' && (
              <ProfilePage
                currentUser={currentUser}
                editingProfile={editingProfile}
                setEditingProfile={setEditingProfile}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                handleUpdateProfile={handleUpdateProfile}
                handleAvatarUpload={handleAvatarUpload}
                apiCall={apiCall}
                setSuccessMessage={setSuccessMessage}
                setErrorMessage={setErrorMessage}
              />
            )}
          </main>
        </div>
        
        <AddVideoModal
          show={showAddVideoModal}
          onClose={() => {
            setShowAddVideoModal(false);
            setNewVideoForm({
              title: '',
              duration: '',
              category: '',
              section: '',
              module: '',
              description: '',
              thumbnail: null,
              thumbnailPreview: '',
              videoFile: null,
              fileSize: null
            });
          }}
          newVideoForm={newVideoForm}
          setNewVideoForm={setNewVideoForm}
          handleThumbnailChange={handleThumbnailChange}
          handleVideoFileChange={handleVideoFileChange}
          handleAddVideo={handleAddVideo}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          chapters={chapters}
          categories={videoCategories}
        />
        
        <EditVideoModal
          show={!!editingVideo}
          video={editingVideo}
          setEditingVideo={setEditingVideo}
          handleUpdateVideo={handleUpdateVideo}
          isUploading={isUploading}
          formatFileSize={formatFileSize}
          chapters={chapters}
          categories={videoCategories}
        />
        
        {/* 移动端底部导航栏 */}
        <MobileBottomNav
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
        />
        
      </div>
    );
  }

  return null;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TrainingPlatform />);