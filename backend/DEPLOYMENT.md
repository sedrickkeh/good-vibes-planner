# Backend Deployment Guide

## Environment Variables

Set these environment variables in your deployment platform:

### Required
- `SECRET_KEY` - A long, random string for JWT token signing (generate with `openssl rand -hex 32`)
- `DATABASE_URL` - Database connection string (SQLite for development, PostgreSQL for production)

### Optional
- `DEFAULT_USERNAME` - Default admin username (default: "admin")
- `DEFAULT_PASSWORD` - Default admin password (default: "admin123")
- `ACCESS_TOKEN_EXPIRE_MINUTES` - JWT token expiration (default: 30)
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `ENVIRONMENT` - Set to "production" for production deployment

## Railway Deployment

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub repo
   - Select the `backend` folder

2. **Set Environment Variables**
   ```bash
   SECRET_KEY=your-super-secret-key-here
   DATABASE_URL=sqlite:///./good_vibes.db
   CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
   ENVIRONMENT=production
   ```

3. **Deploy**
   - Railway will automatically detect the Python app
   - It will use the `Procfile` or `railway.json` configuration
   - Your API will be available at `https://your-app.railway.app`

## Alternative Platforms

### Render
1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`

### Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `git push heroku main`

### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure build settings
3. Set environment variables

## Database Options

### SQLite (Development/Small Scale)
- Default option, file-based
- `DATABASE_URL=sqlite:///./good_vibes.db`

### PostgreSQL (Production)
- Recommended for production
- `DATABASE_URL=postgresql://user:password@host:port/database`

## Security Checklist

- [ ] Change default admin credentials
- [ ] Set a strong SECRET_KEY
- [ ] Configure CORS_ORIGINS properly
- [ ] Use HTTPS in production
- [ ] Set ENVIRONMENT=production
- [ ] Use PostgreSQL for production database

## Testing Deployment

```bash
# Test health endpoint
curl https://your-api-domain.com/

# Test authentication
curl -X POST https://your-api-domain.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "password123"}'
``` 