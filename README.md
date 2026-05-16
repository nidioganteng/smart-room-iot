# 🏠 Smart Room Monitor & Controller

> Sistem simulasi IoT berbasis ESP32 yang memantau kondisi ruangan secara real-time dan dapat dikontrol melalui website dashboard.

![IoT](https://img.shields.io/badge/IoT-ESP32-blue) ![React](https://img.shields.io/badge/Frontend-React-61dafb) ![MQTT](https://img.shields.io/badge/Protocol-MQTT-purple) ![Wokwi](https://img.shields.io/badge/Simulator-Wokwi-green) ![Tailwind](https://img.shields.io/badge/Style-TailwindCSS-38bdf8)

---

## 📋 Deskripsi

Smart Room Monitor & Controller adalah proyek IoT simulasi yang dibangun karena Gabut. Sistem ini mensimulasikan sebuah ruangan pintar yang dilengkapi berbagai sensor untuk memantau kondisi ruangan, serta dapat dikontrol dari jarak jauh melalui website dashboard berbasis React.

Proyek ini menggunakan **Wokwi** sebagai simulator hardware ESP32, **MQTT** sebagai protokol komunikasi IoT, dan **React + Tailwind CSS** sebagai frontend dashboard.

---

## ✨ Fitur

- 🌡️ **Monitor Suhu & Kelembaban** — Pembacaan real-time dari sensor DHT22
- 🚶 **Deteksi Gerak** — Mendeteksi keberadaan orang menggunakan PIR sensor
- ☀️ **Monitor Intensitas Cahaya** — Pembacaan nilai cahaya dari sensor LDR
- 💡 **Kontrol Lampu** — Menyalakan/mematikan LED dari website secara remote
- 📊 **Grafik Real-time** — Visualisasi data suhu dalam bentuk line chart
- 📋 **Log Aktivitas** — Riwayat event sistem tercatat otomatis
- ⚠️ **Sensor Offline Detection** — Website otomatis mendeteksi bila simulator berhenti
- 📱 **Fully Responsive** — Dashboard dapat diakses dari desktop maupun mobile

---

## 🛠️ Teknologi yang Digunakan

### Hardware Simulation
| Komponen | Fungsi | Pin ESP32 |
|---|---|---|
| ESP32 DevKit C V4 | Mikrokontroller utama | — |
| DHT22 | Sensor suhu & kelembaban | GPIO 15 |
| PIR Sensor | Deteksi gerak | GPIO 14 |
| LDR (Photoresistor) | Sensor cahaya | GPIO 34 |
| LED | Output kontrol lampu | GPIO 26 |
| LCD I2C 16x2 | Display lokal | SDA: GPIO 21, SCL: GPIO 22 |

### Software & Tools
| Teknologi | Kegunaan |
|---|---|
| [Wokwi](https://wokwi.com) | Simulator ESP32 |
| [PlatformIO](https://platformio.org) | Build system firmware |
| [VS Code](https://code.visualstudio.com) | Code editor |
| [MQTT (broker.hivemq.com)](https://broker.hivemq.com) | Broker komunikasi IoT |
| [React + Vite](https://vitejs.dev) | Frontend framework |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling |
| [Recharts](https://recharts.org) | Grafik real-time |
| [mqtt.js](https://github.com/mqttjs/MQTT.js) | MQTT client untuk browser |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    WOKWI SIMULATOR                      │
│  ┌──────────┐  ┌───────┐  ┌───────┐  ┌───────┐          │
│  │  DHT22   │  │  PIR  │  │  LDR  │  │  LED  │          │
│  └────┬─────┘  └───┬───┘  └───┬───┘  └───┬───┘          │
│       └────────────┴──────────┴──────────┘              │
│                         │                               │
│                    ┌────┴────┐                          │
│                    │  ESP32  │                          │
│                    └────┬────┘                          │
└─────────────────────────┼───────────────────────────────┘
                          │ WiFi (MQTT Publish/Subscribe)
                          ▼
              ┌───────────────────────┐
              │   broker.hivemq.com   │
              │    (MQTT Broker)      │
              └───────────┬───────────┘
                          │ WebSocket
                          ▼
              ┌───────────────────────┐
              │   React Dashboard     │
              │   localhost:5173      │
              │                       │
              │  • Sensor Cards       │
              │  • Real-time Chart    │
              │  • LED Control        │
              │  • Activity Log       │
              └───────────────────────┘
```

---

## 📁 Struktur Project

```
smart-room-iot/
├── 📁 firmware/                  # ESP32 firmware (PlatformIO)
│   ├── 📁 src/
│   │   └── main.cpp              # Kode utama ESP32
│   ├── diagram.json              # Skema rangkaian Wokwi
│   ├── platformio.ini            # Konfigurasi PlatformIO
│   └── wokwi.toml                # Konfigurasi Wokwi extension
│
└── 📁 website/                   # Dashboard React
    ├── 📁 src/
    │   ├── App.jsx               # Komponen utama dashboard
    │   ├── index.css             # Global styles (Tailwind)
    │   └── main.jsx              # Entry point React
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Cara Menjalankan

### Prerequisites
- [VS Code](https://code.visualstudio.com)
- [PlatformIO Extension](https://platformio.org/install/ide?install=vscode)
- [Wokwi Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=wokwi.wokwi-vscode)
- [Node.js](https://nodejs.org) (v18+)

### 1. Clone Repository
```bash
git clone https://github.com/USERNAME/smart-room-iot.git
cd smart-room-iot
```

### 2. Build Firmware ESP32
```bash
cd firmware
~/.platformio/penv/bin/pio run
```

### 3. Jalankan Simulasi Wokwi
1. Buka VS Code
2. Buka file `firmware/diagram.json`
3. Tekan `F1` → pilih **Wokwi: Start Simulator**
4. Simulator akan berjalan otomatis

### 4. Jalankan Website Dashboard
```bash
cd website
npm install
npm run dev
```

5. Buka browser ke `http://localhost:5173`

---

## 📡 MQTT Topics

| Topic | Arah | Deskripsi |
|---|---|---|
| `smarthome/sensor/temperature` | ESP32 → Website | Data suhu (°C) |
| `smarthome/sensor/humidity` | ESP32 → Website | Data kelembaban (%) |
| `smarthome/sensor/motion` | ESP32 → Website | Status gerak (0/1) |
| `smarthome/sensor/light` | ESP32 → Website | Nilai cahaya (lux) |
| `smarthome/control/led` | Website → ESP32 | Kontrol LED (ON/OFF) |

---


## 👨‍💻 Developer

**Nidio Tilman**  
