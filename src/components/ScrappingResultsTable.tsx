import React, { useState } from 'react';

export function ScrappingResultsTable({ results }: { results: any[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instagram</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facebook</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avaliação</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {results.map((result, index) => {
            const instagram = result.instagram || result.completo?.instagrams?.[0] || '';
            const facebook = result.facebook || result.completo?.facebooks?.[0] || '';
            const avaliacao = result.pontuacao || result.completo?.totalScore || 'N/A';
            return (
              <React.Fragment key={result.id || index}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.title || result.company_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {instagram ? (
                      <a href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {facebook ? (
                      <a href={facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="text-yellow-500">★</span> <span className="ml-1">{avaliacao}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => toggleRow(index)}
                    >
                      {expandedRows.has(index) ? 'Ocultar' : 'Ver tudo'}
                    </button>
                  </td>
                </tr>
                {expandedRows.has(index) && (
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {Object.entries(result.completo || result).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium text-gray-700">{key}:</span>{' '}
                            {Array.isArray(value)
                              ? value.length > 0
                                ? value.map((v, i) => <span key={i} className="block">{typeof v === 'object' ? JSON.stringify(v) : v}</span>)
                                : 'N/A'
                              : typeof value === 'object' && value !== null
                                ? JSON.stringify(value)
                                : value?.toString() || 'N/A'}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 