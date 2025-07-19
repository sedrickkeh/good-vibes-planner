Deployment:

```bash
pa website create --domain yourusername.pythonanywhere.com --command '/home/yourusername/.virtualenvs/my_venv/bin/uvicorn --app-dir /home/yourusername/good-vibes-planner/backend --uds ${DOMAIN_SOCKET} main:app'
```

For updates:

```bash
# Pull latest changes
cd good-vibes-planner
git pull origin main

# Reload website
pa website reload --domain sedrickkeh.pythonanywhere.com
```