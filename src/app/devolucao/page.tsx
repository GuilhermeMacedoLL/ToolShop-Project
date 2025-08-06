// app/devolucao/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiTool,
  FiXCircle,
  FiClock,
  FiUser,
  FiLogOut,
  FiWifi,
  FiWifiOff,
  FiAlertCircle,
  FiShield,
  FiCheckSquare,
  FiX,
  FiAlertTriangle,
  FiDatabase,
  FiAlertOctagon,
  FiPackage,
  FiSettings,
  FiBarChart,
  FiFileText,
  FiRotateCcw,
  FiList,
  FiCheck,
  FiAlertCircle as FiAlertCircle2,
} from "react-icons/fi";
import ToolShopLogo from "../assets/ToolShop.jpg";
import { useRouter } from "next/navigation";

// Interface para dados RFID
interface RFIDData {
  uid: string;
  timestamp: string;
  signalStrength: number;
  toolId?: string;
  toolName?: string;
  status?: string;
}

// Interface para ferramenta
interface Tool {
  id: string;
  name: string;
  rfidUid: string;
  status: "disponível" | "emprestada" | "manutenção" | "danificada";
  category: string;
  location: string;
  borrowedBy?: string;
  borrowedDate?: string;
  returnDate?: string;
  lastMaintenance?: string;
  damageReport?: string;
}

// Interface para usuário
interface User {
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

export default function Devolucao() {
  const router = useRouter();

  // Estados do sistema
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [scannedTool, setScannedTool] = useState<Tool | null>(null);
  const [scannedUser, setScannedUser] = useState<User | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [lastRFIDData, setLastRFIDData] = useState<RFIDData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados do fluxo
  const [currentStep, setCurrentStep] = useState<
    "auth" | "scan" | "confirm" | "complete" | "status"
  >("auth");
  const [scanMode, setScanMode] = useState<"user" | "tool">("user");
  const [returnedTools, setReturnedTools] = useState<Tool[]>([]);
  const [userTools, setUserTools] = useState<Tool[]>([]);

  // Estados de verificação
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [damageDescription, setDamageDescription] = useState("");
  const [toolCondition, setToolCondition] = useState<
    "bom" | "danificado" | "precisa_manutencao"
  >("bom");

  const wsRef = useRef<WebSocket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Conectar ao Arduino via WebSocket
  const connectToArduino = () => {
    try {
      // Em desenvolvimento, simular conexão
      if (process.env.NODE_ENV === "development") {
        console.log("Modo desenvolvimento - simulando conexão Arduino");
        setArduinoConnected(true);
        setError(null);
        return;
      }

      const ws = new WebSocket("ws://localhost:8080/arduino");

      ws.onopen = () => {
        console.log("Conectado ao Arduino");
        setArduinoConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const rfidData: RFIDData = JSON.parse(event.data);
          handleRFIDRead(rfidData);
        } catch (err) {
          console.error("Erro ao processar dados RFID:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("Erro na conexão WebSocket:", error);
        setArduinoConnected(false);
        setError("Arduino não conectado - usando modo simulação");
      };

      ws.onclose = () => {
        console.log("Conexão com Arduino fechada");
        setArduinoConnected(false);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Erro ao conectar ao Arduino:", err);
      setArduinoConnected(false);
      setError("Arduino não disponível - usando modo simulação");
    }
  };

  // Polling como fallback
  const startPolling = () => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch("/api/arduino/rfid");
        if (response.ok) {
          const rfidData: RFIDData = await response.json();
          if (rfidData.uid) {
            handleRFIDRead(rfidData);
          }
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 1000);
  };

  // Processar leitura RFID
  const handleRFIDRead = async (rfidData: RFIDData) => {
    setLastRFIDData(rfidData);
    setIsScanning(false);

    try {
      if (scanMode === "user") {
        // Buscar usuário por RFID
        const response = await fetch(
          `/api/google-sheets?action=user-by-rfid&rfid=${rfidData.uid}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setScannedUser(data.data);
            setCurrentUser(data.data);
            setSuccess(`Usuário identificado: ${data.data.name}`);
            setCurrentStep("scan");
            setScanMode("tool");
            loadUserTools(data.data.id);
          } else {
            setError("Usuário não encontrado no sistema");
          }
        }
      } else {
        // Buscar ferramenta por RFID
        const response = await fetch(
          `/api/google-sheets?action=tool-by-rfid&rfid=${rfidData.uid}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setScannedTool(data.data);
            setSuccess(`Ferramenta identificada: ${data.data.name}`);
            setCurrentStep("confirm");
          } else {
            setError("Ferramenta não encontrada no sistema");
          }
        }
      }
    } catch (err) {
      console.error("Erro ao processar RFID:", err);
      setError("Erro ao processar leitura RFID");
    }
  };

  // Simulação de leitura (para desenvolvimento)
  const simulateRFIDScan = () => {
    setIsScanning(true);
    setError(null);

    setTimeout(() => {
      const mockRFIDData: RFIDData = {
        uid: scanMode === "user" ? "USER-001" : "TOOL-001",
        timestamp: new Date().toISOString(),
        signalStrength: Math.floor(Math.random() * 100),
      };

      handleRFIDRead(mockRFIDData);
    }, 2000);
  };

  // Confirmar devolução
  const confirmReturn = async () => {
    if (!scannedTool || !currentUser) return;

    try {
      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "devolução",
          toolId: scannedTool.id,
          userId: currentUser.id,
          userName: currentUser.name,
          toolName: scannedTool.name,
          rfidUid: scannedTool.rfidUid,
          damageDescription:
            toolCondition !== "bom" ? damageDescription : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        setReturnedTools([...returnedTools, scannedTool]);
        setSuccess(`Devolução registrada: ${scannedTool.name}`);

        // Atualizar lista de ferramentas do usuário
        setUserTools(userTools.filter((tool) => tool.id !== scannedTool.id));

        setScannedTool(null);
        setDamageDescription("");
        setToolCondition("bom");
        setCurrentStep("complete");
      } else {
        throw new Error("Erro ao registrar devolução");
      }
    } catch (err) {
      console.error("Erro ao confirmar devolução:", err);
      setError("Erro ao registrar devolução. Tente novamente.");
    }
  };

