import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { donorAPI, handleAPIError, BLOOD_TYPES } from '../services/api';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  UsersIcon,
  HeartIcon,
  CalendarDaysIcon,
  XMarkIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Format date for input field (YYYY-MM-DD format)
const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    // Create a Date object from the UTC string
    const utcDate = new Date(dateValue);
    
    // Get the local date components (this accounts for timezone)
    const year = utcDate.getFullYear();
    const month = String(utcDate.getMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date input formatting error:', error);
    return '';
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view', 'delete'
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stats, setStats] = useState({
    totalDonors: 0,
    activeDonors: 0,
    totalDonations: 0,
    recentDonations: 0
  });

  const [formData, setFormData] = useState({
    donor_name: '',
    blood_type: '',
    contact_number: '',
    date_of_last_donation: '',
    is_active: true
  });

  const [donationFormData, setDonationFormData] = useState({
    donation_date: '',
    blood_units: '1.0',
    donation_center: 'SH. Atoll Hospital',
    notes: ''
  });

  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);

  // Debounce search term with 500ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Track if user is typing (for showing search indicator)
  const isSearching = searchTerm !== debouncedSearchTerm;

  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm,
        blood_type: selectedBloodType,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
      };

      const response = await donorAPI.getDonors(params);
      setDonors(response.data.donors);
      setTotalPages(response.data.totalPages || response.data.pagination?.total_pages || 1);
    } catch (error) {
      toast.error(handleAPIError(error));
      setDonors([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, selectedBloodType, statusFilter]);

  useEffect(() => {
    fetchDonors();
    fetchStats();
  }, [fetchDonors]);

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedBloodType, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await donorAPI.getStats();
      setStats({
        totalDonors: response.data.totalDonors,
        activeDonors: response.data.activeDonors,
        totalDonations: response.data.totalDonations,
        recentDonations: response.data.thisMonthDonations
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fall back to zeros if API fails
      setStats({
        totalDonors: 0,
        activeDonors: 0,
        totalDonations: 0,
        recentDonations: 0
      });
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDonationFormChange = (e) => {
    const { name, value } = e.target;
    setDonationFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateDonor = () => {
    setModalMode('create');
    setSelectedDonor(null);
    setFormData({
      donor_name: '',
      blood_type: '',
      contact_number: '',
      date_of_last_donation: '',
      is_active: true // Already a boolean
    });
    setShowModal(true);
  };

  const handleEditDonor = (donor) => {
    setModalMode('edit');
    setSelectedDonor(donor);
    
    setFormData({
      donor_name: donor.donor_name || '',
      blood_type: donor.blood_type || '',
      contact_number: donor.contact_number || '',
      date_of_last_donation: formatDateForInput(donor.date_of_last_donation),
      is_active: Boolean(donor.is_active) // Convert to actual boolean
    });
    setDonationFormData({
      donation_date: '',
      blood_units: '1.0',
      donation_center: 'SH. Atoll Hospital',
      notes: ''
    });
    setShowDonationForm(false);
    setShowModal(true);
  };

  const handleViewDonor = async (donor) => {
    setModalMode('view');
    setSelectedDonor(donor);
    setDonationHistory([]);
    setLoadingHistory(true);
    setShowModal(true);

    try {
      // Fetch full donor details including donation history
      const response = await donorAPI.getDonorById(donor.id);
      setSelectedDonor(response.data.donor);
      setDonationHistory(response.data.donation_history || []);
    } catch (error) {
      toast.error(`Failed to load donation history: ${handleAPIError(error)}`);
      setDonationHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteDonor = (donor) => {
    setModalMode('delete');
    setSelectedDonor(donor);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Base form data
      const baseData = {
        donor_name: formData.donor_name,
        blood_type: formData.blood_type,
        contact_number: formData.contact_number,
        is_active: Boolean(formData.is_active) // Ensure boolean type
      };

      // For CREATE mode, include last donation date if provided
      // For EDIT mode, exclude it as it should only be updated via donation history
      const cleanedData = modalMode === 'create' 
        ? {
            ...baseData,
            date_of_last_donation: formData.date_of_last_donation || null
          }
        : baseData;

      if (modalMode === 'create') {
        await donorAPI.createDonor(cleanedData);
        toast.success('Donor created successfully!');
      } else if (modalMode === 'edit') {
        await donorAPI.updateDonor(selectedDonor.id, cleanedData);
        toast.success('Donor updated successfully!');
      }
      
      setShowModal(false);
      fetchDonors();
      fetchStats();
    } catch (error) {
      toast.error(handleAPIError(error));
    }
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!donationFormData.donation_date) {
        toast.error('Donation date is required');
        return;
      }

      // Clean the donation data
      const cleanedDonationData = {
        donation_date: donationFormData.donation_date,
        blood_units: parseFloat(donationFormData.blood_units) || 1.0,
        donation_center: donationFormData.donation_center || 'SH. Atoll Hospital',
        notes: donationFormData.notes || null
      };

      await donorAPI.recordDonation(selectedDonor.id, cleanedDonationData);
      toast.success('Donation recorded successfully!');
      
      // Reset donation form
      setDonationFormData({
        donation_date: '',
        blood_units: '1.0',
        donation_center: 'SH. Atoll Hospital',
        notes: ''
      });
      setShowDonationForm(false);
      
      // Refresh data
      fetchDonors();
      fetchStats();
    } catch (error) {
      toast.error(handleAPIError(error));
    }
  };

  const handleDeleteDonation = async (donationId) => {
    // Find the donation to delete for display in confirmation
    const donation = donationHistory.find(d => d.id === donationId);
    setDonationToDelete(donation);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteDonation = async () => {
    if (!donationToDelete) return;

    try {
      await donorAPI.deleteDonation(selectedDonor.id, donationToDelete.id);
      toast.success('Donation deleted successfully!');
      
      // Close confirmation modal
      setShowDeleteConfirmation(false);
      setDonationToDelete(null);
      
      // Refresh donation history
      const response = await donorAPI.getDonorById(selectedDonor.id);
      setSelectedDonor(response.data.donor);
      setDonationHistory(response.data.donation_history || []);
      
      // Refresh main data
      fetchDonors();
      fetchStats();
    } catch (error) {
      toast.error(handleAPIError(error));
    }
  };

  const cancelDeleteDonation = () => {
    setShowDeleteConfirmation(false);
    setDonationToDelete(null);
  };

  const handleDelete = async () => {
    try {
      await donorAPI.deleteDonor(selectedDonor.id);
      toast.success('Donor deleted successfully!');
      setShowModal(false);
      fetchDonors();
      fetchStats();
    } catch (error) {
      toast.error(handleAPIError(error));
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedBloodType('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  const calculateNextDonationDate = (lastDonationDate) => {
    if (!lastDonationDate) return null;
    const date = new Date(lastDonationDate);
    date.setMonth(date.getMonth() + 3);
    return date;
  };

  const isEligibleToDonate = (nextDonationDate) => {
    if (!nextDonationDate) return true;
    return new Date(nextDonationDate) <= new Date();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Home
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-700 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-600">
            Manage blood donors and monitor donation activities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Donors
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats.totalDonors}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HeartIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Donors
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats.activeDonors}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blood-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Donations
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats.totalDonations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    This Month
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats.recentDonations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="card mb-6">
          <div className="flex flex-col space-y-4">
            {/* Search and Filters Row */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between space-y-4 xl:space-y-0">
              
              {/* Search - Takes full width on mobile, fixed width on larger screens */}
              <div className="flex justify-center lg:justify-start lg:flex-shrink-0">
                <div className="search-input-container w-full max-w-md lg:max-w-sm">
                  <MagnifyingGlassIcon className="search-icon" />
                  <input
                    id="admin-search"
                    name="admin-search"
                    type="text"
                    placeholder="Search donors by name, contact, or blood type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    autoComplete="search"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blood-red-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Dropdowns - Centered */}
              <div className="flex justify-center">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-center">
                  {/* Blood Type Filter */}
                  <div className="w-full sm:w-40">
                    <label htmlFor="blood-type-filter" className="sr-only">Filter by Blood Type</label>
                    <select
                      id="blood-type-filter"
                      name="blood-type-filter"
                      value={selectedBloodType}
                      onChange={(e) => setSelectedBloodType(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">All Blood Types</option>
                      {BLOOD_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="w-full sm:w-32">
                    <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
                    <select
                      id="status-filter"
                      name="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={resetFilters}
                    className="btn-secondary whitespace-nowrap w-full sm:w-auto"
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Add New Donor Button - Centered on mobile, right on larger screens */}
              <div className="flex justify-center xl:justify-end xl:flex-shrink-0">
                <button
                  onClick={handleCreateDonor}
                  className="btn-primary whitespace-nowrap"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New Donor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Donors Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Donation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eligibility
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blood-red-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : donors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No donors found
                    </td>
                  </tr>
                ) : (
                  donors.map((donor) => {
                    const nextDonationDate = calculateNextDonationDate(donor.date_of_last_donation);
                    const eligible = isEligibleToDonate(nextDonationDate);
                    
                    return (
                      <tr key={donor.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {donor.donor_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {donor.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-blood-red-600">
                            {donor.blood_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{donor.contact_number}</div>
                          <div className="text-sm text-gray-500">{donor.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {donor.date_of_last_donation 
                            ? new Date(donor.date_of_last_donation).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(donor.is_active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {eligible ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Not Eligible
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleViewDonor(donor)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditDonor(donor)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDonor(donor)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`bg-white rounded-lg p-6 w-full ${modalMode === 'view' ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' && 'Add New Donor'}
                  {modalMode === 'edit' && 'Edit Donor'}
                  {modalMode === 'view' && 'Donor Details'}
                  {modalMode === 'delete' && 'Delete Donor'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {modalMode === 'delete' ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete donor "{selectedDonor?.donor_name}"? This action cannot be undone.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleDelete}
                      className="btn-primary bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) :               modalMode === 'view' ? (
                <div className="space-y-6">
                  {/* Donor Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedDonor?.donor_name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                        <div className="mt-1 text-sm font-semibold text-blood-red-600">{selectedDonor?.blood_type}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                        <div className="mt-1 text-sm text-gray-900">{selectedDonor?.contact_number}</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Donation</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {selectedDonor?.date_of_last_donation 
                            ? new Date(selectedDonor.date_of_last_donation).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Next Donation</label>
                        <div className="mt-1 text-sm text-gray-900">
                          {selectedDonor?.next_donation_date 
                            ? new Date(selectedDonor.next_donation_date).toLocaleDateString()
                            : 'Available now'
                          }
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedDonor?.is_active)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Donation History Section */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
                      Donation History
                    </h4>
                    
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blood-red-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Loading donation history...</span>
                      </div>
                    ) : donationHistory.length > 0 ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {donationHistory.map((donation) => (
                          <div key={donation.id} className="bg-gray-50 rounded-lg p-4 relative">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500">Date</label>
                                <div className="text-sm text-gray-900">
                                  {new Date(donation.donation_date).toLocaleDateString()}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500">Blood Units</label>
                                <div className="text-sm text-gray-900">{donation.blood_units} units</div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500">Center</label>
                                <div className="text-sm text-gray-900">{donation.donation_center}</div>
                              </div>
                              {donation.notes && (
                                <div className="md:col-span-3">
                                  <label className="block text-xs font-medium text-gray-500">Notes</label>
                                  <div className="text-sm text-gray-900">{donation.notes}</div>
                                </div>
                              )}
                            </div>
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteDonation(donation.id)}
                              className="absolute top-2 right-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
                              title="Delete this donation record"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <HeartIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No donation history available</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Donor Information Form */}
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="donor_name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          id="donor_name"
                          type="text"
                          name="donor_name"
                          required
                          value={formData.donor_name}
                          onChange={handleFormChange}
                          className="input-field"
                          placeholder="Enter full name"
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <label htmlFor="blood_type" className="block text-sm font-medium text-gray-700 mb-2">
                          Blood Type *
                        </label>
                        <select
                          id="blood_type"
                          name="blood_type"
                          required
                          value={formData.blood_type}
                          onChange={handleFormChange}
                          className="input-field"
                        >
                          <option value="">Select blood type</option>
                          {BLOOD_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Number *
                        </label>
                        <input
                          id="contact_number"
                          type="tel"
                          name="contact_number"
                          required
                          value={formData.contact_number}
                          onChange={handleFormChange}
                          className="input-field"
                          placeholder="+92300xxxxxxx"
                          autoComplete="tel"
                        />
                      </div>
                      <div>
                        <label htmlFor="date_of_last_donation" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Donation Date
                        </label>
                        <input
                          id="date_of_last_donation"
                          type="date"
                          name="date_of_last_donation"
                          value={formData.date_of_last_donation}
                          onChange={modalMode === 'create' ? handleFormChange : undefined}
                          disabled={modalMode === 'edit'}
                          className={`input-field ${modalMode === 'edit' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                        />
                        {modalMode === 'edit' ? (
                          <p className="mt-1 text-xs text-gray-500">
                            This date is automatically updated when you add or remove donation records below.
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-gray-500">
                            Optional: Set if this donor has donated before.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="is_active"
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleFormChange}
                        className="h-4 w-4 text-blood-red-600 focus:ring-blood-red-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                        Active donor
                      </label>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="flex-1 btn-primary"
                      >
                        {modalMode === 'create' ? 'Create Donor' : 'Update Donor'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="flex-1 btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>

                  {/* Add Donation Section - Only show in edit mode */}
                  {modalMode === 'edit' && (
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900 flex items-center">
                          <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
                          Add New Donation
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowDonationForm(!showDonationForm)}
                          className="btn-secondary text-sm"
                        >
                          {showDonationForm ? 'Cancel' : 'Add Donation'}
                        </button>
                      </div>
                      
                      {showDonationForm && (
                        <form onSubmit={handleDonationSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="donation_date" className="block text-sm font-medium text-gray-700 mb-2">
                                Donation Date *
                              </label>
                              <input
                                id="donation_date"
                                type="date"
                                name="donation_date"
                                required
                                value={donationFormData.donation_date}
                                onChange={handleDonationFormChange}
                                className="input-field"
                                max={new Date().toISOString().split('T')[0]} // Don't allow future dates
                              />
                            </div>
                            <div>
                              <label htmlFor="blood_units" className="block text-sm font-medium text-gray-700 mb-2">
                                Blood Units *
                              </label>
                              <select
                                id="blood_units"
                                name="blood_units"
                                required
                                value={donationFormData.blood_units}
                                onChange={handleDonationFormChange}
                                className="input-field"
                              >
                                <option value="0.5">0.5 units</option>
                                <option value="1.0">1.0 unit</option>
                                <option value="1.5">1.5 units</option>
                                <option value="2.0">2.0 units</option>
                              </select>
                            </div>
                            <div>
                              <label htmlFor="donation_center" className="block text-sm font-medium text-gray-700 mb-2">
                                Donation Center *
                              </label>
                              <input
                                id="donation_center"
                                type="text"
                                name="donation_center"
                                required
                                value={donationFormData.donation_center}
                                onChange={handleDonationFormChange}
                                className="input-field"
                                placeholder="SH. Atoll Hospital"
                                autoComplete="organization"
                              />
                            </div>
                            <div>
                              <label htmlFor="donation_notes" className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                              </label>
                              <input
                                id="donation_notes"
                                type="text"
                                name="notes"
                                value={donationFormData.notes}
                                onChange={handleDonationFormChange}
                                className="input-field"
                                placeholder="Optional notes"
                              />
                            </div>
                          </div>
                          <div className="flex space-x-4">
                            <button
                              type="submit"
                              className="btn-primary"
                            >
                              Record Donation
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDonationForm(false)}
                              className="btn-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && donationToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrashIcon className="h-5 w-5 text-red-600 mr-2" />
                  Delete Donation Record
                </h3>
                <button
                  onClick={cancelDeleteDonation}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this donation record? This action cannot be undone.
                </p>
                
                {/* Donation Details to be Deleted */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Donation Details:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-red-700">Date:</span>
                      <span className="text-red-900 font-medium">
                        {new Date(donationToDelete.donation_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Blood Units:</span>
                      <span className="text-red-900 font-medium">{donationToDelete.blood_units} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Center:</span>
                      <span className="text-red-900 font-medium">{donationToDelete.donation_center}</span>
                    </div>
                    {donationToDelete.notes && (
                      <div className="flex justify-between">
                        <span className="text-red-700">Notes:</span>
                        <span className="text-red-900 font-medium">{donationToDelete.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={confirmDeleteDonation}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Donation
                </button>
                <button
                  onClick={cancelDeleteDonation}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 