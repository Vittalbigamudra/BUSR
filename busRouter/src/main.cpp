#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// WiFi settings
const char* ssid = "ORBI93";
const char* password = "pastelfinch077";
const char* serverUrl = "http://192.168.4.71:5000/gps";

// RGB LED pins
#define PIN_RED   25
#define PIN_GREEN 26
#define PIN_BLUE  27

// GPS pins (not 16/17, since those are used by SIM800L)
#define GPS_RX 34  // ESP32 receives from GPS TX
#define GPS_TX 33  // ESP32 transmits to GPS RX

// GPS setup
HardwareSerial GPSserial(1); // Use UART1
TinyGPSPlus gps;

// Store WiFi connection state
bool wifiConnected = false;

// GPS baud rate detection
const int gpsBaudRates[] = {4800, 9600, 38400, 115200};
const int numBaudRates = 4;
int currentBaudRate = 0;
bool gpsBaudRateFound = false;

// ===== SATELLITE DATA STRUCTURES =====
struct SatelliteInfo {
  int id;
  int elevation;
  int azimuth;
  int snr;
  bool valid;
};

#define MAX_SATELLITES 20
SatelliteInfo satellites[MAX_SATELLITES];
int satelliteCount = 0;

// ===== DIRECTION HELPER =====
String getDirection(int azimuth) {
  if (azimuth >= 337.5 || azimuth < 22.5) return "N";
  if (azimuth >= 22.5 && azimuth < 67.5) return "NE";
  if (azimuth >= 67.5 && azimuth < 112.5) return "E";
  if (azimuth >= 112.5 && azimuth < 157.5) return "SE";
  if (azimuth >= 157.5 && azimuth < 202.5) return "S";
  if (azimuth >= 202.5 && azimuth < 247.5) return "SW";
  if (azimuth >= 247.5 && azimuth < 292.5) return "W";
  if (azimuth >= 292.5 && azimuth < 337.5) return "NW";
  return "?";
}

// ===== NMEA GSV PARSING =====
void parseGSVSentence(String sentence) {
  // GSV format: $GPGSV,3,1,12,01,05,001,80,02,40,270,85,12,25,170,77,23,45,200,65*7F
  // Fields: $GPGSV, total_sentences, current_sentence, total_sats, sat1_id, sat1_elev, sat1_azim, sat1_snr, ...
  
  if (!sentence.startsWith("$GPGSV")) {
    return;
  }
  
  // Clear old satellite data if this is the first sentence
  if (sentence.indexOf(",1,") > 0) {
    satelliteCount = 0;
    for (int i = 0; i < MAX_SATELLITES; i++) {
      satellites[i].valid = false;
    }
  }
  
  // Split the sentence into fields
  int fieldCount = 0;
  int startPos = 0;
  int commaPos = sentence.indexOf(',');
  
  while (commaPos > 0 && fieldCount < 20) {
    String field = sentence.substring(startPos, commaPos);
    
    // Skip the first 4 fields (header, total_sentences, current_sentence, total_sats)
    if (fieldCount >= 4) {
      int satIndex = (fieldCount - 4) / 4; // 4 fields per satellite
      int fieldType = (fieldCount - 4) % 4; // 0=ID, 1=Elevation, 2=Azimuth, 3=SNR
      
      if (satIndex < MAX_SATELLITES) {
        switch (fieldType) {
          case 0: // Satellite ID
            satellites[satIndex].id = field.toInt();
            satellites[satIndex].valid = true;
            break;
          case 1: // Elevation
            satellites[satIndex].elevation = field.toInt();
            break;
          case 2: // Azimuth
            satellites[satIndex].azimuth = field.toInt();
            break;
          case 3: // SNR
            satellites[satIndex].snr = field.toInt();
            if (satellites[satIndex].valid) {
              satelliteCount = max(satelliteCount, satIndex + 1);
            }
            break;
        }
      }
    }
    
    startPos = commaPos + 1;
    commaPos = sentence.indexOf(',', startPos);
    fieldCount++;
  }
}

// ===== RAW NMEA CAPTURE =====
String nmeaBuffer = "";
void captureNMEAData() {
  while (GPSserial.available()) {
    char c = GPSserial.read();
    
    // Process with TinyGPS++
    gps.encode(c);
    
    // Also capture raw NMEA for GSV parsing
    if (c == '$') {
      nmeaBuffer = "$";
    } else if (c == '\n' && nmeaBuffer.length() > 0) {
      // Complete NMEA sentence
      if (nmeaBuffer.startsWith("$GPGSV")) {
        parseGSVSentence(nmeaBuffer);
      }
      nmeaBuffer = "";
    } else if (nmeaBuffer.length() > 0 && c >= 32 && c <= 126) {
      nmeaBuffer += c;
    }
  }
}

