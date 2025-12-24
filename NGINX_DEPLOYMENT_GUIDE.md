# AWS Practice App - Nginx Deployment Guide

This guide covers everything you need to build and deploy your React AWS Practice App using Nginx.

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Nginx web server
- A server or VPS (Ubuntu/CentOS/etc.)

## 🏗️ Step 1: Build the React App

### 1.1 Navigate to your project directory
```bash
cd aws-practice-app
```

### 1.2 Install dependencies
```bash
npm install
# or
yarn install
```

### 1.3 Build the production version
```bash
npm run build
# or
yarn build
```

This creates a `build` folder with optimized production files.

### 1.4 Verify the build
```bash
ls -la build/
```

You should see:
- `index.html`
- `static/` folder with CSS, JS, and media files
- `manifest.json`
- Other static assets

## 🌐 Step 2: Install and Configure Nginx

### 2.1 Install Nginx

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx
```

**CentOS/RHEL:**
```bash
sudo yum install nginx
# or for newer versions
sudo dnf install nginx
```

**macOS (for local testing):**
```bash
brew install nginx
```

### 2.2 Start and enable Nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.3 Check Nginx status
```bash
sudo systemctl status nginx
```

## 📁 Step 3: Deploy Your App Files

### 3.1 Create deployment directory
```bash
sudo mkdir -p /var/www/aws-practice-app
```

### 3.2 Copy build files to server
```bash
# If deploying locally
sudo cp -r build/* /var/www/aws-practice-app/

# If deploying to remote server via SCP
scp -r build/* user@your-server:/tmp/
# Then on the server:
sudo mv /tmp/* /var/www/aws-practice-app/
```

### 3.3 Set proper permissions
```bash
sudo chown -R www-data:www-data /var/www/aws-practice-app
sudo chmod -R 755 /var/www/aws-practice-app
```

## ⚙️ Step 4: Configure Nginx

### 4.1 Create Nginx configuration file
```bash
sudo nano /etc/nginx/sites-available/aws-practice-app
```

### 4.2 Add the following configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Replace with your domain name or server IP
    server_name your-domain.com www.your-domain.com;
    # For IP-only access, use: server_name _;
    
    root /var/www/aws-practice-app;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Cache other assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Security: Hide nginx version
    server_tokens off;
    
    # Prevent access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 4.3 Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/aws-practice-app /etc/nginx/sites-enabled/
```

### 4.4 Remove default site (optional)
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 4.5 Test Nginx configuration
```bash
sudo nginx -t
```

### 4.6 Reload Nginx
```bash
sudo systemctl reload nginx
```

## 🔒 Step 5: SSL/HTTPS Setup (Recommended)

### 5.1 Install Certbot
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### 5.2 Obtain SSL certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 5.3 Auto-renewal setup
```bash
sudo crontab -e
```

Add this line:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Step 6: Performance Optimization

### 6.1 Update Nginx main configuration
```bash
sudo nano /etc/nginx/nginx.conf
```

Add/modify these settings in the `http` block:
```nginx
http {
    # Worker processes
    worker_processes auto;
    
    # Connection settings
    worker_connections 1024;
    keepalive_timeout 65;
    
    # File upload limits
    client_max_body_size 10M;
    
    # Buffer sizes
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
    
    # Enable sendfile
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    # Your existing configuration...
}
```

## 🚀 Step 7: Deployment Script (Optional)

Create an automated deployment script:

```bash
nano deploy.sh
```

```bash
#!/bin/bash

# AWS Practice App Deployment Script

echo "🚀 Starting deployment..."

# Build the app
echo "📦 Building React app..."
cd aws-practice-app
npm run build

# Backup current deployment
echo "💾 Creating backup..."
sudo cp -r /var/www/aws-practice-app /var/www/aws-practice-app.backup.$(date +%Y%m%d_%H%M%S)

# Deploy new build
echo "📁 Deploying new build..."
sudo rm -rf /var/www/aws-practice-app/*
sudo cp -r build/* /var/www/aws-practice-app/

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/www/aws-practice-app
sudo chmod -R 755 /var/www/aws-practice-app

# Test and reload Nginx
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Your app is available at: http://your-domain.com"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## 🔍 Step 8: Monitoring and Logs

### 8.1 Check Nginx logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 8.2 Monitor Nginx status
```bash
sudo systemctl status nginx
```

### 8.3 Check disk space
```bash
df -h /var/www/aws-practice-app
```

## 🛠️ Troubleshooting

### Common Issues:

**1. 403 Forbidden Error:**
```bash
# Check file permissions
ls -la /var/www/aws-practice-app
sudo chown -R www-data:www-data /var/www/aws-practice-app
```

**2. 404 Not Found for routes:**
- Ensure the `try_files` directive is correctly configured for React Router

**3. Static files not loading:**
```bash
# Check if files exist
ls -la /var/www/aws-practice-app/static/
```

**4. Nginx won't start:**
```bash
# Check configuration
sudo nginx -t
# Check what's using port 80
sudo netstat -tlnp | grep :80
```

## 📊 Step 9: Performance Testing

### Test your deployment:
```bash
# Check response time
curl -w "@curl-format.txt" -o /dev/null -s "http://your-domain.com"

# Load testing with Apache Bench
ab -n 100 -c 10 http://your-domain.com/
```

Create `curl-format.txt`:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

## 🔄 Step 10: Updates and Maintenance

### Regular maintenance tasks:

1. **Update the app:**
   ```bash
   ./deploy.sh
   ```

2. **Update Nginx:**
   ```bash
   sudo apt update && sudo apt upgrade nginx
   ```

3. **Renew SSL certificates:**
   ```bash
   sudo certbot renew --dry-run
   ```

4. **Clean old backups:**
   ```bash
   sudo find /var/www/ -name "aws-practice-app.backup.*" -mtime +30 -delete
   ```

## 📝 Final Checklist

- [ ] React app builds successfully
- [ ] Nginx is installed and running
- [ ] App files are deployed to `/var/www/aws-practice-app`
- [ ] Nginx configuration is created and enabled
- [ ] SSL certificate is installed (if using HTTPS)
- [ ] All routes work correctly (test navigation)
- [ ] Static files load properly
- [ ] Performance is optimized
- [ ] Monitoring is set up

## 🌐 Access Your App

Your AWS Practice App should now be available at:
- HTTP: `http://your-domain.com` or `http://your-server-ip`
- HTTPS: `https://your-domain.com` (if SSL is configured)

## 📞 Support

If you encounter issues:
1. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify file permissions and ownership
3. Test Nginx configuration: `sudo nginx -t`
4. Ensure all required files are in place

---

**🎉 Congratulations! Your AWS Practice App is now live and ready for users to practice their certification exams.**