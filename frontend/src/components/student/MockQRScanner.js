import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

const MockQRScanner = () => {
  const { user } = useAuth();
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSessions, setAvailableSessions] = useState([]);

  // Sample QR data for testing (matches backend format)
  const sampleQRData = JSON.stringify({
    type: 'attendance',
    sessionId: 'test-session-123',
    facultyId: 'faculty-id-123',
    subject: 'MATH101',
    period: 1,
    class: 'CSE',
    section: 'A',
    timestamp: new Date().toISOString(),
    expiryTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    geofence: {
      latitude: 17.4065,
      longitude: 78.4772,
      radius: 50
    },
    version: '1.0'
  });

  const processQRCode = async (qrText) => {
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      console.log('🔍 ==========================================');
      console.log('🔍 MOCK SCANNER: PROCESSING QR CODE');
      console.log('🔍 ==========================================');
      console.log('🔍 Raw QR text (type):', typeof qrText);
      console.log('🔍 Raw QR text (length):', qrText?.length);
      console.log('🔍 Raw QR text (first 200 chars):', qrText?.substring(0, 200));
      console.log('🔍 Raw QR text (full):', qrText);
      
      // Parse QR code data
      const qrData = JSON.parse(qrText);
      console.log('✅ JSON parsing successful');
      console.log('✅ Parsed QR data keys:', Object.keys(qrData));
      console.log('✅ Full parsed data:', JSON.stringify(qrData, null, 2));
      
      console.log('🔍 Field validation:');
      console.log('  - type field:', qrData.type, '(expected: "attendance")');
      console.log('  - sessionId field:', qrData.sessionId, '(exists:', !!qrData.sessionId, ')');
      console.log('  - facultyId field:', qrData.facultyId, '(exists:', !!qrData.facultyId, ')');
      console.log('  - subject field:', qrData.subject, '(exists:', !!qrData.subject, ')');
      console.log('  - timestamp field:', qrData.timestamp, '(exists:', !!qrData.timestamp, ')');
      console.log('  - geofence field:', qrData.geofence, '(exists:', !!qrData.geofence, ')');
      
      // Validate QR code data structure
      if (!qrData.sessionId) {
        console.error('❌ VALIDATION FAILED: Missing sessionId');
        console.error('❌ Available fields:', Object.keys(qrData));
        console.error('❌ SessionId value:', qrData.sessionId);
        throw new Error('Missing sessionId in QR code');
      }
      
      if (qrData.type !== 'attendance') {
        console.error('❌ VALIDATION FAILED: Invalid type');
        console.error('❌ Expected: "attendance", Got:', qrData.type);
        throw new Error(`Invalid type: expected 'attendance', got '${qrData.type}'`);
      }
      
      console.log('✅ QR validation passed successfully!');
      console.log('🔍 ==========================================');

      // Get mock location
      const location = {
        latitude: 17.4065,
        longitude: 78.4772
      };
      
      // Submit attendance to backend
      const attendanceData = {
        sessionId: qrData.sessionId,
        location: location,
        timestamp: new Date().toISOString()
      };
      
      console.log('📝 Submitting attendance data:', attendanceData);
      const result = await apiService.markAttendance(attendanceData);
      console.log('📝 Attendance API result:', result);
      
      if (result.success) {
        setScanResult({
          type: 'success',
          message: result.message || 'Attendance marked successfully!',
          details: {
            session: result.data.session,
            attendance: result.data.attendance,
            timestamp: new Date().toISOString()
          }
        });
        
        // Trigger a custom event to notify dashboard to refresh
        window.dispatchEvent(new CustomEvent('attendanceMarked', {
          detail: { attendance: result.data.attendance }
        }));
        console.log('🎉 Attendance marked successfully - dashboard refresh triggered');
      } else {
        throw new Error(result.message || 'Failed to mark attendance');
      }

    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanResult({
        type: 'error',
        message: error.message || 'Invalid QR code or processing error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      setError('Please enter QR code data');
      return;
    }
    processQRCode(qrInput);
  };

  const useSampleData = () => {
    setQrInput(sampleQRData);
  };

  const fetchAvailableSessions = async () => {
    console.log('🔍 Fetching available sessions for student...');
    try {
      const response = await apiService.get('/sessions/student/my');
      console.log('🔍 Sessions API response:', response);
      
      if (response.success) {
        console.log('🔍 Total sessions found:', response.data.length);
        console.log('🔍 Sessions data:', response.data);
        
        const sessions = response.data.slice(0, 5); // Show last 5 sessions
        setAvailableSessions(sessions);
        
        console.log('🔍 Set available sessions (count):', sessions.length);
        sessions.forEach((session, index) => {
          console.log(`  Session ${index + 1}:`, {
            id: session._id,
            sessionId: session.sessionId,
            subject: session.subject?.code,
            class: session.class,
            section: session.section,
            isActive: session.isActive,
            expiryTime: session.expiryTime
          });
        });
      } else {
        console.error('❌ Sessions API returned failure:', response);
      }
    } catch (error) {
      console.error('❌ Failed to fetch sessions:', error);
      console.error('❌ Error details:', error.message, error.stack);
    }
  };

  const selectRealSession = (session) => {
    console.log('🔍 Creating QR data for real session:', session);
    
    const qrDataObject = {
      type: 'attendance',
      sessionId: session.sessionId,
      facultyId: session.faculty?._id,
      subject: session.subject?.code,
      period: session.period,
      class: session.class,
      section: session.section,
      timestamp: new Date().toISOString(),
      expiryTime: session.expiryTime,
      geofence: session.geofence,
      version: '1.0'
    };
    
    console.log('🔍 Generated QR data object:', qrDataObject);
    console.log('🔍 QR data validation:', {
      hasType: !!qrDataObject.type,
      hasSessionId: !!qrDataObject.sessionId,
      hasFacultyId: !!qrDataObject.facultyId,
      hasSubject: !!qrDataObject.subject,
      typeValue: qrDataObject.type,
      sessionIdValue: qrDataObject.sessionId
    });
    
    const realQRData = JSON.stringify(qrDataObject);
    console.log('🔍 Final QR JSON string (first 200 chars):', realQRData.substring(0, 200));
    console.log('🔍 Final QR JSON length:', realQRData.length);
    
    setQrInput(realQRData);
  };

  const resetScanner = () => {
    setScanResult(null);
    setError('');
    setQrInput('');
    setLoading(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          Mock QR Scanner (Testing Mode)
        </h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-blue-800 font-semibold">Testing Mode</h3>
              <p className="text-blue-700 text-sm mt-1">
                This version doesn't require camera access. Perfect for testing the attendance system functionality.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {!scanResult && !loading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="qr-input" className="block text-sm font-medium text-gray-700 mb-2">
                Enter QR Code Data:
              </label>
              <textarea
                id="qr-input"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Paste QR code JSON data here..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
              >
                Process QR Code
              </button>
              
              <button
                type="button"
                onClick={useSampleData}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Use Sample Data
              </button>
              
              <button
                type="button"
                onClick={fetchAvailableSessions}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Load Real Sessions
              </button>
            </div>
            
            {availableSessions.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Available Sessions (Click to use):</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableSessions.map((session, index) => (
                    <div 
                      key={session._id} 
                      className="p-2 bg-white rounded border cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => selectRealSession(session)}
                    >
                      <div className="text-sm">
                        <strong>{session.subject?.code} - {session.subject?.name}</strong>
                        <br />
                        Class: {session.class} {session.section} | Period: {session.period}
                        <br />
                        Session ID: <code className="bg-gray-100 px-1 rounded">{session.sessionId}</code>
                        <br />
                        Status: <span className={session.isActive ? 'text-green-600' : 'text-red-600'}>
                          {session.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-lg text-gray-600">Processing attendance...</span>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="text-center">
            {scanResult.type === 'success' ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-600">Attendance Marked!</h3>
                  <p className="text-gray-600 mt-2">{scanResult.message}</p>
                </div>
                
                {scanResult.details && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="font-semibold text-green-800 mb-2">Details:</h4>
                    <div className="text-sm text-green-700 space-y-1 text-left">
                      <p><span className="font-medium">Session ID:</span> {scanResult.details.attendance?.sessionId || 'N/A'}</p>
                      <p><span className="font-medium">Status:</span> {scanResult.details.attendance?.status || 'Present'}</p>
                      <p><span className="font-medium">Time:</span> {new Date(scanResult.details.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600">Process Failed</h3>
                  <p className="text-gray-600 mt-2">{scanResult.message}</p>
                </div>
              </div>
            )}
            
            <button
              onClick={resetScanner}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Try Another Code
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use Mock Scanner</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Option 1: Use Sample Data</h4>
            <p className="text-sm text-gray-600">Click "Use Sample Data" to test with pre-filled QR code data.</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Option 2: Manual Input</h4>
            <p className="text-sm text-gray-600 mb-2">Paste this JSON format:</p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "type": "attendance",
  "sessionId": "your-session-id",
  "timestamp": "2025-09-22T22:30:00.000Z",
  "version": "1.0"
}`}
            </pre>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> This mock scanner tests the full attendance workflow without requiring camera access.
            Perfect for development and testing!
          </p>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-blue-900 font-semibold">Student Information</h4>
            <div className="text-blue-800 text-sm mt-1">
              <p>Logged in as: <span className="font-medium">{user?.name || user?.email}</span></p>
              <p>Current time: {new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockQRScanner;