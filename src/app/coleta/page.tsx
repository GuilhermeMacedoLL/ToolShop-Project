// app/coleta/page.tsx
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

export default function Coleta() {
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
    "auth" | "operation" | "scan" | "confirm" | "complete" | "status"
  >("auth");
  const [operation, setOperation] = useState<
    "coleta" | "devolução" | "reporte_dano" | null
  >(null);
  const [scanMode, setScanMode] = useState<"user" | "tool">("user");
  const [collectedTools, setCollectedTools] = useState<Tool[]>([]);
  const [returnedTools, setReturnedTools] = useState<Tool[]>([]);
  const [userTools, setUserTools] = useState<Tool[]>([]);

  // Estados de verificação
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [exitVerification, setExitVerification] = useState(false);
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [damageDescription, setDamageDescription] = useState("");

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
            setCurrentStep("operation");
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

  // Confirmar operação
  const confirmOperation = async () => {
    if (!scannedTool || !currentUser || !operation) return;

    try {
      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: operation,
          toolId: scannedTool.id,
          userId: currentUser.id,
          userName: currentUser.name,
          toolName: scannedTool.name,
          rfidUid: scannedTool.rfidUid,
          damageDescription:
            operation === "reporte_dano" ? damageDescription : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (operation === "coleta") {
          setCollectedTools([...collectedTools, scannedTool]);
          setSuccess(`Coleta registrada: ${scannedTool.name}`);
        } else if (operation === "devolução") {
          setReturnedTools([...returnedTools, scannedTool]);
          setSuccess(`Devolução registrada: ${scannedTool.name}`);
        } else if (operation === "reporte_dano") {
          setSuccess(`Reporte de dano registrado: ${scannedTool.name}`);
        }

        setScannedTool(null);
        setDamageDescription("");
        setCurrentStep("complete");
      } else {
        throw new Error("Erro ao registrar operação");
      }
    } catch (err) {
      console.error("Erro ao confirmar operação:", err);
      setError("Erro ao registrar operação. Tente novamente.");
    }
  };

  // Verificar saída
  const verifyExit = () => {
    setExitVerification(true);

    // Simula verificação automática na porta
    setTimeout(() => {
      const hasUnregisteredTools = collectedTools.length > 0;

      if (hasUnregisteredTools) {
        setError("⚠️ ALERTA: Ferramentas não registradas detectadas!");
        // Aqui você ativaria sirene e câmeras
      } else {
        setSuccess("✅ Saída autorizada. Bom trabalho!");
        setCurrentStep("auth");
        resetSystem();
      }
    }, 3000);
  };

  // Resetar sistema
  const resetSystem = () => {
    setCurrentUser(null);
    setScannedTool(null);
    setScannedUser(null);
    setCollectedTools([]);
    setReturnedTools([]);
    setOperation(null);
    setCurrentStep("auth");
    setError(null);
    setSuccess(null);
    setTermsAccepted(false);
    setExitVerification(false);
    setDamageDescription("");
  };

  // Carregar ferramentas do usuário
  const loadUserTools = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `/api/google-sheets?action=user-tools&userId=${currentUser.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserTools(data.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar ferramentas do usuário:", err);
    }
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

  // Carregar ferramentas quando usuário é definido
  useEffect(() => {
    if (currentUser) {
      loadUserTools();
    }
  }, [currentUser]);

  return (
    <>
      <Head>
        <title>ToolShop - Sistema de Gerenciamento</title>
        <meta
          name="description"
          content="Sistema de gerenciamento de ferramentas com RFID"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        {/* Header Moderno */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-xl shadow-lg">
                    <Image
                      src={ToolShopLogo}
                      alt="ToolShop Logo"
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    ToolShop
                  </h1>
                  <p className="text-sm text-gray-600">Sistema de Coleta</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {currentUser && (
                  <div className="hidden md:flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiUser className="text-green-500" />
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

        <main className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Botão de voltar moderno */}
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-8 group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 group-hover:shadow-md transition-all duration-200">
                <FiArrowLeft className="mr-2" />
              </div>
              <span className="ml-3 font-medium">Voltar</span>
            </button>

            {/* Status do Arduino moderno */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-xl ${
                      arduinoConnected ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {arduinoConnected ? (
                      <FiWifi className="text-green-600" size={24} />
                    ) : (
                      <FiWifiOff className="text-red-600" size={24} />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">
                      Arduino RFID
                    </span>
                    <p className="text-sm text-gray-600">
                      {arduinoConnected
                        ? "Conectado e operacional"
                        : "Desconectado"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={connectToArduino}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  Reconectar
                </button>
              </div>
            </div>

            {/* Layout Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Área Principal - Coleta/Devolução */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <FiShield className="mr-3" /> Sistema de Controle
                      </h2>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Passo 1: Autenticação */}
                    {currentStep === "auth" && (
                      <div className="text-center space-y-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <FiUser className="text-green-600 text-3xl" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Identificação do Usuário
                          </h3>
                          <p className="text-gray-600 text-lg">
                            Aproxime seu crachá do leitor RFID para acessar o
                            sistema
                          </p>
                        </div>

                        <div className="border-2 border-dashed border-green-300 rounded-2xl p-12 bg-gradient-to-br from-green-50 to-emerald-50">
                          {isScanning ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-pulse">
                                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                  <FiUser className="text-white text-3xl" />
                                </div>
                              </div>
                              <p className="mt-6 text-gray-600 text-lg font-medium">
                                Lendo crachá...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto shadow-lg" />
                              <p className="text-gray-500 text-lg">
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
                          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
                        >
                          <FiUser className="mr-3 inline" />
                          Simular Leitura de Crachá
                        </button>
                      </div>
                    )}

                    {/* Passo 2: Escolha da Operação */}
                    {currentStep === "operation" && currentUser && (
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <FiCheckCircle className="text-green-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold">
                          Bem-vindo, {currentUser.name}!
                        </h3>
                        <p className="text-gray-600">
                          Escolha a operação desejada:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <button
                            onClick={() => {
                              setOperation("coleta");
                              setShowTerms(true);
                            }}
                            className="p-8 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                          >
                            <FiTool className="text-blue-600 text-4xl mx-auto mb-4" />
                            <h4 className="font-semibold text-blue-800 text-lg">
                              Coleta de Ferramentas
                            </h4>
                            <p className="text-sm text-blue-600 mt-2">
                              Retirar ferramentas do estoque
                            </p>
                          </button>

                          <button
                            onClick={() => router.push("/devolucao")}
                            className="p-8 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                          >
                            <FiCheckSquare className="text-green-600 text-4xl mx-auto mb-4" />
                            <h4 className="font-semibold text-green-800 text-lg">
                              Devolução de Ferramentas
                            </h4>
                            <p className="text-sm text-green-600 mt-2">
                              Devolver ferramentas ao estoque
                            </p>
                          </button>

                          <button
                            onClick={() => {
                              setOperation("reporte_dano");
                              setCurrentStep("scan");
                              setScanMode("tool");
                            }}
                            className="p-8 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-colors md:col-span-2"
                          >
                            <FiAlertOctagon className="text-red-600 text-4xl mx-auto mb-4" />
                            <h4 className="font-semibold text-red-800 text-lg">
                              Reportar Ferramenta Danificada
                            </h4>
                            <p className="text-sm text-red-600 mt-2">
                              Informar sobre ferramentas quebradas ou
                              danificadas
                            </p>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Passo 3: Leitura de Ferramentas */}
                    {currentStep === "scan" && operation && (
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <FiTool className="text-orange-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold">
                          {operation === "coleta"
                            ? "Coleta"
                            : operation === "devolução"
                            ? "Devolução"
                            : "Reporte de Dano"}{" "}
                          de Ferramentas
                        </h3>
                        <p className="text-gray-600">
                          Aproxime as ferramentas do leitor RFID
                        </p>

                        <div className="border-2 border-dashed border-orange-300 rounded-2xl p-8 bg-orange-50">
                          {isScanning ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-pulse">
                                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto">
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
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setScanMode("tool");
                            simulateRFIDScan();
                          }}
                          disabled={isScanning}
                          className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400"
                        >
                          <FiTool className="mr-2 inline" />
                          Simular Leitura de Ferramenta
                        </button>
                      </div>
                    )}

                    {/* Passo 4: Confirmação */}
                    {currentStep === "confirm" && scannedTool && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <FiCheckCircle className="text-green-600 text-2xl" />
                          </div>
                          <h3 className="text-xl font-semibold mt-4">
                            Confirmar {operation}
                          </h3>
                        </div>

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

                        {operation === "reporte_dano" && (
                          <div className="bg-red-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-red-800 mb-2">
                              Descreva o Dano:
                            </h4>
                            <textarea
                              value={damageDescription}
                              onChange={(e) =>
                                setDamageDescription(e.target.value)
                              }
                              placeholder="Descreva o que aconteceu com a ferramenta..."
                              className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              rows={3}
                            />
                          </div>
                        )}

                        <div className="flex space-x-4">
                          <button
                            onClick={confirmOperation}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                          >
                            Confirmar {operation}
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

                    {/* Passo 5: Conclusão */}
                    {currentStep === "complete" && (
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <FiCheckCircle className="text-green-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold">
                          Operação Concluída!
                        </h3>

                        {collectedTools.length > 0 && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">
                              Ferramentas Coletadas:
                            </h4>
                            <ul className="text-sm text-blue-700">
                              {collectedTools.map((tool, index) => (
                                <li key={index}>• {tool.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}

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
                            Continuar Operações
                          </button>
                          <button
                            onClick={verifyExit}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                          >
                            Finalizar e Sair
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Termos de Responsabilidade */}
                    {showTerms && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl max-w-md mx-4">
                          <h3 className="text-lg font-semibold mb-4">
                            Termos de Responsabilidade
                          </h3>
                          <div className="text-sm text-gray-600 mb-4 max-h-60 overflow-y-auto">
                            <p className="mb-2">
                              Ao coletar ferramentas, você se compromete a:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>
                                Utilizar as ferramentas apenas para fins
                                profissionais
                              </li>
                              <li>Devolver as ferramentas em bom estado</li>
                              <li>Reportar qualquer dano ou problema</li>
                              <li>Não emprestar ferramentas para terceiros</li>
                              <li>Respeitar os prazos de devolução</li>
                            </ul>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => {
                                setTermsAccepted(true);
                                setShowTerms(false);
                                setCurrentStep("scan");
                                setScanMode("tool");
                              }}
                              className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Aceitar
                            </button>
                            <button
                              onClick={() => {
                                setShowTerms(false);
                                setOperation(null);
                              }}
                              className="flex-1 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verificação de Saída */}
                    {exitVerification && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl max-w-md mx-4 text-center">
                          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiAlertTriangle className="text-yellow-600 text-2xl" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">
                            Verificação de Saída
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Verificando ferramentas coletadas...
                          </p>
                          <div className="animate-pulse">
                            <div className="w-8 h-8 bg-yellow-400 rounded-full mx-auto"></div>
                          </div>
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

              {/* Sidebar - Seu Status */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <FiUser className="mr-3" /> Seu Status
                      </h2>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Informações do Usuário */}
                    {currentUser && (
                      <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                        <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                          <FiUser className="mr-2 text-green-600" />
                          Informações
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <span className="text-sm font-medium text-green-800">
                              Nome:
                            </span>
                            <span className="text-sm font-semibold text-green-700">
                              {currentUser.name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <span className="text-sm font-medium text-green-800">
                              Função:
                            </span>
                            <span className="text-sm font-semibold text-green-700">
                              {currentUser.function}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <span className="text-sm font-medium text-green-800">
                              Nível:
                            </span>
                            <span className="text-sm font-semibold text-green-700">
                              {currentUser.accessLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ferramentas Emprestadas */}
                    <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                      <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                        <FiPackage className="mr-2 text-green-600" />
                        Ferramentas Emprestadas
                      </h3>
                      {userTools.length > 0 ? (
                        <div className="space-y-3">
                          {userTools.map((tool, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg text-sm shadow-sm"
                            >
                              <span className="text-green-800 font-semibold">
                                {tool.name}
                              </span>
                              <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded-full">
                                {tool.borrowedDate}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-center">
                          <p className="text-sm text-gray-600">
                            Nenhuma ferramenta emprestada
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Reporte de Dano - EM VERMELHO */}
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border-2 border-red-200 shadow-sm">
                      <h3 className="font-semibold text-red-800 mb-3 flex items-center">
                        <FiAlertOctagon className="mr-2 text-red-600" />
                        Reporte de Dano
                      </h3>
                      <p className="text-sm text-red-700 mb-4">
                        Encontrou uma ferramenta quebrada ou danificada?
                      </p>
                      <button
                        onClick={() => {
                          setOperation("reporte_dano");
                          setCurrentStep("scan");
                          setScanMode("tool");
                        }}
                        className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                      >
                        Reportar Dano
                      </button>
                    </div>

                    {/* Estatísticas Rápidas */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <FiBarChart className="mr-2 text-green-600" />
                        Estatísticas
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-green-800">
                            Emprestadas:
                          </span>
                          <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                            {userTools.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-blue-800">
                            Disponíveis:
                          </span>
                          <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                            15
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-yellow-800">
                            Em Manutenção:
                          </span>
                          <span className="text-sm font-bold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                            3
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="space-y-3">
                      <button
                        onClick={() => setCurrentStep("status")}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
                      >
                        <FiFileText className="mr-2 inline" />
                        Ver Histórico
                      </button>
                      <button
                        onClick={() =>
                          window.open(
                            "/api/google-sheets?action=tools",
                            "_blank"
                          )
                        }
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                      >
                        <FiDatabase className="mr-2 inline" />
                        Ver Estoque
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
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg">
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
                  <p className="text-sm text-gray-600">Sistema de Coleta</p>
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
