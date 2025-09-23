import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

const QRScanner = () => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScanner = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on component unmount
      if (html5QrcodeScanner.current) {
        html5QrcodeScanner.current.clear();
      }
    };
  }, []);

  const startScanning = async () => {
    setError('');
    setScanResult(null);
    setIsScanning(true);

    // Check camera permissions first
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device/browser');
      }

      // Check if we have camera permission
      const permissionStatus = await navigator.permissions.query({ name: 'camera' }).catch(() => null);
      if (permissionStatus && permissionStatus.state === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access in your browser settings.');
      }

    } catch (permError) {
      console.error('Permission check failed:', permError);
      setError(permError.message || 'Camera permission required. Please enable camera access.');
      setIsScanning(false);
      return;
    }

    // Add a small delay to ensure DOM element is rendered
    setTimeout(() => {
      tryStartScanner();
    }, 100);
  };

  const tryStartScanner = async () => {
    const configs = [
      // Basic configuration (most compatible)
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      // Enhanced configuration (better quality)
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment"
        }
      },
      // Fallback configuration (minimal)
      {
        fps: 5,
        qrbox: 200,
        rememberLastUsedCamera: false,
        aspectRatio: 1.0
      }
    ];

    for (let i = 0; i < configs.length; i++) {
      try {
        const qrReaderElement = document.getElementById('qr-reader');
        if (!qrReaderElement) {
          throw new Error('QR reader element not found. Please refresh the page.');
        }

        // Clear any existing scanner
        if (html5QrcodeScanner.current) {
          await html5QrcodeScanner.current.clear().catch(() => {});
        }

        console.log(`Trying scanner configuration ${i + 1}/${configs.length}`);
        
        html5QrcodeScanner.current = new Html5QrcodeScanner(
          "qr-reader",
          configs[i],
          false
        );

        await html5QrcodeScanner.current.render(onScanSuccess, onScanFailure);
        console.log('Scanner started successfully');
        return; // Success, exit the loop

      } catch (error) {
        console.error(`Scanner config ${i + 1} failed:`, error);
        
        if (i === configs.length - 1) {
          // Last config failed, show error
          let errorMessage = 'Failed to start camera.';
          
          if (error.message.includes('Permission denied')) {
            errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
          } else if (error.message.includes('not found') || error.message.includes('NotFoundError')) {
            errorMessage = 'No camera found. Please ensure your device has a camera.';
          } else if (error.message.includes('NotAllowedError')) {
            errorMessage = 'Camera access not allowed. Please enable camera permissions.';
          } else if (error.message.includes('NotSupportedError')) {
            errorMessage = 'Camera not supported on this device/browser.';
          }
          
          setError(errorMessage);
          setIsScanning(false);
        }
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    setLoading(true);
    try {
      console.log('🔍 ===========================================');
      console.log('🔍 QR CODE SCAN DEBUG - START');
      console.log('🔍 ===========================================');
      console.log('🔍 Raw scanned text (first 200 chars):', decodedText.substring(0, 200));
      console.log('🔍 Raw text length:', decodedText.length);
      console.log('🔍 Raw text type:', typeof decodedText);
      
      // Try to parse QR code data
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
        console.log('✅ JSON parsing successful');
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        throw new Error(`Invalid QR code format: ${parseError.message}`);
      }
      
      console.log('🔍 Parsed QR data:', qrData);
      console.log('🔍 QR data type:', typeof qrData);
      console.log('🔍 QR data keys:', Object.keys(qrData || {}));
      
      // Check each required field individually
      console.log('🔍 Field checks:');
      console.log('🔍 - sessionId exists:', 'sessionId' in qrData);
      console.log('🔍 - sessionId value:', qrData.sessionId);
      console.log('🔍 - sessionId type:', typeof qrData.sessionId);
      console.log('🔍 - type exists:', 'type' in qrData);
      console.log('🔍 - type value:', qrData.type);
      console.log('🔍 - type typeof:', typeof qrData.type);
      
      // Detailed validation with specific error messages
      if (!qrData || typeof qrData !== 'object') {
        throw new Error('QR code does not contain valid JSON object');
      }
      
      if (!('sessionId' in qrData)) {
        console.error('❌ sessionId field missing from QR code');
        console.error('🔍 Available fields:', Object.keys(qrData));
        throw new Error('Missing sessionId field in QR code');
      }
      
      if (!qrData.sessionId || qrData.sessionId === '' || qrData.sessionId === null || qrData.sessionId === undefined) {
        console.error('❌ sessionId field exists but is empty/null');
        throw new Error(`Invalid sessionId value: '${qrData.sessionId}'`);
      }
      
      if (!('type' in qrData)) {
        console.error('❌ type field missing from QR code');
        throw new Error('Missing type field in QR code');
      }
      
      if (qrData.type !== 'attendance') {
        console.error('❌ type field has wrong value');
        throw new Error(`Invalid type: expected 'attendance', got '${qrData.type}'`);
      }
      
      console.log('✅ QR code validation passed!');
      console.log('🔍 ===========================================');
      console.log('🔍 QR CODE SCAN DEBUG - END');
      console.log('🔍 ===========================================');

      // Get current location for geofencing
      const location = await getCurrentLocation();
      
      // Submit attendance to backend
      const attendanceData = {
        sessionId: qrData.sessionId,
        location: location,
        timestamp: new Date().toISOString()
      };
      
      const result = await apiService.markAttendance(attendanceData);
      
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
      console.error('Error processing QR scan:', error);
      setScanResult({
        type: 'error',
        message: error.message || 'Invalid QR code or processing error'
      });
    } finally {
      setLoading(false);
      stopScanning();
    }
  };

  const onScanFailure = (error) => {
    // Ensure error is a string before calling includes()
    const errorMsg = typeof error === 'string' ? error : (error && error.message) ? error.message : '';
    
    // Filter out common scanning messages that are not actual errors
    const commonMessages = [
      'No QR code found',
      'No MultiFormat Readers were able to detect the code',
      'QR code parse error',
      'NotFoundException'
    ];
    
    const isCommonMessage = commonMessages.some(msg => errorMsg.includes(msg));
    
    // Only log actual errors, not the expected scanning messages
    if (!isCommonMessage && errorMsg) {
      console.error('QR Scan failed:', error);
    }
  };

  const stopScanning = () => {
    if (html5QrcodeScanner.current) {
      html5QrcodeScanner.current.clear();
      html5QrcodeScanner.current = null;
    }
    setIsScanning(false);
  };

  // Get current location for geofencing
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback to simulated location if geolocation is not available
        resolve({
          latitude: 17.4065, // Example coordinates for the college
          longitude: 78.4772
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to simulated location
          resolve({
            latitude: 17.4065,
            longitude: 78.4772
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const resetScanner = () => {
    setScanResult(null);
    setError('');
    setLoading(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Scan QR Code for Attendance</h2>
        
        {error && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-red-600 text-xs sm:text-sm">{error}</p>
                {(error.includes('camera') || error.includes('Camera') || error.includes('permission')) && (
                  <Link 
                    to="/student/camera-test" 
                    className="text-blue-600 hover:text-blue-800 text-xs underline mt-1 inline-block"
                  >
                    Test Camera & Troubleshoot →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!isScanning && !scanResult && !loading && (
          <div className="text-center">
            <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Ready to Scan</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">Position the QR code within the camera frame to mark your attendance</p>
            <button
              onClick={startScanning}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
            >
              Start Camera
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-lg text-gray-600">Processing attendance...</span>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Scanning for QR Code...</h3>
              <button
                onClick={stopScanning}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium touch-manipulation self-start"
              >
                Stop Scanning
              </button>
            </div>
            
            <div id="qr-reader" ref={scannerRef} className="mx-auto max-w-xs sm:max-w-md"></div>
            
            <div className="text-center text-xs sm:text-sm text-gray-600 space-y-1">
              <p><strong>Scanning Tips:</strong></p>
              <p>• Hold your device steady and point at the QR code</p>
              <p>• Ensure good lighting - avoid shadows or glare</p>
              <p>• Keep a moderate distance (6-12 inches away)</p>
              <p>• Wait a moment for the camera to focus</p>
              <p>• Make sure you're physically in the classroom</p>
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
                    <h4 className="font-semibold text-green-800 mb-2">Session Details:</h4>
                    <div className="text-sm text-green-700 space-y-1 text-left">
                      {scanResult.details.session && (
                        <>
                          <p><span className="font-medium">Subject:</span> {scanResult.details.session.subject?.code} - {scanResult.details.session.subject?.name}</p>
                          <p><span className="font-medium">Class:</span> {scanResult.details.session.class} - {scanResult.details.session.section}</p>
                          <p><span className="font-medium">Faculty:</span> {scanResult.details.session.faculty?.name}</p>
                        </>
                      )}
                      <p><span className="font-medium">Time Marked:</span> {new Date(scanResult.details.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={resetScanner}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Scan Another Code
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600">Scan Failed</h3>
                  <p className="text-gray-600 mt-2">{scanResult.message}</p>
                </div>
                
                <button
                  onClick={resetScanner}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">How to Mark Attendance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Steps:</h4>
            <ol className="text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-2 list-decimal list-inside">
              <li>Make sure you're physically present in the classroom</li>
              <li>Wait for your faculty to display the QR code</li>
              <li>Click "Start Camera" to begin scanning</li>
              <li>Point your camera at the QR code</li>
              <li>Wait for automatic processing and confirmation</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Important Notes:</h4>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-2 list-disc list-inside">
              <li>QR codes are valid for only 5 minutes</li>
              <li>You must be in the classroom (geofencing active)</li>
              <li>Each student can scan only once per session</li>
              <li>Late scanning after code expiry will not work</li>
              <li>Contact faculty if you face technical issues</li>
            </ul>
          </div>
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

export default QRScanner;