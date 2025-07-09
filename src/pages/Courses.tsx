import React, { useState } from 'react';
import { Search, Filter, Play, Clock, Users, Star, Plus } from 'lucide-react';
import Card, { CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  progress?: number;
  category: string;
  status: 'published' | 'draft';
}

const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Vendas B2B Avançado',
    description: 'Aprenda técnicas avançadas de vendas para o mercado B2B',
    thumbnail: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg',
    instructor: 'João Silva',
    duration: '8h 30min',
    students: 234,
    rating: 4.8,
    progress: 45,
    category: 'Vendas',
    status: 'published'
  },
  {
    id: '2',
    title: 'Prospecção de Leads',
    description: 'Estratégias eficientes para prospecção de leads qualificados',
    thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
    instructor: 'Maria Santos',
    duration: '6h 15min',
    students: 189,
    rating: 4.6,
    category: 'Marketing',
    status: 'published'
  },
  {
    id: '3',
    title: 'Negociação Empresarial',
    description: 'Técnicas de negociação para fechamento de grandes contratos',
    thumbnail: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg',
    instructor: 'Pedro Costa',
    duration: '10h 45min',
    students: 312,
    rating: 4.9,
    category: 'Negociação',
    status: 'published'
  }
];

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Vendas', 'Marketing', 'Negociação', 'Gestão'];

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-500">Aprimore suas habilidades com nossos cursos especializados</p>
        </div>
        <Button leftIcon={<Plus size={16} />}>Novo Curso</Button>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar cursos..."
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
          Filtrar
        </Button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? 'Todos' : category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} hover className="overflow-hidden">
            <div className="relative h-48">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              {course.progress && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="primary">{course.category}</Badge>
                {course.status === 'draft' && (
                  <Badge variant="warning">Rascunho</Badge>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {course.description}
              </p>

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Clock size={16} className="mr-1" />
                <span>{course.duration}</span>
                <Users size={16} className="ml-4 mr-1" />
                <span>{course.students} alunos</span>
                <Star size={16} className="ml-4 mr-1 text-yellow-400" />
                <span>{course.rating}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users size={16} className="text-gray-600" />
                  </div>
                  <span className="ml-2 text-sm text-gray-700">
                    {course.instructor}
                  </span>
                </div>
                <Button
                  size="sm"
                  leftIcon={<Play size={16} />}
                >
                  {course.progress ? 'Continuar' : 'Começar'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Courses;