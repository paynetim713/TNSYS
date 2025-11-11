// Login page component - English version with fixed logo
const LoginPage = ({ loginForm, setLoginForm, handleLogin, errorMessage, setCurrentPage }) => {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg relative">
      {/* Large floating decorations */}
      <div className="floating-shapes">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>
      
      {/* Left title area - Desktop only */}
      <div className="hidden lg:block absolute top-6 left-6 z-20">
        <img 
          src="./js/components/logo/ACA-logo.jpeg" 
          alt="ACA Training" 
          className="h-16 w-auto"
        />
      </div>

      
      {/* Central login form - Glass morphism */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Mobile title - only show on mobile */}
        <div className="lg:hidden text-center mb-8">
          <img 
            src="./js/components/logo/ACA-logo.jpeg" 
            alt="ACA Training" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h2 className="text-3xl font-light text-white/90">Training Platform</h2>
        </div>
        
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Login</h2>
            <p className="text-white/70">Please enter your account credentials</p>
          </div>
          
          {errorMessage && (
            <div className="bg-red-500/20 border-l-4 border-red-500 text-white px-4 py-3 rounded mb-6 backdrop-blur-sm">
              {errorMessage}
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/40 transition"
                placeholder="Enter username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/40 transition"
                placeholder="Enter password"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={loginForm.remember}
                  onChange={(e) => setLoginForm({...loginForm, remember: e.target.checked})}
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-white focus:ring-white/30"
                />
                <span className="ml-2 text-sm text-white/80">Remember password</span>
              </label>
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white py-3 rounded-xl font-semibold transition shadow-lg border border-white/30"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};