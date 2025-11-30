"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Calendar } from "lucide-react";

export default function TermosDeUsoPage() {
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
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-black text-3xl text-text-primary">
                Termos de Uso
              </h1>
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Calendar className="w-4 h-4" />
                <span>Ultima atualizacao: Novembro de 2024</span>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">1. Aceitacao dos Termos</h2>
            <p className="text-text-secondary leading-relaxed">
              Ao acessar e utilizar a plataforma SOS Emocional 24h ("Plataforma"), voce concorda com estes
              Termos de Uso. Se voce nao concordar com qualquer parte destes termos, por favor, nao utilize
              nossos servicos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">2. Descricao do Servico</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              A SOS Emocional 24h e uma plataforma de apoio emocional que oferece:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li>Chat de apoio emocional com inteligencia artificial</li>
              <li>Comunidade anonima para troca de experiencias</li>
              <li>Diario emocional para acompanhamento pessoal</li>
              <li>Analisador de conversas para identificar padroes</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              <strong className="text-flame-primary">IMPORTANTE:</strong> Esta plataforma NAO substitui acompanhamento
              profissional de psicologos, psiquiatras ou outros profissionais de saude mental. Em caso de
              emergencia, ligue para o CVV: 188.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">3. Elegibilidade</h2>
            <p className="text-text-secondary leading-relaxed">
              Para utilizar a Plataforma, voce deve ter no minimo 18 anos de idade ou contar com
              autorizacao de um responsavel legal. Ao criar uma conta, voce declara que as informacoes
              fornecidas sao verdadeiras.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">4. Conta do Usuario</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Ao criar uma conta, voce e responsavel por:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li>Manter a confidencialidade de suas credenciais</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Notificar imediatamente qualquer uso nao autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">5. Uso Adequado</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Ao utilizar nossa Plataforma, voce concorda em NAO:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li>Compartilhar dados pessoais de contato (telefone, email, redes sociais) na comunidade</li>
              <li>Assediar, ameacar ou intimidar outras usuarias</li>
              <li>Publicar conteudo ilegal, ofensivo ou prejudicial</li>
              <li>Promover produtos, servicos ou golpes</li>
              <li>Tentar acessar dados de outras usuarias</li>
              <li>Usar a plataforma para fins comerciais nao autorizados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">6. Privacidade e Anonimato</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Nos valorizamos sua privacidade e anonimato:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
              <li>Conversas na comunidade sao anonimas (identificadas apenas por cores)</li>
              <li>Seus dados pessoais sao protegidos conforme nossa Politica de Privacidade</li>
              <li>Voce pode solicitar exclusao de seus dados a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">7. Moderacao de Conteudo</h2>
            <p className="text-text-secondary leading-relaxed">
              Para proteger todas as usuarias, implementamos sistemas automaticos de moderacao que podem
              bloquear mensagens contendo informacoes pessoais (telefones, emails, etc.), palavras
              inapropriadas ou conteudo que viole estes termos. Mensagens podem ser denunciadas e
              revisadas por nossa equipe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">8. Limitacao de Responsabilidade</h2>
            <p className="text-text-secondary leading-relaxed">
              A Plataforma e fornecida "como esta". Nao garantimos que o servico sera ininterrupto ou
              livre de erros. Nao somos responsaveis por conselhos ou acoes tomadas com base nas
              interacoes na plataforma. Recomendamos sempre buscar ajuda profissional para questoes
              de saude mental.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">9. Propriedade Intelectual</h2>
            <p className="text-text-secondary leading-relaxed">
              Todo o conteudo da Plataforma, incluindo textos, graficos, logos, icones e software,
              e propriedade da SOS Emocional 24h ou de seus licenciadores e esta protegido por leis
              de direitos autorais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">10. Modificacoes nos Termos</h2>
            <p className="text-text-secondary leading-relaxed">
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alteracoes
              significativas serao comunicadas por email ou notificacao na Plataforma. O uso
              continuado apos as alteracoes constitui aceitacao dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">11. Encerramento de Conta</h2>
            <p className="text-text-secondary leading-relaxed">
              Voce pode encerrar sua conta a qualquer momento atraves das configuracoes. Nos
              reservamos o direito de suspender ou encerrar contas que violem estes Termos,
              sem aviso previo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">12. Lei Aplicavel</h2>
            <p className="text-text-secondary leading-relaxed">
              Estes Termos sao regidos pelas leis da Republica Federativa do Brasil. Qualquer
              disputa sera resolvida nos tribunais competentes do Brasil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary mb-4">13. Contato</h2>
            <p className="text-text-secondary leading-relaxed">
              Para duvidas sobre estes Termos de Uso, entre em contato atraves do email:
              <a href="mailto:contato@sosemocional.com" className="text-flame-primary ml-1 hover:underline">
                contato@sosemocional.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/politica-de-privacidade"
              className="text-center px-6 py-3 bg-bg-secondary rounded-xl text-text-secondary hover:text-text-primary transition-colors"
            >
              Ver Politica de Privacidade
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
