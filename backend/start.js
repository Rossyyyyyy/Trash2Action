// start.js - Helper script to start the server with clear instructions
const { spawn } = require('child_process');
const os = require('os');

// Get local network IP
function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalNetworkIP();
const port = process.env.PORT || 5000;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║           🌱 Trash2Action Backend Server 🌱              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📡 Network Configuration:');
console.log(`   Local:   http://localhost:${port}`);
console.log(`   Network: http://${localIP}:${port}\n`);

console.log('📱 Mobile devices on the same WiFi can connect to:');
console.log(`   http://${localIP}:${port}\n`);

console.log('🔍 Test endpoints:');
console.log(`   http://${localIP}:${port}/health`);
console.log(`   http://${localIP}:${port}/status\n`);

console.log('⚡ Starting server...\n');
console.log('─────────────────────────────────────────────────────────────\n');

// Start the actual server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Server exited with code ${code}`);
  }
  process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});
