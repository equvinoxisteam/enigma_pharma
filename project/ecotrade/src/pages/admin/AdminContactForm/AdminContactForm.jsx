import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshCw } from 'lucide-react';
import { getContactSubmissions, updateContactSubmission, deleteContactSubmission } from '../../../store/slices/newsletterContactSlice';

import StatsCards from './components/StatsCards';
import SearchFilters from './components/SearchFilters';
import SubmissionsTable from './components/SubmissionsTable';
import ViewModal from './components/ViewModal';
import EditModal from './components/EditModal';


const AdminContactForm = () => {
  const dispatch = useDispatch();
  const { contactSubmissions, loadingSubmissions, contactError } = useSelector(state => state.newsletterContact);
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form state for editing
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    department: '',
    adminNotes: ''
  });

  useEffect(() => {
    dispatch(getContactSubmissions());
  }, [dispatch]);

  // Filter and sort submissions
  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = contactSubmissions?.filter(submission => {
      const matchesSearch = 
        submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || submission.priority === priorityFilter;
      const matchesDepartment = departmentFilter === 'all' || submission.department === departmentFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
    }) || [];

    // Sort submissions
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [contactSubmissions, searchTerm, statusFilter, priorityFilter, departmentFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSubmissions = filteredAndSortedSubmissions.slice(startIndex, startIndex + itemsPerPage);

  const getStats = () => {
    const totalSubmissions = contactSubmissions?.length || 0;
    const inProgressSubmissions = contactSubmissions?.filter(sub => sub.status === 'in-progress').length || 0;
    const resolvedSubmissions = contactSubmissions?.filter(sub => sub.status === 'resolved').length || 0;
    const closedSubmissions = contactSubmissions?.filter(sub => sub.status === 'closed').length || 0;
    const urgentSubmissions = contactSubmissions?.filter(sub => sub.priority === 'urgent').length || 0;
    const todaySubmissions = contactSubmissions?.filter(sub => {
      const today = new Date();
      const subDate = new Date(sub.createdAt);
      return subDate.toDateString() === today.toDateString();
    }).length || 0;

    return { 
      totalSubmissions,  
      inProgressSubmissions, 
      resolvedSubmissions, 
      closedSubmissions, 
      urgentSubmissions, 
      todaySubmissions 
    };
  };

  const stats = getStats();

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowModal(true);
  };

  const handleEditSubmission = (submission) => {
    setEditingSubmission(submission);
    setEditForm({
      status: submission.status || 'pending',
      priority: submission.priority || 'medium',
      department: submission.department || 'general',
      adminNotes: submission.adminNotes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await dispatch(updateContactSubmission({ 
        id: editingSubmission._id, 
        updateData: editForm 
      })).unwrap();
      
      setShowEditModal(false);
      setEditingSubmission(null);
      setEditForm({ status: '', priority: '', department: '', adminNotes: '' });
      
      dispatch(getContactSubmissions());
    } catch (error) {
      console.error('Error updating submission:', error);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await dispatch(deleteContactSubmission(submissionId)).unwrap();
        dispatch(getContactSubmissions());
      } catch (error) {
        console.error('Error deleting submission:', error);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSubmission(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSubmission(null);
    setEditForm({ status: '', priority: '', department: '', adminNotes: '' });
  };

  const handleRefresh = () => {
    dispatch(getContactSubmissions());
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loadingSubmissions) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Form Management</h1>
          <p className="text-gray-600 mt-2">Manage and respond to customer inquiries</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#2A4365' }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Search and Filters */}
      <SearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
      />

      {/* Submissions Table */}
      <SubmissionsTable
        submissions={currentSubmissions}
        filteredSubmissions={filteredAndSortedSubmissions}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        startIndex={startIndex}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        handleViewSubmission={handleViewSubmission}
        handleEditSubmission={handleEditSubmission}
        handleDeleteSubmission={handleDeleteSubmission}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        departmentFilter={departmentFilter}
      />

      {/* View Modal */}
      {showModal && selectedSubmission && (
        <ViewModal
          submission={selectedSubmission}
          onClose={closeModal}
          onEdit={() => handleEditSubmission(selectedSubmission)}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingSubmission && (
        <EditModal
          submission={editingSubmission}
          editForm={editForm}
          setEditForm={setEditForm}
          onClose={closeEditModal}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default AdminContactForm;