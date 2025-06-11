import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BLOOD_TYPES, donorAPI } from '../services/api';


const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalDonations: 0,
    availableDonors: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await donorAPI.getPublicStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching public stats:', error);
        // Keep default values if API fails
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleBloodTypeClick = (bloodType) => {
    navigate(`/donors/blood-type/${bloodType}`);
  };



  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blood-red-600 to-blood-red-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Connect Blood Donors
              <span className="block text-blood-red-200">Save Lives Together</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blood-red-100 max-w-3xl mx-auto">
              Find blood donors in your area quickly and easily. Our platform connects those in need with willing donors to save lives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <button 
                  onClick={() => navigate('/admin')}
                  className="bg-white text-blood-red-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Admin Dashboard
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-white text-blood-red-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Admin Login
                </button>
              )}
              <button 
                onClick={() => document.getElementById('blood-types').scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-blood-red-600 transition-colors duration-200"
              >
                Find Donors
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Blood Types Selection */}
      <section id="blood-types" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Find Donors by Blood Type
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select a blood type to find available donors in your area. Click on any blood type card to see the list of donors.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-6">
            {BLOOD_TYPES.map((bloodType) => (
              <div
                key={bloodType}
                onClick={() => handleBloodTypeClick(bloodType)}
                className="blood-type-card text-center cursor-pointer"
              >
                <div className="text-3xl md:text-4xl font-bold text-blood-red-600 mb-2">
                  {bloodType}
                </div>
                <div className="text-sm text-gray-600">
                  Find Donors
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Blood Type Compatibility
              </h3>
              <p className="text-blue-800 text-sm">
                <strong>Universal Donor:</strong> O- can donate to all blood types<br/>
                <strong>Universal Recipient:</strong> AB+ can receive from all blood types<br/>
                Remember to always consult with medical professionals for blood transfusions.
              </p>
            </div>
          </div>
        </div>
      </section>

      

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-lg text-gray-600">
              Real-time statistics from our blood donor community
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-blood-red-600 mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-10 w-16 mx-auto rounded"></div>
                ) : (
                  stats.totalDonors
                )}
              </div>
              <div className="text-lg text-gray-600">Active Donors</div>
              <div className="text-sm text-gray-500 mt-1">Ready to help save lives</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-blood-red-600 mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-10 w-16 mx-auto rounded"></div>
                ) : (
                  stats.totalDonations
                )}
              </div>
              <div className="text-lg text-gray-600">Total Donations</div>
              <div className="text-sm text-gray-500 mt-1">Lives touched through giving</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-blood-red-600 mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-300 h-10 w-16 mx-auto rounded"></div>
                ) : (
                  stats.availableDonors
                )}
              </div>
              <div className="text-lg text-gray-600">Available Now</div>
              <div className="text-sm text-gray-500 mt-1">Ready for immediate donation</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 