import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { donorAPI, handleAPIError } from '../services/api';
import { 
  MagnifyingGlassIcon, 
  PhoneIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// Blood types constant
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

const DonorsByBloodType = () => {
  const { bloodType: rawBloodType } = useParams();
  const navigate = useNavigate();
  
  // Decode the blood type from URL
  const bloodType = decodeURIComponent(rawBloodType || '');
  
  // Validate blood type - redirect to home if invalid
  useEffect(() => {
    if (bloodType && !BLOOD_TYPES.includes(bloodType)) {
      console.error('Invalid blood type:', bloodType);
      toast.error(`Invalid blood type: ${bloodType}`);
      navigate('/');
    }
  }, [bloodType, navigate]);
  
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Debounce search term with 500ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Track if user is typing (for showing search indicator)
  const isSearching = searchTerm !== debouncedSearchTerm;

  const fetchDonors = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        available_only: availableOnly,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await donorAPI.getDonorsByBloodType(bloodType, params);
      setDonors(response.data.donors);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(handleAPIError(error));
    } finally {
      setLoading(false);
    }
  }, [bloodType, availableOnly, debouncedSearchTerm]);

  useEffect(() => {
    fetchDonors(currentPage);
  }, [fetchDonors, currentPage]);

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, availableOnly]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled automatically by debounced effect
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBloodTypeChange = (newBloodType) => {
    if (newBloodType !== bloodType) {
      // Validate blood type
      if (!BLOOD_TYPES.includes(newBloodType)) {
        toast.error('Invalid blood type selected');
        return;
      }
      
      try {
        // Properly encode the blood type for URL
        const encodedBloodType = encodeURIComponent(newBloodType);
        console.log('Navigating to blood type:', newBloodType, 'Encoded:', encodedBloodType);
        
        // Use React Router navigation with correct path
        navigate(`/donors/blood-type/${encodedBloodType}`);
        
      } catch (error) {
        console.error('Navigation error:', error);
        toast.error('Failed to switch blood type. Please try again.');
      }
    }
  };

  const isAvailableToDonate = (nextDonationDate) => {
    if (!nextDonationDate) return true;
    return new Date(nextDonationDate) <= new Date();
  };

  const getDaysUntilEligible = (nextDonationDate) => {
    if (!nextDonationDate) return 0;
    const today = new Date();
    const eligibleDate = new Date(nextDonationDate);
    const diffTime = eligibleDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-blood-red-600 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Home
            </button>
            <div className="h-6 border-l border-gray-300"></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Blood Type <span className="text-blood-red-600">{bloodType}</span> Donors
              </h1>
              <p className="text-gray-600 text-sm">
                {pagination.total_donors || 0} donors found
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              {/* Search */}
              <div className="flex flex-col">
                <label htmlFor="donor-search" className="text-sm font-medium text-gray-700 mb-2">Search Donors</label>
                <form onSubmit={handleSearch} className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="donor-search"
                    name="donor-search"
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 pr-10"
                    autoComplete="search"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blood-red-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </form>
              </div>

              {/* Availability Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Availability</label>
                <div className="flex items-center space-x-2 h-10">
                  <input
                    type="checkbox"
                    id="availableOnly"
                    checked={availableOnly}
                    onChange={(e) => {
                      setAvailableOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="h-4 w-4 text-blood-red-600 focus:ring-blood-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="availableOnly" className="text-sm text-gray-700">
                    Show only available donors
                  </label>
                </div>
              </div>

              {/* Blood Type Selector */}
              <div className="flex flex-col">
                <label htmlFor="blood-type-selector" className="text-sm font-medium text-gray-700 mb-2">Switch Blood Type</label>
                <select
                  id="blood-type-selector"
                  name="blood-type-selector"
                  value={bloodType}
                  onChange={(e) => handleBloodTypeChange(e.target.value)}
                  className="input-field text-sm py-2 px-3 text-center font-semibold text-blood-red-600 border-blood-red-200 focus:border-blood-red-500 focus:ring-blood-red-500"
                >
                  {BLOOD_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blood-red-600"></div>
        </div>
      )}

      {/* Donors Grid */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {donors.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {donors.map((donor) => {
                  const available = isAvailableToDonate(donor.next_donation_date);
                  const daysUntilEligible = getDaysUntilEligible(donor.next_donation_date);
                  
                  return (
                    <div key={donor.id} className={`card hover:shadow-lg transition-shadow duration-200 ${
                      available 
                        ? 'border-l-2 border-l-green-500' 
                        : 'border-l-2 border-l-red-400'
                    }`}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {donor.donor_name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-2xl font-bold text-blood-red-600">
                              {donor.blood_type}
                            </span>
                            {available ? (
                              <div className="flex items-center text-green-600 text-sm">
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Available
                              </div>
                            ) : (
                              <div className="flex items-center text-red-600 text-sm">
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Not Available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          <span>{donor.contact_number}</span>
                        </div>
                      </div>

                      {/* Donation Info */}
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          <span>Last donation: {donor.date_of_last_donation 
                            ? new Date(donor.date_of_last_donation).toLocaleDateString()
                            : 'Never'
                          }</span>
                        </div>
                        {!available && daysUntilEligible > 0 && (
                          <div className="flex items-center text-sm text-orange-600">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            <span>Eligible in {daysUntilEligible} days</span>
                          </div>
                        )}
                      </div>

                      {/* Contact Button */}
                      <div className="mt-6">
                        <a
                          href={`tel:${donor.contact_number}`}
                          className="w-full btn-primary text-center block"
                        >
                          Contact Donor
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="mt-12 flex justify-center">
                  <div className="flex space-x-2">
                    {/* Previous */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const page = i + Math.max(1, currentPage - 2);
                      if (page > pagination.total_pages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-md border text-sm font-medium ${
                            currentPage === page
                              ? 'border-blood-red-500 bg-blood-red-50 text-blood-red-600'
                              : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {/* Next */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.total_pages}
                      className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                No donors found for blood type {bloodType}
              </div>
              <p className="text-gray-400 mb-6">
                Try adjusting your search criteria or check back later.
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonorsByBloodType; 