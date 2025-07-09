import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PreviewData {
  headers: string[];
  rows: string[][];
}

const ImportSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [settings, setSettings] = useState({
    responsible: 'Victor Peixoto',
    pipelineStage: 'prospected',
    hasHeader: true,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        let headers: string[] = [];
        let rows: string[][] = [];

        if (selectedFile.name.endsWith('.csv')) {
          const text = data as string;
          const lines = text.split('\n');
          headers = lines[0].split(',').map(header => header.trim());
          rows = lines.slice(1)
            .map(line => line.split(',').map(cell => cell.trim()))
            .filter(row => row.some(cell => cell));
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          headers = jsonData[0] as string[];
          rows = jsonData.slice(1) as string[][];
        }

        setPreviewData({ headers, rows });
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    };

    if (selectedFile.name.endsWith('.csv')) {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !previewData) return;
    setShowPreview(true);
  };

  const handleImport = async () => {
    if (!previewData || !user) return;
    
    setIsImporting(true);
    
    try {
      // Map the preview data to leads using the correct column names from the database schema
      const leads = previewData.rows.map(row => ({
        companyname: row[0],
        contactname: row[1],
        email: row[2],
        phone: row[3],
        jobtitle: row[4],
        status: settings.pipelineStage,
        priority: 'medium',
        createddate: Date.now(),
        responsible: settings.responsible,
        user_id: user.id // Add user_id to imported leads
      }));

      // Insert leads into the database
      const { data, error } = await supabase
        .from('leads')
        .insert(leads);

      if (error) throw error;

      // Navigate back to pipeline with success message
      navigate('/pipeline', { 
        state: { 
          message: `${leads.length} leads importados com sucesso!`,
          type: 'success'
        }
      });
    } catch (error) {
      console.error('Error importing leads:', error);
      // Handle error appropriately
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadExample = () => {
    const data = [
      ['Nome da Empresa', 'Nome do Contato', 'Email', 'Telefone', 'Cargo'],
      ['Empresa A', 'João Silva', 'joao@empresa-a.com', '(11) 99999-9999', 'Diretor'],
      ['Empresa B', 'Maria Santos', 'maria@empresa-b.com', '(11) 88888-8888', 'Gerente']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'exemplo_importacao.xlsx');
  };

  if (showPreview && previewData) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Revisar Dados</h1>
          <p className="text-gray-500">Verifique os dados antes de importar</p>
        </div>

        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {previewData.headers.map((header, i) => (
                    <th
                      key={i}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewData.rows.length > 5 && (
            <div className="mt-4 text-sm text-gray-500">
              Mostrando 5 de {previewData.rows.length} registros
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
            >
              Voltar
            </Button>
            <Button 
              onClick={handleImport}
              isLoading={isImporting}
            >
              {isImporting ? 'Importando...' : 'Importar Leads'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações de importação</h1>
        <p className="text-gray-500">Configure os parâmetros para importar seus leads</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleNext} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo (CSV ou XLSX):
                <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Escolher arquivo
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-500">
                  {file ? file.name : 'Nenhum arquivo escolhido'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pessoa responsável:
              </label>
              <select
                name="responsible"
                value={settings.responsible}
                onChange={handleSettingChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="Victor Peixoto">Victor Peixoto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etapa do Pipeline:
              </label>
              <select
                name="pipelineStage"
                value={settings.pipelineStage}
                onChange={handleSettingChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="prospected">Prospectado</option>
                <option value="contacted">Em Conversa</option>
                <option value="proposal">Proposta</option>
                <option value="closed">Fechado</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasHeader"
                name="hasHeader"
                checked={settings.hasHeader}
                onChange={handleSettingChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="hasHeader" className="ml-2 block text-sm text-gray-900">
                A primeira linha é um cabeçalho
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Exemplo de arquivo:
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadExample}
                >
                  Baixar
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/pipeline')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={!file}
              rightIcon={<ChevronRight size={16} />}
            >
              Próximo
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ImportSettings;