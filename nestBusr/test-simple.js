console.log('=== SIMPLE TEST FILE ===');
console.log('Node.js is working');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Test if we can require the main file
try {
  console.log('Attempting to require main.ts...');
  require('./src/main.ts');
  console.log('Successfully required main.ts');
} catch (error) {
  console.error('Error requiring main.ts:', error.message);
} 