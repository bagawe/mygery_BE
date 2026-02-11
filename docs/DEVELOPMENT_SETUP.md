# 🛠️ DEVELOPMENT SETUP GUIDE

**Last Updated:** February 11, 2026

---

## 📍 BACKEND IP & PORT

Backend berjalan di:
- **Port:** `3030` (atau sesuai `PORT` di environment variable)
- **Development URL:** `http://localhost:3030`
- **Network URL:** `http://[IP_LAPTOP]:3030` (untuk test di device lain)

---

## 🎯 SKENARIO DEVELOPMENT

### **1️⃣ Frontend Web (Vue.js) & Backend di Laptop yang Sama**

✅ **GUNAKAN `localhost` - TIDAK PERLU GANTI-GANTI IP!**

#### Setup Vue.js:

**File: `.env.development`**
```bash
VITE_API_BASE_URL=http://localhost:3030/api
```

**File: `.env.production`**
```bash
VITE_API_BASE_URL=https://api.mygerindra.com/api
```

**File: `src/api/axios.js`**
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

#### Run Vue.js:
```bash
npm run dev
# Vue akan jalan di http://localhost:5173
# Backend di http://localhost:3030
# TIDAK ADA CORS ISSUE karena sudah dikonfigurasi!
```

---

### **2️⃣ Frontend Mobile (Flutter) & Backend di Laptop yang Sama**

✅ **GUNAKAN `localhost` untuk development**

#### Setup Flutter:

**File: `lib/config/environment.dart`**
```dart
class Environment {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3030/api',
  );
  
  static bool get isProduction => apiBaseUrl.contains('mygerindra.com');
}
```

#### Run Flutter (Emulator iOS/Android):
```bash
# Default - gunakan localhost
flutter run

# Atau explicit:
flutter run --dart-define=API_BASE_URL=http://localhost:3030/api
```

> **💡 NOTE:** 
> - iOS Simulator → `localhost` berfungsi langsung
> - Android Emulator → `localhost` berfungsi langsung
> - Keduanya akan connect ke laptop host secara otomatis

---

### **3️⃣ Test di HP Fisik via USB/WiFi**

❗ **SKENARIO INI MEMERLUKAN IP LAPTOP**

#### Langkah-langkah:

**1. Cek IP Laptop (macOS):**
```bash
# WiFi
ipconfig getifaddr en0

# Ethernet
ipconfig getifaddr en1

# Atau lihat semua:
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Contoh output: `10.194.77.48`

**2. Pastikan HP dan Laptop di WiFi yang sama**

**3. Run Flutter dengan IP Laptop:**
```bash
flutter run --dart-define=API_BASE_URL=http://10.194.77.48:3030/api
```

**4. Test dengan curl dari HP:**
```bash
# Install Termux di Android atau iSH di iOS
curl http://10.194.77.48:3030/api/agenda/public?month=2026-02
```

---

## 🔥 SOLUSI PINTAR: Auto-Detect IP

Buat script helper untuk otomatis detect IP!

### **Untuk Flutter - `run_flutter.sh`**

Create file di root project Flutter:

```bash
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 My Gerindra Flutter Runner${NC}"
echo ""

# Detect IP
LAPTOP_IP=$(ipconfig getifaddr en0 2>/dev/null)

if [ -z "$LAPTOP_IP" ]; then
    echo -e "${YELLOW}⚠️  Could not detect WiFi IP, checking Ethernet...${NC}"
    LAPTOP_IP=$(ipconfig getifaddr en1 2>/dev/null)
fi

if [ -z "$LAPTOP_IP" ]; then
    LAPTOP_IP="localhost"
    echo -e "${YELLOW}⚠️  No network detected, using localhost${NC}"
else
    echo -e "${GREEN}✅ Detected laptop IP: $LAPTOP_IP${NC}"
fi

