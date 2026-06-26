import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: 'Aniketh Test',
    email: 'aniketh0701@gmail.com',
    password: 'Aniketh@123',
    confirmPassword: 'Aniketh@123',
    userType: 'BUYER',
    phoneNumber: '9876543210',
    companyName: 'Test Company',
    address: 'Test Address',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    manufacturingTypes: ['API_MANUFACTURING'],
    serviceCategories: ['API_MANUFACTURING']
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5005/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('📦 Registration response:', data);
      setResult({ success: response.ok, data });

      if (response.ok) {
        console.log('✅ Registration successful! Check email for verification.');
      } else {
        console.error('❌ Registration failed:', data.message);
      }
    } catch (error) {
      console.error('💥 Error:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🚀 Quick Account Creator</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Test Account</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> {formData.fullName}</div>
              <div><strong>Email:</strong> {formData.email}</div>
              <div><strong>Password:</strong> {formData.password}</div>
              <div><strong>Type:</strong> {formData.userType}</div>
              <div><strong>Phone:</strong> {formData.phoneNumber}</div>
              <div><strong>Company:</strong> {formData.companyName}</div>
            </div>
            
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </div>

        {result && (
          <div className={`rounded-lg shadow p-6 mb-6 ${
            result.success ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'
          }`}>
            <h2 className="text-xl font-semibold mb-4">
              {result.success ? '✅ Success' : '❌ Failed'}
            </h2>
            <pre className="bg-white p-4 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(result.data, null, 2)}
            </pre>
            
            {result.success && (
              <div className="mt-4">
                <p className="mb-4 font-semibold">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Check server logs for verification email</li>
                  <li>Or manually verify in MongoDB</li>
                  <li>Then login with the credentials</li>
                </ol>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
          <h2 className="text-xl font-semibold mb-4">⚠️ Note</h2>
          <p className="text-sm">
            This will attempt to register with the specified email. 
            Since you're using local MongoDB, this will be a fresh database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickRegister;
