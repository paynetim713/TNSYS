// 移动端底部导航栏组件
const MobileBottomNav = ({ currentPage, setCurrentPage, currentUser }) => {
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: '🏠', page: 'home' },
    { id: 'videos', label: 'Videos', icon: '🎥', page: 'videos' },
    { id: 'announcements', label: 'News', icon: '📢', page: 'announcements' },
    { id: 'hr-center', label: 'HR', icon: '👥', page: 'hr-center' },
    { id: 'profile', label: 'Profile', icon: '👤', page: 'profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
      <div className="flex justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.page)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
              currentPage === item.page 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 侧边栏组件 
const Sidebar = ({ sidebarOpen, currentPage, setCurrentPage, currentUser }) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => {
      const newState = { ...prev };
      
      // 如果点击已展开的菜单，则关闭它
      if (prev[menuName]) {
        newState[menuName] = false;
        return newState;
      }
      
      // 如果点击不同的菜单，先关闭其他菜单
      const hasOtherExpanded = Object.keys(prev).some(key => key !== menuName && prev[key]);
      
      if (hasOtherExpanded) {
        // 首先关闭所有其他菜单
        Object.keys(prev).forEach(key => {
          if (key !== menuName) {
            newState[key] = false;
          }
        });
        
        // 然后短暂延迟后打开新菜单
        setTimeout(() => {
          setExpandedMenus(current => ({
            ...current,
            [menuName]: true
          }));
        }, 150);
        
        return newState;
      } else {
        // 没有其他菜单展开，只需切换点击的菜单
        newState[menuName] = !prev[menuName];
        return newState;
      }
    });
  };

  return (
    <div className={`sidebar-gradient text-white transition-all duration-300 flex flex-col h-full shadow-2xl ${sidebarOpen ? 'w-64' : 'w-20'} lg:relative lg:translate-x-0 ${!sidebarOpen ? 'lg:w-20' : 'lg:w-64'} ${sidebarOpen ? 'sidebar-mobile open' : 'sidebar-mobile'} hidden lg:flex`}>
      {/* 固定Logo头部 */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
          {sidebarOpen ? (
            <div className="w-full p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <img 
                src="./js/components/logo/ACA-logo.jpeg" 
                alt="ACA Training" 
                className="h-16 w-auto mx-auto rounded-lg"
              />
            </div>
          ) : (
            // Collapsed state
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/20 backdrop-blur-sm">
              <span className="text-white font-bold text-sm">ACA</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Scrollable Navigation */}
      <div className={`flex-1 sidebar-scroll ${sidebarOpen ? 'px-6' : 'px-2'}`}>
        <nav className="space-y-6">
          {/* Dashboard Section */}
          <div className="space-y-2">
            {sidebarOpen && (
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Dashboard</h3>
              </div>
            )}
            <button
              onClick={() => setCurrentPage('home')}
              className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${
                sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
              } ${currentPage === 'home' ? 'active bg-white/10 shadow-md' : ''}`}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              {sidebarOpen && <span className="font-medium">Dashboard</span>}
            </button>
          </div>

          {/* Training Section */}
          <div className="space-y-2">
            {sidebarOpen && (
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Training</h3>
              </div>
            )}
            <button
              onClick={() => setCurrentPage('videos')}
              className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${
                sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
              } ${currentPage === 'videos' ? 'active bg-white/10 shadow-md' : ''}`}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              {sidebarOpen && <span className="font-medium">Training Videos</span>}
            </button>

            {currentUser.role === 'admin' && (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    if (sidebarOpen) {
                      toggleMenu('video');
                    } else {
                      setCurrentPage('video-management');
                    }
                  }}
                  className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all ${
                    sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
                  } ${currentPage === 'video-management' || currentPage === 'video-category-management' || currentPage === 'chapter-management' ? 'active' : ''}`}
                >
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                  {sidebarOpen && (
                    <>
                      <span className="font-medium">Video Management</span>
                      <div className={`ml-auto transition-transform duration-300 ease-in-out ${expandedMenus.video ? 'rotate-90' : 'rotate-0'}`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    </>
                  )}
                </button>
                
                {/* Submenu */}
                {sidebarOpen && (
                  <div className={`ml-6 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedMenus.video ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <button
                      onClick={() => setCurrentPage('video-management')}
                      className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 space-x-3 px-4 py-2 text-sm hover:bg-white/10 hover:scale-[1.02] ${
                        currentPage === 'video-management' ? 'active' : ''
                      }`}
                    >
                      <div className="w-4 h-4 flex-shrink-0"></div>
                      <span className="font-medium">Videos</span>
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage('chapter-management')}
                      className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 space-x-3 px-4 py-2 text-sm hover:bg-white/10 hover:scale-[1.02] ${
                        currentPage === 'chapter-management' ? 'active' : ''
                      }`}
                    >
                      <div className="w-4 h-4 flex-shrink-0"></div>
                      <span className="font-medium">Chapters</span>
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage('video-category-management')}
                      className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all space-x-3 px-4 py-2 text-sm ${
                        currentPage === 'video-category-management' ? 'active' : ''
                      }`}
                    >
                      <div className="w-4 h-4 flex-shrink-0"></div>
                      <span className="font-medium">Categories</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Employee Management Section */}
          {currentUser.role === 'admin' && (
            <div className="space-y-2">
              {sidebarOpen && (
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Employee Management</h3>
                </div>
              )}
              
              <button
                onClick={() => setCurrentPage('employee-management')}
                className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${
                  sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
                } ${currentPage === 'employee-management' ? 'active bg-white/10 shadow-md' : ''}`}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                {sidebarOpen && <span className="font-medium">Employees</span>}
              </button>
              
              <button
                onClick={() => setCurrentPage('termination-records')}
                className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${
                  sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
                } ${currentPage === 'termination-records' ? 'active bg-white/10 shadow-md' : ''}`}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {sidebarOpen && <span className="font-medium">Termination Records</span>}
              </button>

              <button
                onClick={() => setCurrentPage('department-management')}
                className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${
                  sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
                } ${currentPage === 'department-management' ? 'active bg-white/10 shadow-md' : ''}`}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                {sidebarOpen && <span className="font-medium">Departments</span>}
              </button>

              <button
                onClick={() => setCurrentPage('add-user')}
                className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${
                  sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
                } ${currentPage === 'add-user' ? 'active bg-white/10 shadow-md' : ''}`}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                {sidebarOpen && <span className="font-medium">Add User</span>}
              </button>
            </div>
          )}
          
          
          {/* Resources Section */}
          <div className="space-y-2">
            {sidebarOpen && (
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Resources</h3>
              </div>
            )}
            
            <button
              onClick={() => setCurrentPage('announcements')}
              className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${
                sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
              } ${currentPage === 'announcements' ? 'active bg-white/10 shadow-md' : ''}`}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              {sidebarOpen && <span className="font-medium">Announcements</span>}
            </button>
          
            {/* Resource Center Menu */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (sidebarOpen) {
                    toggleMenu('resource');
                  } else {
                    setCurrentPage('resource-center');
                  }
                }}
                className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all ${
                  sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
                } ${currentPage === 'resource-center' || currentPage === 'category-management' ? 'active' : ''}`}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                {sidebarOpen && (
                  <>
                    <span className="font-medium">Resource Center</span>
                    <div className={`ml-auto transition-transform duration-300 ease-in-out ${expandedMenus.resource ? 'rotate-90' : 'rotate-0'}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </>
                )}
              </button>
              
              {/* Submenu */}
              {sidebarOpen && (
                <div className={`ml-6 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedMenus.resource ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <button
                    onClick={() => setCurrentPage('resource-center')}
                    className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 space-x-3 px-4 py-2 text-sm hover:bg-white/10 hover:scale-[1.02] ${
                      currentPage === 'resource-center' ? 'active' : ''
                    }`}
                  >
                    <div className="w-4 h-4 flex-shrink-0"></div>
                    <span className="font-medium">Files</span>
                  </button>
                  
                  {currentUser && currentUser.role === 'admin' && (
                    <button
                      onClick={() => setCurrentPage('category-management')}
                      className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 space-x-3 px-4 py-2 text-sm hover:bg-white/10 hover:scale-[1.02] ${
                        currentPage === 'category-management' ? 'active' : ''
                      }`}
                    >
                      <div className="w-4 h-4 flex-shrink-0"></div>
                      <span className="font-medium">Categories</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* HR Section */}
          <div className="space-y-2">
            {sidebarOpen && (
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">HR</h3>
              </div>
            )}
            
            <button
              onClick={() => setCurrentPage('hr-center')}
              className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${
                sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
              } ${currentPage === 'hr-center' ? 'active bg-white/10 shadow-md' : ''}`}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {sidebarOpen && <span className="font-medium">HR Center</span>}
            </button>
            
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setCurrentPage('admin-hr-center')}
                className={`sidebar-item w-full flex items-center rounded-lg text-left transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${
                  sidebarOpen ? 'space-x-3 px-4 py-3' : 'justify-center py-3 px-1'
                } ${currentPage === 'admin-hr-center' ? 'active bg-white/10 shadow-md' : ''}`}
              >
                <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                {sidebarOpen && <span className="font-medium">Admin HR Center</span>}
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

const Header = ({ currentPage, setSidebarOpen, sidebarOpen, currentUser, handleLogout, setCurrentPage }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, right: 0 });
  const userMenuRef = React.useRef(null);
  
  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // 计算菜单位置
  React.useEffect(() => {
    if (showUserMenu && userMenuRef.current) {
      const rect = userMenuRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right - window.scrollX
      });
    }
  }, [showUserMenu]);
  
  const getPageTitle = () => {
    const titles = {
      'home': 'Dashboard',
      'videos': 'Training Videos',
      'video-management': 'Video Management',
      'chapter-management': 'Chapter Management',
      'video-category-management': 'Video Categories',
      'employee-management': 'Employee Management',
      'termination-records': 'Termination Records',
      'department-management': 'Department Management',
      'profile': 'Profile',
      'video-player': 'Video Player',
      'announcements': 'Announcements',
      'resource-center': 'Resource Center',
      'category-management': 'Resource Categories',
      'hr-center': 'HR Center',
      'admin-hr-center': 'Admin HR Center',
      'add-user': 'Add User'
    };
    return titles[currentPage] || '';
  };

  return (
    <header className="bg-white shadow-sm px-4 lg:px-6 py-4 overflow-visible">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* 移动端隐藏，桌面端显示 */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="hidden lg:block text-gray-600 hover:text-gray-800 transition-transform hover:scale-110"
          >
            <span className="text-2xl">☰</span>
          </button>
          <h1 className="text-lg lg:text-xl font-semibold text-gray-800 gradient-text mobile-text-lg">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="relative user-menu-container" style={{zIndex: 9999}}>
            <div 
              ref={userMenuRef}
              className="flex items-center space-x-2 lg:space-x-3 hover:bg-gray-50 rounded-lg px-2 lg:px-3 py-2 transition-all cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
            >
           <img 
             src={getAvatarUrl(currentUser)} 
                alt="" 
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-full ring-2 ring-blue-500 ring-offset-2" 
                onError={(e) => {
               e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentUser.name;
                }}
              />
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.role === 'admin' ? 'Administrator' : currentUser.department}</p>
              </div>
              <div className={`transform transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}>
                <span className="text-gray-400">▼</span>
              </div>
            </div>
            
            {/* 下拉菜单 */}
            {showUserMenu && (
              <div 
                className="fixed w-40 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 modal-mobile sm:block hidden" 
                style={{
                  zIndex: 99999,
                  top: `${menuPosition.top}px`,
                  right: `${menuPosition.right}px`
                }}
              >
                <button
                  onClick={() => {
                    setCurrentPage('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3 sm:px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 btn-mobile"
                >
                  <span>👤</span>
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-3 sm:px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 btn-mobile"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* 移动端下拉菜单 */}
            {showUserMenu && (
              <div className="mobile-user-menu sm:hidden">
                <button
                  onClick={() => {
                    setCurrentPage('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-3"
                >
                  <span className="text-lg">👤</span>
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3"
                >
                  <span className="text-lg">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};