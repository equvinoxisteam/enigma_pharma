import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchProducts, 
  createProduct, 
  updateExistingProduct, 
  deleteProduct,
  fetchTypes,
  createNewType
} from '../../../store/slices/productSlice';
import { resetUploadState } from '../../../store/slices/uploadSlice';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ProductsTable from './components/ProductsTable';
import ProductForm from './components/ProductForm/ProductForm';
import Pagination from './components/Pagination';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';
import ProductConfirmationModal from './components/ProductConfirmationModal';
import ProductDeleteConfirmationModal from './components/ProductDeleteConfirmationModal';

const AdminProducts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products, types, loading, totalPages, currentPage: serverCurrentPage, totalProducts } = useSelector(state => state.products);
   const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
   const [searchTerm, setSearchTerm] = useState('');


  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    message: '',
    productId: null,
    isEditMode: false
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    productName: ''
  });
  
   const productsPerPage = 6; 

    useEffect(() => {
    const params = {
      page: currentPage,
      limit: productsPerPage,
      search: debouncedSearchQuery || undefined, 
      sortBy: 'newest',
    };
    dispatch(fetchProducts(params));
  }, [dispatch, currentPage, debouncedSearchQuery]);

  useEffect(() => {
    dispatch(fetchTypes());
  }, [dispatch]);


   useEffect(() => {
    // Set a timer for 1 second (1000ms)
    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(searchTerm);
      // Reset to page 1 only when a debounced search term is set
      if (searchTerm) {
        setCurrentPage(1);
      }
    }, 1000);

    // This cleanup function runs before the effect runs again, clearing the old timer.
    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]); 

  
  // const totalPages = Math.ceil(filteredAndSortedProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  
    const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleProductClick = (productId) => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
    if (frontendUrl) {
      window.open(`${frontendUrl}/product/${productId}`, '_blank');
    } else {
      navigate(`/product/${productId}`);
    }
  };
  
  const handleDeleteProduct = (product) => {
    setDeleteModal({
      isOpen: true,
      productId: product._id,
      productName: product.name
    });
  };

  const confirmDeleteProduct = async () => {
    try {
      await dispatch(deleteProduct(deleteModal.productId)).unwrap();
      
      setDeleteModal({
        isOpen: false,
        productId: null,
        productName: ''
      });
      
      setConfirmationModal({
        isOpen: true,
        message: `Product "${deleteModal.productName}" has been deleted successfully!`,
        productId: null,
        isEditMode: false,
        isDeleteMode: true
      });
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
      setDeleteModal({
        isOpen: false,
        productId: null,
        productName: ''
      });
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      productId: null,
      productName: ''
    });
  };
  
  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      typeId: product.type?._id || product.type?.id,
    });
    setIsAddProductOpen(true);
  };
  
  const closeProductForm = () => {
    setIsAddProductOpen(false);
    setEditingProduct(null);
    dispatch(resetUploadState());
  };
  
  const handleSaveProduct = async (productData) => {
    try {
      let typeId = productData.typeId;

      if (productData.newType && productData.newType.name.trim()) {
        const newTypeResult = await dispatch(createNewType(productData.newType)).unwrap();
        typeId = newTypeResult._id;
      }

      const payload = {
        ...productData,
        type: typeId,
        specifications: productData.specifications || {}
      };

      if (payload.collection !== 'Cooking Appliances') {
        delete payload.burners;
        delete payload.ignitionType;
      } else {
        if (!payload.burners) delete payload.burners;
        if (!payload.ignitionType) delete payload.ignitionType;
      }

      payload.price = Number(payload.price);
      payload.stock = Number(payload.stock);
      if (payload.discountPrice) {
        payload.discountPrice = Number(payload.discountPrice);
      }

      const fieldsToRemove = [
        'typeId', 'newType',
        'id', '_id', '__v', 'createdAt'
      ];
      fieldsToRemove.forEach(field => delete payload[field]);

      let result;
      const isEditMode = !!editingProduct;

      if (isEditMode) {
        result = await dispatch(updateExistingProduct({
          id: editingProduct._id,
          productData: payload
        })).unwrap();
      } else {
        result = await dispatch(createProduct(payload)).unwrap();
      }

      closeProductForm();

      setConfirmationModal({
        isOpen: true,
        message: `Product "${payload.name}" has been ${isEditMode ? 'updated' : 'created'} successfully!`,
        productId: result._id || result.id,
        isEditMode
      });

    } catch (err) {
      console.error('Error saving product:', err);
      const errorMessage = err.message || (err.error ? `${err.message}: ${err.error}` : 'An unknown error occurred.');
      alert(`Failed to save product: ${errorMessage}`);
    }
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      message: '',
      productId: null,
      isEditMode: false
    });
  };

  if (loading || !types) {
    return <LoadingSpinner />;
  }
  
  return (
    <ErrorBoundary>
      <div className="p-3 sm:p-4 lg:p-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products Management</h1>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsAddProductOpen(true)}
            className="w-full sm:w-auto"
          >
            Add Product
          </Button>
        </div>
        
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search products..."
           value={searchTerm}
            onChange={handleSearch}
            leftIcon={<Search className="h-5 w-5 text-gray-400" />}
            fullWidth
          />
        </div>

      <div className="mb-4 text-sm text-gray-600">
          Showing {products.length} of {totalProducts} products 
          {debouncedSearchQuery && ` (filtered by "${debouncedSearchQuery}")`}
        </div>

        
        <div className="bg-white overflow-hidden shadow-sm rounded-lg mb-6">
          <div className="overflow-x-auto">
            <ProductsTable 
              products={products} 
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onProductClick={handleProductClick}
            />
          </div>
        </div>
        
        {totalPages > 1 && (
          <Pagination
            currentPage={serverCurrentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalProducts}
            itemsPerPage={productsPerPage}
          />
        )}
        {isAddProductOpen && (
          <ProductForm
            onClose={closeProductForm}
            onSave={handleSaveProduct}
            product={editingProduct}
            types={types}
          />
        )}
      </div>

      <ProductConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        message={confirmationModal.message}
        productId={confirmationModal.productId}
        isEditMode={confirmationModal.isEditMode}
      />

      <ProductDeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteProduct}
        productName={deleteModal.productName}
      />
    </ErrorBoundary>
  );
};

export default AdminProducts;