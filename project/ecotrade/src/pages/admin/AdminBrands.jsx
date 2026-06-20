import React, { useState, useEffect } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTypes,
  createNewType,
  updateExistingType,
  deleteType
} from '../../store/slices/productSlice';
import { uploadSingleImage } from '../../store/slices/uploadSlice';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AdminBrands = () => {
  const dispatch = useDispatch();
  const { types, loading } = useSelector((state) => state.products);
  const { uploading } = useSelector((state) => state.upload);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    dispatch(fetchTypes());
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredBrands = types.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        logo: brand.logo || ''
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        logo: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setFormData({
      name: '',
      logo: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await dispatch(uploadSingleImage({
        file,
        folder: 'brands',
        key: 'brandLogo'
      })).unwrap();
      setFormData({ ...formData, logo: result.url });
    } catch (error) {
      alert('Failed to upload logo. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Brand name is required');
      return;
    }

    try {
      if (editingBrand) {
        await dispatch(updateExistingType({
          id: editingBrand.id || editingBrand._id,
          typeData: formData
        })).unwrap();
        alert('Brand updated successfully!');
      } else {
        await dispatch(createNewType(formData)).unwrap();
        alert('Brand created successfully!');
      }
      handleCloseModal();
    } catch (error) {
      alert(error.message || 'Failed to save brand');
    }
  };

  const handleDelete = (brand) => {
    setDeleteConfirmation(brand);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteType(deleteConfirmation.id || deleteConfirmation._id)).unwrap();
      alert('Brand deleted successfully!');
      setDeleteConfirmation(null);
    } catch (error) {
      alert(error.message || 'Failed to delete brand. It may have products assigned to it.');
      setDeleteConfirmation(null);
    }
  };

  if (loading && types.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Brands Management</h1>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => handleOpenModal()}
        >
          Add Brand
        </Button>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search brands..."
          value={searchTerm}
          onChange={handleSearch}
          leftIcon={<Search className="h-5 w-5 text-gray-400" />}
          fullWidth
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBrands.map((brand) => (
                <tr key={brand.id || brand._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="h-10 w-10 rounded object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No Logo</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(brand)}
                      className="text-green-600 hover:text-blue-900 mr-3"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(brand)}
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

        {filteredBrands.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No brands found</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name *
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
                      Brand Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mb-2"
                    />
                    {uploading['brandLogo'] && (
                      <p className="text-sm text-green-600">Uploading logo...</p>
                    )}
                    {formData.logo && (
                      <img
                        src={formData.logo}
                        alt="Preview"
                        className="mt-2 h-20 w-20 object-contain rounded border"
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
                    {editingBrand ? 'Update' : 'Create'}
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
                Are you sure you want to delete the brand "{deleteConfirmation.name}"?
                This action cannot be undone and may fail if products are using this brand.
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

export default AdminBrands;
