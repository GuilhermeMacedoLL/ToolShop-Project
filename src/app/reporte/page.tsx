// app/reporte/page.tsx
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
  FiCamera,
  FiEdit3,
  FiSend,
  FiHome,
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

export default function Reporte() {
  const router = useRouter();

  // Estados do sistema
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [scannedTool, setScannedTool] = useState<Tool | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [arduinoConnected, setArduinoConnected] = useState(false);
  const [lastRFIDData, setLastRFIDData] = useState<RFIDData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados do fluxo
  const [currentStep, setCurrentStep] = useState<
    "auth" | "scan" | "confirm" | "complete"
  >("auth");
  const [damageDescription, setDamageDescription] = useState("");
  const [damageType, setDamageType] = useState<
    "quebrada" | "danificada" | "desgastada" | "outro"
  >("quebrada");
  const [urgency, setUrgency] = useState<"baixa" | "média" | "alta">("média");

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
      if (currentStep === "auth") {
        // Buscar usuário por RFID
        const response = await fetch(
          `/api/google-sheets?action=user-by-rfid&rfid=${rfidData.uid}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setCurrentUser(data.data);
            setSuccess(`Usuário identificado: ${data.data.name}`);
            setCurrentStep("scan");
          } else {
            setError("Usuário não encontrado no sistema");
          }
        }
      } else if (currentStep === "scan") {
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
        uid: currentStep === "auth" ? "USER-001" : "TOOL-001",
        timestamp: new Date().toISOString(),
        signalStrength: Math.floor(Math.random() * 100),
      };

      handleRFIDRead(mockRFIDData);
    }, 2000);
  };

  // Confirmar reporte
  const confirmReport = async () => {
    if (!scannedTool || !currentUser || !damageDescription.trim()) return;

    try {
      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reporte_dano",
          toolId: scannedTool.id,
          userId: currentUser.id,
          userName: currentUser.name,
          toolName: scannedTool.name,
          rfidUid: scannedTool.rfidUid,
          damageDescription: damageDescription,
          damageType: damageType,
          urgency: urgency,
        }),
      });

      if (response.ok) {
        setSuccess(`Reporte registrado: ${scannedTool.name}`);
        setCurrentStep("complete");
      } else {
        throw new Error("Erro ao registrar reporte");
      }
    } catch (err) {
      console.error("Erro ao confirmar reporte:", err);
      setError("Erro ao registrar reporte. Tente novamente.");
    }
  };

  // Resetar sistema
  const resetSystem = () => {
    setCurrentUser(null);
    setScannedTool(null);
    setCurrentStep("auth");
    setError(null);
    setSuccess(null);
    setDamageDescription("");
    setDamageType("quebrada");
    setUrgency("média");
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
        <title>ToolShop - Reporte de Dano</title>
        <meta
          name="description"
          content="Sistema de reporte de ferramentas danificadas"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-50">
        {/* Header Moderno */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 p-2 rounded-xl shadow-lg">
                    <Image
                      src={ToolShopLogo}
                      alt="ToolShop Logo"
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    ToolShop
                  </h1>
                  <p className="text-sm text-gray-600">Reporte de Dano</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {currentUser && (
                  <div className="hidden md:flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiUser className="text-red-500" />
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
          <div className="max-w-4xl mx-auto">
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
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-sm font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200"
                >
                  Reconectar
                </button>
              </div>
            </div>

            {/* Layout Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Área Principal - Reporte */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 p-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <FiAlertOctagon className="mr-3" /> Reporte de Dano
                      </h2>
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Passo 1: Autenticação */}
                    {currentStep === "auth" && (
                      <div className="text-center space-y-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <FiUser className="text-red-600 text-3xl" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Identificação do Usuário
                          </h3>
                          <p className="text-gray-600 text-lg">
                            Aproxime seu crachá do leitor RFID para reportar um
                            dano
                          </p>
                        </div>

                        <div className="border-2 border-dashed border-red-300 rounded-2xl p-12 bg-gradient-to-br from-red-50 to-pink-50">
                          {isScanning ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-pulse">
                                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
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
                          onClick={() => simulateRFIDScan()}
                          disabled={isScanning}
                          className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
                        >
                          <FiUser className="mr-3 inline" />
                          Simular Leitura de Crachá
                        </button>
                      </div>
                    )}

                    {/* Passo 2: Leitura de Ferramenta */}
                    {currentStep === "scan" && currentUser && (
                      <div className="text-center space-y-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <FiCheckCircle className="text-green-600 text-3xl" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Bem-vindo, {currentUser.name}!
                          </h3>
                          <p className="text-gray-600 text-lg">
                            Aproxime a ferramenta danificada do leitor RFID
                          </p>
                        </div>

                        <div className="border-2 border-dashed border-red-300 rounded-2xl p-12 bg-gradient-to-br from-red-50 to-pink-50">
                          {isScanning ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-pulse">
                                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                                  <FiTool className="text-white text-3xl" />
                                </div>
                              </div>
                              <p className="mt-6 text-gray-600 text-lg font-medium">
                                Lendo ferramenta...
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto shadow-lg" />
                              <p className="text-gray-500 text-lg">
                                Aguardando leitura da ferramenta...
                              </p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => simulateRFIDScan()}
                          disabled={isScanning}
                          className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
                        >
                          <FiTool className="mr-3 inline" />
                          Simular Leitura de Ferramenta
                        </button>
                      </div>
                    )}

                    {/* Passo 3: Confirmação */}
                    {currentStep === "confirm" && scannedTool && (
                      <div className="space-y-8">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <FiAlertOctagon className="text-red-600 text-3xl" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mt-4">
                            Reportar Dano
                          </h3>
                        </div>

                        {/* Detalhes da Ferramenta */}
                        <div className="bg-gray-50 p-6 rounded-xl">
                          <h4 className="font-semibold mb-4 text-gray-900">
                            Ferramenta Identificada:
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">
                                Nome:
                              </span>
                              <p className="text-gray-900 font-semibold">
                                {scannedTool.name}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Categoria:
                              </span>
                              <p className="text-gray-900 font-semibold">
                                {scannedTool.category}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Localização:
                              </span>
                              <p className="text-gray-900 font-semibold">
                                {scannedTool.location}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Status:
                              </span>
                              <p className="text-gray-900 font-semibold">
                                {scannedTool.status}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Tipo de Dano */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">
                            Tipo de Dano:
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              {
                                value: "quebrada",
                                label: "Quebrada",
                                icon: "🔨",
                              },
                              {
                                value: "danificada",
                                label: "Danificada",
                                icon: "⚠️",
                              },
                              {
                                value: "desgastada",
                                label: "Desgastada",
                                icon: "🔧",
                              },
                              { value: "outro", label: "Outro", icon: "❓" },
                            ].map((type) => (
                              <button
                                key={type.value}
                                onClick={() => setDamageType(type.value as any)}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                  damageType === type.value
                                    ? "border-red-500 bg-red-50 text-red-700"
                                    : "border-gray-200 bg-white hover:border-red-300"
                                }`}
                              >
                                <div className="text-2xl mb-2">{type.icon}</div>
                                <div className="font-medium">{type.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Urgência */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">
                            Nível de Urgência:
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              {
                                value: "baixa",
                                label: "Baixa",
                                color: "green",
                              },
                              {
                                value: "média",
                                label: "Média",
                                color: "yellow",
                              },
                              { value: "alta", label: "Alta", color: "red" },
                            ].map((level) => (
                              <button
                                key={level.value}
                                onClick={() => setUrgency(level.value as any)}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                  urgency === level.value
                                    ? `border-${level.color}-500 bg-${level.color}-50 text-${level.color}-700`
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                <div className="font-medium">{level.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Descrição do Dano */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">
                            Descrição Detalhada do Dano:
                          </h4>
                          <textarea
                            value={damageDescription}
                            onChange={(e) =>
                              setDamageDescription(e.target.value)
                            }
                            placeholder="Descreva detalhadamente o que aconteceu com a ferramenta, incluindo como o dano ocorreu, quais partes foram afetadas e qualquer informação relevante..."
                            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            rows={6}
                          />
                          <p className="text-sm text-gray-600">
                            Quanto mais detalhes você fornecer, melhor será para
                            a equipe de manutenção.
                          </p>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex space-x-4">
                          <button
                            onClick={confirmReport}
                            disabled={!damageDescription.trim()}
                            className="flex-1 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
                          >
                            <FiSend className="mr-2 inline" />
                            Enviar Reporte
                          </button>
                          <button
                            onClick={() => {
                              setScannedTool(null);
                              setCurrentStep("scan");
                            }}
                            className="flex-1 py-4 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Passo 4: Conclusão */}
                    {currentStep === "complete" && (
                      <div className="text-center space-y-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <FiCheckCircle className="text-green-600 text-3xl" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Reporte Enviado com Sucesso!
                          </h3>
                          <p className="text-gray-600 text-lg">
                            O reporte foi registrado e será analisado pela
                            equipe de manutenção.
                          </p>
                        </div>

                        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-3">
                            Próximos Passos:
                          </h4>
                          <ul className="text-sm text-green-700 space-y-2 text-left">
                            <li>• A equipe de manutenção será notificada</li>
                            <li>• A ferramenta será avaliada em até 24h</li>
                            <li>• Você receberá atualizações sobre o status</li>
                            <li>
                              • Uma nova ferramenta será disponibilizada se
                              necessário
                            </li>
                          </ul>
                        </div>

                        <div className="flex space-x-4">
                          <button
                            onClick={() => setCurrentStep("scan")}
                            className="flex-1 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-300"
                          >
                            Reportar Outra Ferramenta
                          </button>
                          <button
                            onClick={() => router.push("/home")}
                            className="flex-1 py-4 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 rounded-xl font-semibold transition-all duration-300"
                          >
                            Voltar ao Início
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mensagens de Status */}
                    {error && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <FiAlertCircle className="text-red-500" size={20} />
                          <span className="text-red-700 font-medium">
                            {error}
                          </span>
                        </div>
                      </div>
                    )}

                    {success && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <FiCheckCircle className="text-green-500" size={20} />
                          <span className="text-green-700 font-medium">
                            {success}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar - Informações */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <FiAlertOctagon className="mr-3" /> Informações
                      </h2>
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Informações do Usuário */}
                    {currentUser && (
                      <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                        <h3 className="font-semibold text-red-800 mb-4 flex items-center">
                          <FiUser className="mr-2 text-red-600" />
                          Usuário
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
                            <span className="text-sm font-medium text-red-800">
                              Nome:
                            </span>
                            <span className="text-sm font-semibold text-red-700">
                              {currentUser.name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
                            <span className="text-sm font-medium text-red-800">
                              Função:
                            </span>
                            <span className="text-sm font-semibold text-red-700">
                              {currentUser.function}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Estatísticas de Reportes */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <FiBarChart className="mr-2 text-red-600" />
                        Estatísticas
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-red-800">
                            Reportes Hoje:
                          </span>
                          <span className="text-sm font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                            3
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-yellow-800">
                            Em Análise:
                          </span>
                          <span className="text-sm font-bold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                            5
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-green-800">
                            Resolvidos:
                          </span>
                          <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                            12
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="space-y-3">
                      <button
                        onClick={() =>
                          window.open(
                            "/api/google-sheets?action=tools",
                            "_blank"
                          )
                        }
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
                      >
                        <FiDatabase className="mr-2 inline" />
                        Ver Estoque
                      </button>
                      <button
                        onClick={() => router.push("/home")}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
                      >
                        <FiHome className="mr-2 inline" />
                        Voltar ao Início
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
                <div className="bg-gradient-to-r from-red-500 to-pink-600 p-2 rounded-lg">
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
                  <p className="text-sm text-gray-600">Reporte de Dano</p>
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
