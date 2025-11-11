// Add Video Modal - with Section and Module fields
const AddVideoModal = ({ 
  show, 
  onClose, 
  newVideoForm, 
  setNewVideoForm,
  handleThumbnailChange, 
  handleVideoFileChange, 
  handleAddVideo,
  isUploading,
  uploadProgress,
  chapters = [],
  categories = []
}) => {
  if (!show) return null;
  
  // Debug: Log chapters data
  console.log('AddVideoModal chapters:', chapters);

  return (
    <div className="modal-container">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="text-xl font-bold text-gray-800">Upload New Video</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">✕</span>
          </button>
        </div>
        
        <div className="modal-body">
          <UploadProgress progress={uploadProgress} isUploading={isUploading} />
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video Title *</label>
              <input
                type="text"
                value={newVideoForm.title}
                onChange={(e) => setNewVideoForm({...newVideoForm, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Company Culture Training"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chapter *</label>
                <select
                  value={newVideoForm.section}
                  onChange={(e) => {
                    const selectedChapter = chapters.find(c => c.name === e.target.value);
                    const firstModule = selectedChapter?.modules?.[0];
                    const moduleValue = firstModule ? (typeof firstModule === 'string' ? firstModule : firstModule.module_name) : '';
                    setNewVideoForm({
                      ...newVideoForm, 
                      section: e.target.value,
                      module: moduleValue
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Chapter</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.name}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Module *</label>
                <select
                  value={newVideoForm.module}
                  onChange={(e) => setNewVideoForm({...newVideoForm, module: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  disabled={!newVideoForm.section}
                >
                  <option value="">Select Module</option>
                  {chapters
                    .find(c => c.name === newVideoForm.section)
                    ?.modules?.map((module) => (
                      <option key={typeof module === 'string' ? module : module.module_name} value={typeof module === 'string' ? module : module.module_name}>
                        {typeof module === 'string' ? module : module.module_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={newVideoForm.category}
                  onChange={(e) => setNewVideoForm({...newVideoForm, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={newVideoForm.duration}
                  onChange={(e) => setNewVideoForm({...newVideoForm, duration: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g.: 25"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newVideoForm.description}
                onChange={(e) => setNewVideoForm({...newVideoForm, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                rows="3"
                placeholder="Enter video description..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Thumbnail Image</label>
              <div className="upload-area rounded-lg p-6 text-center cursor-pointer" onClick={() => document.getElementById('thumbnail-input').click()}>
                {newVideoForm.thumbnailPreview ? (
                  <img src={newVideoForm.thumbnailPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                ) : (
                  <>
                    <span className="text-4xl mb-2 block">📷</span>
                    <p className="text-gray-600">Click to upload thumbnail image</p>
                    <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, max 5MB</p>
                  </>
                )}
              </div>
              <input
                id="thumbnail-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleThumbnailChange(e, false)}
                className="hidden"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Video File *</label>
              <div className="upload-area rounded-lg p-6 text-center cursor-pointer" onClick={() => document.getElementById('video-input').click()}>
                {newVideoForm.videoFile ? (
                  <>
                    <span className="text-4xl mb-2 block">✓</span>
                    <p className="text-green-600 font-medium">{newVideoForm.videoFile.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{newVideoForm.fileSize}MB</p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl mb-2 block">🎬</span>
                    <p className="text-gray-600">Click to upload video file</p>
                    <p className="text-xs text-gray-500 mt-1">Supports MP4, MOV, AVI formats</p>
                    <p className="text-xs text-orange-500 mt-1">Recommended: under 500MB, 20-30 minutes</p>
                  </>
                )}
              </div>
              <input
                id="video-input"
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoFileChange(e, false)}
                className="hidden"
              />
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <div className="flex space-x-3">
            <button
              onClick={handleAddVideo}
              disabled={isUploading}
              className="flex-1 gradient-bg text-white py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Confirm Upload'}
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

// Edit Video Modal - with Section and Module fields
const EditVideoModal = ({ 
  show, 
  video, 
  setEditingVideo, 
  handleUpdateVideo,
  isUploading,
  formatFileSize,
  chapters = [],
  categories = []
}) => {
  const { useRef, useEffect } = React;
  const descriptionRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px';
    }
  }, [video?.description]);

  if (!show || !video) return null;

  return (
    <div className="modal-container">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="text-xl font-bold text-gray-800">Edit Video</h3>
          <button onClick={() => setEditingVideo(null)} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">✕</span>
          </button>
        </div>
        
        <div className="modal-body">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video Title *</label>
              <input
                type="text"
                value={video.title || ''}
                onChange={(e) => setEditingVideo({...video, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chapter *</label>
                <select
                  value={video.section || ''}
                  onChange={(e) => {
                    const selectedChapter = chapters.find(c => c.name === e.target.value);
                    const firstModule = selectedChapter?.modules?.[0];
                    const moduleValue = firstModule ? (typeof firstModule === 'string' ? firstModule : firstModule.module_name) : video.module || '';
                    setEditingVideo({
                      ...video, 
                      section: e.target.value,
                      module: moduleValue
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Chapter</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.name}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Module *</label>
                <select
                  value={video.module || ''}
                  onChange={(e) => setEditingVideo({...video, module: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  disabled={!video.section}
                >
                  <option value="">Select Module</option>
                  {chapters
                    .find(c => c.name === video.section)
                    ?.modules?.map((module) => (
                      <option key={typeof module === 'string' ? module : module.module_name} value={typeof module === 'string' ? module : module.module_name}>
                        {typeof module === 'string' ? module : module.module_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={video.category || ''}
                  onChange={(e) => setEditingVideo({...video, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="text"
                  value={video.duration || ''}
                  onChange={(e) => setEditingVideo({...video, duration: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g.: 25"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                ref={descriptionRef}
                value={video.description || ''}
                onChange={(e) => {
                  setEditingVideo({...video, description: e.target.value});
                  // Auto-resize on change
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none overflow-hidden min-h-[60px]"
                placeholder="Enter video description..."
                style={{ minHeight: '60px' }}
              />
            </div>
            
            {/* Video file information (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
              <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                {video.hasVideo ? (
                  <>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-600 text-xl">✓</span>
                      <span className="text-green-600 font-medium">Video uploaded</span>
                    </div>
                    <p className="text-sm text-gray-600">File size: {formatFileSize(video.fileSize || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Video and thumbnail cannot be replaced during editing. Please delete and re-upload if you need to change them.</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-gray-400 text-xl">⚠</span>
                      <span className="text-gray-600">No video uploaded</span>
                    </div>
                    <p className="text-xs text-gray-500">Video file needs to be uploaded during creation and cannot be replaced during editing.</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Thumbnail information (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
              <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                {video.thumbnail ? (
                  <>
                    <img src={video.thumbnail} alt="Thumbnail" className="w-full h-40 object-cover rounded-lg mb-2" />
                    <p className="text-xs text-gray-500">Thumbnail cannot be replaced during editing. Please delete and re-upload if you need to change it.</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center h-40">
                      <span className="text-gray-400">No thumbnail</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Thumbnail needs to be uploaded during creation and cannot be replaced during editing.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <div className="flex space-x-3">
            <button
              onClick={handleUpdateVideo}
              disabled={isUploading}
              className="flex-1 gradient-bg text-white py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {isUploading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditingVideo(null)}
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