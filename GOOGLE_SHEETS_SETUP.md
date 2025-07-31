# Configuração Google Sheets

## 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Sheets:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google Sheets API"
   - Clique em "Enable"

## 2. Criar Service Account

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "Service Account"
3. Preencha os dados:
   - Name: `toolshop-service`
   - Description: `Service account for ToolShop application`
4. Clique em "Create and Continue"
5. Pule as etapas de permissões (Role: None)
6. Clique em "Done"

## 3. Gerar Chave JSON

1. Na lista de Service Accounts, clique no email criado
2. Vá para a aba "Keys"
3. Clique em "Add Key" > "Create new key"
4. Selecione "JSON"
5. Clique em "Create"
6. O arquivo JSON será baixado automaticamente

## 4. Configurar Google Sheets

### Criar Planilha

1. Crie uma nova planilha no Google Sheets
2. Crie as seguintes abas:
   - **Ferramentas** - Para cadastro de ferramentas
   - **Usuários** - Para cadastro de usuários
   - **Transações** - Para histórico de operações

### Estrutura das Abas

#### Aba "Ferramentas"

| A   | B    | C        | D      | E         | F           | G              | H               | I              | J                 |
| --- | ---- | -------- | ------ | --------- | ----------- | -------------- | --------------- | -------------- | ----------------- |
| ID  | Nome | RFID UID | Status | Categoria | Localização | Emprestado Por | Data Empréstimo | Data Devolução | Última Manutenção |

#### Aba "Usuários"

| A   | B    | C      | D        | E            |
| --- | ---- | ------ | -------- | ------------ |
| ID  | Nome | Função | RFID UID | Nível Acesso |

#### Aba "Transações"

| A   | B       | C         | D       | E         | F      | G         | H        |
| --- | ------- | --------- | ------- | --------- | ------ | --------- | -------- |
| ID  | User ID | User Name | Tool ID | Tool Name | Action | Timestamp | RFID UID |

### Compartilhar Planilha

1. Clique em "Share" no canto superior direito
2. Adicione o email do Service Account (ex: `toolshop-service@project.iam.gserviceaccount.com`)
3. Dê permissão "Editor"
4. Clique em "Send"

## 5. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your_project_id","private_key_id":"your_private_key_id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"your_service_account_email@your_project.iam.gserviceaccount.com","client_id":"your_client_id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your_service_account_email%40your_project.iam.gserviceaccount.com"}

# Arduino Configuration
ARDUINO_WEBSOCKET_URL=ws://localhost:8080/arduino
ARDUINO_POLLING_INTERVAL=1000

# Application Configuration
NEXT_PUBLIC_APP_NAME=ToolShop
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Substituir Valores

1. **GOOGLE_SHEETS_SPREADSHEET_ID**: ID da planilha (está na URL)
2. **GOOGLE_SERVICE_ACCOUNT_KEY**: Conteúdo completo do arquivo JSON baixado

## 6. Instalar Dependências

```bash
npm install googleapis
```

## 7. Testar Integração

### Teste de Conectividade

```bash
# Testar busca de ferramentas
curl "http://localhost:3000/api/google-sheets?action=tools"

# Testar busca de usuários
curl "http://localhost:3000/api/google-sheets?action=users"

# Testar busca por RFID
curl "http://localhost:3000/api/google-sheets?action=tool-by-rfid&rfid=TOOL-001"
```

### Teste de Transação

```bash
curl -X POST "http://localhost:3000/api/google-sheets" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "coleta",
    "toolId": "TOOL-001",
    "userId": "USER-001",
    "userName": "João Silva",
    "toolName": "Martelo de Borracha",
    "rfidUid": "A1B2C3D4E5F6"
  }'
```

## 8. Dados de Exemplo

### Inserir Ferramentas de Exemplo

Na aba "Ferramentas", adicione:

| ID       | Nome                | RFID UID     | Status     | Categoria | Localização   |
| -------- | ------------------- | ------------ | ---------- | --------- | ------------- |
| TOOL-001 | Martelo de Borracha | A1B2C3D4E5F6 | disponível | Manual    | Prateleira A1 |
| TOOL-002 | Chave de Fenda      | F7G8H9I0J1K2 | disponível | Manual    | Prateleira A2 |
| TOOL-003 | Serra Circular      | L3M4N5O6P7Q8 | disponível | Elétrica  | Prateleira B1 |
| TOOL-004 | Nível a Laser       | R9S0T1U2V3W4 | disponível | Medição   | Prateleira B2 |

### Inserir Usuários de Exemplo

Na aba "Usuários", adicione:

| ID       | Nome         | Função        | RFID UID | Nível Acesso |
| -------- | ------------ | ------------- | -------- | ------------ |
| USER-001 | João Silva   | Técnico       | USER-001 | user         |
| USER-002 | Maria Santos | Supervisor    | USER-002 | supervisor   |
| USER-003 | Pedro Costa  | Administrador | USER-003 | admin        |

## 9. Troubleshooting

### Erro: "Invalid credentials"

- Verifique se o arquivo JSON está correto
- Confirme se o Service Account tem acesso à planilha

### Erro: "Spreadsheet not found"

- Verifique se o ID da planilha está correto
- Confirme se a planilha foi compartilhada com o Service Account

### Erro: "API not enabled"

- Ative a Google Sheets API no Google Cloud Console

### Erro: "Permission denied"

- Verifique se o Service Account tem permissão "Editor" na planilha

## 10. Segurança

### Boas Práticas

1. Nunca commite o arquivo `.env.local` no Git
2. Use variáveis de ambiente em produção
3. Limite as permissões do Service Account
4. Monitore o uso da API

### Em Produção

1. Use um banco de dados real (PostgreSQL, MySQL)
2. Implemente autenticação JWT
3. Use HTTPS para todas as comunicações
4. Implemente rate limiting
5. Configure logs de auditoria
