# 🚀 Good Vibes Planner - Deployment Guide

## Overview
This guide will help you deploy both the backend API and frontend application to production.

## 📋 Prerequisites
- GitHub account
- Railway account (for backend)
- Vercel account (for frontend)

## 🔧 Step 1: Backend Deployment (Railway)

### 1.1 Prepare Repository
1. Push your code to GitHub
2. Ensure `backend/` folder contains all necessary files

### 1.2 Deploy to Railway
1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Choose "Deploy from a folder" → select `backend`

### 1.3 Configure Environment Variables
In Railway dashboard, add these variables:
```bash
SECRET_KEY=your-super-secret-key-here-make-it-long-and-random
DATABASE_URL=sqlite:///./good_vibes.db
CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:3000
ENVIRONMENT=production
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=your-secure-admin-password
```

### 1.4 Generate Secret Key
```bash
# Run this locally to generate a secure secret key
openssl rand -hex 32
```

### 1.5 Test Backend
Once deployed, test your API:
```bash
# Replace with your Railway URL
curl https://your-backend-app.railway.app/

# Test user registration
curl -X POST https://your-backend-app.railway.app/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "password123"}'
```

## 🎨 Step 2: Frontend Deployment (Vercel)

### 2.1 Deploy to Vercel
1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite app

### 2.2 Configure Environment Variables
In Vercel dashboard → Settings → Environment Variables:
```bash
VITE_API_URL=https://your-backend-app.railway.app/api
```

### 2.3 Update Backend CORS
Update your Railway backend environment variables:
```bash
CORS_ORIGINS=https://your-frontend-app.vercel.app,http://localhost:3000
```

## 🔄 Step 3: Testing the Deployment

### 3.1 Test Authentication Flow
1. Visit your Vercel URL
2. Try registering a new account
3. Login with your credentials
4. Create calendars and todos
5. Logout and login with different account to verify isolation

### 3.2 Test Multi-User Functionality
1. Create multiple accounts
2. Verify each user sees only their own data
3. Test calendar creation, todo management

## 🛠️ Alternative Deployment Options

### Backend Alternatives
- **Render**: Similar to Railway, good free tier
- **Heroku**: Classic PaaS, requires credit card
- **DigitalOcean App Platform**: $5/month minimum
- **AWS/GCP**: More complex but scalable

### Frontend Alternatives
- **Netlify**: Great for static sites, good free tier
- **GitHub Pages**: Free but limited features
- **Surge.sh**: Simple deployment for static sites

## 📊 Production Checklist

### Security
- [ ] Strong SECRET_KEY set
- [ ] Default admin password changed
- [ ] CORS origins properly configured
- [ ] HTTPS enabled (automatic with Railway/Vercel)

### Performance
- [ ] Frontend build optimized
- [ ] API response times acceptable
- [ ] Database queries efficient

### Monitoring
- [ ] Backend logs accessible
- [ ] Error tracking set up
- [ ] Uptime monitoring configured

## 🔧 Environment Variables Reference

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing key | `abc123...` |
| `DATABASE_URL` | Database connection | `sqlite:///./good_vibes.db` |
| `CORS_ORIGINS` | Allowed origins | `https://app.vercel.app` |
| `ENVIRONMENT` | Environment type | `production` |
| `DEFAULT_USERNAME` | Admin username | `admin` |
| `DEFAULT_PASSWORD` | Admin password | `secure123` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.railway.app/api` |

## 🆘 Troubleshooting

### Common Issues

**CORS Errors**
- Ensure CORS_ORIGINS includes your frontend domain
- Check for trailing slashes in URLs

**Authentication Failures**
- Verify SECRET_KEY is consistent
- Check token expiration settings

**Database Issues**
- For production, consider upgrading to PostgreSQL
- Check file permissions for SQLite

**Build Failures**
- Ensure all dependencies in requirements.txt
- Check Node.js version compatibility

### Getting Help
1. Check deployment logs in Railway/Vercel dashboards
2. Test API endpoints directly with curl
3. Use browser dev tools to debug frontend issues

## 🎉 Success!
Your Good Vibes Planner is now live! Share the URL with friends and family to start planning together (with proper user isolation).

### Next Steps
- Set up custom domain names
- Add email notifications
- Implement data backup
- Add more advanced features 