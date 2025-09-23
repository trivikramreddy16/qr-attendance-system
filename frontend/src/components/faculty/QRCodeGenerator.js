import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

const QRCodeGenerator = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subjectId: '',
    period: '09:20 AM - 10:10 AM',
    class: 'III-I',
    section: 'CSE-DS-A',
    duration: 60 // minutes
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const periods = [
    '09:20 AM - 10:10 AM',
    '10:10 AM - 11:00 AM', 
    '11:00 AM - 11:50 AM',
    '11:50 AM - 12:40 PM',
    '12:40 PM - 01:30 PM',
    '01:30 PM - 02:20 PM',
    '02:20 PM - 03:10 PM',
    '03:10 PM - 03:50 PM'
  ];

  const classes = ['III-I', 'II-I', 'I-I', 'IV-I'];
  const sections = ['CSE-DS-A'];

  // Load subjects and check for active session on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load subjects assigned to faculty
        const subjectsResponse = await apiService.getSubjects();
        if (subjectsResponse.success) {
          setSubjects(subjectsResponse.data);
          if (subjectsResponse.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              subjectId: subjectsResponse.data[0]._id
            }));
          }
        }
        
        // Check for existing active session
        const activeSessionResponse = await apiService.getActiveSession();
        if (activeSessionResponse.success && activeSessionResponse.data) {
          const session = activeSessionResponse.data;
          setActiveSession(session);
          
          // Calculate remaining time
          const expiryTime = new Date(session.expiryTime);
          const now = new Date();
          const remainingMs = expiryTime.getTime() - now.getTime();
          
          if (remainingMs > 0) {
            const remainingSeconds = Math.floor(remainingMs / 1000);
            setTimeLeft(remainingSeconds);
            
            // Use the complete QR data from backend response (if available) or generate basic QR
            let qrCodeDataUrl;
            if (session.qrCode) {
              // Backend already generated the QR code with complete data
              qrCodeDataUrl = session.qrCode;
            } else {
              // Fallback: generate basic QR code (this should not happen with proper backend)
              console.warn('⚠️  Backend did not provide qrCode, generating basic QR');
              const qrData = JSON.stringify({
                sessionId: session.sessionId,
                type: 'attendance'
              });
              qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' }
              });
            }
            setQrCodeUrl(qrCodeDataUrl);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (activeSession && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setActiveSession(null);
            setQrCodeUrl('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, timeLeft]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateQRCode = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Create session data for backend
      const sessionData = {
        subject: formData.subjectId, // backend expects 'subject', not 'subjectId'
        class: formData.class,
        section: formData.section,
        period: formData.period, // backend requires period field
        duration: formData.duration,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + formData.duration * 60 * 1000).toISOString(),
        geofence: {
          latitude: 17.4065, // backend expects flat structure, not nested
          longitude: 78.4772,
          radius: 100 // meters
        }
      };

      // Create session on backend
      const response = await apiService.createSession(sessionData);
      
      if (response.success) {
        const session = response.data;
        setActiveSession(session);
        
        // Calculate time left
        const expiryTime = new Date(session.session.expiryTime);
        const now = new Date();
        const remainingMs = expiryTime.getTime() - now.getTime();
        const remainingSeconds = Math.floor(remainingMs / 1000);
        setTimeLeft(remainingSeconds);
        
        // Use the complete QR code generated by backend (includes all required fields)
        console.log('🎯 Session creation response:', response);
        console.log('🎯 QR code data available:', !!response.data.qrCode);
        console.log('🎯 Raw QR data available:', !!response.data.qrData);
        
        let qrCodeDataUrl;
        if (response.data.qrCode) {
          // Use the complete QR code from backend (recommended)
          qrCodeDataUrl = response.data.qrCode;
          console.log('✅ Using complete QR code from backend');
          
          // Also log the raw QR data for debugging
          if (response.data.qrData) {
            console.log('🔍 Raw QR data from backend:', response.data.qrData);
            try {
              const parsedQRData = JSON.parse(response.data.qrData);
              console.log('🔍 Parsed QR data fields:', Object.keys(parsedQRData));
              console.log('🔍 SessionId in QR:', parsedQRData.sessionId);
              console.log('🔍 Type in QR:', parsedQRData.type);
            } catch (e) {
              console.error('❌ Failed to parse QR data:', e);
            }
          }
        } else {
          // Fallback: generate basic QR code (should not happen with proper backend)
          console.warn('⚠️  Backend did not provide complete QR code, generating basic one');
          const qrData = JSON.stringify({
            sessionId: response.data.session?.sessionId || session.sessionId,
            type: 'attendance'
          });
          qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        }
        
        setQrCodeUrl(qrCodeDataUrl);
      } else {
        throw new Error(response.message || 'Failed to create session');
      }

    } catch (error) {
      console.error('Error generating QR code:', error);
      setError(error.message || 'Failed to generate QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const endSession = async () => {
    if (activeSession) {
      try {
        await apiService.endSession(activeSession._id);
        setActiveSession(null);
        setQrCodeUrl('');
        setTimeLeft(0);
      } catch (error) {
        console.error('Error ending session:', error);
        setError('Failed to end session');
      }
    }
  };

  const formatTime = (seconds) => {
    // Handle NaN or invalid seconds
    if (isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentDateTime = () => {
    return new Date().toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-3 sm:p-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Generate QR Code for Attendance</h2>
        
        {error && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-xs sm:text-sm">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Form Section */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Subject</label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={!!activeSession}
              >
                <option value="">Select a subject...</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Period</label>
              <select
                name="period"
                value={formData.period}
                onChange={handleInputChange}
                className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={!!activeSession}
              >
                {periods.map(period => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={!!activeSession}
              >
                <option value={30}>30 minutes</option>
                <option value={50}>50 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!!activeSession}
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!!activeSession}
                >
                  {sections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
            </div>


            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Current Date & Time:</strong><br />
                <span className="text-xs sm:text-sm">{getCurrentDateTime()}</span>
              </p>
            </div>

            {!activeSession ? (
              <button
                onClick={generateQRCode}
                disabled={isGenerating || !formData.subjectId}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 text-white font-semibold py-2 sm:py-3 px-4 rounded-md text-sm sm:text-base transition-colors touch-manipulation"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating QR Code...
                  </span>
                ) : (
                  'Generate QR Code'
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-center">
                  <p className="text-green-800 font-semibold">Session Active</p>
                  <p className="text-green-600 text-sm">Students can now scan the QR code</p>
                </div>
                <button
                  onClick={endSession}
                  className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2 px-4 rounded-md text-sm sm:text-base transition-colors touch-manipulation"
                >
                  End Session
                </button>
              </div>
            )}
          </div>

          {/* QR Code Display Section */}
          <div className="flex flex-col items-center space-y-4">
            {qrCodeUrl ? (
              <>
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-lg">
                  <img src={qrCodeUrl} alt="Attendance QR Code" className="w-64 h-64" />
                </div>
                
                <div className="text-center space-y-2">
                  <div className={`text-2xl font-bold ${timeLeft <= 60 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-sm text-gray-600">Time remaining</p>
                  
                  {timeLeft <= 60 && (
                    <p className="text-red-600 text-sm font-semibold animate-pulse">
                      ⚠️ QR Code will expire soon!
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg w-full max-w-sm">
                  <h4 className="font-semibold text-gray-800 mb-2">Session Details:</h4>
                  <div className="text-sm space-y-1">
                    {activeSession?.subject && (
                      <p><span className="font-medium">Subject:</span> {activeSession.subject.code} - {activeSession.subject.name}</p>
                    )}
                    <p><span className="font-medium">Class:</span> {activeSession?.class || formData.class} - {activeSession?.section || formData.section}</p>
                    <p><span className="font-medium">Duration:</span> {activeSession?.duration || formData.duration} minutes</p>
                    {activeSession?.startTime && (
                      <p><span className="font-medium">Started:</span> {new Date(activeSession.startTime).toLocaleTimeString()}</p>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-sm">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Students must scan this QR code within the classroom to mark attendance.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm">QR Code will appear here</p>
                  </div>
                </div>
                <p className="text-sm mt-4">Fill the form and click "Generate QR Code"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">For Faculty:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Select the correct subject, class details, and session duration</li>
              <li>Click "Generate QR Code" to create a session</li>
              <li>Display the QR code to students in the classroom</li>
              <li>QR code validity depends on the duration you set</li>
              <li>Monitor attendance in real-time and end session when done</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">For Students:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Scan the QR code using your mobile device</li>
              <li>Must be present in the designated classroom</li>
              <li>Attendance will be marked automatically</li>
              <li>Cannot mark attendance twice for the same session</li>
              <li>QR code expires when session duration ends</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;