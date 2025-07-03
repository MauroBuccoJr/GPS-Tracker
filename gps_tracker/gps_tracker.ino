#include <SoftwareSerial.h>
#include <TinyGPS++.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// GPS: RX no GPIO0, TX no GPIO3
SoftwareSerial gpsSerial(0, 3);
TinyGPSPlus gps;

// Pinos
const int botaoPin = 2;         // GPIO2 (D4) - Botão
const int ledPin = 1;           // GPIO1 (TX) - LED externo

// Rede e MQTT
const char* ssid = "Mauro";
const char* password = "12345678";
const char* mqtt_server = "35.171.83.226";
const char* mqtt_topic = "coordenadas/objeto";

WiFiClient espClient;
PubSubClient client(espClient);

// Última coordenada válida
float ultimaLat = 0.0;
float ultimaLon = 0.0;
char ultimoTimestamp[30] = "";
bool temCoordenada = false;

void piscarLed(int vezes, int duracao = 200) {
  for (int i = 0; i < vezes; i++) {
    digitalWrite(ledPin, HIGH);
    delay(duracao);
    digitalWrite(ledPin, LOW);
    delay(duracao);
  }
}

void setup_wifi() {
  WiFi.begin(ssid, password);
  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < 10000) {
    delay(300);
  }
}

void reconnect() {
  while (!client.connected()) {
    client.connect("ESP01Client");
  }
}

void setup() {
  pinMode(botaoPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  gpsSerial.begin(9600);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  reconnect();

  piscarLed(5); // Inicialização
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // 📡 Monitoramento contínuo do GPS
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    gps.encode(c);
    
    if (gps.location.isUpdated()) {
      ultimaLat = gps.location.lat();
      ultimaLon = gps.location.lng();

      snprintf(ultimoTimestamp, sizeof(ultimoTimestamp), "%04d-%02d-%02dT%02d:%02d:%02dZ",
        gps.date.year(), gps.date.month(), gps.date.day(),
        gps.time.hour(), gps.time.minute(), gps.time.second());

      temCoordenada = true;

      piscarLed(3, 150); // ✨ Pisca 3x ao receber nova coordenada
    }
  }

  // 🔘 Botão pressionado
  if (digitalRead(botaoPin) == LOW) {
    delay(100); // debounce
    if (digitalRead(botaoPin) == LOW && temCoordenada) {
      char payload[200];
      snprintf(payload, sizeof(payload),
        "{\"id\":\"objeto01\",\"latitude\":%.6f,\"longitude\":%.6f,\"timestamp\":\"%s\"}",
        ultimaLat, ultimaLon, ultimoTimestamp);

      bool sucesso = client.publish(mqtt_topic, payload);

      if (sucesso) {
        piscarLed(2, 250); // ✅ Sucesso: 2 piscadas
      } else {
        piscarLed(4, 200); // ❌ Falha: 4 piscadas
      }

      delay(1000); // debounce pós-envio
    }
  }
}
