import React, { useState, useEffect } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, Image as ImageIcon, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCollections,
  createCollection,
  updateCollection,
  deleteCollection
} from '../../store/slices/collectionSlice';
import { uploadSingleImage } from '../../store/slices/uploadSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AdminCollections = () => {
  const dispatch = useDispatch();
  const { collections, loading, error } = useSelector((state) => state.collections);
  const { uploading } = useSelector((state) => state.upload);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parentCategory: 'More Electronics',
    displayOrder: 0,
    isActive: true
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    dispatch(fetchCollections({ includeInactive: true }));
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (collection = null) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData({
        name: collection.name,
        description: collection.description || '',
        image: collection.image || '',
        parentCategory: collection.parentCategory || 'More Electronics',
        displayOrder: collection.displayOrder || 0,
        isActive: collection.isActive !== undefined ? collection.isActive : true
      });
    } else {
      setEditingCollection(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        parentCategory: 'More Electronics',
        displayOrder: 0,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCollection(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      parentCategory: 'More Electronics',
      displayOrder: 0,
      isActive: true
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await dispatch(uploadSingleImage({
        file,
        folder: 'collections',
        key: 'collectionImage'
      })).unwrap();
      setFormData({ ...formData, image: result.url });
    } catch (error) {
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Collection name is required');
      return;
    }

    try {
      if (editingCollection) {
        await dispatch(updateCollection({
          id: editingCollection.id || editingCollection._id,
          collectionData: formData
        })).unwrap();
        alert('Collection updated successfully!');
      } else {
        await dispatch(createCollection(formData)).unwrap();
        alert('Collection created successfully!');
      }
      handleCloseModal();
    } catch (error) {
      alert(error.message || 'Failed to save collection');
    }
  };

  const handleDelete = async (collection) => {
    if (collection.productCount > 0) {
      alert(`Cannot delete "${collection.name}" because it has ${collection.productCount} product(s). Please reassign or delete those products first.`);
      return;
    }

    setDeleteConfirmation(collection);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteCollection(deleteConfirmation.id || deleteConfirmation._id)).unwrap();
      alert('Collection deleted successfully!');
      setDeleteConfirmation(null);
    } catch (error) {
      alert(error.message || 'Failed to delete collection');
      setDeleteConfirmation(null);
    }
  };

  if (loading && collections.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collections Management</h1>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => handleOpenModal()}
        >
          Add Collection
        </Button>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search collections..."
          value={searchTerm}
          onChange={handleSearch}
          leftIcon={<Search className="h-5 w-5 text-gray-400" />}
          fullWidth
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollections.map((collection) => (
                <tr key={collection.id || collection._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {collection.image ? (
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{collection.name}</div>
                    {collection.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {collection.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{collection.parentCategory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {collection.productCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {collection.displayOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        collection.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {collection.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(collection)}
                      className="text-green-600 hover:text-blue-900 mr-3"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(collection)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No collections found</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingCollection ? 'Edit Collection' : 'Add New Collection'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Name *
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Category
                    </label>
                    <Input
                      type="text"
                      name="parentCategory"
                      value={formData.parentCategory}
                      onChange={handleChange}
                      fullWidth
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Order
                      </label>
                      <Input
                        type="number"
                        name="displayOrder"
                        value={formData.displayOrder}
                        onChange={handleChange}
                        min="0"
                        fullWidth
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mb-2"
                    />
                    {uploading['collectionImage'] && (
                      <p className="text-sm text-green-600">Uploading image...</p>
                    )}
                    {formData.image && (
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="mt-2 h-32 w-32 object-cover rounded"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    {editingCollection ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the collection "{deleteConfirmation.name}"?
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmation(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCollections;
