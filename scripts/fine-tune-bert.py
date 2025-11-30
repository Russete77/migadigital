#!/usr/bin/env python3
"""
Fine-tuning script para BERT PT-BR
Treina o modelo baseado em feedback de usuárias

Dependências:
pip install transformers datasets torch supabase pandas scikit-learn huggingface-hub

Uso:
python scripts/fine-tune-bert.py --export-only  # Apenas exportar dados
python scripts/fine-tune-bert.py --train         # Treinar modelo
python scripts/fine-tune-bert.py --upload        # Treinar e fazer upload para HF
"""

import os
import json
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

# ML imports
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
)
from datasets import Dataset
import pandas as pd
from sklearn.model_selection import train_test_split

# Supabase
from supabase import create_client, Client

# Hugging Face Hub
from huggingface_hub import HfApi, login

# ===== CONFIG =====
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Service role para admin
HF_TOKEN = os.getenv('HUGGINGFACE_API_KEY')

BASE_MODEL = "MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7"
OUTPUT_DIR = "./models/bert-sentiment-finetuned"
DATA_DIR = "./data/training"

# Labels de emoção
EMOTION_LABELS = [
    'desesperada',
    'triste',
    'ansiosa',
    'raiva',
    'feliz',
    'esperancosa',
    'confusa'
]

LABEL2ID = {label: i for i, label in enumerate(EMOTION_LABELS)}
ID2LABEL = {i: label for i, label in enumerate(EMOTION_LABELS)}


