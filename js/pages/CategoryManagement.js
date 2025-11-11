// Category Management Page - Manage Resource Center categories
const CategoryManagement = ({ 
  currentUser 
}) => {
  const { useState, useEffect } = React;
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadResources();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources.php?action=categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources.php', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setResources(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert('Please enter category name');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'add_category',
          name: newCategory
        })
      });

      const result = await response.json();
      if (result.success) {
        setNewCategory('');
        loadCategories();
        alert('Category added successfully');
      } else {
        alert('Failed to add category: ' + result.error);
      }
    } catch (error) {
      alert('Failed to add category: ' + error.message);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category);
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryName.trim()) {
      alert('Please enter category name');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources.php', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_category',
          old_name: editingCategory,
          new_name: editCategoryName
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditingCategory(null);
        setEditCategoryName('');
        loadCategories();
        loadResources();
        alert('Category updated successfully');
      } else {
        alert('Failed to update category: ' + result.error);
      }
    } catch (error) {
      alert('Failed to update category: ' + error.message);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? This will also remove the category from all resources using it.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/resources.php', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete_category',
          name: categoryName
        })
      });

      const result = await response.json();
      if (result.success) {
        loadCategories();
        loadResources();
        alert('Category deleted successfully');
      } else {
        alert('Failed to delete category: ' + result.error);
      }
    } catch (error) {
      alert('Failed to delete category: ' + error.message);
    }
  };

  const getCategoryFileCount = (categoryName) => {
    return resources.filter(resource => resource.category === categoryName).length;
  };

  return (
    <div className="w-full px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
        <p className="text-gray-500 mt-1">Manage Resource Center categories</p>
      </div>

      {/* Add New Category */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Category</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter category name"
          />
          <button
            onClick={handleAddCategory}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Categories</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
            </div>
            <h4 className="text-lg font-semibold text-gray-600 mb-2">No Categories</h4>
            <p className="text-gray-500">No categories have been created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                {editingCategory === category ? (
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleUpdateCategory}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setEditCategoryName('');
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{category}</h4>
                      <p className="text-sm text-gray-500">
                        {getCategoryFileCount(category)} file(s) using this category
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
