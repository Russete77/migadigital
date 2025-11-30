# SOS Emocional 24h by Thiago Lins

![Status](https://img.shields.io/badge/STATUS-MVP_COMPLETO-success?style=for-the-badge)
![Mobile](https://img.shields.io/badge/MOBILE-FIRST-blue?style=for-the-badge)

**Seu escudo contra decisões que você vai se arrepender**

Micro-SaaS de intervenção emocional com IA que incorpora a personalidade e metodologia do coach Thiago Lins (@tl.marques). Ajuda mulheres a evitarem mensagens impulsivas, analisarem conversas e identificarem red flags em relacionamentos.

## Stack Técnica

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Shadcn/ui
- **Animações**: Framer Motion
- **Auth**: Clerk
- **Database**: Supabase (Postgres + RLS)
- **AI**: Anthropic Claude 3.5 Sonnet
- **Payments**: Stripe (PIX + Cartão)
- **Deploy**: Vercel

## Features Principais

### 🚨 Botão SOS de Emergência
- Botão gigante pulsante (280x280px)
- Breathing exercise de 10s
- Chat com IA (personalidade do Thiago Lins)
- Intervenção em tempo real

### 🔍 Analisador de Conversas
- Upload de prints (até 3)
- Análise de texto manual
- Claude Vision OCR
- Resultados detalhados com gráficos

### 📝 Diário Emocional
- Mood tracker (1-10)
- Seleção de emoções
- Timeline de evolução

### 🎧 Biblioteca de Áudios
- Categorias: Emergência, Autoestima, Estratégia, Mentalidade, Cura
- Player integrado

### 💎 Sistema de Assinaturas
- **Free**: 3 análises/mês, 5 usos SOS
- **Premium (R$ 39,90/mês)**: 15 análises, SOS ilimitado
- **Pro (R$ 69,90/mês)**: Tudo ilimitado + exclusividades

## Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env.local
cp .env.local.example .env.local

# 3. Executar schema SQL no Supabase
# (veja supabase-schema.sql)

# 4. Rodar localmente
npm run dev
```

Acesse: http://localhost:3000

## Documentação Completa

- **Deploy**: Veja `DEPLOYMENT_GUIDE.md`
- **Resumo**: Veja `PROJECT_SUMMARY.md`

## MVP 100% COMPLETO ✅

Todos os sprints (1, 2, 3 e 4) implementados:
- ✅ Autenticação (Clerk)
- ✅ Dashboard com SOS
- ✅ Chat de emergência com IA
- ✅ Analisador de conversas
- ✅ Resultados com gráficos
- ✅ Stripe integration (PIX + Cartão)
- ✅ Diário emocional
- ✅ Biblioteca de áudios
- ✅ Settings
- ✅ 100% Mobile-First

**41 arquivos TypeScript criados**

---

© 2024 SOS Emocional 24h - Desenvolvido com Claude Code by Anthropic
