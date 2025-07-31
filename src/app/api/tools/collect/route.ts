import { NextRequest, NextResponse } from "next/server";

// Interface para dados de coleta
interface CollectData {
  toolId: string;
  userId: string;
  timestamp: string;
  rfidUid: string;
}

// Simulação de banco de dados (em produção, seria um banco real)
let collectedTools: CollectData[] = [];

export async function POST(request: NextRequest) {
  try {
    const body: CollectData = await request.json();

    // Validação dos dados
    if (!body.toolId || !body.userId || !body.rfidUid) {
      return NextResponse.json(
        { error: "Dados incompletos para registro de coleta" },
        { status: 400 }
      );
    }

    // Em produção, aqui você:
    // 1. Verificaria se a ferramenta existe no banco
    // 2. Verificaria se está disponível
    // 3. Registraria a coleta no banco de dados
    // 4. Atualizaria o status da ferramenta
    // 5. Integraria com Google Sheets se necessário

    // Simulação de registro
    const collectRecord: CollectData = {
      toolId: body.toolId,
      userId: body.userId,
      timestamp: body.timestamp,
      rfidUid: body.rfidUid,
    };

    collectedTools.push(collectRecord);

    // Simulação de integração com Google Sheets
    // await updateGoogleSheets(collectRecord);

    console.log("Coleta registrada:", collectRecord);

    return NextResponse.json({
      success: true,
      message: "Coleta registrada com sucesso",
      data: collectRecord,
    });
  } catch (error) {
    console.error("Erro ao registrar coleta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Retorna histórico de coletas (para debug)
    return NextResponse.json({
      success: true,
      data: collectedTools,
    });
  } catch (error) {
    console.error("Erro ao buscar coletas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