// ===== DISPLAY REAL SATELLITE DATA =====
void displayRealSatelliteData() {
  if (satelliteCount > 0) {
    // Visual polar coordinate display
    Serial.println("\n🛰️ SATELLITE POSITIONS:");
    Serial.println("     N (0°)");
    Serial.println("        |");
    Serial.println("   NW  |  NE");
    Serial.println("  (270°| 90°)");
    Serial.println("        |");
    Serial.println("     S (180°)");
    Serial.println("");
    
    // Show satellites in their approximate positions
    for (int i = 0; i < satelliteCount; i++) {
      if (satellites[i].valid) {
        String symbol = "🛰";
        if (satellites[i].snr > 80) symbol = "⭐";      // Strong signal
        else if (satellites[i].snr > 60) symbol = "🌟"; // Medium signal
        else symbol = "🛰";                              // Weak signal
        
        String position = getDirection(satellites[i].azimuth);
        Serial.printf("  %s %s (ID:%d, El:%d°, SNR:%d)\n", 
                     symbol.c_str(), 
                     position.c_str(),
                     satellites[i].id,
                     satellites[i].elevation,
                     satellites[i].snr);
      }
    }
  }
}

// ===== GPS BAUD RATE DETECTION =====
bool detectGPSBaudRate() {
  Serial.println("🔍 Detecting GPS baud rate...");
  
  for (int i = 0; i < numBaudRates; i++) {
    int baudRate = gpsBaudRates[i];
    Serial.printf("Trying %d baud... ", baudRate);
    
    GPSserial.begin(baudRate, SERIAL_8N1, GPS_RX, GPS_TX);
    delay(1000); // Give GPS time to respond
    
    // Clear any old data
    while (GPSserial.available()) {
      GPSserial.read();
    }
    
    // Wait for valid NMEA data
    unsigned long startTime = millis();
    bool foundValidData = false;
    String nmeaBuffer = "";
    int validSentences = 0;
    
    while (millis() - startTime < 5000) { // Wait up to 5 seconds
      if (GPSserial.available()) {
        char c = GPSserial.read();
        if (c == '$') {
          nmeaBuffer = "$";
        } else if (c == '\n' && nmeaBuffer.length() > 0) {
          // Check if we have a complete NMEA sentence
          if (nmeaBuffer.length() > 8 && nmeaBuffer.startsWith("$GP")) {
            validSentences++;
            Serial.printf("Found NMEA: %s\n", nmeaBuffer.c_str());
            if (validSentences >= 2) { // Need at least 2 valid sentences
              foundValidData = true;
              break;
            }
          }
          nmeaBuffer = "";
        } else if (nmeaBuffer.length() > 0 && c >= 32 && c <= 126) {
          nmeaBuffer += c;
        }
      }
      delay(10);
    }
    
    if (foundValidData) {
      Serial.printf("✅ Found %d valid NMEA sentences at %d baud!\n", validSentences, baudRate);
      currentBaudRate = baudRate;
      gpsBaudRateFound = true;
      return true;
    } else {
      Serial.println("❌ No valid NMEA data");
    }
  }
  
  Serial.println("❌ Could not detect GPS baud rate!");
  return false;
}

// ===== LED FUNCTIONS =====
void setColor(int r, int g, int b) {
  analogWrite(PIN_RED, r);
  analogWrite(PIN_GREEN, g);
  analogWrite(PIN_BLUE, b);
}

void blinkColor(int r, int g, int b, int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    setColor(r, g, b);
    delay(delayMs);
    setColor(0, 0, 0);
    delay(delayMs);
  }
}

// ===== SATELLITE VISUALIZATION =====
// This function has been replaced by displayRealSatelliteData() which shows actual satellite data from GSV parsing

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("🚀 ESP32 (TTGO T-Call) starting...");

  // Setup RGB LED pins
  ledcAttachPin(PIN_RED, 1);
  ledcAttachPin(PIN_GREEN, 2);
  ledcAttachPin(PIN_BLUE, 3);
  ledcSetup(1, 5000, 8);
  ledcSetup(2, 5000, 8);
  ledcSetup(3, 5000, 8);

  // Start GPS UART
  if (!detectGPSBaudRate()) {
    Serial.println("⚠️ GPS baud rate detection failed! Defaulting to 115200 baud...");
    GPSserial.begin(115200, SERIAL_8N1, GPS_RX, GPS_TX);
    currentBaudRate = 115200;
    gpsBaudRateFound = true;
    Serial.println("✅ GPS initialized at 115200 baud (default)");
  }

  // Initialize satellite data
  for (int i = 0; i < MAX_SATELLITES; i++) {
    satellites[i].valid = false;
  }
  satelliteCount = 0;
  
  // Connect WiFi
  Serial.print("Connecting to WiFi ..");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    setColor(255, 0, 0); // Solid red while connecting
    Serial.print(".");
    delay(500);
  }
  wifiConnected = true;
  Serial.println("\n✅ Connected! IP: " + WiFi.localIP().toString());
  blinkColor(0, 0, 255, 3, 150); // Flash blue 3x = WiFi connected
}

