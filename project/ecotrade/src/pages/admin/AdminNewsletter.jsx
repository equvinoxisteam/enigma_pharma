import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Users, Calendar, Search, Download, ListFilter as Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSubscribers } from '../../store/slices/newsletterContactSlice';
import Button from '../../components/ui/Button';

const AdminNewsletter = () => {
  const dispatch = useDispatch();
  const { subscribers, loadingSubscribers, newsletterError } = useSelector(state => state.newsletterContact);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    dispatch(getSubscribers());
  }, [dispatch]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSubscribers = subscribers?.filter(subscriber =>
    subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSubscribers = filteredSubscribers.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    // CSV header
    const csvContent = ['Email,Subscription Date,Source,Status'];
    
    // Add data rows
    filteredSubscribers.forEach(subscriber => {
      const email = `"${subscriber.email}"`;
      const date = `"${formatDate(subscriber.subscriptionDate)}"`;
      const source = `"${subscriber.source || 'website'}"`;
      const status = `"${subscriber.isActive ? 'Active' : 'Inactive'}"`;
      csvContent.push(`${email},${date},${source},${status}`);
    });

    const csvString = csvContent.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const activeSubscribers = subscribers?.filter(sub => sub.isActive).length || 0;
    const totalSubscribers = subscribers?.length || 0;
    const todaySubscribers = subscribers?.filter(sub => {
      const today = new Date();
      const subDate = new Date(sub.subscriptionDate);
      return subDate.toDateString() === today.toDateString();
    }).length || 0;

    return { activeSubscribers, totalSubscribers, todaySubscribers };
  };

  const stats = getStats();

  if (loadingSubscribers) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-20 sm:h-24"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Newsletter Management</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg mr-3 sm:mr-4">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" style={{color: '#2A4365'}} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Subscribers</p>
                  <p className="text-xl sm:text-2xl font-bold" style={{color: '#2A4365'}}>{stats.totalSubscribers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-orange-50 rounded-lg mr-3 sm:mr-4">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6" style={{color: '#C87941'}} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Active Subscribers</p>
                  <p className="text-xl sm:text-2xl font-bold" style={{color: '#C87941'}}>{stats.activeSubscribers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm sm:col-span-1 col-span-1">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gray-100 rounded-lg mr-3 sm:mr-4">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Today's Subscriptions</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-700">{stats.todaySubscribers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search subscribers..."
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm sm:text-base"
                style={{"--tw-ring-color": "#2A4365"}}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              leftIcon={<Download size={16} />}
              className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Subscribers Table - Desktop */}
        <div className="hidden sm:block bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead style={{backgroundColor: '#f8fafc'}}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#2A4365'}}>
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#2A4365'}}>
                  Subscription Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#2A4365'}}>
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{color: '#2A4365'}}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentSubscribers.length > 0 ? (
                currentSubscribers.map((subscriber) => (
                  <tr key={subscriber._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {subscriber.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(subscriber.subscriptionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="px-3 py-1 text-xs font-medium rounded-full" style={{backgroundColor: '#f0f4f8', color: '#2A4365'}}>
                        {subscriber.source || 'website'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                          subscriber.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {subscriber.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Mail className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        {searchTerm ? 'No subscribers found' : 'No subscribers yet'}
                      </p>
                      <p className="text-gray-500">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Subscribers will appear here once they sign up.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Subscribers Cards - Mobile */}
        <div className="sm:hidden space-y-4">
          {currentSubscribers.length > 0 ? (
            currentSubscribers.map((subscriber) => (
              <div key={subscriber._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1 min-w-0">
                    <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {subscriber.email}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                      subscriber.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {subscriber.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subscription Date:</span>
                    <span className="text-gray-900">{formatDate(subscriber.subscriptionDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Source:</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: '#f0f4f8', color: '#2A4365'}}>
                      {subscriber.source || 'website'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900 mb-1">
                {searchTerm ? 'No subscribers found' : 'No subscribers yet'}
              </p>
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'Try adjusting your search terms.' : 'Subscribers will appear here once they sign up.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8">
            {/* Mobile Pagination */}
            <div className="sm:hidden">
              <div className="text-sm text-gray-700 text-center mb-4">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex justify-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex-1 max-w-[100px] border-gray-300"
                  leftIcon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex-1 max-w-[100px] border-gray-300"
                  rightIcon={<ChevronRight size={16} />}
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Desktop Pagination */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSubscribers.length)} of {filteredSubscribers.length} subscribers
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="border-gray-300"
                  leftIcon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700 px-4 py-2 border border-gray-300 rounded bg-white">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="border-gray-300"
                  rightIcon={<ChevronRight size={16} />}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNewsletter;