# Deployment Guide

Complete guide for deploying the QR Attendance System to production environments.

## 🌐 Deployment Options

### 1. Traditional VPS/Server Deployment
### 2. Cloud Platform Deployment (Heroku, Railway, etc.)
### 3. Docker Containerization
### 4. Local Network Deployment

---

## 🚀 Production Environment Setup

### Prerequisites
- **Node.js** v16 or higher
- **MongoDB** (local, cloud, or managed instance)
- **SSL Certificate** (for HTTPS)
- **Domain name** (optional but recommended)
- **PM2** for process management

---

## 📋 Pre-Deployment Checklist

### Backend Security
- [ ] Change default JWT secret to a strong, random key
- [ ] Set up environment variables properly
- [ ] Enable CORS for specific frontend domains only
- [ ] Set up rate limiting
- [ ] Configure proper MongoDB security
- [ ] Enable logging and monitoring
- [ ] Set up backup strategy

### Frontend Security
- [ ] Remove development/debug code
- [ ] Set correct API URLs for production
- [ ] Optimize build for production
- [ ] Configure proper error handling
- [ ] Set up analytics (optional)

---

## 🗄️ Database Setup

### MongoDB Atlas (Cloud - Recommended)

1. **Create Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account and cluster

2. **Configure Database**
   ```javascript
   // Create these collections:
   // - users
   // - sessions  
   // - attendances
   
   // Create indexes for performance
   db.users.createIndex({ email: 1 }, { unique: true })
   db.attendances.createIndex({ studentId: 1, sessionId: 1 })
   db.sessions.createIndex({ facultyId: 1, isActive: 1 })
   ```

3. **Get Connection String**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qr-attendance?retryWrites=true&w=majority
   ```

### Self-Hosted MongoDB

1. **Install MongoDB**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mongodb-org
   
   # Start service
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

2. **Secure MongoDB**
   ```bash
   # Enable authentication
   sudo nano /etc/mongod.conf
   
   # Add:
   security:
     authorization: enabled
   ```

3. **Create Database User**
   ```javascript
   use qr-attendance
   db.createUser({
     user: "appuser",
     pwd: "strong-password",
     roles: [{ role: "readWrite", db: "qr-attendance" }]
   })
   ```

---

## 🖥️ Backend Deployment

### 1. VPS/Server Deployment

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx (for reverse proxy)
   sudo apt install nginx
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd QR-Attendance-System/backend
   
   # Install dependencies
   npm install --production
   
   # Create production environment file
   sudo nano .env
   ```

3. **Production .env File**
   ```env
   # Database
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/qr-attendance
   
   # Authentication  
   JWT_SECRET=your-super-secure-jwt-secret-min-32-characters
   
   # Server
   PORT=5000
   NODE_ENV=production
   
   # CORS
   FRONTEND_URL=https://yourdomain.com
   
   # Optional: Logging
   LOG_LEVEL=info
   ```

4. **Start with PM2**
   ```bash
   # Start application
   pm2 start server.js --name "qr-attendance-api"
   
   # Save PM2 configuration
   pm2 save
   
   # Setup startup script
   pm2 startup
   ```

5. **Nginx Configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/qr-attendance-api
   ```

   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/qr-attendance-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **SSL Certificate (Let's Encrypt)**
   ```bash
   # Install Certbot
   sudo apt install snapd
   sudo snap install --classic certbot
   
   # Get certificate
   sudo certbot --nginx -d api.yourdomain.com
   ```

### 2. Heroku Deployment

1. **Prepare for Heroku**
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login to Heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   cd backend
   
   # Create app
   heroku create qr-attendance-api
   
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secure-jwt-secret
   heroku config:set MONGODB_URI=your-mongodb-connection-string
   ```

3. **Deploy**
   ```bash
   # Add Heroku remote
   heroku git:remote -a qr-attendance-api
   
   # Deploy
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### 3. Railway Deployment

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Select the backend folder

2. **Set Environment Variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-secure-jwt-secret
   MONGODB_URI=your-mongodb-connection-string
   PORT=5000
   ```

3. **Deploy**
   - Railway automatically builds and deploys
   - Get your deployment URL

---

## 🌐 Frontend Deployment

### 1. Build Production Frontend

1. **Configure Production Environment**
   ```bash
   cd frontend
   
   # Create production .env
   echo "REACT_APP_API_URL=https://api.yourdomain.com/api" > .env.production
   ```

2. **Build Application**
   ```bash
   # Install dependencies
   npm install
   
   # Build for production
   npm run build
   
   # This creates a 'build' folder with optimized files
   ```

### 2. Deploy to Static Hosting

#### Netlify Deployment