  // Carregar ferramentas do usuário
  const loadUserTools = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/google-sheets?action=user-tools&userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserTools(data.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar ferramentas do usuário:", err);
    }
  };

  // Resetar sistema
  const resetSystem = () => {
    setCurrentUser(null);
    setScannedTool(null);
    setScannedUser(null);
    setReturnedTools([]);
    setUserTools([]);
    setCurrentStep("auth");
    setError(null);
    setSuccess(null);
    setDamageDescription("");
    setToolCondition("bom");
  };

  // Inicializar conexão
  useEffect(() => {
    connectToArduino();

    if (!arduinoConnected) {
      startPolling();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [arduinoConnected]);

  return (
    <>
      <Head>
        <title>ToolShop - Devolução de Ferramentas</title>
        <meta
          name="description"
          content="Sistema de devolução de ferramentas com RFID"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Moderno */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg">
                    <Image
                      src={ToolShopLogo}
                      alt="ToolShop Logo"
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    ToolShop
                  </h1>
                  <p className="text-sm text-gray-600">Sistema de Devolução</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {currentUser && (
                  <div className="hidden md:flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiUser className="text-blue-500" />
                      <span className="text-sm font-medium">
                        {currentUser.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiShield className="text-blue-500" />
                      <span className="text-sm font-medium">
                        {currentUser.function}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={resetSystem}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <FiLogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Botão de voltar */}
            <button
              onClick={() => router.back()}
              className="flex items-center text-green-600 hover:text-green-800 mb-6"
            >
              <FiArrowLeft className="mr-2" /> Voltar
            </button>

            {/* Status do Arduino */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {arduinoConnected ? (
                    <FiWifi className="text-blue-500" size={20} />
                  ) : (
                    <FiWifiOff className="text-red-500" size={20} />
                  )}
                  <span className="font-medium">
                    Arduino: {arduinoConnected ? "Conectado" : "Desconectado"}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={connectToArduino}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                  >
                    Reconectar
                  </button>
                </div>
              </div>
            </div>

            {/* Layout Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Área Principal - Devolução */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <FiRotateCcw className="mr-3" /> Devolução de Ferramentas
                    </h2>
                  </div>

                  <div className="p-6">
                    {/* Passo 1: Autenticação */}
                    {currentStep === "auth" && (
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                          <FiUser className="text-blue-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold">
                          Identificação do Usuário
                        </h3>
                        <p className="text-gray-600">
                          Aproxime seu crachá do leitor RFID para iniciar a
                          devolução
                        </p>

                        <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 bg-blue-50">
                          {isScanning ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-pulse">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                                  <FiUser className="text-white text-2xl" />
                                </div>
                              </div>
                              <p className="mt-4 text-gray-600">
                                Lendo crachá...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto" />
                              <p className="text-gray-500">
                                Aguardando leitura do crachá...
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setScanMode("user");
                            simulateRFIDScan();
                          }}
                          disabled={isScanning}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          <FiUser className="mr-2 inline" />
                          Simular Leitura de Crachá
                        </button>
                      </div>
                    )}

                    {/* Passo 2: Leitura de Ferramentas */}
                    {currentStep === "scan" && currentUser && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <FiCheckCircle className="text-blue-600 text-2xl" />
                          </div>
                          <h3 className="text-xl font-semibold mt-4">
                            Bem-vindo, {currentUser.name}!
                          </h3>
                          <p className="text-gray-600">
                            Aproxime as ferramentas para devolução
                          </p>
                        </div>

                        {/* Lista de Ferramentas Emprestadas */}
                        <div className="bg-blue-50 p-6 rounded-xl">
                          <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                            <FiList className="mr-2" />
                            Suas Ferramentas Emprestadas
                          </h4>
                          {userTools.length > 0 ? (
                            <div className="space-y-3">
                              {userTools.map((tool, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                                >
                                  <div>
                                    <p className="font-medium text-blue-800">
                                      {tool.name}
                                    </p>
                                    <p className="text-sm text-blue-600">
                                      {tool.category}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-blue-500">
                                      Emprestada em: {tool.borrowedDate}
                                    </p>
                                    <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                      Em uso
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FiPackage className="text-blue-400 text-4xl mx-auto mb-3" />
                              <p className="text-blue-600">
                                Você não possui ferramentas emprestadas
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Área de Leitura */}
                        <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 bg-blue-50 text-center">
                          {isScanning ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-pulse">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                                  <FiTool className="text-white text-2xl" />
                                </div>
                              </div>
                              <p className="mt-4 text-gray-600">
                                Lendo ferramenta...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto" />
                              <p className="text-gray-500">
                                Aguardando leitura da ferramenta...
                              </p>
                              <p className="text-sm text-gray-400">
                                Aproxime uma ferramenta do leitor RFID
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setScanMode("tool");
                            simulateRFIDScan();
                          }}
                          disabled={isScanning}
                          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 disabled:bg-gray-400"
                        >
                          <FiTool className="mr-2 inline" />
                          Simular Leitura de Ferramenta
                        </button>
                      </div>
                    )}

                    {/* Passo 3: Confirmação */}
                    {currentStep === "confirm" && scannedTool && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <FiCheckCircle className="text-green-600 text-2xl" />
                          </div>
                          <h3 className="text-xl font-semibold mt-4">
                            Confirmar Devolução
                          </h3>
                        </div>

                        {/* Detalhes da Ferramenta */}
                        <div className="bg-gray-50 p-6 rounded-xl">
                          <h4 className="font-semibold mb-4">
                            Detalhes da Ferramenta:
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Nome:</span>
                              <p className="text-gray-600">
                                {scannedTool.name}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Categoria:</span>
                              <p className="text-gray-600">
                                {scannedTool.category}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Localização:</span>
                              <p className="text-gray-600">
                                {scannedTool.location}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Status:</span>
                              <p className="text-gray-600">
                                {scannedTool.status}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Condição da Ferramenta */}
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                          <h4 className="font-semibold text-yellow-800 mb-4 flex items-center">
                            <FiAlertCircle2 className="mr-2" />
                            Condição da Ferramenta
                          </h4>
                          <div className="space-y-4">
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="condition"
                                  value="bom"
                                  checked={toolCondition === "bom"}
                                  onChange={(e) =>
                                    setToolCondition(e.target.value as any)
                                  }
                                  className="mr-2 text-green-600"
                                />
                                <span className="text-green-700">
                                  Bom Estado
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="condition"
                                  value="precisa_manutencao"
                                  checked={
                                    toolCondition === "precisa_manutencao"
                                  }
                                  onChange={(e) =>
                                    setToolCondition(e.target.value as any)
                                  }
                                  className="mr-2 text-yellow-600"
                                />
                                <span className="text-yellow-700">
                                  Precisa Manutenção
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="condition"
                                  value="danificado"
                                  checked={toolCondition === "danificado"}
                                  onChange={(e) =>
                                    setToolCondition(e.target.value as any)
                                  }
                                  className="mr-2 text-red-600"
                                />
                                <span className="text-red-700">Danificado</span>
                              </label>
                            </div>

                            {(toolCondition === "precisa_manutencao" ||
                              toolCondition === "danificado") && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Descrição do Problema:
                                </label>
                                <textarea
                                  value={damageDescription}
                                  onChange={(e) =>
                                    setDamageDescription(e.target.value)
                                  }
                                  placeholder="Descreva o problema encontrado..."
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                  rows={3}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-4">
                          <button
                            onClick={confirmReturn}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium"
                          >
                            <FiCheck className="mr-2 inline" />
                            Confirmar Devolução
                          </button>
                          <button
                            onClick={() => {
                              setScannedTool(null);
                              setCurrentStep("scan");
                            }}
                            className="flex-1 py-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Passo 4: Conclusão */}
                    {currentStep === "complete" && (
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <FiCheckCircle className="text-green-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold">
                          Devolução Concluída!
                        </h3>

                        {returnedTools.length > 0 && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">
                              Ferramentas Devolvidas:
                            </h4>
                            <ul className="text-sm text-green-700">
                              {returnedTools.map((tool, index) => (
                                <li key={index}>• {tool.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex space-x-4">
                          <button
                            onClick={() => setCurrentStep("scan")}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                          >
                            Continuar Devoluções
                          </button>
                          <button
                            onClick={() => router.push("/coleta")}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                          >
                            Ir para Coleta
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mensagens de Status */}
                    {error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FiAlertCircle className="text-red-500" />
                          <span className="text-red-700 text-sm">{error}</span>
                        </div>
                      </div>
                    )}

                    {success && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <FiCheckCircle className="text-green-500" />
                          <span className="text-green-700 text-sm">
                            {success}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar - Status da Devolução */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <FiRotateCcw className="mr-3" /> Status da Devolução
                      </h2>
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Informações do Usuário */}
                    {currentUser && (
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-3">
                          Usuário
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-800">
                              Nome:
                            </span>
                            <span className="text-sm text-blue-700">
                              {currentUser.name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-800">
                              Função:
                            </span>
                            <span className="text-sm text-blue-700">
                              {currentUser.function}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-800">
                              Nível:
                            </span>
                            <span className="text-sm text-blue-700">
                              {currentUser.accessLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ferramentas para Devolver */}
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                        <FiPackage className="mr-2" />
                        Ferramentas para Devolver
                      </h3>
                      {userTools.length > 0 ? (
                        <div className="space-y-2">
                          {userTools.map((tool, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg text-sm"
                            >
                              <span className="text-yellow-800 font-medium">
                                {tool.name}
                              </span>
                              <span className="text-yellow-600 text-xs">
                                {tool.borrowedDate}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-sm text-gray-600">
                            Nenhuma ferramenta para devolver
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ferramentas Devolvidas */}
                    {returnedTools.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                          <FiCheckSquare className="mr-2" />
                          Ferramentas Devolvidas
                        </h3>
                        <div className="space-y-2">
                          {returnedTools.map((tool, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-green-50 rounded-lg text-sm"
                            >
                              <span className="text-green-800 font-medium">
                                {tool.name}
                              </span>
                              <span className="text-green-600 text-xs">
                                Devolvida
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Estatísticas */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <FiBarChart className="mr-2" />
                        Estatísticas
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg">
                          <span className="text-sm font-medium text-yellow-800">
                            Para Devolver:
                          </span>
                          <span className="text-sm font-bold text-yellow-600">
                            {userTools.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                          <span className="text-sm font-medium text-green-800">
                            Devolvidas:
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {returnedTools.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-blue-800">
                            Total:
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {userTools.length + returnedTools.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          window.open(
                            "/api/google-sheets?action=tools",
                            "_blank"
                          )
                        }
                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <FiDatabase className="mr-2 inline" />
                        Ver Estoque
                      </button>
                      <button
                        onClick={() => router.push("/coleta")}
                        className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <FiTool className="mr-2 inline" />
                        Ir para Coleta
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                  <Image
                    src={ToolShopLogo}
                    alt="ToolShop Logo"
                    width={32}
                    height={32}
                    className="rounded"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">ToolShop</h3>
                  <p className="text-sm text-gray-600">Sistema de Devolução</p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>© 2025 ToolShop. Todos os direitos reservados.</span>
                <span>•</span>
                <span>Versão 2.0.1</span>
                <span>•</span>
                <span>Integração Arduino + RFID + Google Sheets</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
