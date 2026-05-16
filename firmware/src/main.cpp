#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// =====================
// KONFIGURASI WiFi
// =====================
const char* ssid     = "Wokwi-GUEST";
const char* password = "";

// =====================
// KONFIGURASI MQTT
// =====================
const char* mqtt_server   = "107d31f5d9f54ead8bf774affb3c84df.s1.eu.hivemq.cloud";
const int   mqtt_port     = 8883;
const char* mqtt_user     = "smartroom";
const char* mqtt_password = "SmartRoom123";
const char* client_id     = "esp32-smart-room";

// =====================
// TOPIC MQTT
// =====================
const char* topic_temp    = "smarthome/sensor/temperature";
const char* topic_hum     = "smarthome/sensor/humidity";
const char* topic_motion  = "smarthome/sensor/motion";
const char* topic_light   = "smarthome/sensor/light";
const char* topic_led     = "smarthome/control/led";

// =====================
// PIN ESP32
// =====================
#define DHT_PIN     4
#define DHT_TYPE    DHT22
#define PIR_PIN     14
#define LDR_PIN     34
#define LED_PIN     26

// =====================
// INISIALISASI
// =====================
DHT dht(DHT_PIN, DHT_TYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;
const long interval   = 2000;

// =====================
// FUNGSI KONEKSI WiFi
// =====================
void setupWiFi() {
  Serial.println("Menghubungkan ke WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("WiFi terhubung! IP: ");
  Serial.println(WiFi.localIP());
}

// =====================
// CALLBACK MQTT (terima perintah dari website)
// =====================
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Perintah diterima [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  if (String(topic) == topic_led) {
    if (message == "ON") {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("LED dinyalakan.");
    } else if (message == "OFF") {
      digitalWrite(LED_PIN, LOW);
      Serial.println("LED dimatikan.");
    }
  }
}

// =====================
// FUNGSI KONEKSI MQTT
// =====================
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.println("Menghubungkan ke MQTT broker...");
    if (client.connect(client_id, mqtt_user, mqtt_password)) {
      Serial.println("MQTT terhubung!");
      client.subscribe(topic_led);
      Serial.println("Subscribe ke topic: smarthome/control/led");
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" — coba lagi 5 detik...");
      delay(5000);
    }
  }
}

// =====================
// SETUP
// =====================
void setup() {
  Serial.begin(115200);
  Serial.println("");
  Serial.println("=== Smart Room Monitor Mulai ===");

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  dht.begin();

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Room IoT");
  lcd.setCursor(0, 1);
  lcd.print("Memulai...");

  setupWiFi();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// =====================
// LOOP
// =====================
void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    // Baca DHT22
    float suhu = dht.readTemperature();
    float hum  = dht.readHumidity();

    // Baca PIR
    int motion = digitalRead(PIR_PIN);

    // Baca LDR
    int light = analogRead(LDR_PIN);

    // Debug serial monitor
    Serial.println("---");
    Serial.print("Suhu: "); Serial.print(suhu); Serial.println(" °C");
    Serial.print("Humidity: "); Serial.print(hum); Serial.println(" %");
    Serial.print("Gerak: "); Serial.println(motion ? "Ada gerakan" : "Tidak ada");
    Serial.print("Cahaya: "); Serial.println(light);

    // Cek sensor valid
    if (!isnan(suhu) && !isnan(hum)) {
      client.publish(topic_temp,   String(suhu).c_str());
      client.publish(topic_hum,    String(hum).c_str());
      client.publish(topic_motion, String(motion).c_str());
      client.publish(topic_light,  String(light).c_str());
      Serial.println("Data berhasil dikirim ke MQTT.");
    } else {
      Serial.println("Error: sensor DHT22 gagal baca!");
    }

    // Update LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Suhu: ");
    lcd.print(suhu, 1);
    lcd.print("C");
    lcd.setCursor(0, 1);
    lcd.print(motion ? "Ada orang" : "Kosong");
  }
}