1. **Manual Deployment**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Deploy
   cd frontend
   npm run build
   netlify deploy --prod --dir=build
   ```

2. **Automatic Deployment**
   - Connect GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `build`
   - Set environment variables in Netlify dashboard

#### Vercel Deployment

1. **Deploy with Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   cd frontend
   vercel --prod
   ```

2. **Configure Environment Variables**
   ```bash
   # Set API URL
   vercel env add REACT_APP_API_URL production
   ```

#### Traditional Web Server

1. **Copy Build Files**
   ```bash
   # Copy build files to web server
   scp -r build/* user@server:/var/www/html/qr-attendance/
   ```

2. **Nginx Configuration for SPA**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/html/qr-attendance;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Cache static assets
       location /static/ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

---

## 🐳 Docker Deployment

### 1. Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["node", "server.js"]
```

### 2. Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    restart: always
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://root:password@mongodb:27017/qr-attendance?authSource=admin
      JWT_SECRET: your-super-secure-jwt-secret
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### 4. Deploy with Docker Compose
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring

1. **PM2 Monitoring**
   ```bash
   # View status
   pm2 status
   
   # View logs
   pm2 logs
   
   # Monitor resources
   pm2 monit
   ```

2. **Log Files**
   ```bash
   # Create log directory
   sudo mkdir -p /var/log/qr-attendance
   
   # Configure log rotation
   sudo nano /etc/logrotate.d/qr-attendance
   ```

3. **Health Checks**
   ```bash
   # Add to cron for health monitoring
   */5 * * * * curl -f http://localhost:5000/api/health || echo "API is down" | mail -s "QR Attendance API Alert" admin@yourdomain.com
   ```

### 2. Error Tracking

Consider integrating services like:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **DataDog** for comprehensive monitoring

---

## 🔒 Security Best Practices

### 1. Environment Security
```bash
# Set proper file permissions
chmod 600 .env
chown app:app .env

# Use environment variables, never hardcode secrets
# Regularly rotate JWT secrets
# Use HTTPS everywhere
```

### 2. Database Security
```javascript
// Enable MongoDB authentication
// Use connection string with credentials
// Regularly backup database
// Monitor for suspicious activity
```

### 3. Server Security
```bash
# Keep system updated
sudo apt update && sudo apt upgrade

# Configure firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy QR Attendance System

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies (Backend)
      run: |
        cd backend
        npm ci
        
    - name: Install dependencies (Frontend)
      run: |
        cd frontend
        npm ci
        
    - name: Build Frontend
      run: |
        cd frontend
        npm run build
        
    - name: Deploy to Server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /var/www/qr-attendance
          git pull origin main
          cd backend && npm ci --production
          cd ../frontend && npm run build
          pm2 restart qr-attendance-api
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Backend Not Starting**
   ```bash
   # Check logs
   pm2 logs qr-attendance-api
   
   # Check port availability  
   sudo netstat -tulpn | grep :5000
   ```

2. **Database Connection Issues**
   ```bash
   # Test MongoDB connection
   mongo "your-mongodb-uri"
   
   # Check network connectivity
   telnet cluster.mongodb.net 27017
   ```

3. **Frontend Build Failures**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **SSL Certificate Issues**
   ```bash
   # Renew Let's Encrypt certificate
   sudo certbot renew
   
   # Test certificate
   sudo certbot certificates
   ```

---

## 📈 Performance Optimization

### Backend Optimizations
- Enable gzip compression
- Implement caching strategies
- Use database indexing
- Optimize database queries
- Set up CDN for static assets

### Frontend Optimizations
- Code splitting and lazy loading
- Image optimization
- PWA capabilities
- Service workers for caching
- Bundle analysis and optimization

---

## 📋 Post-Deployment Tasks

1. **Test All Features**
   - [ ] User authentication
   - [ ] QR code generation and scanning
   - [ ] Attendance marking
   - [ ] Dashboard updates
   - [ ] Report generation

2. **Set Up Monitoring**
   - [ ] Error tracking
   - [ ] Performance monitoring
   - [ ] Uptime monitoring
   - [ ] Database monitoring

3. **Configure Backups**
   - [ ] Database backups
   - [ ] Application code backups
   - [ ] Environment configuration backups

4. **Documentation**
   - [ ] Update API documentation
   - [ ] Document deployment process
   - [ ] Create user manuals
   - [ ] Set up knowledge base

---

## 🎯 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Multiple backend instances
- Database read replicas
- CDN integration

### Vertical Scaling
- Server resource monitoring
- Database performance tuning
- Cache optimization
- Memory management

---

**🎉 Congratulations! Your QR Attendance System is now deployed and ready for production use.**