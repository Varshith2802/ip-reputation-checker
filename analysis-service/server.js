// server.js (Express)
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();

const PORT = process.env.PORT || 8002;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:30080', 'http://127.0.0.1:30080'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// IP validation function
function isValidIP(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

// SSRF protection - block private IP ranges
function isPrivateIP(ip) {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./
  ];
  
  return privateRanges.some(range => range.test(ip));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analysis-service' });
});

// IP reputation check endpoint
app.get('/check-ip', async (req, res) => {
  const ip = (req.query.ip || '').trim();
  
  // Input validation
  if (!ip) {
    return res.status(400).json({ message: 'IP address is required' });
  }
  
  if (!isValidIP(ip)) {
    return res.status(400).json({ message: 'Invalid IP address format' });
  }
  
  if (isPrivateIP(ip)) {
    return res.status(400).json({ message: 'Private IP addresses are not allowed' });
  }

  try {
    // Use HTTPS and add timeout
    const resp = await fetch(`https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,query,country,isp`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'IP-Reputation-Checker/1.0'
      }
    });
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    
    const json = await resp.json();

    if (json.status !== 'success') {
      return res.status(400).json({ message: 'IP lookup failed', query: ip });
    }

    // Map to the shape expected by api-service/frontend
    res.json({
      query: json.query,
      reputation: 'Good',        // or compute if you have threat intel
      country: json.country,
      provider: json.isp,
      threats: []
    });
  } catch (e) {
    // Generic error message to avoid information disclosure
    res.status(502).json({ message: 'IP lookup service temporarily unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`Analysis service listening on http://0.0.0.0:${PORT}`);
});
