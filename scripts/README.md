# Scripts - SOS Mulheres

Scripts Python para manutenção e evolução da IA.

## 🤖 Fine-tuning do BERT

O script `fine-tune-bert.py` permite retreinar o modelo BERT de análise de sentimento baseado no feedback real das usuárias.

### Pré-requisitos

```bash
# Instalar dependências Python
pip install -r requirements.txt
```

### Variáveis de Ambiente

Defina as seguintes variáveis:

```bash
# Supabase (obrigatório)
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."  # Service role key (admin)

# Hugging Face (opcional, apenas se quiser fazer upload)
export HUGGINGFACE_API_KEY="hf_xxx..."
```

### Uso

#### 1. Exportar dados de treinamento

Exporta feedbacks positivos (rating >= 4) dos últimos 90 dias:

```bash
python scripts/fine-tune-bert.py --export-only
```

Exportar dos últimos 30 dias:

```bash
python scripts/fine-tune-bert.py --export-only --days 30
```

Os dados serão salvos em `data/training/training_data_YYYYMMDD_HHMMSS.csv`

#### 2. Treinar modelo localmente

Treina o modelo usando os dados exportados:

```bash
python scripts/fine-tune-bert.py --train
```

Com epochs personalizados:

```bash
python scripts/fine-tune-bert.py --train --epochs 5
```

O modelo treinado será salvo em `models/bert-sentiment-finetuned/`

#### 3. Treinar e fazer upload para Hugging Face

```bash
python scripts/fine-tune-bert.py --upload
```

Isso irá:
1. Exportar dados
2. Treinar modelo
3. Fazer upload para `sosmulheres/bert-sentiment-ptbr` no Hugging Face Hub

### Pipeline Completo

Para rodar o pipeline completo (exportar → treinar → upload):

```bash
python scripts/fine-tune-bert.py --upload --days 90 --epochs 3
```

### Requisitos de Dados

**Mínimo recomendado**: 100 exemplos por emoção (700 exemplos no total)

Se você tiver menos dados, o script irá avisar e pedir confirmação para continuar.

### Estrutura de Diretórios

```
scripts/
├── fine-tune-bert.py          # Script principal
├── requirements.txt           # Dependências Python
└── README.md                  # Esta documentação

data/                          # Criado automaticamente
└── training/
    └── training_data_*.csv    # Dados exportados

models/                        # Criado automaticamente
└── bert-sentiment-finetuned/
    ├── pytorch_model.bin      # Modelo treinado
    ├── config.json            # Configuração
    ├── tokenizer_config.json  # Tokenizer
    └── metadata.json          # Metadata do treinamento
```

### Usando o Modelo Treinado

Depois de treinar, você pode usar o modelo localmente:

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Carregar modelo local
tokenizer = AutoTokenizer.from_pretrained('./models/bert-sentiment-finetuned')
model = AutoModelForSequenceClassification.from_pretrained('./models/bert-sentiment-finetuned')

# Ou usar do Hugging Face Hub (se fez upload)
tokenizer = AutoTokenizer.from_pretrained('sosmulheres/bert-sentiment-ptbr')
model = AutoModelForSequenceClassification.from_pretrained('sosmulheres/bert-sentiment-ptbr')
```

Para integrar no backend, atualize `sos-api/src/lib/nlp/sentiment-analyzer.ts`:

```typescript
// Trocar o modelo base
const response = await this.client.zeroShotClassification({
  model: 'sosmulheres/bert-sentiment-ptbr',  // ← Seu modelo fine-tuned
  inputs: text,
  // ...
});
```

### Automação (Recomendado)

Configure um cron job para retreinar mensalmente:

```bash
# Crontab (todo dia 1 do mês às 3h da manhã)
0 3 1 * * cd /path/to/sosmulheres && python scripts/fine-tune-bert.py --upload --days 30
```

Ou use GitHub Actions / Vercel Cron Jobs.

### Monitoramento

Após cada treinamento, o script gera `metadata.json` com:
- Data do treinamento
- Número de exemplos
- Loss de validação
- Distribuição de emoções

Use isso para monitorar a evolução da IA ao longo do tempo.

### Troubleshooting

**"Nenhum feedback encontrado"**
- Certifique-se de que há feedbacks com rating >= 4 no banco
- Verifique se a tabela `ai_feedback` está populada
- Tente aumentar o período: `--days 180`

**"Labels inválidas encontradas"**
- Algum feedback tem emoção não reconhecida
- O script irá filtrar automaticamente

**Out of Memory durante treinamento**
- Reduza `per_device_train_batch_size` no código (linha 175)
- Use CPU ao invés de GPU: remova `fp16=True`

**Erro ao fazer upload**
- Verifique `HUGGINGFACE_API_KEY`
- Certifique-se de ter permissão no repositório

---

## 📊 Outros Scripts (Futuros)

### `export-feedback-report.py`
Gera relatório PDF com análise de feedbacks.

### `migrate-legacy-data.py`
Migra dados legados para novo formato.

### `test-sentiment-accuracy.py`
Testa acurácia do modelo em dataset de teste.
