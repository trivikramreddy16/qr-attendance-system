import React, { useState } from 'react';

const NetworkTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, details) => {
    const result = {
      test,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testBackendHealth = async () => {
    setLoading(true);
    addResult('Backend Health Check', 'testing', 'Testing backend connectivity...');

    const backendUrls = [
      'http://localhost:5000/health',
      'http://192.168.0.151:5000/health'
    ];

    for (const url of backendUrls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        addResult(
          `Backend Health (${url})`, 
          response.ok ? 'success' : 'error',
          `Status: ${response.status}, Response: ${JSON.stringify(data)}`
        );
      } catch (error) {
        addResult(
          `Backend Health (${url})`,
          'error', 
          `Error: ${error.message}`
        );
      }
    }
    setLoading(false);
  };

  const testApiService = async () => {
    setLoading(true);
    addResult('API Service Test', 'testing', 'Testing API service configuration...');

    try {
      // Import API service dynamically
      const { default: apiService } = await import('../../services/api');
      
      addResult(
        'API Service Config',
        'info',
        `Base URL: ${apiService.baseURL}, Current hostname: ${window.location.hostname}`
      );

      // Test health endpoint through API service
      const health = await apiService.get('/health');
      addResult('API Service Health', 'success', JSON.stringify(health));
      
    } catch (error) {
      addResult('API Service Test', 'error', error.message);
    }
    setLoading(false);
  };

  const testCORS = async () => {
    setLoading(true);
    addResult('CORS Test', 'testing', 'Testing CORS headers...');

    try {
      const response = await fetch('http://192.168.0.151:5000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        }
      });

      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      };

      addResult('CORS Headers', 'info', JSON.stringify(corsHeaders, null, 2));
      addResult('CORS Test', 'success', 'CORS request successful');

    } catch (error) {
      addResult('CORS Test', 'error', error.message);
    }
    setLoading(false);
  };

  const testQRFormat = async () => {
    setLoading(true);
    addResult('QR Format Test', 'testing', 'Testing QR code format validation...');

    try {
      // Test with correct format
      const correctQR = {
        type: 'attendance',
        sessionId: 'test-session-123',
        facultyId: 'faculty-id',
        subject: 'MATH101',
        timestamp: new Date().toISOString()
      };

      const correctText = JSON.stringify(correctQR);
      addResult('QR Format - Correct', 'success', `Format: ${correctText}`);

      // Test with missing type
      const wrongQR = {
        sessionId: 'test-session-123',
        facultyId: 'faculty-id'
      };
      
      const wrongText = JSON.stringify(wrongQR);
      addResult('QR Format - Missing Type', 'error', `Format: ${wrongText} (This should fail validation)`);

      // Test validation logic
      const testValidation = (qrData) => {
        if (!qrData.sessionId) return 'Missing sessionId';
        if (qrData.type !== 'attendance') return `Invalid type: expected 'attendance', got '${qrData.type}'`;
        return 'Valid';
      };

      addResult('Validation Test - Correct', 'success', testValidation(correctQR));
      addResult('Validation Test - Wrong', 'error', testValidation(wrongQR));

    } catch (error) {
      addResult('QR Format Test', 'error', error.message);
    }
    setLoading(false);
  };

  const runAllTests = async () => {
    clearResults();
    await testBackendHealth();
    await testApiService();
    await testCORS();
    await testQRFormat();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔧 Network Connectivity Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Current Environment:</h2>
        <ul className="text-sm space-y-1">
          <li><strong>Hostname:</strong> {window.location.hostname}</li>
          <li><strong>Origin:</strong> {window.location.origin}</li>
          <li><strong>User Agent:</strong> {navigator.userAgent}</li>
          <li><strong>Is ngrok:</strong> {window.location.hostname.includes('ngrok') ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          onClick={testBackendHealth}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Backend Health
        </button>
        
        <button 
          onClick={testApiService}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test API Service
        </button>
        
        <button 
          onClick={testCORS}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test CORS
        </button>
        
        <button 
          onClick={testQRFormat}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          Test QR Format
        </button>

        <button 
          onClick={runAllTests}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Run All Tests
        </button>

        <button 
          onClick={clearResults}
          disabled={loading}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Clear Results
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span>Running tests...</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border ${
              result.status === 'success' ? 'bg-green-50 border-green-200' :
              result.status === 'error' ? 'bg-red-50 border-red-200' :
              result.status === 'testing' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{result.test}</h3>
              <span className="text-xs text-gray-500">{result.timestamp}</span>
            </div>
            <pre className="text-sm whitespace-pre-wrap bg-white p-2 rounded border">
              {result.details}
            </pre>
          </div>
        ))}
      </div>

      {testResults.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-8">
          Click a test button above to start debugging network connectivity
        </div>
      )}
    </div>
  );
};

export default NetworkTest;