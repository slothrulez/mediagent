# 🗑️ Complete n8n Removal Guide

## 🛑 **Stop n8n Process**

### **1. Stop running n8n**
```bash
# If running in terminal, press Ctrl+C
# Or find and kill the process
pkill -f n8n
```

### **2. Check for running processes**
```bash
# Check if n8n is still running
ps aux | grep n8n

# Kill any remaining processes
sudo pkill -9 n8n
```

---

## 🧹 **Remove n8n Installation**

### **Method 1: If installed globally with npm**
```bash
# Uninstall n8n globally
npm uninstall -g n8n

# Verify removal
npm list -g | grep n8n
```

### **Method 2: If installed locally**
```bash
# Remove from current project
npm uninstall n8n

# Check package.json to ensure it's removed
```

### **Method 3: If installed with yarn**
```bash
# Global removal
yarn global remove n8n

# Local removal
yarn remove n8n
```

---

## 📁 **Remove n8n Data & Configuration**

### **1. Remove n8n data directory**
```bash
# Default location (Linux/Mac)
rm -rf ~/.n8n

# Windows
rmdir /s %USERPROFILE%\.n8n
```

### **2. Remove n8n cache**
```bash
# npm cache
npm cache clean --force

# yarn cache
yarn cache clean
```

### **3. Remove Docker containers (if used)**
```bash
# Stop and remove n8n containers
docker stop n8n
docker rm n8n

# Remove n8n images
docker rmi n8nio/n8n

# Remove volumes
docker volume prune
```

---

## 🔧 **Clean VS Code Configuration**

### **1. Remove VS Code tasks**
Delete `.vscode/tasks.json` if it contains n8n tasks:
```bash
rm .vscode/tasks.json
```

### **2. Remove from workspace settings**
Check `.vscode/settings.json` and remove any n8n-related configurations.

---

## 🌐 **Clean Environment Variables**

### **1. Remove from .env files**
```bash
# Edit your .env file and remove:
# VITE_N8N_BASE_URL=http://localhost:5678
# VITE_N8N_API_KEY=your_n8n_api_key
# VITE_N8N_EMAIL=your_n8n_email
# VITE_N8N_PASSWORD=your_n8n_password
```

### **2. Clean shell profile**
```bash
# Check and edit these files:
nano ~/.bashrc
nano ~/.zshrc
nano ~/.profile

# Remove any n8n-related exports or PATH additions
```

---

## 🧼 **System Cleanup**

### **1. Clear system cache**
```bash
# Linux
sudo apt autoremove
sudo apt autoclean

# macOS
brew cleanup

# Windows
# Use Disk Cleanup utility
```

### **2. Remove from system PATH**
Check if n8n was added to system PATH and remove it:
```bash
# Check current PATH
echo $PATH

# Edit PATH in shell profile if needed
```

---

## ✅ **Verification**

### **1. Verify complete removal**
```bash
# Try to run n8n (should fail)
n8n --version

# Check for any remaining files
find / -name "*n8n*" 2>/dev/null

# Check npm global packages
npm list -g --depth=0
```

### **2. Check ports**
```bash
# Ensure port 5678 is free
lsof -i :5678
netstat -tulpn | grep 5678
```

---

## 🚀 **Alternative: Quick Cleanup Script**

Create and run this cleanup script:

```bash
#!/bin/bash
echo "🗑️ Removing n8n completely..."

# Stop processes
pkill -f n8n

# Remove installations
npm uninstall -g n8n 2>/dev/null
yarn global remove n8n 2>/dev/null

# Remove data
rm -rf ~/.n8n

# Remove Docker
docker stop n8n 2>/dev/null
docker rm n8n 2>/dev/null
docker rmi n8nio/n8n 2>/dev/null

# Clean cache
npm cache clean --force
yarn cache clean 2>/dev/null

echo "✅ n8n removal complete!"
echo "🔍 Verify with: n8n --version (should fail)"
```

Save as `remove_n8n.sh`, make executable, and run:
```bash
chmod +x remove_n8n.sh
./remove_n8n.sh
```

---

## 🎯 **Final Steps**

1. **Restart your terminal/VS Code**
2. **Verify removal**: `n8n --version` should show "command not found"
3. **Check AutoFlow**: The app should now show "n8n Disconnected" or work in demo mode
4. **Clean browser cache** if you accessed n8n web interface

---

## ⚠️ **Important Notes**

- **Backup data**: If you have important workflows, export them first
- **Docker volumes**: Use `docker volume ls` and `docker volume rm` to remove persistent data
- **Multiple installations**: Check both global and local npm/yarn installations
- **System services**: If n8n was installed as a service, disable it first

Your system is now completely clean of n8n! 🎉