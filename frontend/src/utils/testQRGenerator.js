/**
 * Test QR Code Generator Utility
 * Use this to generate test QR codes for testing the scanner
 */

// Test QR code data that matches the expected format
export const generateTestQRData = (sessionId = 'test-session-123') => {
  return JSON.stringify({
    type: 'attendance',
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
};

// Sample test data
export const sampleTestData = {
  validQR: generateTestQRData('test-session-123'),
  
  // Another test session
  validQR2: generateTestQRData('session-456-math-101'),
  
  // Invalid format (missing type)
  invalidQR1: JSON.stringify({
    sessionId: 'test-session-123',
    timestamp: new Date().toISOString()
  }),
  
  // Invalid format (wrong type)
  invalidQR2: JSON.stringify({
    type: 'invalid',
    sessionId: 'test-session-123',
    timestamp: new Date().toISOString()
  })
};

/**
 * Console helper to generate QR codes for testing
 * Run this in browser console: generateTestQRForConsole()
 */
export const generateTestQRForConsole = () => {
  const testData = generateTestQRData();
  console.log('Test QR Code Data:');
  console.log(testData);
  console.log('\nTo test:');
  console.log('1. Copy the data above');
  console.log('2. Go to https://qr-code-generator.com/');
  console.log('3. Paste the data and generate a QR code');
  console.log('4. Display the QR code and test with your scanner');
  return testData;
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.generateTestQRForConsole = generateTestQRForConsole;
  window.sampleTestData = sampleTestData;
}