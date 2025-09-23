import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(formData);
    
    if (!result.success) {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-md w-full space-y-4 sm:space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            QR Attendance System
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
            CSE-DS-A Department | III-I Semester
          </p>
        </div>
        
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-8 space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">Login as:</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`p-3 sm:p-4 text-xs sm:text-sm font-medium rounded-lg border-2 transition-colors ${
                    formData.role === 'student'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Student
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'faculty' })}
                  className={`p-3 sm:p-4 text-xs sm:text-sm font-medium rounded-lg border-2 transition-colors ${
                    formData.role === 'faculty'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Faculty
                  </div>
                </button>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 sm:py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-sm sm:text-base"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 sm:py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-sm sm:text-base"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <h4 className="text-xs sm:text-sm font-semibold text-green-900 mb-2 sm:mb-3 flex items-center">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-xs sm:text-sm">Test Accounts (Password: password123)</span>
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Faculty Accounts */}
            <div className="space-y-1 sm:space-y-2">
              <h5 className="text-xs font-medium text-green-800 uppercase tracking-wide border-b border-green-200 pb-1">Faculty</h5>
              <div className="space-y-0.5 sm:space-y-1 text-xs text-green-700">
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation" 
                     onClick={() => setFormData({...formData, role: 'faculty', email: 'kbpullamma@faculty.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Dr. K.B. Pullamma</span>
                  <span className="text-green-600 text-xs flex-shrink-0">ACD</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'faculty', email: 'mprasanna@faculty.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Ms. M. Prasanna</span>
                  <span className="text-green-600 text-xs flex-shrink-0">IDS</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'faculty', email: 'nsamatha@faculty.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Mrs. N. Samatha</span>
                  <span className="text-green-600 text-xs flex-shrink-0">CN</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'faculty', email: 'vbhavya@faculty.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Ms. V. Bhavya</span>
                  <span className="text-green-600 text-xs flex-shrink-0">DEVOPS</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'faculty', email: 'faculty@demo.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Demo Faculty ⭐</span>
                  <span className="text-green-600 text-xs flex-shrink-0">OS</span>
                </div>
              </div>
            </div>
            
            {/* Student Accounts */}
            <div className="space-y-1 sm:space-y-2">
              <h5 className="text-xs font-medium text-green-800 uppercase tracking-wide border-b border-green-200 pb-1">Students</h5>
              <div className="space-y-0.5 sm:space-y-1 text-xs text-green-700">
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'student', email: 'vikram@demo.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Vikram</span>
                  <span className="text-green-600 text-xs flex-shrink-0">6731</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'student', email: 'sathvika@demo.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Sathvika</span>
                  <span className="text-green-600 text-xs flex-shrink-0">6724</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'student', email: 'retwwik@demo.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Retwwik</span>
                  <span className="text-green-600 text-xs flex-shrink-0">6739</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'student', email: 'tanush@demo.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Tanush</span>
                  <span className="text-green-600 text-xs flex-shrink-0">6758</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'student', email: 'nakshathra@demo.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Nakshathra</span>
                  <span className="text-green-600 text-xs flex-shrink-0">6733</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'student', email: 'saiteja@demo.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Sai Teja</span>
                  <span className="text-green-600 text-xs flex-shrink-0">6755</span>
                </div>
                <div className="flex justify-between items-center hover:bg-green-100 p-1 rounded cursor-pointer touch-manipulation"
                     onClick={() => setFormData({...formData, role: 'student', email: 'student@demo.com', password: 'password123'})}>
                  <span className="font-medium truncate mr-2">Demo Student ⭐</span>
                  <span className="text-green-600 text-xs flex-shrink-0">DEMO</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-2 sm:mt-3 pt-2 border-t border-green-200">
            <p className="text-xs text-green-600 italic">💡 Tap any account to auto-fill | Subjects: ACD, IDS, CN, DEVOPS, OS</p>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => setFormData({role: 'faculty', email: 'faculty@demo.com', password: 'password123'})}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation"
          >
            👨‍🏫 Quick Faculty Login
          </button>
          <button
            type="button"
            onClick={() => setFormData({role: 'student', email: 'student@demo.com', password: 'password123'})}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation"
          >
            👨‍🎓 Quick Student Login
          </button>
        </div>

        {/* System Information */}
        <div className="text-center mt-4 sm:mt-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
            <p className="text-xs text-gray-600 mb-1">
              📅 <strong>Semester:</strong> III-I (2024-25) | 🏫 <strong>Dept:</strong> CSE-DS-A
            </p>
            <p className="text-xs text-gray-500">
              📱 <strong>Features:</strong> QR Attendance • Geofencing • Reports • Mobile Ready
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;