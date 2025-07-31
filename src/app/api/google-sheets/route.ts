import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Configuração do Google Sheets
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const CREDENTIALS = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");

// Interface para dados de ferramenta
interface ToolData {
  id: string;
  name: string;
  rfidUid: string;
  status: "disponível" | "emprestada" | "manutenção";
  category: string;
  location: string;
  borrowedBy?: string;
  borrowedDate?: string;
  returnDate?: string;
  lastMaintenance?: string;
}

// Interface para dados de usuário
interface UserData {
  id: string;
  name: string;
  function: string;
  rfidUid: string;
  accessLevel: "user" | "supervisor" | "admin";
}

// Interface para transação
interface Transaction {
  id: string;
  userId: string;
  userName: string;
  toolId: string;
  toolName: string;
  action: "coleta" | "devolução" | "reporte_dano";
  timestamp: string;
  rfidUid: string;
  damageDescription?: string;
}

class GoogleSheetsService {
  private auth: any;
  private sheets: any;

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: SCOPES,
    });
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  // Buscar todas as ferramentas
  async getTools(): Promise<ToolData[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Ferramentas!A2:J", // Ajuste conforme sua planilha
      });

      const rows = response.data.values || [];
      return rows.map((row: any[]) => ({
        id: row[0] || "",
        name: row[1] || "",
        rfidUid: row[2] || "",
        status: row[3] || "disponível",
        category: row[4] || "",
        location: row[5] || "",
        borrowedBy: row[6] || "",
        borrowedDate: row[7] || "",
        returnDate: row[8] || "",
        lastMaintenance: row[9] || "",
      }));
    } catch (error) {
      console.error("Erro ao buscar ferramentas:", error);
      throw error;
    }
  }

  // Buscar usuários
  async getUsers(): Promise<UserData[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Usuários!A2:E", // Ajuste conforme sua planilha
      });

      const rows = response.data.values || [];
      return rows.map((row: any[]) => ({
        id: row[0] || "",
        name: row[1] || "",
        function: row[2] || "",
        rfidUid: row[3] || "",
        accessLevel: row[4] || "user",
      }));
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      throw error;
    }
  }

  // Registrar transação
  async registerTransaction(transaction: Transaction): Promise<void> {
    try {
      const values = [
        [
          transaction.id,
          transaction.userId,
          transaction.userName,
          transaction.toolId,
          transaction.toolName,
          transaction.action,
          transaction.timestamp,
          transaction.rfidUid,
        ],
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Transações!A2", // Ajuste conforme sua planilha
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values },
      });
    } catch (error) {
      console.error("Erro ao registrar transação:", error);
      throw error;
    }
  }

  // Atualizar status da ferramenta
  async updateToolStatus(
    toolId: string,
    status: string,
    borrowedBy?: string
  ): Promise<void> {
    try {
      // Primeiro, encontrar a linha da ferramenta
      const tools = await this.getTools();
      const toolIndex = tools.findIndex((t) => t.id === toolId);

      if (toolIndex === -1) {
        throw new Error("Ferramenta não encontrada");
      }

      const rowNumber = toolIndex + 2; // +2 porque começamos da linha 2
      const range = `Ferramentas!D${rowNumber}:G${rowNumber}`;

      const values = [
        [
          status,
          borrowedBy || "",
          new Date().toISOString(),
          status === "emprestada" ? "" : new Date().toISOString(),
        ],
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: "RAW",
        resource: { values },
      });
    } catch (error) {
      console.error("Erro ao atualizar status da ferramenta:", error);
      throw error;
    }
  }

  // Buscar ferramenta por RFID
  async getToolByRFID(rfidUid: string): Promise<ToolData | null> {
    try {
      const tools = await this.getTools();
      return tools.find((tool) => tool.rfidUid === rfidUid) || null;
    } catch (error) {
      console.error("Erro ao buscar ferramenta por RFID:", error);
      throw error;
    }
  }

  // Buscar usuário por RFID
  async getUserByRFID(rfidUid: string): Promise<UserData | null> {
    try {
      const users = await this.getUsers();
      return users.find((user) => user.rfidUid === rfidUid) || null;
    } catch (error) {
      console.error("Erro ao buscar usuário por RFID:", error);
      throw error;
    }
  }
}

const sheetsService = new GoogleSheetsService();

// GET - Buscar ferramentas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const rfidUid = searchParams.get("rfid");

    if (action === "tools") {
      const tools = await sheetsService.getTools();
      return NextResponse.json({ success: true, data: tools });
    }

    if (action === "users") {
      const users = await sheetsService.getUsers();
      return NextResponse.json({ success: true, data: users });
    }

    if (action === "tool-by-rfid" && rfidUid) {
      const tool = await sheetsService.getToolByRFID(rfidUid);
      return NextResponse.json({ success: true, data: tool });
    }

    if (action === "user-by-rfid" && rfidUid) {
      const user = await sheetsService.getUserByRFID(rfidUid);
      return NextResponse.json({ success: true, data: user });
    }

    return NextResponse.json(
      { error: "Ação não especificada" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro na API Google Sheets:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Registrar transação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      toolId,
      userId,
      userName,
      toolName,
      rfidUid,
      damageDescription,
    } = body;

    if (!action || !toolId || !userId || !rfidUid) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const transaction: Transaction = {
      id: `TXN-${Date.now()}`,
      userId,
      userName: userName || "Usuário",
      toolId,
      toolName: toolName || "Ferramenta",
      action: action as "coleta" | "devolução" | "reporte_dano",
      timestamp: new Date().toISOString(),
      rfidUid,
      damageDescription:
        action === "reporte_dano" ? damageDescription : undefined,
    };

    // Registrar transação
    await sheetsService.registerTransaction(transaction);

    // Atualizar status da ferramenta
    let newStatus = "disponível";
    if (action === "coleta") {
      newStatus = "emprestada";
    } else if (action === "reporte_dano") {
      newStatus = "danificada";
    }
    await sheetsService.updateToolStatus(
      toolId,
      newStatus,
      action === "coleta" ? userName : undefined
    );

    return NextResponse.json({
      success: true,
      message: `Transação registrada: ${action}`,
      data: transaction,
    });
  } catch (error) {
    console.error("Erro ao registrar transação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
