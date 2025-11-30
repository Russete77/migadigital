"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Calendar, Lock, Eye, Trash2, Download, Mail } from "lucide-react";

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-black text-3xl text-text-primary">
                Politica de Privacidade
              </h1>
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Calendar className="w-4 h-4" />
                <span>Ultima atualizacao: Novembro de 2024</span>
              </div>
            </div>
          </div>
          <p className="text-text-secondary">
            Esta Politica de Privacidade descreve como coletamos, usamos e protegemos suas informacoes
            pessoais em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018).
          </p>
        </div>

        {/* LGPD Rights Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-4 bg-bg-secondary rounded-xl border border-white/10">
            <Lock className="w-8 h-8 text-flame-primary mb-2" />
            <h3 className="font-bold text-text-primary mb-1">Seguranca</h3>
            <p className="text-xs text-text-tertiary">Seus dados sao criptografados e protegidos</p>
          </div>
          <div className="p-4 bg-bg-secondary rounded-xl border border-white/10">
            <Eye className="w-8 h-8 text-flame-primary mb-2" />
            <h3 className="font-bold text-text-primary mb-1">Transparencia</h3>
            <p className="text-xs text-text-tertiary">Saiba exatamente quais dados coletamos</p>
          </div>
          <div className="p-4 bg-bg-secondary rounded-xl border border-white/10">
            <Trash2 className="w-8 h-8 text-flame-primary mb-2" />
            <h3 className="font-bold text-text-primary mb-1">Exclusao</h3>
            <p className="text-xs text-text-tertiary">Solicite exclusao dos seus dados</p>
          </div>
          <div className="p-4 bg-bg-secondary rounded-xl border border-white/10">
            <Download className="w-8 h-8 text-flame-primary mb-2" />
            <h3 className="font-bold text-text-primary mb-1">Portabilidade</h3>
            <p className="text-xs text-text-tertiary">Exporte seus dados quando quiser</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">1. Controlador de Dados</h2>
            <p className="text-text-secondary leading-relaxed">
              A SOS Emocional 24h e a controladora dos dados pessoais coletados atraves desta plataforma.
              Para questoes relacionadas a privacidade, entre em contato atraves do email:
              <a href="mailto:privacidade@sosemocional.com" className="text-flame-primary ml-1 hover:underline">
                privacidade@sosemocional.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">2. Dados que Coletamos</h2>

            <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">2.1 Dados de Cadastro</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li>Email (para autenticacao e comunicacao)</li>
              <li>Nome (opcional, para personalizacao)</li>
              <li>Foto de perfil (opcional)</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">2.2 Dados de Uso</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li>Conversas com a IA de apoio emocional</li>
              <li>Entradas no diario emocional</li>
              <li>Interacoes na comunidade (anonimas)</li>
              <li>Historico de analises de conversas</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">2.3 Dados Tecnicos</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li>Endereco IP (para seguranca)</li>
              <li>Tipo de navegador e dispositivo</li>
              <li>Paginas visitadas e tempo de uso</li>
            </ul>

            <div className="mt-6 p-4 bg-flame-primary/10 border border-flame-primary/30 rounded-xl">
              <p className="text-sm text-flame-primary">
                <strong>DADOS SENSIVEIS:</strong> Por se tratar de uma plataforma de saude emocional,
                alguns dados coletados podem ser considerados sensiveis pela LGPD. Tratamos esses
                dados com o maximo cuidado e so os utilizamos para fornecer nossos servicos de apoio.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">3. Finalidade do Tratamento</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Utilizamos seus dados para:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li><strong>Fornecer o servico:</strong> Chat de apoio, diario, comunidade</li>
              <li><strong>Personalizar experiencia:</strong> Adaptar respostas da IA ao seu contexto</li>
              <li><strong>Melhorar o servico:</strong> Treinar modelos de IA com dados anonimizados</li>
              <li><strong>Seguranca:</strong> Prevenir fraudes e proteger usuarias</li>
              <li><strong>Comunicacao:</strong> Enviar atualizacoes importantes sobre a plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">4. Base Legal (LGPD)</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              O tratamento dos seus dados e realizado com base em:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li><strong>Consentimento (Art. 7, I):</strong> Ao criar sua conta e aceitar estes termos</li>
              <li><strong>Execucao de contrato (Art. 7, V):</strong> Para fornecer os servicos contratados</li>
              <li><strong>Interesse legitimo (Art. 7, IX):</strong> Para melhorar nossos servicos</li>
              <li><strong>Protecao da vida (Art. 7, VII):</strong> Em casos de crise identificados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Seus dados podem ser compartilhados com:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li><strong>Supabase:</strong> Armazenamento seguro de dados (servidores no Brasil/EUA)</li>
              <li><strong>Clerk:</strong> Servico de autenticacao (dados de login)</li>
              <li><strong>OpenAI:</strong> Processamento de conversas pela IA (dados anonimizados)</li>
              <li><strong>Stripe:</strong> Processamento de pagamentos (se aplicavel)</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              <strong>NAO vendemos seus dados</strong> para terceiros. Todos os parceiros citados seguem
              rigorosos padroes de seguranca e privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">6. Anonimato na Comunidade</h2>
            <p className="text-text-secondary leading-relaxed">
              As salas de chat da comunidade sao projetadas para garantir seu anonimato:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4 mt-4">
              <li>Voce e identificada apenas por uma cor aleatoria</li>
              <li>Seu nome real NUNCA e exibido nas salas</li>
              <li>Mensagens sao filtradas para bloquear dados de contato</li>
              <li>Outras usuarias nao podem ver seu perfil real</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">7. Seus Direitos (LGPD)</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Conforme a LGPD, voce tem direito a:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li><strong>Acesso:</strong> Saber quais dados temos sobre voce</li>
              <li><strong>Correcao:</strong> Corrigir dados incompletos ou incorretos</li>
              <li><strong>Exclusao:</strong> Solicitar a exclusao dos seus dados</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogacao:</strong> Retirar seu consentimento a qualquer momento</li>
              <li><strong>Informacao:</strong> Saber com quem seus dados sao compartilhados</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              Para exercer qualquer desses direitos, acesse as Configuracoes da sua conta ou entre em
              contato pelo email:
              <a href="mailto:privacidade@sosemocional.com" className="text-flame-primary ml-1 hover:underline">
                privacidade@sosemocional.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">8. Retencao de Dados</h2>
            <p className="text-text-secondary leading-relaxed">
              Mantemos seus dados enquanto sua conta estiver ativa. Apos solicitar exclusao:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4 mt-4">
              <li>Dados pessoais: excluidos em ate 30 dias</li>
              <li>Conversas e diario: excluidos imediatamente</li>
              <li>Mensagens na comunidade: anonimizadas (sem vinculo com sua conta)</li>
              <li>Logs de seguranca: mantidos por 6 meses (obrigacao legal)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">9. Seguranca</h2>
            <p className="text-text-secondary leading-relaxed">
              Implementamos medidas tecnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4 mt-4">
              <li>Criptografia de dados em transito (HTTPS/TLS)</li>
              <li>Criptografia de dados em repouso</li>
              <li>Autenticacao segura com Clerk</li>
              <li>Controle de acesso baseado em roles</li>
              <li>Monitoramento de atividades suspeitas</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">10. Cookies</h2>
            <p className="text-text-secondary leading-relaxed">
              Utilizamos cookies essenciais para o funcionamento da plataforma:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4 mt-4">
              <li><strong>Autenticacao:</strong> Manter voce logada</li>
              <li><strong>Preferencias:</strong> Lembrar suas configuracoes</li>
              <li><strong>Seguranca:</strong> Prevenir ataques</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              NAO utilizamos cookies de rastreamento ou publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">11. Menores de Idade</h2>
            <p className="text-text-secondary leading-relaxed">
              Nossa plataforma e destinada a maiores de 18 anos. Se voce tem menos de 18 anos,
              so pode usar a plataforma com autorizacao e supervisao de um responsavel legal.
              Nao coletamos intencionalmente dados de menores de 13 anos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">12. Alteracoes nesta Politica</h2>
            <p className="text-text-secondary leading-relaxed">
              Podemos atualizar esta Politica periodicamente. Alteracoes significativas serao
              comunicadas por email ou notificacao na plataforma. Recomendamos revisar esta
              pagina regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">13. Contato e DPO</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Para duvidas, solicitacoes ou reclamacoes sobre privacidade:
            </p>
            <div className="p-4 bg-bg-secondary rounded-xl border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-flame-primary" />
                <span className="text-text-primary font-bold">Encarregado de Dados (DPO)</span>
              </div>
              <p className="text-text-secondary">
                Email:
                <a href="mailto:dpo@sosemocional.com" className="text-flame-primary ml-1 hover:underline">
                  dpo@sosemocional.com
                </a>
              </p>
            </div>
            <p className="text-text-secondary leading-relaxed mt-4">
              Voce tambem pode registrar reclamacao junto a Autoridade Nacional de Protecao de Dados (ANPD):
              <a
                href="https://www.gov.br/anpd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-flame-primary ml-1 hover:underline"
              >
                www.gov.br/anpd
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/termos-de-uso"
              className="text-center px-6 py-3 bg-bg-secondary rounded-xl text-text-secondary hover:text-text-primary transition-colors"
            >
              Ver Termos de Uso
            </Link>
            <Link
              href="/"
              className="text-center px-6 py-3 bg-gradient-hero text-white rounded-xl hover:scale-105 transition-transform"
            >
              Voltar ao Inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
