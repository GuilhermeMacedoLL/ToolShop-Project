import { NextRequest, NextResponse } from "next/server";

// Interface para dados RFID
interface RFIDData {
  uid: string;
  timestamp: string;
  signalStrength: number;
  toolId?: string;
  toolName?: string;
  status?: string;
}

// Simulação de dados do Arduino (em produção, isso viria de uma conexão real)
let lastRFIDRead: RFIDData | null = null;

export async function GET() {
  try {
    // Em produção, aqui você faria uma conexão real com o Arduino
    // via Serial, WebSocket, ou HTTP

    // Simulação de leitura RFID
    const mockRFIDData: RFIDData = {
      uid: "A1B2C3D4E5F6",
      timestamp: new Date().toISOString(),
      signalStrength: Math.floor(Math.random() * 100),
      toolId: "TOOL-001",
      toolName: "Martelo de Borracha",
      status: "disponível",
    };

    // Simula que nem sempre há uma leitura
    if (Math.random() > 0.7) {
      lastRFIDRead = mockRFIDData;
    }

    return NextResponse.json(lastRFIDRead || { uid: "" });
  } catch (error) {
    console.error("Erro ao ler RFID:", error);
    return NextResponse.json(
      { error: "Erro ao comunicar com Arduino" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Em produção, aqui você enviaria comandos para o Arduino
    // Por exemplo, para ativar/desativar o leitor RFID

    return NextResponse.json({
      success: true,
      message: "Comando enviado para Arduino",
    });
  } catch (error) {
    console.error("Erro ao enviar comando para Arduino:", error);
    return NextResponse.json(
      { error: "Erro ao enviar comando para Arduino" },
      { status: 500 }
    );
  }
}