echo ""
echo "Select run mode:"
echo "1) 💻 Localhost (Emulator/Simulator) - RECOMMENDED"
echo "2) 📱 Network IP (Physical Device via WiFi)"
echo "3) 🌐 Production API"
echo "4) 🔍 Show current IP only"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
  1)
    echo -e "${GREEN}🚀 Running with localhost...${NC}"
    flutter run --dart-define=API_BASE_URL=http://localhost:3030/api
    ;;
  2)
    echo -e "${GREEN}🚀 Running with network IP: $LAPTOP_IP:3030${NC}"
    flutter run --dart-define=API_BASE_URL=http://$LAPTOP_IP:3030/api
    ;;
  3)
    echo -e "${GREEN}🚀 Running with production API...${NC}"
    flutter run --dart-define=API_BASE_URL=https://api.mygerindra.com/api
    ;;
  4)
    echo -e "${GREEN}Current IP: $LAPTOP_IP${NC}"
    echo "Backend URL: http://$LAPTOP_IP:3030"
    echo ""
    echo "Test with curl:"
    echo "curl http://$LAPTOP_IP:3030/api/agenda/public?month=2026-02"
    ;;
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac
```

**Cara pakai:**
```bash
chmod +x run_flutter.sh
./run_flutter.sh
```

### **Untuk Vue.js - `run_vue.sh`**

Create file di root project Vue.js:

```bash
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 My Gerindra Admin Panel Runner${NC}"
echo ""

LAPTOP_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")

echo -e "${GREEN}✅ Backend running at: http://localhost:3030${NC}"
echo -e "${GREEN}✅ Network IP: $LAPTOP_IP:3030${NC}"
echo ""
echo "Select mode:"
echo "1) 💻 Development (localhost)"
echo "2) 🌐 Production build"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
  1)
    echo -e "${GREEN}🚀 Running development server...${NC}"
    npm run dev
    ;;
  2)
    echo -e "${GREEN}🏗️  Building for production...${NC}"
    npm run build
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
```

---

## 🛡️ TROUBLESHOOTING

### **Problem: "Connection refused" di HP fisik**

**Solusi:**

1. **Cek backend running:**
```bash
curl http://localhost:3030/api/agenda/public?month=2026-02
```

2. **Cek IP laptop benar:**
```bash
ipconfig getifaddr en0
```

3. **Cek firewall macOS:**
```bash
# Pastikan Node.js allowed
System Preferences → Security & Privacy → Firewall → Firewall Options
# Cari "node" dan pastikan "Allow incoming connections"
```

4. **Test dari laptop ke laptop (loopback):**
```bash
curl http://[LAPTOP_IP]:3030/api/agenda/public?month=2026-02
```

### **Problem: CORS Error di Browser**

**Cek di backend `src/app.js`:**
```javascript
// Pastikan CORS sudah dikonfigurasi:
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### **Problem: IP berubah terus saat pindah WiFi**

**Solusi:**
- **Development:** Selalu gunakan `localhost` jika FE dan BE di laptop yang sama
- **Test di HP:** Gunakan script auto-detect IP di atas
- **Production:** Gunakan domain tetap (https://api.mygerindra.com)

---

## 📊 QUICK REFERENCE

| Scenario | Frontend | Backend | URL to Use |
|----------|----------|---------|------------|
| Vue.js dev di laptop yang sama | localhost:5173 | localhost:3030 | `http://localhost:3030/api` |
| Flutter emulator | iOS/Android Sim | localhost:3030 | `http://localhost:3030/api` |
| Flutter di HP fisik | WiFi Connected | WiFi Connected | `http://[LAPTOP_IP]:3030/api` |
| Production | Deployed | Deployed | `https://api.mygerindra.com/api` |

---

## ✅ BEST PRACTICES

1. ✅ **Development:** Gunakan `localhost` - TIDAK PERLU GANTI-GANTI IP
2. ✅ **Environment Variables:** Pakai `.env` untuk Vue.js, `--dart-define` untuk Flutter
3. ✅ **Testing HP Fisik:** Gunakan script auto-detect IP
4. ✅ **Production:** Selalu pakai HTTPS dengan domain proper
5. ✅ **Git:** Jangan commit `.env` file (sudah di `.gitignore`)

---

## 🎯 SUMMARY

**Untuk Tim Frontend Web (Vue.js):**
```bash
# File: .env.development
VITE_API_BASE_URL=http://localhost:3030/api

# Run:
npm run dev
```

**Untuk Tim Frontend Mobile (Flutter):**
```bash
# Emulator/Simulator:
flutter run

# HP Fisik:
flutter run --dart-define=API_BASE_URL=http://[IP_LAPTOP]:3030/api
```

**Backend:**
```bash
npm run dev
# Running on http://localhost:3030
```

---

**Questions?** Contact backend team  
**IP Check Command:** `ipconfig getifaddr en0`
