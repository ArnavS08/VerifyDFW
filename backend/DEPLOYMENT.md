# Deployment Guide

Quick guide for deploying the USAII Emergency Monitor backend to various platforms.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended for Serverless)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/server.js"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Environment Variables:**
   Set in Vercel dashboard or CLI:
   ```bash
   vercel env add PORT
   vercel env add NODE_ENV
   ```

### Option 2: Railway.app (Easiest)

1. **Visit:** https://railway.app

2. **Connect GitHub repo** or use CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

3. **Railway automatically detects:**
   - Node.js project
   - npm start command
   - Required dependencies

4. **No configuration needed!** Railway auto-configures everything.

### Option 3: Render.com

1. **Visit:** https://render.com

2. **Create New Web Service**

3. **Settings:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

4. **Environment Variables:**
   - `NODE_ENV`: `production`

### Option 4: Heroku

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Create `Procfile`:**
   ```
   web: node server.js
   ```

3. **Deploy:**
   ```bash
   heroku login
   heroku create usaii-emergency-monitor
   git push heroku main
   ```

4. **Set Environment:**
   ```bash
   heroku config:set NODE_ENV=production
   ```

### Option 5: AWS EC2

1. **Launch EC2 Instance** (Ubuntu 22.04)

2. **SSH into instance:**
   ```bash
   ssh -i key.pem ubuntu@your-ip
   ```

3. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Clone and setup:**
   ```bash
   git clone your-repo
   cd backend
   npm install
   ```

5. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name usaii-monitor
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 6: Docker

1. **Create `Dockerfile`:**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm install --production
   
   COPY . .
   
   EXPOSE 3000
   
   CMD ["node", "server.js"]
   ```

2. **Create `.dockerignore`:**
   ```
   node_modules
   npm-debug.log
   .env
   .git
   ```

3. **Build and run:**
   ```bash
   docker build -t usaii-monitor .
   docker run -p 3000:3000 usaii-monitor
   ```

4. **Push to Docker Hub:**
   ```bash
   docker tag usaii-monitor yourusername/usaii-monitor
   docker push yourusername/usaii-monitor
   ```

### Option 7: DigitalOcean App Platform

1. **Visit:** https://cloud.digitalocean.com/apps

2. **Create App from GitHub**

3. **Configuration auto-detected:**
   - Run Command: `npm start`
   - Build Command: `npm install`

4. **One-click deploy!**

## 🔒 Production Checklist

### Security
- [ ] Enable HTTPS (use Let's Encrypt or platform SSL)
- [ ] Add rate limiting middleware
- [ ] Implement request validation
- [ ] Set secure CORS origins
- [ ] Add helmet.js for security headers
- [ ] Use environment variables for sensitive data

### Performance
- [ ] Enable response compression
- [ ] Implement caching (Redis)
- [ ] Add CDN for static assets
- [ ] Set up load balancing for scale
- [ ] Monitor API response times

### Reliability
- [ ] Set up health check monitoring
- [ ] Configure auto-restart on crash
- [ ] Add logging (Winston, Morgan)
- [ ] Set up error tracking (Sentry)
- [ ] Implement graceful shutdown

### Monitoring
- [ ] Application performance monitoring (APM)
- [ ] Error tracking and alerting
- [ ] Uptime monitoring
- [ ] API analytics

## 📊 Environment Variables

Create `.env` file for production:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# NWS API (optional customization)
CONTACT_EMAIL=your-email@example.com

# Monitoring (if using external services)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# CORS (restrict in production)
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🎯 Production Enhancements

### Add Rate Limiting
```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Add Compression
```bash
npm install compression
```

```javascript
import compression from 'compression';
app.use(compression());
```

### Add Helmet (Security)
```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

### Add Request Logging
```bash
npm install morgan
```

```javascript
import morgan from 'morgan';
app.use(morgan('combined'));
```

## 🧪 Testing Deployment

After deployment, test all endpoints:

```bash
# Replace with your deployed URL
export API_URL="https://your-api.com"

# Test health
curl $API_URL/health

# Test NWS
curl $API_URL/api/nws/alerts/active

# Test comprehensive
curl $API_URL/api/mock/comprehensive/frisco
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (AWS ELB, Nginx)
- Deploy multiple instances
- Share session state (Redis)

### Caching Strategy
```javascript
// Cache NWS responses for 5 minutes
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

### Database (Future Enhancement)
If you need to store historical data:
- PostgreSQL for structured data
- MongoDB for flexible schemas
- Redis for caching and sessions

## 🌐 Custom Domain Setup

### DNS Configuration
Point your domain to deployment:

```
Type: A Record
Name: api
Value: [your-server-ip]
```

Or for platforms like Vercel:
```
Type: CNAME
Name: api
Value: your-deployment.vercel.app
```

### SSL Certificate
Most platforms provide automatic SSL.

For manual setup:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

## 🎬 Quick Deploy Commands

### Railway (Fastest)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Vercel (Serverless)
```bash
npm install -g vercel
vercel login
vercel
```

### Heroku (Traditional)
```bash
heroku login
heroku create
git push heroku main
```

## 🆘 Troubleshooting

### Port already in use
```bash
# Find process
lsof -i :3000
# Kill it
kill -9 <PID>
```

### NWS API not responding
- Check internet connectivity
- Verify User-Agent header
- Check NWS API status: https://api.weather.gov

### Memory issues
Increase Node memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" node server.js
```

### CORS errors
Update CORS configuration:
```javascript
app.use(cors({
  origin: 'https://your-frontend.com',
  credentials: true
}));
```

## 📱 Frontend Integration

Update frontend API base URL:

```javascript
// Development
const API_URL = 'http://localhost:3000';

// Production
const API_URL = 'https://api.yourdomain.com';

// Auto-detect
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.yourdomain.com'
  : 'http://localhost:3000';
```

## ✅ Post-Deployment Verification

1. **Health Check:** `curl https://your-api.com/health`
2. **Live Data:** `curl https://your-api.com/api/nws/alerts/active`
3. **Mock Data:** `curl https://your-api.com/api/mock/pd/incidents`
4. **Comprehensive:** `curl https://your-api.com/api/mock/comprehensive/frisco`

---

**Recommended for Hackathon:** Railway.app or Vercel - fastest deployment, no configuration needed!
