import React, { useState, useEffect } from 'react';
import { Search, Loader, AlertCircle, Save, Download, Crown, Clock, Check, History, Eye, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

interface ScrappingResult {
  title: string;
  phone: string;
  email: string;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  expires_at: string;
  subscription_plans: {
    name: string;
    type: string;
    extraction_limit: number;
    duration_days: number;
  };
}

interface ScrapingSession {
  id: string;
  business_type: string;
  state: string;
  city: string;
  neighborhood: string | null;
  limit_requested: number;
  results_count: number;
  status: 'completed' | 'failed' | 'partial';
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

interface ScrapingLead {
  id: string;
  business_type: string;
  state: string;
  city: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string | null;
  session_id: string | null;
}

const ScrappingMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessType, setBusinessType] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<ScrappingResult[]>([]);
  const [error, setError] = useState('');
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [scrapingSessions, setScrapingSessions] = useState<ScrapingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ScrapingSession | null>(null);
  const [sessionResults, setSessionResults] = useState<ScrapingLead[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSessionResults, setLoadingSessionResults] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserSubscription();
      fetchMonthlyUsage();
      fetchScrapingHistory();
    }
  }, [user]);

  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            type,
            extraction_limit,
            duration_days
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const subscription = data[0];
        
        // Check if subscription is expired
        if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
          // Mark as expired
          await supabase
            .from('user_subscriptions')
            .update({ status: 'expired' })
            .eq('id', subscription.id);
          
          setUserSubscription(null);
        } else {
          setUserSubscription(subscription);
        }
      } else {
        setUserSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setUserSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchMonthlyUsage = async () => {
    if (!user) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    try {
      const { data, error } = await supabase
        .from('scraping_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('month', startOfMonth.toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setMonthlyUsage(data[0].count ?? 0);
      } else {
        setMonthlyUsage(0);
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
      setMonthlyUsage(0);
    }
  };

  const fetchScrapingHistory = async () => {
    if (!user) return;

    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('scraping_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setScrapingSessions(data || []);
    } catch (err) {
      console.error('Error fetching scraping history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchSessionResults = async (sessionId: string) => {
    setLoadingSessionResults(true);
    try {
      const { data, error } = await supabase
        .from('scrapping_leads')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessionResults(data || []);
    } catch (err) {
      console.error('Error fetching session results:', err);
    } finally {
      setLoadingSessionResults(false);
    }
  };

  const updateUsageCount = async (count: number) => {
    if (!user) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    try {
      const safeCount = count ?? 0;

      const { data, error } = await supabase
        .from('scraping_usage')
        .upsert({
          user_id: user.id,
          month: startOfMonth.toISOString().split('T')[0],
          count: safeCount
        }, {
          onConflict: 'user_id,month'
        })
        .select()
        .single();

      if (!error && data) {
        setMonthlyUsage(data.count ?? 0);
      }
    } catch (err) {
      console.error('Error updating usage:', err);
    }
  };

  const saveScrapingResults = async (sessionId: string, results: ScrappingResult[]) => {
    if (!user || results.length === 0) return;

    try {
      const leads = results.map(result => ({
        business_type: businessType,
        state,
        city,
        neighborhood: neighborhood || null,
        company_name: result.title || null,
        phone: result.phone || null,
        email: result.email || null,
        address: null,
        created_by: user.id,
        session_id: sessionId
      }));

      const { error } = await supabase
        .from('scrapping_leads')
        .insert(leads);

      if (error) throw error;
    } catch (err) {
      console.error('Error saving scraping results:', err);
      throw err;
    }
  };

  const getExtractionLimit = () => {
    if (!userSubscription) return 0;
    return userSubscription.subscription_plans.extraction_limit;
  };

  const getRemainingExtractions = () => {
    const limit = getExtractionLimit();
    return Math.max(0, limit - monthlyUsage);
  };

  const isSubscriptionActive = () => {
    return userSubscription && userSubscription.status === 'active';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResults([]);

    if (!isSubscriptionActive()) {
      setError('Você precisa de uma assinatura ativa para extrair leads.');
      setIsLoading(false);
      return;
    }

    const remainingLimit = getRemainingExtractions();
    if (limit > remainingLimit) {
      setError(`Você só pode extrair mais ${remainingLimit} ${userSubscription?.subscription_plans.type === 'free' ? 'extrações de degustação' : 'extrações'} com seu plano atual.`);
      setIsLoading(false);
      return;
    }

    let sessionId: string | null = null;

    try {
      // Create scraping session
      const { data: sessionData, error: sessionError } = await supabase
        .from('scraping_sessions')
        .insert({
          user_id: user!.id,
          business_type: businessType,
          state,
          city,
          neighborhood: neighborhood || null,
          limit_requested: limit,
          results_count: 0,
          status: 'completed'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      sessionId = sessionData.id;

      const response = await fetch('https://n8n.turbopartners.com.br/webhook/89313ec0-2c00-40f9-ad5a-5f58933fdfb1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_type: businessType,
          state,
          city,
          limit
        }),
      });

      if (!response.ok) {
        if (response.status === 500) {
          throw new Error('O serviço de extração está temporariamente indisponível. Tente novamente em alguns minutos.');
        } else if (response.status === 404) {
          throw new Error('Serviço de extração não encontrado. Verifique a configuração.');
        } else {
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          throw new Error(`Erro no servidor (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      
      console.log('Parsed data:', data);
      
      if (data && typeof data === 'object') {
        let extractedResults: ScrappingResult[] = [];
        
        if (Array.isArray(data)) {
          extractedResults = data;
          console.log('Processing as direct array:', extractedResults);
        } else if (data.results && Array.isArray(data.results)) {
          extractedResults = data.results;
          console.log('Processing as results array:', extractedResults);
        } else if (data.data && Array.isArray(data.data)) {
          extractedResults = data.data;
          console.log('Processing as data array:', extractedResults);
        } else if (data.success === false || data.error) {
          const errorMessage = data.error || data.message || 'Erro desconhecido no webhook';
          throw new Error(`Erro no serviço: ${errorMessage}`);
        } else if (data.code === 0 && data.message) {
          throw new Error(`Erro no workflow: ${data.message}`);
        } else if (data.title || data.phone || data.email) {
          extractedResults = [data];
          console.log('Processing as single object:', extractedResults);
        } else {
          const arrayProperty = Object.values(data).find(value => Array.isArray(value));
          if (arrayProperty) {
            extractedResults = arrayProperty as ScrappingResult[];
            console.log('Processing as found array property:', extractedResults);
          } else {
            console.error('Unexpected response format:', data);
            throw new Error('Formato de resposta não reconhecido. Verifique a configuração do webhook.');
          }
        }

        if (!Array.isArray(extractedResults)) {
          throw new Error('Dados extraídos não estão no formato esperado');
        }

        const validResults = extractedResults.filter(result => 
          result && 
          typeof result === 'object' && 
          (result.title || result.phone || result.email)
        );

        console.log('Valid results found:', validResults.length, validResults);

        if (validResults.length === 0) {
          throw new Error('Nenhum resultado válido encontrado para os critérios especificados');
        }

        setResults(validResults);
        
        // Save results to database
        await saveScrapingResults(sessionId, validResults);
        
        // Update session with results count
        await supabase
          .from('scraping_sessions')
          .update({ 
            results_count: validResults.length,
            status: validResults.length > 0 ? 'completed' : 'partial'
          })
          .eq('id', sessionId);
        
        const newUsage = monthlyUsage + validResults.length;
        setMonthlyUsage(newUsage);
        await updateUsageCount(newUsage);
        
        // Refresh history
        await fetchScrapingHistory();
        
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err) {
      console.error('Error details:', err);
      
      // Update session with error status
      if (sessionId) {
        await supabase
          .from('scraping_sessions')
          .update({ 
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Erro desconhecido'
          })
          .eq('id', sessionId);
      }
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Erro de conexão: Não foi possível conectar ao serviço de extração. Verifique sua conexão com a internet.');
      } else if (err instanceof SyntaxError && err.message.includes('JSON')) {
        setError('Erro de formato: O servidor retornou dados em formato inválido. Tente novamente.');
      } else if (err instanceof Error) {
        setError(`${err.message}`);
      } else {
        setError('Ocorreu um erro inesperado ao extrair os dados. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToPipeline = async () => {
    setIsSaving(true);
    try {
      const leads = results.map(result => ({
        companyname: result.title || '',
        contactname: '',
        email: result.email || '',
        phone: result.phone || '',
        jobtitle: '',
        status: 'leads',
        priority: 'medium',
        createddate: Math.floor(Date.now() / 1000),
        responsible: (user?.user_metadata?.name as string) || 'Unknown',
        user_id: user?.id,
        owner_id: user?.id,
      }));

      const { error } = await supabase
        .from('leads')
        .insert(leads);

      if (error) throw error;

      navigate('/pipeline', { 
        state: { 
          message: `${leads.length} leads importados com sucesso na etapa LEADS!`,
          type: 'success'
        }
      });
    } catch (error) {
      setError('Erro ao salvar leads no pipeline.');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = results.map(result => ({
      'Empresa': result.title,
      'Telefone': result.phone,
      'Email': result.email
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');

    const date = new Date().toISOString().split('T')[0];
    const filename = `leads_${businessType.toLowerCase()}_${date}.csv`;

    XLSX.writeFile(wb, filename);
  };

  const handleViewSession = async (session: ScrapingSession) => {
    setSelectedSession(session);
    await fetchSessionResults(session.id);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão de scraping?')) return;

    try {
      const { error } = await supabase
        .from('scraping_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      await fetchScrapingHistory();
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setSessionResults([]);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Erro ao excluir sessão.');
    }
  };

  const handleUpgrade = () => {
    navigate('/register');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Falhou';
      case 'partial':
        return 'Parcial';
      default:
        return status;
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!isSubscriptionActive()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scrapping Map</h1>
          <p className="text-gray-500">Extraia leads de empresas por localização</p>
        </div>

        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Assinatura Necessária
            </h3>
            <p className="text-gray-600 mb-6">
              Você precisa de uma assinatura ativa para usar o Scrapping Map. 
              Escolha um plano para começar a extrair leads.
            </p>
            <Button onClick={handleUpgrade} leftIcon={<Crown size={16} />}>
              Ver Planos
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const remainingExtractions = getRemainingExtractions();
  const extractionLimit = getExtractionLimit();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scrapping Map</h1>
          <p className="text-gray-500">Extraia leads de empresas por localização</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          leftIcon={<History size={16} />}
        >
          {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
        </Button>
      </div>

      {showHistory && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Histórico de Scraping</h2>
          {loadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="animate-spin h-6 w-6 text-blue-600" />
            </div>
          ) : scrapingSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma sessão de scraping encontrada.</p>
          ) : (
            <div className="space-y-4">
              {scrapingSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{session.business_type}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {session.city}, {session.state}
                        {session.neighborhood && ` - ${session.neighborhood}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {session.results_count} de {session.limit_requested} resultados • {session.created_at ? formatDate(session.created_at) : 'N/A'}
                      </p>
                      {session.error_message && (
                        <p className="text-sm text-red-600 mt-1">{session.error_message}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSession(session)}
                        leftIcon={<Eye size={14} />}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSession(session.id)}
                        leftIcon={<Trash2 size={14} />}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {selectedSession && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Resultados da Sessão: {selectedSession.business_type}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSession(null);
                setSessionResults([]);
              }}
            >
              Fechar
            </Button>
          </div>
          {loadingSessionResults ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="animate-spin h-6 w-6 text-blue-600" />
            </div>
          ) : sessionResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum resultado encontrado para esta sessão.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessionResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.company_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.created_at ? formatDate(result.created_at) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Plano: {userSubscription?.subscription_plans.name}
                </h3>
                {userSubscription?.subscription_plans.type === 'free' && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {userSubscription?.subscription_plans.type === 'monthly' && (
                  <Crown className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {monthlyUsage} de {extractionLimit} extrações {userSubscription?.subscription_plans.type === 'free' ? 'de degustação' : 'por mês'}
              </p>
            </div>
            <div className="h-2 bg-gray-200 rounded-full w-32">
              <div 
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${extractionLimit > 0 ? (monthlyUsage / extractionLimit) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Área de Atuação"
            placeholder="Ex: Padaria, Restaurante, Academia..."
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            required
            fullWidth
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Estado"
              placeholder="Ex: SP"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              fullWidth
            />

            <Input
              label="Cidade"
              placeholder="Ex: São Paulo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              fullWidth
            />
          </div>

          <Input
            label="Bairro (Opcional)"
            placeholder="Ex: Vila Madalena"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade de leads (Disponível: {remainingExtractions})
            </label>
            <input
              type="range"
              min="1"
              max={Math.max(1, remainingExtractions)}
              value={Math.min(limit, remainingExtractions)}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={remainingExtractions <= 0}
            />
            <div className="mt-1 text-sm text-gray-500 text-right">{Math.min(limit, remainingExtractions)} leads</div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || remainingExtractions <= 0}
            fullWidth
            leftIcon={isLoading ? <Loader className="animate-spin" /> : <Search />}
          >
            {isLoading ? 'Extraindo dados...' : 'Iniciar Extração'}
          </Button>

          {isLoading && (
            <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="text-yellow-500 mr-2" size={20} />
              <p className="text-sm text-yellow-700">
                Por favor, não feche esta página enquanto os dados estão sendo extraídos, dependendo da quantidade o resultado por demorar alguns minutos.
              </p>
            </div>
          )}
        </form>

        {results.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Resultados ({results.length})</h2>
              <div className="flex space-x-2">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  leftIcon={<Download size={16} />}
                >
                  Exportar CSV
                </Button>
                <Button
                  onClick={handleSaveToPipeline}
                  disabled={isSaving}
                  leftIcon={isSaving ? <Loader className="animate-spin" /> : <Save />}
                  title="Salvar leads na etapa LEADS do pipeline"
                >
                  {isSaving ? 'Salvando...' : 'Salvar no Pipeline (LEADS)'}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.email || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ScrappingMap;