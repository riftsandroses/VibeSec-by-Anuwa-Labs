const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Configure multer to keep original filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const username = req.username || 'unknown';
    const filename = `workspace_${username}_${timestamp}.zip`;
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());

// Mock user database
const users = {
  'demo': 'password123',
  'admin': 'admin123'
};

// Mock tokens storage
const tokens = new Map();

// Helper function to generate mock token
function generateToken(username, type = 'access') {
  return `mock_${type}_${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to validate token
function validateToken(token, expectedType = 'access') {
  const tokenData = tokens.get(token);
  if (!tokenData) {
    return { valid: false, error: 'Invalid token' };
  }
  
  if (tokenData.type !== expectedType) {
    return { valid: false, error: 'Invalid token type' };
  }

  const expiryTime = tokenData.type === 'access' ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const tokenAge = Date.now() - tokenData.createdAt;
  
  if (tokenAge > expiryTime) {
    tokens.delete(token);
    return { valid: false, error: 'Token expired' };
  }

  return { valid: true, data: tokenData };
}

// 1. Login API
app.post('/api/v1/login', (req, res) => {
  console.log('🔥 Login request:', req.body);
  
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  if (users[username] && users[username] === password) {
    const accessToken = generateToken(username, 'access');
    const refreshToken = generateToken(username, 'refresh');
    
    tokens.set(accessToken, { 
      username, 
      type: 'access',
      createdAt: Date.now()
    });
    tokens.set(refreshToken, { 
      username, 
      type: 'refresh',
      createdAt: Date.now()
    });

    console.log('✅ Login successful for:', username);
    
    return res.json({
      success: true,
      access: accessToken,
      refresh: refreshToken,
      message: 'Login successful',
      expiresIn: 900
    });
  } else {
    console.log('❌ Login failed for:', username);
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
});

// 2. Refresh Token API
app.post('/api/v1/refresh', (req, res) => {
  console.log('🔄 Token refresh request received');
  
  const { refresh } = req.body;

  if (!refresh) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  const validation = validateToken(refresh, 'refresh');
  
  if (!validation.valid) {
    console.log('❌ Refresh token validation failed:', validation.error);
    return res.status(401).json({
      success: false,
      message: validation.error
    });
  }

  const { username } = validation.data;
  const newAccessToken = generateToken(username, 'access');
  
  tokens.set(newAccessToken, { 
    username, 
    type: 'access',
    createdAt: Date.now()
  });

  console.log('✅ Token refreshed for user:', username);

  return res.json({
    success: true,
    access: newAccessToken,
    message: 'Token refreshed successfully',
    expiresIn: 900
  });
});

// 3. Logout API
app.post('/api/v1/logout', (req, res) => {
  console.log('👋 Logout request received');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No token provided'
    });
  }

  const token = authHeader.split(' ')[1];
  const tokenData = tokens.get(token);

  if (!tokenData) {
    console.log('⚠️ Logout with invalid/expired token');
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  const username = tokenData.username;

  let deletedCount = 0;
  for (const [key, value] of tokens.entries()) {
    if (value.username === username) {
      tokens.delete(key);
      deletedCount++;
    }
  }

  console.log(`✅ Logout successful for user: ${username}`);
  console.log(`   Deleted ${deletedCount} token(s)`);

  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// 4. Dashboard API (NEW)
app.get('/api/v1/dashboard', (req, res) => {
  console.log('📊 Dashboard request received');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No token provided'
    });
  }

  const token = authHeader.split(' ')[1];
  const validation = validateToken(token, 'access');

  if (!validation.valid) {
    return res.status(401).json({
      success: false,
      message: validation.error
    });
  }

  console.log('✅ Dashboard data fetched for user:', validation.data.username);
  // Mock dashboard data based on user
  const dashboardData = {
    'demo': {
      totalScans: 12,
      criticalIssues: "--",
      highIssues: 8,
      mediumIssues: 15,
      lowIssues: 22,
      lastScanDate: '2025-10-18',
      exploitableVulnerabilities: 5,
      recentScans: [
        { date: '2025-10-18', vulnerabilities: 48, duration: '2m 34s' },
        { date: '2025-10-15', vulnerabilities: 52, duration: '2m 41s' },
        { date: '2025-10-12', vulnerabilities: 45, duration: '2m 28s' }
      ]
    },
    'admin': {
      totalScans: 28,
      criticalIssues: 5,
      highIssues: 4,
      mediumIssues: 9,
      lowIssues: 14,
      lastScanDate: '2025-10-21',
      exploitableVulnerabilities: 2,
      recentScans: [
        { date: '2025-10-21', vulnerabilities: 28, duration: '3m 12s' },
        { date: '2025-10-19', vulnerabilities: 30, duration: '3m 05s' },
        { date: '2025-10-17', vulnerabilities: 32, duration: '3m 18s' }
      ]
    }
  };

  const userDashboard = dashboardData[validation.data.username] || dashboardData['demo'];

  res.json({
    success: true,
    ...userDashboard
  });
});

// 5. Security Testing API (MODIFIED)
app.post('/api/v1/security-testing/', upload.single('file'), (req, res) => {
  console.log('🔥 Security testing request received');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No token provided'
    });
  }

  const token = authHeader.split(' ')[1];
  const validation = validateToken(token, 'access');

  if (!validation.valid) {
    return res.status(401).json({
      success: false,
      message: validation.error
    });
  }

  // Store username for multer middleware filename
  req.username = validation.data.username;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  console.log('✅ Security scan completed for user:', validation.data.username);
  console.log('📦 Zip file saved:', req.file.filename);
  console.log('📁 File path:', req.file.path);
  console.log('💾 File size:', (req.file.size / 1024).toFixed(2), 'KB');

  // Mock vulnerability data
  const mockVulnerabilities = [
    {
      name: "SQL Injection",
      file: "src/database.js",
      lines: "45-48",
      severity: "Critical",
      impact: "Allows unauthorized database access and data manipulation",
      exploitable: true,
      cvssScore: 9.8,
      description: "The application concatenates user input directly into SQL queries without proper sanitization, making it vulnerable to SQL injection attacks.",
      cve: "CVE-2023-12345",
      recommendation: "Use parameterized queries or prepared statements to prevent SQL injection. Never concatenate user input directly into SQL queries.",
      codeSnippet: "const query = 'SELECT * FROM users WHERE id=' + userId;\ndb.query(query);",
      fix: "const query = 'SELECT * FROM users WHERE id=?';\ndb.query(query, [userId]);"
    },
    {
      name: "Cross-Site Scripting (XSS)",
      file: "src/views/profile.html",
      lines: "23-25",
      severity: "High",
      impact: "Attackers can inject malicious scripts into web pages viewed by users",
      exploitable: true,
      cvssScore: 7.4,
      description: "User input is rendered directly in HTML without proper encoding, allowing script injection.",
      cve: "CVE-2023-23456",
      recommendation: "Always sanitize and encode user input before rendering in HTML. Use a template engine with auto-escaping.",
      codeSnippet: "<div>${userInput}</div>",
      fix: "<div>${escapeHtml(userInput)}</div>"
    },
    {
      name: "Hardcoded Credentials",
      file: "config/database.config.js",
      lines: "12-15",
      severity: "Critical",
      impact: "Exposes sensitive database credentials in source code",
      exploitable: false,
      cvssScore: 9.1,
      description: "Database credentials are hardcoded in the source code, which is a severe security risk.",
      cve: null,
      recommendation: "Store credentials in environment variables or use a secure secrets management system.",
      codeSnippet: "const dbConfig = {\n  host: 'localhost',\n  user: 'admin',\n  password: 'admin123'\n};",
      fix: "const dbConfig = {\n  host: process.env.DB_HOST,\n  user: process.env.DB_USER,\n  password: process.env.DB_PASSWORD\n};"
    },
    {
      name: "Path Traversal",
      file: "src/fileHandler.js",
      lines: "67-70",
      severity: "High",
      impact: "Allows attackers to access files outside the intended directory",
      exploitable: true,
      cvssScore: 8.6,
      description: "The application uses user input to construct file paths without proper validation.",
      cve: "CVE-2023-34567",
      recommendation: "Validate and sanitize file paths. Use path.join() and check that the resolved path is within allowed directories.",
      codeSnippet: "const filePath = './uploads/' + req.query.file;\nres.sendFile(filePath);",
      fix: "const filePath = path.join('./uploads/', path.basename(req.query.file));\nif (!filePath.startsWith('./uploads/')) {\n  return res.status(400).send('Invalid path');\n}\nres.sendFile(filePath);"
    },
    {
      name: "Insecure Deserialization",
      file: "src/api/session.js",
      lines: "89-92",
      severity: "Medium",
      impact: "May lead to remote code execution or data tampering",
      exploitable: false,
      cvssScore: 6.5,
      description: "The application deserializes user-controlled data without validation.",
      cve: "CVE-2023-45678",
      recommendation: "Avoid deserializing untrusted data. If necessary, implement strict validation and use safe serialization formats like JSON.",
      codeSnippet: "const sessionData = JSON.parse(req.cookies.session);",
      fix: "try {\n  const sessionData = JSON.parse(req.cookies.session);\n  if (!validateSessionStructure(sessionData)) {\n    throw new Error('Invalid session');\n  }\n} catch (e) {\n  // Handle error\n}"
    },
    {
      name: "Missing Authentication",
      file: "src/routes/admin.js",
      lines: "15-18",
      severity: "High",
      impact: "Unauthorized access to administrative functions",
      exploitable: true,
      cvssScore: 8.2,
      description: "Admin routes are accessible without authentication checks.",
      cve: null,
      recommendation: "Implement authentication middleware for all sensitive routes.",
      codeSnippet: "app.get('/admin/users', (req, res) => {\n  // Admin functionality\n});",
      fix: "app.get('/admin/users', requireAuth, requireAdmin, (req, res) => {\n  // Admin functionality\n});"
    },
    {
      name: "Weak Cryptographic Algorithm",
      file: "src/utils/crypto.js",
      lines: "34-37",
      severity: "Medium",
      impact: "Encrypted data may be compromised",
      exploitable: false,
      cvssScore: 5.3,
      description: "The application uses MD5 for password hashing, which is cryptographically broken.",
      cve: null,
      recommendation: "Use modern hashing algorithms like bcrypt, scrypt, or Argon2 for password storage.",
      codeSnippet: "const hash = crypto.createHash('md5').update(password).digest('hex');",
      fix: "const hash = await bcrypt.hash(password, 12);"
    },
    {
      name: "Information Disclosure",
      file: "src/middleware/errorHandler.js",
      lines: "12-16",
      severity: "Low",
      impact: "Reveals sensitive system information to attackers",
      exploitable: true,
      cvssScore: 4.3,
      description: "Error messages include stack traces and system information in production.",
      cve: null,
      recommendation: "Log detailed errors server-side but return generic error messages to clients in production.",
      codeSnippet: "res.status(500).json({ error: err.stack });",
      fix: "if (process.env.NODE_ENV === 'production') {\n  res.status(500).json({ error: 'Internal server error' });\n} else {\n  res.status(500).json({ error: err.stack });\n}"
    }
  ];

  res.json({
    success: true,
    scanDate: new Date().toISOString(),
    totalVulnerabilities: mockVulnerabilities.length,
    vulnerabilities: mockVulnerabilities,
    uploadedFile: req.file.filename,
    fileSize: req.file.size,
    summary: {
      critical: mockVulnerabilities.filter(v => v.severity === 'Critical').length,
      high: mockVulnerabilities.filter(v => v.severity === 'High').length,
      medium: mockVulnerabilities.filter(v => v.severity === 'Medium').length,
      low: mockVulnerabilities.filter(v => v.severity === 'Low').length,
      exploitable: mockVulnerabilities.filter(v => v.exploitability === 'Exploitable').length
    }
  });
});

// 6. Profile API
app.get('/api/v1/profile', (req, res) => {
  console.log('🔥 Profile request received');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No token provided'
    });
  }

  const token = authHeader.split(' ')[1];
  const validation = validateToken(token, 'access');

  if (!validation.valid) {
    return res.status(401).json({
      success: false,
      message: validation.error
    });
  }

  console.log('✅ Profile fetched for user:', validation.data.username);

  const profiles = {
    'demo': {
      name: 'Demo User',
      email: 'demo@anuwalabs.com',
      profilePicture: null,
      accountType: 'Standard',
      memberSince: '2024-01-15',
      organization: 'Anuwa Labs Demo',
      serverHealth: {
        status: 'Online',
        uptime: '99.9%',
        responseTime: '45'
      }
    },
    'admin': {
      name: 'Administrator',
      email: 'admin@anuwalabs.com',
      profilePicture: null,
      accountType: 'Premium',
      memberSince: '2023-06-10',
      organization: 'Anuwa Labs',
      serverHealth: {
        status: 'Online',
        uptime: '99.99%',
        responseTime: '32'
      }
    }
  };

  const profile = profiles[validation.data.username] || profiles['demo'];
  
  res.json({
    success: true,
    ...profile
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeTokens: tokens.size
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'VibeSec Mock API Server',
    version: '1.0.0',
    endpoints: {
      login: 'POST /api/v1/login',
      refresh: 'POST /api/v1/refresh',
      logout: 'POST /api/v1/logout',
      dashboard: 'GET /api/v1/dashboard',
      securityTest: 'POST /api/v1/security-testing/',
      profile: 'GET /api/v1/profile',
      health: 'GET /health'
    },
    testCredentials: {
      user1: { username: 'demo', password: 'password123' },
      user2: { username: 'admin', password: 'admin123' }
    },
    tokenInfo: {
      accessTokenExpiry: '15 minutes',
      refreshTokenExpiry: '7 days'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 VibeSec Mock API Server Started!');
  console.log('================================');
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('  POST   /api/v1/login');
  console.log('  POST   /api/v1/refresh');
  console.log('  POST   /api/v1/logout');
  console.log('  GET    /api/v1/dashboard');
  console.log('  POST   /api/v1/security-testing/');
  console.log('  GET    /api/v1/profile');
  console.log('  GET    /health');
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('  Username: demo     Password: password123');
  console.log('  Username: admin    Password: admin123');
  console.log('');
  console.log('⏱️  Token Expiry:');
  console.log('  Access Token:  15 minutes');
  console.log('  Refresh Token: 7 days');
  console.log('');
  console.log('📁 Uploads Directory:', uploadsDir);
  console.log('');
  console.log('💡 Tip: Visit http://localhost:3007 for API info');
  console.log('================================');
  console.log('');
});