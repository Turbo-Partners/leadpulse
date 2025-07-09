import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Heart, Pin, Calendar, Users, Trophy, Star, Plus, Filter, MoreHorizontal, Paperclip, Link, Video, BarChart3, Smile, Image, FileText, X, Check } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  expiresAt?: string;
  allowMultiple: boolean;
  createdBy: string;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  likes: number;
  comments: number;
  createdAt: string;
  hasLiked: boolean;
  poll?: Poll;
}

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  position: number;
}

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPost, setNewPost] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('general');
  const [showNewPost, setShowNewPost] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  
  // Poll creation state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('7');
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);

  const categories = [
    { id: 'all', label: 'Todos', icon: '📋' },
    { id: 'announcements', label: 'Anúncios', icon: '📢' },
    { id: 'business', label: 'Negócios & Estratégia', icon: '🧠' },
    { id: 'resources', label: 'Recursos', icon: '📚' },
    { id: 'training', label: 'Treinamentos', icon: '🎯' },
    { id: 'general', label: 'Geral', icon: '💬' },
  ];

  // Mock data
  useEffect(() => {
    setPosts([
      {
        id: '1',
        author: {
          name: 'Victor Peixoto',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
          role: 'Admin'
        },
        title: 'IMPORTANTE: Novas funcionalidades do LeadPulse',
        content: 'Pessoal, com base no feedback de vocês, implementamos algumas melhorias importantes na plataforma para tornar as coisas mais simples, intuitivas e fáceis de navegar. O objetivo é eliminar qualquer dúvida sobre como usar as funcionalidades...',
        category: 'announcements',
        isPinned: true,
        likes: 2100,
        comments: 2800,
        createdAt: '20 de Mai',
        hasLiked: false
      },
      {
        id: '2',
        author: {
          name: 'Maria Silva',
          avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
          role: 'Moderador'
        },
        title: 'Qual a melhor estratégia de prospecção?',
        content: 'Gostaria de saber a opinião de vocês sobre as melhores estratégias de prospecção que têm funcionado atualmente.',
        category: 'business',
        isPinned: false,
        likes: 45,
        comments: 12,
        createdAt: '2 horas atrás',
        hasLiked: false,
        poll: {
          id: 'poll-1',
          question: 'Qual estratégia de prospecção tem dado melhores resultados para você?',
          options: [
            { id: 'opt-1', text: 'Cold Email', votes: 45, voters: ['user1', 'user2'] },
            { id: 'opt-2', text: 'LinkedIn Outreach', votes: 67, voters: ['user3', 'user4'] },
            { id: 'opt-3', text: 'Cold Calling', votes: 23, voters: ['user5'] },
            { id: 'opt-4', text: 'Redes Sociais', votes: 34, voters: ['user6', 'user7'] }
          ],
          totalVotes: 169,
          expiresAt: '2024-01-20T23:59:59Z',
          allowMultiple: false,
          createdBy: 'maria-silva'
        }
      },
      {
        id: '3',
        author: {
          name: 'João Santos',
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
          role: 'Membro'
        },
        title: 'Procurando por Recursos de Prospecção? - LEIA-ME',
        content: 'Nossa comunidade é onde mantemos tanto os recursos de prospecção que o Victor compartilha quanto materiais exclusivos da comunidade. Aqui você encontrará templates, scripts e muito mais...',
        category: 'resources',
        isPinned: false,
        likes: 1200,
        comments: 45,
        createdAt: '24 de Mar',
        hasLiked: false
      }
    ]);

    setLeaderboard([
      { id: '1', name: 'Ivonne Teoh', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg', points: 717, position: 1 },
      { id: '2', name: 'Sayyed Ali', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', points: 593, position: 2 },
      { id: '3', name: 'Kate Lawson', avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg', points: 415, position: 3 },
      { id: '4', name: 'Paul Foster', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg', points: 322, position: 4 }
    ]);
  }, []);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            likes: post.hasLiked ? post.likes - 1 : post.likes + 1,
            hasLiked: !post.hasLiked 
          }
        : post
    ));
  };

  const handleVote = (postId: string, optionId: string) => {
    const userId = user?.id || 'current-user';
    
    setPosts(posts.map(post => {
      if (post.id === postId && post.poll) {
        const poll = post.poll;
        const hasVoted = poll.options.some(opt => opt.voters.includes(userId));
        
        // Se não permite múltiplos votos e já votou, remove voto anterior
        if (!poll.allowMultiple && hasVoted) {
          const updatedOptions = poll.options.map(opt => ({
            ...opt,
            votes: opt.voters.includes(userId) ? opt.votes - 1 : opt.votes,
            voters: opt.voters.filter(voter => voter !== userId)
          }));
          
          // Adiciona novo voto
          const finalOptions = updatedOptions.map(opt => 
            opt.id === optionId 
              ? { ...opt, votes: opt.votes + 1, voters: [...opt.voters, userId] }
              : opt
          );
          
          return {
            ...post,
            poll: {
              ...poll,
              options: finalOptions,
              totalVotes: finalOptions.reduce((sum, opt) => sum + opt.votes, 0)
            }
          };
        }
        
        // Se permite múltiplos votos ou ainda não votou
        const targetOption = poll.options.find(opt => opt.id === optionId);
        if (targetOption && targetOption.voters.includes(userId)) {
          // Remove voto
          const updatedOptions = poll.options.map(opt => 
            opt.id === optionId 
              ? { ...opt, votes: opt.votes - 1, voters: opt.voters.filter(voter => voter !== userId) }
              : opt
          );
          
          return {
            ...post,
            poll: {
              ...poll,
              options: updatedOptions,
              totalVotes: updatedOptions.reduce((sum, opt) => sum + opt.votes, 0)
            }
          };
        } else {
          // Adiciona voto
          const updatedOptions = poll.options.map(opt => 
            opt.id === optionId 
              ? { ...opt, votes: opt.votes + 1, voters: [...opt.voters, userId] }
              : opt
          );
          
          return {
            ...post,
            poll: {
              ...poll,
              options: updatedOptions,
              totalVotes: updatedOptions.reduce((sum, opt) => sum + opt.votes, 0)
            }
          };
        }
      }
      return post;
    }));
  };

  const handleNewPost = () => {
    if (!newPost.trim() && !newPostTitle.trim()) return;
    
    const post: Post = {
      id: Date.now().toString(),
      author: {
        name: user?.user_metadata?.name || 'Usuário',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
        role: 'Membro'
      },
      title: newPostTitle || (newPost.length > 50 ? newPost.substring(0, 50) + '...' : newPost),
      content: newPost,
      category: newPostCategory,
      isPinned: false,
      likes: 0,
      comments: 0,
      createdAt: 'Agora',
      hasLiked: false
    };

    setPosts([post, ...posts]);
    setNewPost('');
    setNewPostTitle('');
    setNewPostCategory('general');
    setShowNewPost(false);
  };

  const handleCreatePoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(opt => opt.trim()).length < 2) return;

    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question: pollQuestion,
      options: pollOptions
        .filter(opt => opt.trim())
        .map((opt, index) => ({
          id: `opt-${Date.now()}-${index}`,
          text: opt.trim(),
          votes: 0,
          voters: []
        })),
      totalVotes: 0,
      expiresAt: pollDuration !== 'never' ? 
        new Date(Date.now() + parseInt(pollDuration) * 24 * 60 * 60 * 1000).toISOString() : 
        undefined,
      allowMultiple: allowMultipleVotes,
      createdBy: user?.id || 'current-user'
    };

    const post: Post = {
      id: Date.now().toString(),
      author: {
        name: user?.user_metadata?.name || 'Usuário',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
        role: 'Membro'
      },
      title: pollQuestion,
      content: newPost || 'Enquete criada pela comunidade',
      category: newPostCategory,
      isPinned: false,
      likes: 0,
      comments: 0,
      createdAt: 'Agora',
      hasLiked: false,
      poll
    };

    setPosts([post, ...posts]);
    
    // Reset form
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollDuration('7');
    setAllowMultipleVotes(false);
    setNewPost('');
    setNewPostTitle('');
    setNewPostCategory('general');
    setShowPollModal(false);
    setShowNewPost(false);
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon || '💬';
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.label || 'Geral';
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirada';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  const PollComponent = ({ poll, postId }: { poll: Poll; postId: string }) => {
    const userId = user?.id || 'current-user';
    const hasVoted = poll.options.some(opt => opt.voters.includes(userId));
    const userVotes = poll.options.filter(opt => opt.voters.includes(userId));

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="text-blue-500 dark:text-blue-400" size={20} />
            <h4 className="font-medium text-gray-900 dark:text-white">Enquete</h4>
          </div>
          {poll.expiresAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeRemaining(poll.expiresAt)}
            </span>
          )}
        </div>

        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          {poll.question}
        </h5>

        <div className="space-y-3">
          {poll.options.map((option) => {
            const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
            const isSelected = option.voters.includes(userId);

            return (
              <button
                key={option.id}
                onClick={() => handleVote(postId, option.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.text}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {option.votes} votos
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isSelected ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{poll.totalVotes} votos totais</span>
          {poll.allowMultiple && (
            <span className="text-xs">Múltiplas escolhas permitidas</span>
          )}
          {hasVoted && (
            <span className="text-xs text-green-600 dark:text-green-400">
              ✓ Você votou {userVotes.length > 1 ? `em ${userVotes.length} opções` : ''}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comunidade LeadPulse</h1>
        <p className="text-gray-500 dark:text-gray-400">Conecte-se, aprenda e cresça junto com nossa comunidade</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar na comunidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={16} className="text-gray-400 dark:text-gray-500" />}
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

          {/* New Post */}
          <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {!showNewPost ? (
              <button
                onClick={() => setShowNewPost(true)}
                className="w-full flex items-center space-x-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 p-3 rounded-lg transition-colors"
              >
                <Avatar 
                  name={user?.user_metadata?.name || 'Usuário'} 
                  size="md" 
                />
                <div className="flex-1 text-gray-500 dark:text-gray-400 text-base">
                  O que você gostaria de compartilhar?
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                  <Avatar 
                    name={user?.user_metadata?.name || 'Usuário'} 
                    size="md" 
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.user_metadata?.name || 'Usuário'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      postando em <span className="font-medium">Comunidade LeadPulse</span>
                    </p>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Escreva algo..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                {/* Content Input */}
                <div>
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Compartilhe seus pensamentos, experiências ou perguntas com a comunidade..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows={6}
                  />
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    {/* Attachment Options */}
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Paperclip size={18} />
                    </button>
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Link size={18} />
                    </button>
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Video size={18} />
                    </button>
                    <button 
                      onClick={() => setShowPollModal(true)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Criar enquete"
                    >
                      <BarChart3 size={18} />
                    </button>
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Smile size={18} />
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">GIF</span>

                    {/* Category Selector */}
                    <div className="relative">
                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                      >
                        <option value="">Selecionar categoria</option>
                        {categories.filter(cat => cat.id !== 'all').map(category => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewPost(false);
                        setNewPost('');
                        setNewPostTitle('');
                        setNewPostCategory('general');
                      }}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      CANCELAR
                    </Button>
                    <Button
                      onClick={handleNewPost}
                      disabled={!newPost.trim() && !newPostTitle.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      PUBLICAR
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Event Banner */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Q&A com Victor Peixoto acontece em 5 dias
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Não perca a oportunidade de tirar suas dúvidas diretamente com o fundador
                </p>
              </div>
            </div>
          </Card>

          {/* Category Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className={`p-6 ${post.isPinned ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <Avatar 
                      src={post.author.avatar} 
                      name={post.author.name} 
                      size="md" 
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{post.author.name}</h3>
                        {post.author.role === 'Admin' && (
                          <Star className="text-yellow-500" size={16} />
                        )}
                        {post.author.role && (
                          <Badge variant={post.author.role === 'Admin' ? 'warning' : 'info'}>
                            {post.author.role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{post.createdAt}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <span>{getCategoryIcon(post.category)}</span>
                          <span>{getCategoryLabel(post.category)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {post.isPinned && (
                      <Pin className="text-yellow-600 dark:text-yellow-400" size={16} />
                    )}
                    <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Poll Component */}
                {post.poll && (
                  <PollComponent poll={post.poll} postId={post.id} />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 text-sm ${
                        post.hasLiked ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <Heart 
                        size={16} 
                        className={post.hasLiked ? 'fill-current' : ''} 
                      />
                      <span>{post.likes.toLocaleString()}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                      <MessageSquare size={16} />
                      <span>{post.comments.toLocaleString()}</span>
                    </button>
                  </div>
                  
                  {post.comments > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <Avatar
                            key={i}
                            name={`User ${i}`}
                            size="xs"
                            className="border-2 border-white dark:border-gray-800"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        Novo comentário há 39min
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Community Info */}
          <Card className="p-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            <div className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl font-bold">LP</div>
              </div>
              <h3 className="text-xl font-bold mb-2">Comunidade LeadPulse</h3>
              <p className="text-blue-100 text-sm mb-4">
                leadpulse.com/comunidade
              </p>
              
              <div className="space-y-2 mb-6">
                <p className="text-sm">Acelere Seus Resultados em Vendas</p>
                <p className="text-xs text-blue-100">Criado por Victor Peixoto</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">195.2k</div>
                  <div className="text-xs text-blue-100">Membros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">750</div>
                  <div className="text-xs text-blue-100">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-xs text-blue-100">Admins</div>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Avatar
                      key={i}
                      name={`Member ${i}`}
                      size="sm"
                      className="border-2 border-white"
                    />
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30"
                leftIcon={<Users size={16} />}
              >
                CONVIDAR PESSOAS
              </Button>
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Trophy className="text-yellow-500" size={20} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leaderboard (30 dias)</h3>
            </div>
            
            <div className="space-y-3">
              {leaderboard.map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {user.position <= 3 ? (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        user.position === 1 ? 'bg-yellow-500' :
                        user.position === 2 ? 'bg-gray-400' :
                        'bg-orange-500'
                      }`}>
                        {user.position}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 font-medium">{user.position}</span>
                    )}
                  </div>
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">+{user.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowPollModal(false)}></div>
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="text-blue-500 dark:text-blue-400" size={24} />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">Criar Enquete</h3>
                </div>
                <button 
                  onClick={() => setShowPollModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Poll Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pergunta da Enquete *
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ex: Qual a melhor estratégia de prospecção?"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                {/* Poll Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opções de Resposta *
                  </label>
                  <div className="space-y-3">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            placeholder={`Opção ${index + 1}`}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => removePollOption(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {pollOptions.length < 6 && (
                      <button
                        onClick={addPollOption}
                        className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Plus size={16} />
                        <span>Adicionar opção</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Poll Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duração da Enquete
                    </label>
                    <select
                      value={pollDuration}
                      onChange={(e) => setPollDuration(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="1">1 dia</option>
                      <option value="3">3 dias</option>
                      <option value="7">7 dias</option>
                      <option value="14">14 dias</option>
                      <option value="30">30 dias</option>
                      <option value="never">Sem expiração</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="allowMultiple"
                      checked={allowMultipleVotes}
                      onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="allowMultiple" className="text-sm text-gray-700 dark:text-gray-300">
                      Permitir múltiplas escolhas
                    </label>
                  </div>
                </div>

                {/* Preview */}
                {pollQuestion && pollOptions.filter(opt => opt.trim()).length >= 2 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Prévia da Enquete
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {pollQuestion}
                      </p>
                      {pollOptions.filter(opt => opt.trim()).map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-600 rounded border">
                          <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-500"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="outline"
                  onClick={() => setShowPollModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreatePoll}
                  disabled={!pollQuestion.trim() || pollOptions.filter(opt => opt.trim()).length < 2}
                  leftIcon={<BarChart3 size={16} />}
                >
                  Criar Enquete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;