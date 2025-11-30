'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AVATAR_COLORS = [
  { color: '#E94057', name: 'Flamingo' },
  { color: '#8A2BE2', name: 'Roxo' },
  { color: '#FF1493', name: 'Pink' },
  { color: '#00CED1', name: 'Turquesa' },
  { color: '#FFD700', name: 'Dourado' },
  { color: '#FF6B6B', name: 'Coral' },
  { color: '#4ECDC4', name: 'Menta' },
  { color: '#95E1D3', name: 'Água' },
];

export default function ChatSetupPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [avatarColor, setAvatarColor] = useState('#E94057');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nicknameError, setNicknameError] = useState('');

  // Aguardar Clerk carregar
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <Loader2 className="w-12 h-12 animate-spin text-flame-primary" />
      </div>
    );
  }

  if (!userId) {
    router.push('/sign-in');
    return null;
  }

  const checkNickname = async (nick: string) => {
    if (!nick || nick.length < 3) return;

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data } = await supabase
        .from('chat_profiles')
        .select('nickname')
        .eq('nickname', nick)
        .single();

      if (data) {
        setNicknameError('Esse apelido já está em uso');
        return false;
      } else {
        setNicknameError('');
        return true;
      }
    } catch (error) {
      return true; // Em caso de erro, permitir
    }
  };

  const handleNicknameChange = async (value: string) => {
    setNickname(value);
    if (value.length >= 3) {
      await checkNickname(value);
    } else {
      setNicknameError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações
      if (nickname.length < 3 || nickname.length > 20) {
        toast.error('Apelido deve ter entre 3 e 20 caracteres');
        setIsLoading(false);
        return;
      }

      // Verificar se nickname está disponível
      const isAvailable = await checkNickname(nickname);
      if (!isAvailable) {
        toast.error('Esse apelido já está em uso');
        setIsLoading(false);
        return;
      }

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Buscar profile do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', userId)
        .single();

      if (profileError || !profile) {
        toast.error('Erro ao buscar perfil do usuário');
        setIsLoading(false);
        return;
      }

      // Criar perfil de chat
      const { error: insertError } = await supabase
        .from('chat_profiles')
        .insert({
          user_id: profile.id,
          nickname: nickname.trim(),
          avatar_color: avatarColor,
          bio: bio.trim() || null,
        });

      if (insertError) {
        console.error('Error creating chat profile:', insertError);
        toast.error('Erro ao criar perfil. Tente novamente.');
        setIsLoading(false);
        return;
      }

      toast.success('Perfil criado com sucesso! 🎉');
      router.push('/dashboard/community');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao criar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display font-black text-4xl text-text-primary mb-3">
              Crie seu Perfil Anônimo
            </h1>
            <p className="text-text-secondary text-lg font-medium">
              Para proteger sua privacidade, você terá um apelido nas salas de chat
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 glass-elevated p-8 rounded-3xl">
            {/* Nickname */}
            <div>
              <label className="block mb-2 font-bold text-text-primary">
                Escolha seu apelido
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="Ex: FlordeLótus, GuerreiraSolitária..."
                className="w-full px-5 py-4 rounded-2xl border border-border-default focus:border-flame-primary bg-bg-elevated text-text-primary placeholder:text-text-tertiary font-medium transition-all focus:outline-none focus:ring-2 focus:ring-flame-primary/20"
                maxLength={20}
                required
              />
              {nicknameError && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  {nicknameError}
                </p>
              )}
              <p className="text-xs text-text-tertiary mt-2 font-medium">
                Esse será seu nome nas salas de chat (não seu nome real)
              </p>
            </div>

            {/* Cor do Avatar */}
            <div>
              <label className="block mb-3 font-bold text-text-primary">
                Cor do seu avatar
              </label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {AVATAR_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`relative w-full aspect-square rounded-2xl transition-all hover:scale-110 ${
                      avatarColor === color ? 'ring-4 ring-flame-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={name}
                  >
                    {avatarColor === color && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview do Avatar */}
            <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-2xl">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl"
                style={{ backgroundColor: avatarColor }}
              >
                {nickname ? nickname[0].toUpperCase() : '?'}
              </div>
              <div>
                <p className="text-sm text-text-tertiary font-medium">Preview</p>
                <p className="font-bold text-text-primary">
                  {nickname || 'Seu apelido'}
                </p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block mb-2 font-bold text-text-primary">
                Bio (opcional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você..."
                className="w-full px-5 py-4 rounded-2xl border border-border-default focus:border-flame-primary bg-bg-elevated text-text-primary placeholder:text-text-tertiary font-medium transition-all focus:outline-none focus:ring-2 focus:ring-flame-primary/20 resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-text-tertiary mt-2 font-medium">
                {bio.length}/200 caracteres
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || !nickname || nickname.length < 3 || !!nicknameError}
              className="w-full py-4 bg-gradient-hero text-white rounded-2xl font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Criando perfil...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Entrar na Comunidade
                </>
              )}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 p-5 bg-bg-secondary rounded-2xl">
            <p className="text-sm text-text-secondary font-medium leading-relaxed">
              💜 <strong>Sua segurança é nossa prioridade.</strong> Seu nome real e dados
              pessoais ficam protegidos. Nas salas de chat, apenas seu apelido será
              visível.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
