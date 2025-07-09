import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

interface PlanningMetrics {
  newContacts: number;
  returnRate: number;
  schedulingRate: number;
  attendanceRate: number;
  conversionRate: number;
  averageTicket: number;
  monthlyCosts: number;
}

interface PlanningResults {
  revenue: number;
  sales: number;
  costPerCall: number;
  cac: number;
  sdrs: number;
  closers: number;
  returnedContacts: number;
  scheduledMeetings: number;
  attendedMeetings: number;
}

const Planning = () => {
  const [metrics, setMetrics] = useState<PlanningMetrics>({
    newContacts: 1000,
    returnRate: 30,
    schedulingRate: 10,
    attendanceRate: 50,
    conversionRate: 10,
    averageTicket: 1000,
    monthlyCosts: 5000,
  });

  const [results, setResults] = useState<PlanningResults>({
    revenue: 0,
    sales: 0,
    costPerCall: 0,
    cac: 0,
    sdrs: 0,
    closers: 0,
    returnedContacts: 0,
    scheduledMeetings: 0,
    attendedMeetings: 0,
  });

  const calculateResults = () => {
    // Calculate each step of the funnel
    const returnedContacts = (metrics.newContacts * metrics.returnRate) / 100;
    const scheduledMeetings = (returnedContacts * metrics.schedulingRate) / 100;
    const attendedMeetings = (scheduledMeetings * metrics.attendanceRate) / 100;
    const rawSales = (attendedMeetings * metrics.conversionRate) / 100;
    const sales = Math.round(rawSales); // Round the number of sales
    
    // Calculate financial metrics
    const revenue = sales * metrics.averageTicket;
    const costPerCall = attendedMeetings > 0 ? 100 : 0; // Fixed cost per call of R$100
    const cac = sales > 0 ? metrics.monthlyCosts / sales : 0; // Using rounded sales number
    
    // Calculate team requirements
    const sdrs = Math.ceil(metrics.newContacts / 1000); // 1000 contacts/month per SDR
    const closers = Math.ceil(attendedMeetings / 90); // 90 meetings/month per Closer

    setResults({
      revenue,
      sales,
      costPerCall,
      cac,
      sdrs,
      closers,
      returnedContacts,
      scheduledMeetings,
      attendedMeetings,
    });
  };

  useEffect(() => {
    calculateResults();
  }, [metrics]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetrics(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planejamento de Prospecção</h1>
        <p className="text-gray-500">Calcule suas métricas de prospecção ativa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-6 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Novos Contatos por Mês
              </label>
              <input
                type="range"
                name="newContacts"
                min="0"
                max="5000"
                step="100"
                value={metrics.newContacts}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-1 text-sm text-gray-500 text-right">{metrics.newContacts}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Retorno (%)
              </label>
              <input
                type="range"
                name="returnRate"
                min="0"
                max="100"
                step="1"
                value={metrics.returnRate}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-1 text-sm text-gray-500 text-right">{metrics.returnRate}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Agendamento (%)
              </label>
              <input
                type="range"
                name="schedulingRate"
                min="0"
                max="100"
                step="1"
                value={metrics.schedulingRate}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-1 text-sm text-gray-500 text-right">{metrics.schedulingRate}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Comparecimento (%)
              </label>
              <input
                type="range"
                name="attendanceRate"
                min="0"
                max="100"
                step="1"
                value={metrics.attendanceRate}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-1 text-sm text-gray-500 text-right">{metrics.attendanceRate}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Conversão (%)
              </label>
              <input
                type="range"
                name="conversionRate"
                min="0"
                max="100"
                step="1"
                value={metrics.conversionRate}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-1 text-sm text-gray-500 text-right">{metrics.conversionRate}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket Médio (R$)
              </label>
              <input
                type="range"
                name="averageTicket"
                min="0"
                max="10000"
                step="100"
                value={metrics.averageTicket}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-1 text-sm text-gray-500 text-right">R$ {metrics.averageTicket}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custos Mensais (R$)
              </label>
              <input
                type="range"
                name="monthlyCosts"
                min="0"
                max="50000"
                step="1000"
                value={metrics.monthlyCosts}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="mt-1 text-sm text-gray-500 text-right">R$ {metrics.monthlyCosts}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Resultados (Mensal)</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Faturamento</div>
              <div className="text-xl font-bold text-gray-900">
                R$ {results.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Contatos Retornados</div>
                <div className="text-xl font-bold text-gray-900">
                  {Math.round(results.returnedContacts)}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Reuniões Agendadas</div>
                <div className="text-xl font-bold text-gray-900">
                  {Math.round(results.scheduledMeetings)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Reuniões Realizadas</div>
                <div className="text-xl font-bold text-gray-900">
                  {Math.round(results.attendedMeetings)}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Vendas Fechadas</div>
                <div className="text-xl font-bold text-gray-900">
                  {results.sales}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Custo por Call Realizada</div>
              <div className="text-xl font-bold text-gray-900">
                R$ {results.costPerCall.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">CAC</div>
              <div className="text-xl font-bold text-gray-900">
                R$ {results.cac.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-500">Custos Mensais ÷ Número de Vendas</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Número de SDRs</div>
              <div className="text-xl font-bold text-gray-900">
                {results.sdrs}
              </div>
              <div className="text-xs text-gray-500">1.000 contatos/mês por SDR</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Número de Closers</div>
              <div className="text-xl font-bold text-gray-900">
                {results.closers}
              </div>
              <div className="text-xs text-gray-500">90 atendimentos/mês por Closer</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Planning;