class BERTFineTuner:
    def __init__(self):
        """Inicializa o fine-tuner"""
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente")

        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

        # Criar diretórios
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        os.makedirs(DATA_DIR, exist_ok=True)

    def export_training_data(self, days: int = 90) -> pd.DataFrame:
        """
        Exporta dados de treinamento do Supabase

        Critérios:
        - Apenas feedbacks com rating >= 4 (respostas boas)
        - Últimos N dias
        - Apenas logs com sentiment_emotion definido
        """
        print(f"📊 Exportando dados dos últimos {days} dias...")

        # Calcular data de corte
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

        # Buscar feedbacks positivos
        response = self.supabase.table('ai_feedback') \
            .select('*, ai_response_logs(user_message, sentiment_emotion, sentiment_intensity)') \
            .gte('created_at', cutoff_date) \
            .gte('rating', 4) \
            .execute()

        feedbacks = response.data

        if not feedbacks:
            print("⚠️  Nenhum feedback encontrado!")
            return pd.DataFrame()

        # Transformar em DataFrame
        training_data = []
        for feedback in feedbacks:
            log = feedback.get('ai_response_logs')
            if not log or not log.get('user_message') or not log.get('sentiment_emotion'):
                continue

            training_data.append({
                'text': log['user_message'],
                'label': log['sentiment_emotion'],
                'intensity': log.get('sentiment_intensity', 0.5),
                'rating': feedback['rating'],
                'feedback_date': feedback['created_at'],
            })

        df = pd.DataFrame(training_data)

        # Salvar CSV
        csv_path = os.path.join(DATA_DIR, f'training_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        df.to_csv(csv_path, index=False)

        print(f"✅ {len(df)} exemplos exportados para {csv_path}")
        print(f"\n📈 Distribuição de emoções:")
        print(df['label'].value_counts())

        return df

    def prepare_dataset(self, df: pd.DataFrame) -> Tuple[Dataset, Dataset]:
        """
        Prepara dataset para treinamento
        """
        print("\n🔧 Preparando dataset...")

        # Verificar se todas as labels são válidas
        invalid_labels = df[~df['label'].isin(EMOTION_LABELS)]['label'].unique()
        if len(invalid_labels) > 0:
            print(f"⚠️  Labels inválidas encontradas: {invalid_labels}")
            df = df[df['label'].isin(EMOTION_LABELS)]

        # Converter labels para IDs
        df['label_id'] = df['label'].map(LABEL2ID)

        # Split train/val (80/20)
        train_df, val_df = train_test_split(
            df,
            test_size=0.2,
            stratify=df['label'],
            random_state=42
        )

        print(f"📚 Train: {len(train_df)} exemplos")
        print(f"📝 Val: {len(val_df)} exemplos")

        # Criar Datasets do Hugging Face
        train_dataset = Dataset.from_pandas(train_df[['text', 'label_id']])
        val_dataset = Dataset.from_pandas(val_df[['text', 'label_id']])

        # Tokenizar
        def tokenize_function(examples):
            return self.tokenizer(
                examples['text'],
                padding='max_length',
                truncation=True,
                max_length=256
            )

        train_dataset = train_dataset.map(tokenize_function, batched=True)
        val_dataset = val_dataset.map(tokenize_function, batched=True)

        # Renomear coluna label_id para labels (necessário para Trainer)
        train_dataset = train_dataset.rename_column('label_id', 'labels')
        val_dataset = val_dataset.rename_column('label_id', 'labels')

        # Remover colunas desnecessárias
        train_dataset = train_dataset.remove_columns(['text'])
        val_dataset = val_dataset.remove_columns(['text'])

        # Definir formato pytorch
        train_dataset.set_format('torch')
        val_dataset.set_format('torch')

        return train_dataset, val_dataset

    def train(self, train_dataset: Dataset, val_dataset: Dataset, epochs: int = 3):
        """
        Treina o modelo BERT
        """
        print("\n🚀 Iniciando treinamento...")

        # Carregar modelo base
        model = AutoModelForSequenceClassification.from_pretrained(
            BASE_MODEL,
            num_labels=len(EMOTION_LABELS),
            id2label=ID2LABEL,
            label2id=LABEL2ID
        )

        # Training arguments
        training_args = TrainingArguments(
            output_dir=OUTPUT_DIR,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            learning_rate=2e-5,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            num_train_epochs=epochs,
            weight_decay=0.01,
            logging_dir=f"{OUTPUT_DIR}/logs",
            logging_steps=10,
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
            save_total_limit=2,
            warmup_steps=100,
            fp16=torch.cuda.is_available(),  # Mixed precision se GPU disponível
        )

        # Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            tokenizer=self.tokenizer,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
        )

        # Treinar
        print("🔥 Treinando modelo...")
        trainer.train()

        # Avaliar
        print("\n📊 Avaliando modelo...")
        eval_results = trainer.evaluate()
        print(f"Eval loss: {eval_results['eval_loss']:.4f}")

        # Salvar modelo final
        print(f"\n💾 Salvando modelo em {OUTPUT_DIR}...")
        trainer.save_model(OUTPUT_DIR)
        self.tokenizer.save_pretrained(OUTPUT_DIR)

        # Salvar metadata
        metadata = {
            'base_model': BASE_MODEL,
            'trained_at': datetime.now().isoformat(),
            'num_train_examples': len(train_dataset),
            'num_val_examples': len(val_dataset),
            'eval_loss': eval_results['eval_loss'],
            'epochs': epochs,
            'emotion_labels': EMOTION_LABELS,
        }

        with open(os.path.join(OUTPUT_DIR, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)

        print("\n✅ Treinamento concluído!")
        return eval_results

    def upload_to_hub(self, repo_name: str = "sosmulheres/bert-sentiment-ptbr"):
        """
        Faz upload do modelo treinado para Hugging Face Hub
        """
        if not HF_TOKEN:
            print("⚠️  HUGGINGFACE_API_KEY não definida. Pulando upload.")
            return

        print(f"\n☁️  Fazendo upload para {repo_name}...")

        # Login
        login(token=HF_TOKEN)

        # Upload
        api = HfApi()
        api.upload_folder(
            folder_path=OUTPUT_DIR,
            repo_id=repo_name,
            repo_type="model",
            commit_message=f"Fine-tuned model - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        )

        print(f"✅ Modelo disponível em: https://huggingface.co/{repo_name}")


def main():
    parser = argparse.ArgumentParser(description='Fine-tune BERT para análise de sentimento')
    parser.add_argument('--export-only', action='store_true', help='Apenas exportar dados')
    parser.add_argument('--train', action='store_true', help='Treinar modelo')
    parser.add_argument('--upload', action='store_true', help='Fazer upload para HF Hub')
    parser.add_argument('--days', type=int, default=90, help='Dias de dados para exportar')
    parser.add_argument('--epochs', type=int, default=3, help='Número de epochs')

    args = parser.parse_args()

    # Inicializar
    tuner = BERTFineTuner()

    # Exportar dados
    df = tuner.export_training_data(days=args.days)

    if df.empty:
        print("❌ Nenhum dado para treinar. Certifique-se de ter feedbacks no banco.")
        return

    if args.export_only:
        print("\n✅ Exportação concluída. Use --train para treinar o modelo.")
        return

    # Treinar
    if args.train or args.upload:
        if len(df) < 100:
            print(f"⚠️  Apenas {len(df)} exemplos. Recomendado: pelo menos 100 exemplos por classe.")
            response = input("Continuar mesmo assim? (s/n): ")
            if response.lower() != 's':
                print("❌ Treinamento cancelado.")
                return

        train_dataset, val_dataset = tuner.prepare_dataset(df)
        tuner.train(train_dataset, val_dataset, epochs=args.epochs)

    # Upload
    if args.upload:
        tuner.upload_to_hub()

    print("\n🎉 Pipeline completo!")


if __name__ == '__main__':
    main()
