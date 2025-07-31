// app/home/page.tsx
"use client";

import Head from "next/head";
import Image from "next/image";
import {
  FiArrowRight,
  FiTool,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiUser,
  FiLogOut,
  FiShield,
  FiDatabase,
  FiBarChart,
  FiTrendingUp,
  FiAlertCircle,
  FiPlay,
  FiSettings,
  FiHelpCircle,
} from "react-icons/fi";
import ToolShopLogo from "../assets/ToolShop.jpg";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  // Dados de exemplo para estatísticas
  const stats = {
    totalTools: 156,
    availableTools: 89,
    borrowedTools: 45,
    maintenanceTools: 12,
    activeUsers: 23,
    todayTransactions: 18,
  };

  // Dados de exemplo para atividades recentes
  const recentActivities = [
    {
      id: 1,
      user: "Maria Oliveira",
      action: "coleta",
      tool: "Serra Circular",
      time: "14:30",
      status: "success",
    },
    {
      id: 2,
      user: "Carlos Mendes",
      action: "devolução",
      tool: "Martelo de Borracha",
      time: "14:15",
      status: "success",
    },
    {
      id: 3,
      user: "Ana Costa",
      action: "reporte",
      tool: "Chave de Fenda",
      time: "13:45",
      status: "warning",
    },
    {
      id: 4,
      user: "Pedro Santos",
      action: "coleta",
      tool: "Nível a Laser",
      time: "13:20",
      status: "success",
    },
  ];

  const handleOperationClick = (operation: string) => {
    setIsLoading(true);
    // Simula um pequeno delay para feedback visual
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <>
      <Head>
        <title>ToolShop - Dashboard</title>
        <meta
          name="description"
          content="Sistema inteligente de gerenciamento de ferramentas com RFID"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                  <p className="text-sm text-gray-600">
                    Gestão Inteligente de Ferramentas
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiShield className="text-green-500" />
                    <span className="text-sm font-medium">Sistema Ativo</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiDatabase className="text-blue-500" />
                    <span className="text-sm font-medium">RFID Conectado</span>
                  </div>
                </div>
                <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
                  <FiSettings size={20} />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
                  <FiHelpCircle size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <FiTrendingUp className="text-green-600" />
              <span>Sistema Operacional</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Bem-vindo ao
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {" "}
                ToolShop
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Sistema inteligente de gerenciamento de ferramentas com tecnologia
              RFID. Escolha uma operação abaixo para iniciar.
            </p>
          </div>

          {/* Cards de Operações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Card de Coleta */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform hover:-translate-y-2 transition-all duration-300">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8">
                  <div className="flex items-center justify-between">
                    <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                      <FiTool size={32} className="text-white" />
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-6">Coleta</h3>
                  <p className="text-green-100 mt-2">
                    Retirar ferramentas do estoque
                  </p>
                </div>
                <div className="p-8">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Escaneie seu crachá RFID
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Selecione as ferramentas
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Confirme a retirada
                      </span>
                    </div>
                  </div>
                  <Link href="/coleta" className="block">
                    <button
                      onClick={() => handleOperationClick("coleta")}
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Carregando...</span>
                        </div>
                      ) : (
                        <>
                          <FiPlay className="mr-2" />
                          Iniciar Coleta
                        </>
                      )}
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Card de Devolução */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform hover:-translate-y-2 transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8">
                  <div className="flex items-center justify-between">
                    <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                      <FiCheckCircle size={32} className="text-white" />
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-6">
                    Devolução
                  </h3>
                  <p className="text-blue-100 mt-2">
                    Devolver ferramentas ao estoque
                  </p>
                </div>
                <div className="p-8">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Autentique-se com RFID
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Escaneie as ferramentas
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Verifique a condição
                      </span>
                    </div>
                  </div>
                  <Link href="/devolucao" className="block">
                    <button
                      onClick={() => handleOperationClick("devolucao")}
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Carregando...</span>
                        </div>
                      ) : (
                        <>
                          <FiPlay className="mr-2" />
                          Iniciar Devolução
                        </>
                      )}
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Card de Reporte */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform hover:-translate-y-2 transition-all duration-300">
                <div className="bg-gradient-to-r from-red-500 to-pink-600 p-8">
                  <div className="flex items-center justify-between">
                    <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                      <FiAlertTriangle size={32} className="text-white" />
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mt-6">
                    Reporte
                  </h3>
                  <p className="text-red-100 mt-2">Problemas com ferramentas</p>
                </div>
                <div className="p-8">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Identifique o problema
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Descreva o dano
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Registre o incidente
                      </span>
                    </div>
                  </div>
                  <Link href="/coleta" className="block">
                    <button
                      onClick={() => handleOperationClick("reporte")}
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Carregando...</span>
                        </div>
                      ) : (
                        <>
                          <FiPlay className="mr-2" />
                          Reportar Problema
                        </>
                      )}
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard de Estatísticas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Estatísticas em Tempo Real */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiBarChart className="mr-3 text-green-600" />
                  Estatísticas do Sistema
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">Tempo Real</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Total de Ferramentas
                      </p>
                      <p className="text-3xl font-bold text-green-700">
                        {stats.totalTools}
                      </p>
                    </div>
                    <FiTool className="text-green-500 text-2xl" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Disponíveis
                      </p>
                      <p className="text-3xl font-bold text-blue-700">
                        {stats.availableTools}
                      </p>
                    </div>
                    <FiCheckCircle className="text-blue-500 text-2xl" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">
                        Emprestadas
                      </p>
                      <p className="text-3xl font-bold text-yellow-700">
                        {stats.borrowedTools}
                      </p>
                    </div>
                    <FiUser className="text-yellow-500 text-2xl" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">
                        Em Manutenção
                      </p>
                      <p className="text-3xl font-bold text-red-700">
                        {stats.maintenanceTools}
                      </p>
                    </div>
                    <FiAlertCircle className="text-red-500 text-2xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Atividades Recentes */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiClock className="mr-3 text-blue-600" />
                  Atividades Recentes
                </h3>
                <Link
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todas
                </Link>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.status === "success"
                          ? "bg-green-100"
                          : activity.status === "warning"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                      }`}
                    >
                      {activity.action === "coleta" && (
                        <FiTool className="text-green-600" />
                      )}
                      {activity.action === "devolução" && (
                        <FiCheckCircle className="text-blue-600" />
                      )}
                      {activity.action === "reporte" && (
                        <FiAlertTriangle className="text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {activity.user}
                      </p>
                      <p className="text-sm text-gray-600">{activity.tool}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.time}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiShield className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Status do Sistema
                  </h4>
                  <p className="text-sm text-gray-600">Operacional</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Arduino RFID:</span>
                  <span className="text-green-600 font-medium">Conectado</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Google Sheets:</span>
                  <span className="text-green-600 font-medium">
                    Sincronizado
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Última atualização:</span>
                  <span className="text-gray-600">Agora</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiUser className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Usuários Ativos
                  </h4>
                  <p className="text-sm text-gray-600">
                    {stats.activeUsers} online
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transações hoje:</span>
                  <span className="text-blue-600 font-medium">
                    {stats.todayTransactions}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Média diária:</span>
                  <span className="text-gray-600">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pico de uso:</span>
                  <span className="text-gray-600">09:00 - 11:00</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiDatabase className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Dados do Sistema
                  </h4>
                  <p className="text-sm text-gray-600">Backup automático</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Último backup:</span>
                  <span className="text-purple-600 font-medium">
                    Hoje 02:00
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Próximo backup:</span>
                  <span className="text-gray-600">Amanhã 02:00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Espaço usado:</span>
                  <span className="text-gray-600">23%</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Moderno */}
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
                  <p className="text-sm text-gray-600">
                    Sistema de Gerenciamento Inteligente
                  </p>
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
