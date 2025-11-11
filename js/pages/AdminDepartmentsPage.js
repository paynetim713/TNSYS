const AdminDepartmentsPage = ({ currentUser }) => {
  const { useEffect, useState } = React;
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: null, name: '' });

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments.php');
      const json = await res.json();
      if (json.success) setDepartments(json.data || []);
    } catch (e) {}
  };

  useEffect(() => { loadDepartments(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Department name is required');
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/departments.php', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify(form.id ? { id: form.id, name: form.name } : { name: form.name })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed');
      setForm({ id: null, name: '' });
      loadDepartments();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    setForm({ id: dept.id, name: dept.name });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/departments.php?id=${id}`, { method: 'DELETE', headers: { ...(token && { 'Authorization': `Bearer ${token}` }) } });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed');
      loadDepartments();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="w-full px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Department Management</h2>
        <p className="text-gray-500 mt-1">Create, rename and delete departments</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Department Name *</label>
            <input type="text" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="mt-4 flex space-x-3">
          <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{form.id ? 'Update' : 'Create'}</button>
          {form.id !== null && (
            <button onClick={()=>setForm({ id: null, name: '' })} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {departments.map(d => (
              <tr key={d.id}>
                <td className="px-6 py-3 text-sm text-gray-800">{d.name}</td>
                <td className="px-6 py-3 text-sm space-x-3">
                  <button onClick={()=>handleEdit(d)} className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={()=>handleDelete(d.id)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