// ===== LOOP =====
void loop() {
  // Read GPS data and capture NMEA for GSV parsing
  captureNMEAData();

  // Show GPS status every few seconds
  static unsigned long lastStatusCheck = 0;
  if (millis() - lastStatusCheck > 3000) { // Check every 3 seconds
    lastStatusCheck = millis();
    
    Serial.println("=== GPS STATUS ===");
    Serial.printf("Satellites: %d\n", gps.satellites.value());
    Serial.printf("Fix: %s\n", gps.location.isValid() ? "YES" : "NO");
    Serial.printf("Age: %lu ms\n", gps.location.age());
    Serial.printf("Chars processed: %d\n", gps.charsProcessed());
    Serial.printf("Sentences with fix: %d\n", gps.sentencesWithFix());
    Serial.printf("Failed checksum: %d\n", gps.failedChecksum());
    
    if (gps.location.isValid()) {
      Serial.printf("Lat: %.6f, Lng: %.6f\n", gps.location.lat(), gps.location.lng());
      Serial.printf("Speed: %.2f km/h\n", gps.speed.kmph());
      Serial.printf("Altitude: %.1f m\n", gps.altitude.meters());
      Serial.printf("Course: %.1f°\n", gps.course.deg());
      
      // Show detailed satellite information
      Serial.println("\n🛰️ SATELLITE DETAILS:");
      Serial.printf("Total Satellites (TinyGPS++): %d\n", gps.satellites.value());
      
      // Display real satellite data from GSV parsing
      displayRealSatelliteData();
    } else {
      Serial.println("Waiting for GPS lock...");
    }
    
    // Real satellite data is now displayed by displayRealSatelliteData() above
  }

  // GPS lock check
  if (gps.location.isUpdated() && gps.location.isValid()) {
    float lat = gps.location.lat();
    float lng = gps.location.lng();
    Serial.println("🎯 GPS LOCK ACHIEVED!");
    Serial.printf("📍 Latitude: %.6f, Longitude: %.6f\n", lat, lng);
    Serial.printf("🛰 Satellites: %d\n", gps.satellites.value());
    Serial.printf("🚗 Speed: %.2f km/h\n", gps.speed.kmph());
    Serial.printf("📏 Altitude: %.1f m\n", gps.altitude.meters());

    if (wifiConnected && WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      
      // Build URL with GPS coordinates and satellite count
      String fullUrl = String(serverUrl) + "?lat=" + String(lat, 6) + "&lng=" + String(lng, 6) + "&sats=" + String(gps.satellites.value());
      
      // Add satellite data if available
      if (satelliteCount > 0) {
        fullUrl += "&sat_data=";
        for (int i = 0; i < satelliteCount && i < 5; i++) { // Limit to 5 satellites to avoid URL length issues
          if (satellites[i].valid) {
            fullUrl += String(satellites[i].id) + "," + 
                      String(satellites[i].elevation) + "," + 
                      String(satellites[i].azimuth) + "," + 
                      String(satellites[i].snr);
            if (i < satelliteCount - 1 && i < 4) fullUrl += "|";
          }
        }
      }

      Serial.printf("🌍 Sending GET: %s\n", fullUrl.c_str());
      http.begin(fullUrl);
      int httpResponseCode = http.GET();

      if (httpResponseCode > 0) {
        Serial.printf("✅ Server response: %d\n", httpResponseCode);
        blinkColor(255, 0, 255, 1, 200); // Purple flash = data sent
      } else {
        Serial.printf("⚠️ HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
        blinkColor(255, 255, 0, 2, 200); // Yellow = error
      }

      http.end();
    } else {
      Serial.println("⚠️ WiFi disconnected!");
      wifiConnected = false;
      blinkColor(255, 255, 0, 2, 200); // Yellow blink = WiFi error
    }

    delay(1000); // 1s between updates
  } else {
    // No GPS lock yet
    setColor(255, 0, 0); // Solid red = searching for GPS
  }
}
