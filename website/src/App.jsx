import { useState, useEffect } from "react";
import mqtt from "mqtt";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const BROKER = "wss://broker.hivemq.com:8884/mqtt";
const TOPICS = {
  temp:   "smarthome/sensor/temperature",
  hum:    "smarthome/sensor/humidity",
  motion: "smarthome/sensor/motion",
  light:  "smarthome/sensor/light",
  led:    "smarthome/control/led",
};

function StatusDot({ active }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? "bg-emerald-500" : "bg-red-400"}`}></span>
    </span>
  );
}

function SensorCard({ icon, label, value, unit, color, bgColor }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center text-base`}>{icon}</div>
      </div>
      <div className="flex items-end gap-1 mb-3">
        <span className={`text-3xl sm:text-4xl font-bold tracking-tight ${color}`}>{value}</span>
        <span className="text-sm text-slate-400 mb-1">{unit}</span>
      </div>
      <div className="h-1 rounded-full bg-slate-100">
        <div className={`h-1 rounded-full ${color.replace("text", "bg")} transition-all duration-700`}
          style={{ width: value === "--" ? "0%" : "65%" }}></div>
      </div>
    </div>
  );
}

function LogItem({ log, isFirst }) {
  return (
    <div className={`flex items-center gap-3 text-xs py-2 px-3 rounded-lg transition-colors ${isFirst ? "bg-blue-50 text-slate-700" : "text-slate-400"}`}>
      <div className={`w-1 h-4 rounded-full shrink-0 ${isFirst ? "bg-blue-400" : "bg-slate-200"}`}></div>
      <span className="truncate">{log}</span>
    </div>
  );
}

export default function App() {
  const [connected, setConnected]   = useState(false);
  const [client, setClient]         = useState(null);
  const [suhu, setSuhu]             = useState("--");
  const [humidity, setHumidity]     = useState("--");
  const [motion, setMotion]         = useState("--");
  const [light, setLight]           = useState("--");
  const [ledState, setLedState]     = useState(false);
  const [chartData, setChartData]   = useState([]);
  const [logs, setLogs]             = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  const addLog = (msg) => setLogs((prev) => [msg, ...prev.slice(0, 9)]);

  useEffect(() => {
    const mqttClient = mqtt.connect(BROKER);
    mqttClient.on("connect", () => {
      setConnected(true);
      addLog("🟢 MQTT terhubung ke broker");
      Object.values(TOPICS).forEach((t) => mqttClient.subscribe(t));
    });
    mqttClient.on("message", (topic, message) => {
      const val  = message.toString();
      const time = new Date().toLocaleTimeString("id-ID");
      setLastUpdate(time);
      if (topic === TOPICS.temp) {
        setSuhu(parseFloat(val).toFixed(1));
        setChartData((prev) => [...prev.slice(-20), { time, suhu: parseFloat(val) }]);
      }
      if (topic === TOPICS.hum)    setHumidity(parseFloat(val).toFixed(1));
      if (topic === TOPICS.motion) {
        setMotion(val === "1" ? "Ada orang" : "Kosong");
        if (val === "1") addLog(`🚶 ${time} — Gerakan terdeteksi`);
      }
      if (topic === TOPICS.light)  setLight(parseInt(val));
      if (topic === TOPICS.led)    setLedState(val === "ON");
    });
    mqttClient.on("disconnect", () => {
      setConnected(false);
      addLog("🔴 MQTT terputus");
    });
    setClient(mqttClient);
    return () => mqttClient.end();
  }, []);

  const toggleLED = () => {
    const cmd = !ledState ? "ON" : "OFF";
    client?.publish(TOPICS.led, cmd);
    setLedState(!ledState);
    addLog(`💡 ${new Date().toLocaleTimeString("id-ID")} — Lampu ${cmd}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-cyan-50">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">SR</div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-semibold text-slate-800 leading-none truncate">Smart Room Monitor</h1>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">IoT Dashboard — ESP32 Simulation</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {lastUpdate && (
                <span className="text-xs text-slate-400 hidden md:block">Update: {lastUpdate}</span>
              )}
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full border ${connected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-500 border-red-200"}`}>
                <StatusDot active={connected} />
                <span className="hidden sm:inline">{connected ? "Terhubung" : "Menghubungkan..."}</span>
                <span className="sm:hidden">{connected ? "ON" : "..."}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">

        {/* Sensor Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SensorCard icon="🌡️" label="Suhu" value={suhu} unit="°C" color="text-orange-500" bgColor="bg-orange-50" />
          <SensorCard icon="💧" label="Kelembaban" value={humidity} unit="%" color="text-blue-500" bgColor="bg-blue-50" />
          <SensorCard icon="☀️" label="Cahaya" value={light} unit="lux" color="text-amber-500" bgColor="bg-amber-50" />

          {/* Motion Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Gerak</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-base">🚶</div>
            </div>
            <div className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold mt-1 ${motion === "Ada orang" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              <StatusDot active={motion === "Ada orang"} />
              <span className="truncate">{motion}</span>
            </div>
          </div>
        </div>

        {/* Chart + LED */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

          {/* Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Grafik Suhu</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time dari sensor DHT22</p>
              </div>
              <span className="text-xs bg-orange-50 text-orange-500 border border-orange-200 px-2 py-1 rounded-full font-medium">Live</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={30} />
                <Tooltip
                  contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(val) => [`${val}°C`, "Suhu"]}
                />
                <Line type="monotone" dataKey="suhu" stroke="#f97316" strokeWidth={2.5} dot={false} strokeLinecap="round" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* LED Control */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <div className="text-center mb-4">
              <h2 className="text-sm font-semibold text-slate-700">Kontrol Lampu</h2>
              <p className="text-xs text-slate-400 mt-0.5">Kendali via MQTT</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-500 ${ledState ? "bg-amber-100 shadow-lg shadow-amber-200" : "bg-slate-100"}`}>
                {ledState && <div className="absolute inset-0 rounded-full bg-amber-200 animate-ping opacity-20"></div>}
                <span className="text-3xl sm:text-4xl">{ledState ? "💡" : "🔌"}</span>
              </div>
              <button
                onClick={toggleLED}
                className={`w-full py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-95 ${ledState ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100" : "bg-linear-to-r from-blue-500 to-cyan-400 text-white hover:shadow-md hover:shadow-blue-200"}`}
              >
                {ledState ? "Matikan Lampu" : "Nyalakan Lampu"}
              </button>
              <div className={`w-full text-center text-xs font-medium py-2 rounded-lg ${ledState ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
                Status: {ledState ? "ON ✓" : "OFF"}
              </div>
            </div>
          </div>
        </div>

        {/* Log Aktivitas */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Log Aktivitas</h2>
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Riwayat event sistem</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{logs.length} event</span>
          </div>
          <div className="space-y-1.5 max-h-40 sm:max-h-48 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-slate-300 text-2xl mb-2">📡</p>
                <p className="text-xs text-slate-400">Menunggu data dari sensor...</p>
              </div>
            ) : (
              logs.map((log, i) => <LogItem key={i} log={log} isFirst={i === 0} />)
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-slate-300">Smart Room IoT — ESP32 + MQTT + React + Tailwind</p>
        </div>

      </main>
    </div>
  );
}