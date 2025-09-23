import React, { useState, useRef, useEffect } from 'react';

const CameraTest = () => {
  const [cameraStatus, setCameraStatus] = useState('Not tested');
  const [cameraList, setCameraList] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState('Unknown');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    checkPermissionStatus();
    return () => {
      stopCamera();
    };
  }, []);

  const checkPermissionStatus = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        setPermissionStatus(permission.state);
        
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state);
        });
      }
    } catch (error) {
      console.log('Permission API not supported');
      setPermissionStatus('Not supported');
    }
  };

  const getCameraList = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setCameraList(cameras);
      return cameras;
    } catch (error) {
      console.error('Error getting camera list:', error);
      setError('Failed to get camera list: ' + error.message);
      return [];
    }
  };

  const testBasicCamera = async () => {
    setCameraStatus('Testing...');
    setError(null);
    
    try {
      // Test basic camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setCameraStatus('✅ Basic camera access working');
      
      // Get available cameras
      await getCameraList();
      
    } catch (error) {
      console.error('Camera test failed:', error);
      let message = 'Camera test failed: ';
      
      if (error.name === 'NotAllowedError') {
        message += 'Camera permission denied';
      } else if (error.name === 'NotFoundError') {
        message += 'No camera found';
      } else if (error.name === 'NotSupportedError') {
        message += 'Camera not supported';
      } else {
        message += error.message;
      }
      
      setCameraStatus('❌ ' + message);
      setError(message);
    }
  };

  const testEnvironmentCamera = async () => {
    setCameraStatus('Testing environment camera...');
    setError(null);
    
    try {
      // Stop current stream
      stopCamera();
      
      // Test environment (back) camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setCameraStatus('✅ Environment camera working');
      
    } catch (error) {
      console.error('Environment camera test failed:', error);
      
      // Fallback to any camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment" // Try without exact requirement
          },
          audio: false
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        
        setCameraStatus('✅ Fallback camera working (environment camera not available)');
        
      } catch (fallbackError) {
        setCameraStatus('❌ Environment camera failed, fallback also failed');
        setError('Environment camera test failed: ' + error.message);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraStatus('Camera stopped');
  };

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      checkPermissionStatus();
    } catch (error) {
      console.error('Permission request failed:', error);
      setError('Permission request failed: ' + error.message);
    }
  };

  const copyDiagnostics = () => {
    const diagnostics = {
      userAgent: navigator.userAgent,
      permissionStatus,
      cameraStatus,
      availableCameras: cameraList.length,
      mediaDevicesSupported: !!navigator.mediaDevices,
      getUserMediaSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      error: error
    };
    
    navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2))
      .then(() => alert('Diagnostics copied to clipboard'))
      .catch(() => console.log('Failed to copy diagnostics'));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Camera Diagnostics</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">System Info</h3>
            <p className="text-sm">Permission Status: <span className="font-mono">{permissionStatus}</span></p>
            <p className="text-sm">Camera Status: <span className="font-mono">{cameraStatus}</span></p>
            <p className="text-sm">Available Cameras: {cameraList.length}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Browser Support</h3>
            <p className="text-sm">MediaDevices: {navigator.mediaDevices ? '✅' : '❌'}</p>
            <p className="text-sm">getUserMedia: {navigator.mediaDevices?.getUserMedia ? '✅' : '❌'}</p>
            <p className="text-sm">HTTPS: {location.protocol === 'https:' ? '✅' : '❌'}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="border rounded p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Camera Preview</h3>
          <video 
            ref={videoRef}
            className="w-full max-w-md mx-auto block bg-black rounded"
            autoPlay
            playsInline
            muted
            style={{ height: '200px' }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={testBasicCamera}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            Test Basic Camera
          </button>
          
          <button
            onClick={testEnvironmentCamera}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
          >
            Test Environment Camera
          </button>
          
          <button
            onClick={stopCamera}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          >
            Stop Camera
          </button>
          
          <button
            onClick={requestPermission}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
          >
            Request Permission
          </button>
          
          <button
            onClick={copyDiagnostics}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
          >
            Copy Diagnostics
          </button>
        </div>

        {cameraList.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Available Cameras</h3>
            <ul className="text-sm space-y-1">
              {cameraList.map((camera, index) => (
                <li key={camera.deviceId} className="bg-gray-100 p-2 rounded">
                  <strong>Camera {index + 1}:</strong> {camera.label || 'Unknown Camera'}
                  <br />
                  <span className="text-gray-600">ID: {camera.deviceId}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-gray-600 mt-4">
          <p><strong>Troubleshooting Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Ensure you're using HTTPS (required for camera access)</li>
            <li>Check browser camera permissions in settings</li>
            <li>Try different browsers (Chrome, Firefox, Safari, Edge)</li>
            <li>On mobile, use the rear camera when possible</li>
            <li>Ensure no other apps are using the camera</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CameraTest;