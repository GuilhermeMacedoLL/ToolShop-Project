# Integração Arduino + RFID + Next.js

## Visão Geral

Este sistema foi projetado para funcionar com um Arduino real equipado com leitor RFID. A implementação atual inclui simulações para desenvolvimento, mas está preparada para integração real.

## Componentes Necessários

### Hardware

- Arduino Uno/Nano/Mega
- Módulo RFID-RC522 (ou similar)
- LEDs para feedback visual
- Buzzer para alertas sonoros
- Display LCD (opcional)

### Software

- Biblioteca RFID para Arduino
- WebSocket Server no Arduino (usando ESP8266 ou similar)
- Ou comunicação Serial + Node.js bridge

## Estrutura de Dados RFID

### Formato dos Dados

```typescript
interface RFIDData {
  uid: string; // UID único do chip RFID (ex: "A1B2C3D4E5F6")
  timestamp: string; // Timestamp da leitura
  signalStrength: number; // Força do sinal (RSSI)
  toolId?: string; // ID da ferramenta (se cadastrada)
  toolName?: string; // Nome da ferramenta (se cadastrada)
  status?: string; // Status da ferramenta
}
```

## Implementação Arduino

### Código Arduino Básico

```cpp
#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN         9
#define SS_PIN          10

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();

  Serial.println("Sistema RFID iniciado");
}

void loop() {
  // Verifica se há novos cartões
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    // Lê o UID do cartão
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }

    // Envia dados via Serial
    Serial.print("RFID:");
    Serial.print(uid);
    Serial.print(",");
    Serial.print(millis());
    Serial.print(",");
    Serial.println(analogRead(A0)); // Simulação de força do sinal

    delay(1000); // Evita múltiplas leituras
  }
}
```

## Comunicação com Next.js

### Opção 1: WebSocket (Recomendado)

```javascript
// No Arduino (usando ESP8266)
#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>

WebSocketsServer webSocket = WebSocketsServer(8080);

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Desconectado!\n", num);
      break;
    case WStype_CONNECTED:
      Serial.printf("[%u] Conectado\n", num);
      break;
  }
}

void sendRFIDData(String uid) {
  String json = "{\"uid\":\"" + uid + "\",\"timestamp\":\"" + String(millis()) + "\",\"signalStrength\":" + String(analogRead(A0)) + "}";
  webSocket.broadcastTXT(json);
}
```

### Opção 2: Serial + Node.js Bridge

```javascript
// bridge.js
const SerialPort = require("serialport");
const WebSocket = require("ws");

const port = new SerialPort("/dev/ttyUSB0", { baudRate: 9600 });
const wss = new WebSocket.Server({ port: 8080 });

port.on("data", (data) => {
  const line = data.toString().trim();
  if (line.startsWith("RFID:")) {
    const [uid, timestamp, signal] = line.split(",");
    const rfidData = {
      uid: uid.replace("RFID:", ""),
      timestamp: new Date().toISOString(),
      signalStrength: parseInt(signal),
    };

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(rfidData));
      }
    });
  }
});
```

## Configuração do Sistema

### 1. Configurar IP do Arduino

No arquivo `src/app/coleta/page.tsx`, altere:

```javascript
const ws = new WebSocket("ws://SEU_IP_ARDUINO:8080/arduino");
```

### 2. Cadastrar Ferramentas

Cada ferramenta deve ter um RFID único cadastrado:

```javascript
const toolDatabase: Tool[] = [
  {
    id: "TOOL-001",
    name: "Martelo de Borracha",
    rfidUid: "A1B2C3D4E5F6", // UID real do RFID
    status: "disponível",
    category: "Manual",
    location: "Prateleira A1",
  },
  // ... mais ferramentas
];
```

### 3. Configurar APIs

As APIs em `src/app/api/` já estão preparadas para:

- `/api/arduino/rfid` - Comunicação com Arduino
- `/api/tools/collect` - Registro de coletas

## Fluxo de Funcionamento

1. **Leitura RFID**: Arduino lê o chip RFID da ferramenta
2. **Transmissão**: Dados são enviados via WebSocket/Serial
3. **Processamento**: Next.js recebe e processa os dados
4. **Busca**: Sistema busca a ferramenta no banco de dados
5. **Confirmação**: Usuário confirma a coleta
6. **Registro**: Dados são salvos e integrados com Google Sheets

## Tratamento de Erros

### Erros Comuns

- **Arduino desconectado**: Sistema mostra status e permite reconexão
- **RFID não cadastrado**: Exibe erro e permite cadastro
- **Ferramenta indisponível**: Verifica status antes de permitir coleta
- **Falha de comunicação**: Fallback para polling HTTP

### Logs e Debug

```javascript
// Ativar logs detalhados
console.log("Dados RFID recebidos:", rfidData);
console.log("Ferramenta encontrada:", tool);
console.log("Erro de comunicação:", error);
```

## Melhorias Futuras

1. **Autenticação RFID**: Usuários também com RFID
2. **Geolocalização**: Rastreamento de localização das ferramentas
3. **Alertas**: Notificações de manutenção e vencimento
4. **Relatórios**: Dashboard com estatísticas
5. **Mobile**: App mobile para coleta em campo

## Testes

### Teste de Conectividade

```bash
# Testar API Arduino
curl http://localhost:3000/api/arduino/rfid

# Testar registro de coleta
curl -X POST http://localhost:3000/api/tools/collect \
  -H "Content-Type: application/json" \
  -d '{"toolId":"TOOL-001","userId":"USER-001","timestamp":"2025-01-20T10:00:00Z","rfidUid":"A1B2C3D4E5F6"}'
```

### Simulação de RFID

Para desenvolvimento, o sistema inclui simulação que pode ser ativada no modo manual.
