'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Brain,
  Shield,
  Bell,
  Database,
  Key,
  Globe,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Zap,
} from 'lucide-react';

interface SettingsData {
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPromptVersion: string;
    humanizationEnabled: boolean;
    ragEnabled: boolean;
  };
  moderation: {
    autoFlagCrisis: boolean;
    crisisKeywords: string[];
    minSeverityForAlert: string;
  };
  notifications: {
    emailOnCrisis: boolean;
    emailRecipients: string[];
    dailyReportEnabled: boolean;
  };
  general: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxConversationsPerUser: number;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'moderation' | 'notifications' | 'general'>('ai');

  const defaultSettings: SettingsData = {
    ai: {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2048,
      systemPromptVersion: 'v2.0',
      humanizationEnabled: true,
      ragEnabled: true,
    },
    moderation: {
      autoFlagCrisis: true,
      crisisKeywords: ['suicidio', 'me matar', 'acabar com tudo', 'nao aguento mais'],
      minSeverityForAlert: 'high',
    },
    notifications: {
      emailOnCrisis: true,
      emailRecipients: [],
      dailyReportEnabled: false,
    },
    general: {
      maintenanceMode: false,
      registrationEnabled: true,
      maxConversationsPerUser: 100,
    },
  };

  useEffect(() => {
    // Em producao, buscaria do backend
    setSettings(defaultSettings);
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Em producao, salvaria no backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotification({ type: 'success', message: 'Configuracoes salvas com sucesso!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao salvar configuracoes' });
    }
    setSaving(false);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateSetting = <K extends keyof SettingsData>(
    category: K,
    key: keyof SettingsData[K],
    value: any
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    });
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-flame-primary" />
      </div>
    );
  }

  const tabs = [
    { id: 'ai', label: 'IA & RAG', icon: Brain },
    { id: 'moderation', label: 'Moderacao', icon: Shield },
    { id: 'notifications', label: 'Notificacoes', icon: Bell },
    { id: 'general', label: 'Geral', icon: Sliders },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Settings className="w-8 h-8 text-flame-primary" />
            Configuracoes
          </h1>
          <p className="mt-2 text-text-secondary">
            Configure parametros do sistema e da IA
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-flame-primary text-white hover:bg-flame-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-flame-primary text-white'
                : 'text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-bg-secondary rounded-xl border border-border-default p-6">
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Brain className="w-5 h-5 text-flame-primary" />
              Configuracoes da IA
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Modelo
                </label>
                <select
                  value={settings.ai.model}
                  onChange={(e) => updateSetting('ai', 'model', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-primary text-text-primary"
                >
                  <option value="gpt-4o">GPT-4o (Recomendado)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Temperatura ({settings.ai.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.ai.temperature}
                  onChange={(e) => updateSetting('ai', 'temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-text-tertiary mt-1">
                  <span>Mais preciso</span>
                  <span>Mais criativo</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={settings.ai.maxTokens}
                  onChange={(e) => updateSetting('ai', 'maxTokens', parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-primary text-text-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Versao do System Prompt
                </label>
                <input
                  type="text"
                  value={settings.ai.systemPromptVersion}
                  onChange={(e) => updateSetting('ai', 'systemPromptVersion', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-primary text-text-primary"
                  disabled
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-border-default">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-text-primary font-medium">Humanizacao Ativa</span>
                  <p className="text-sm text-text-tertiary">Usa BERT para tornar respostas mais naturais</p>
                </div>
                <button
                  onClick={() => updateSetting('ai', 'humanizationEnabled', !settings.ai.humanizationEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.ai.humanizationEnabled ? 'bg-flame-primary' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      settings.ai.humanizationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-text-primary font-medium">RAG (Base de Conhecimento)</span>
                  <p className="text-sm text-text-tertiary">Usa embeddings para enriquecer respostas</p>
                </div>
                <button
                  onClick={() => updateSetting('ai', 'ragEnabled', !settings.ai.ragEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.ai.ragEnabled ? 'bg-flame-primary' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      settings.ai.ragEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Shield className="w-5 h-5 text-flame-primary" />
              Moderacao Automatica
            </h3>

            <label className="flex items-center justify-between">
              <div>
                <span className="text-text-primary font-medium">Auto-flag de Crises</span>
                <p className="text-sm text-text-tertiary">Detecta automaticamente mensagens de crise</p>
              </div>
              <button
                onClick={() => updateSetting('moderation', 'autoFlagCrisis', !settings.moderation.autoFlagCrisis)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.moderation.autoFlagCrisis ? 'bg-flame-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.moderation.autoFlagCrisis ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Severidade Minima para Alerta
              </label>
              <select
                value={settings.moderation.minSeverityForAlert}
                onChange={(e) => updateSetting('moderation', 'minSeverityForAlert', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-primary text-text-primary"
              >
                <option value="low">Baixa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Critica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Palavras-chave de Crise
              </label>
              <textarea
                value={settings.moderation.crisisKeywords.join('\n')}
                onChange={(e) => updateSetting('moderation', 'crisisKeywords', e.target.value.split('\n').filter(k => k.trim()))}
                rows={5}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-primary text-text-primary font-mono text-sm"
                placeholder="Uma palavra/frase por linha"
              />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Bell className="w-5 h-5 text-flame-primary" />
              Notificacoes
            </h3>

            <label className="flex items-center justify-between">
              <div>
                <span className="text-text-primary font-medium">Email em Crises</span>
                <p className="text-sm text-text-tertiary">Envia email quando uma crise e detectada</p>
              </div>
              <button
                onClick={() => updateSetting('notifications', 'emailOnCrisis', !settings.notifications.emailOnCrisis)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.emailOnCrisis ? 'bg-flame-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.notifications.emailOnCrisis ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <span className="text-text-primary font-medium">Relatorio Diario</span>
                <p className="text-sm text-text-tertiary">Envia resumo diario por email</p>
              </div>
              <button
                onClick={() => updateSetting('notifications', 'dailyReportEnabled', !settings.notifications.dailyReportEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.dailyReportEnabled ? 'bg-flame-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.notifications.dailyReportEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Emails para Notificacao
              </label>
              <textarea
                value={settings.notifications.emailRecipients.join('\n')}
                onChange={(e) => updateSetting('notifications', 'emailRecipients', e.target.value.split('\n').filter(k => k.trim()))}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-primary text-text-primary font-mono text-sm"
                placeholder="Um email por linha"
              />
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Sliders className="w-5 h-5 text-flame-primary" />
              Configuracoes Gerais
            </h3>

            <label className="flex items-center justify-between">
              <div>
                <span className="text-text-primary font-medium">Modo Manutencao</span>
                <p className="text-sm text-text-tertiary">Desabilita acesso de usuarios</p>
              </div>
              <button
                onClick={() => updateSetting('general', 'maintenanceMode', !settings.general.maintenanceMode)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.general.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.general.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <span className="text-text-primary font-medium">Cadastro Habilitado</span>
                <p className="text-sm text-text-tertiary">Permite novas usuarias se cadastrarem</p>
              </div>
              <button
                onClick={() => updateSetting('general', 'registrationEnabled', !settings.general.registrationEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.general.registrationEnabled ? 'bg-flame-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.general.registrationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Max Conversas por Usuaria
              </label>
              <input
                type="number"
                value={settings.general.maxConversationsPerUser}
                onChange={(e) => updateSetting('general', 'maxConversationsPerUser', parseInt(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-bg-primary text-text-primary"
              />
            </div>

            {/* System Info */}
            <div className="pt-6 border-t border-border-default">
              <h4 className="text-sm font-medium text-text-primary mb-4">Informacoes do Sistema</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-secondary">Supabase</span>
                  <span className="text-green-600">Conectado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-secondary">OpenAI</span>
                  <span className="text-green-600">Configurado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-secondary">BERT API</span>
                  <span className="text-green-600">Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-secondary">Clerk</span>
                  <span className="text-green-600">Ativo</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
