import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import CadenceCard from '../components/cadences/CadenceCard';
import CadenceSchedule from '../components/cadences/CadenceSchedule';
import Card, { CardHeader } from '../components/ui/Card';
import { mockCadences } from '../mockData';
import { Cadence } from '../types';

const Cadences = () => {
  const [cadences, setCadences] = useState<Cadence[]>(mockCadences);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCadence, setSelectedCadence] = useState<Cadence | null>(null);

  const filteredCadences = cadences.filter(cadence => 
    cadence.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditCadence = (id: string) => {
    const cadence = cadences.find(c => c.id === id);
    if (cadence) {
      setSelectedCadence(cadence);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Cadences</h1>
          <p className="text-gray-500">Create and manage automated email sequences</p>
        </div>
        <Button leftIcon={<Plus size={16} />}>New Cadence</Button>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search cadences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} className="text-gray-400" />}
            fullWidth
          />
        </div>
        <Button 
          variant="outline" 
          leftIcon={<Filter size={16} />}
        >
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCadences.map((cadence) => (
          <CadenceCard 
            key={cadence.id} 
            cadence={cadence} 
            onEdit={handleEditCadence}
          />
        ))}
      </div>

      {selectedCadence && (
        <Card>
          <CardHeader 
            title={selectedCadence.name} 
            subtitle={`${selectedCadence.steps.length} steps over ${selectedCadence.duration} days`}
            action={
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedCadence(null)}
              >
                Close
              </Button>
            }
          />
          
          <div className="mt-4">
            <CadenceSchedule steps={selectedCadence.steps} />
          </div>
        </Card>
      )}
    </div>
  );
};

export default Cadences;