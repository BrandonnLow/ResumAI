import os
import glob
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    DataCollatorForLanguageModeling,
    set_seed,
)
from datasets import Dataset
from peft import LoraConfig, get_peft_model

# Default configuration
MODEL_NAME = "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B"
DATA_DIR = "./data"
MAX_SEQ_LENGTH = 256
BATCH_SIZE = 1
GRADIENT_ACCUMULATION_STEPS = 4
LEARNING_RATE = 1e-4
EPOCHS = 1

def prepare_dataset(data_dir, tokenizer, max_seq_length):
    text_files = glob.glob(os.path.join(data_dir, "*.txt"))
    
    all_texts = []
    for file_path in text_files:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
            if text.strip():
                if len(text) > max_seq_length * 10:
                    text = text[:max_seq_length * 10]
                all_texts.append(text)
    
    def tokenize_function(examples):
        results = tokenizer(
            examples["text"],
            truncation=True,
            max_length=max_seq_length,
            padding="max_length",
        )
        return {
            "input_ids": results["input_ids"],
            "attention_mask": results["attention_mask"],
        }
    
    dataset = Dataset.from_dict({"text": all_texts})
    tokenized_dataset = dataset.map(
            tokenize_function,
            batched=True,
            batch_size=2,
            remove_columns=["text"],
    )
    
    return tokenized_dataset.train_test_split(test_size=0.05, seed=42)

def tokenizerFunction():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=True, trust_remote_code=True)
    
    if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        trust_remote_code=True,
        torch_dtype=torch.float16,
        device_map="auto",
        low_cpu_mem_usage=True,
        use_cache=False,
    )
    
    model.gradient_checkpointing_enable()
    
    peft_config = LoraConfig(
        r=4,
        lora_alpha=8,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    model = get_peft_model(model, peft_config)
    return model, tokenizer

def main():
    set_seed(33993)
    torch.cuda.empty_cache()
    
    os.makedirs("./model-finetuned-rtx4050", exist_ok=True)
    
    model, tokenizer = tokenizerFunction()
    datasets = prepare_dataset(DATA_DIR, tokenizer, MAX_SEQ_LENGTH)
    
    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)
    
    training_args = TrainingArguments(
        output_dir="./model-finetuned-rtx4050",
        overwrite_output_dir=True,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
        learning_rate=LEARNING_RATE,
        weight_decay=0.01,
        warmup_steps=50,
        logging_steps=20,
        save_strategy="steps",
        eval_strategy="steps",
        eval_steps=200,
        save_steps=400,
        save_total_limit=1,
        load_best_model_at_end=True,
        bf16=True,
        gradient_checkpointing=True,
        max_grad_norm=1.0,
        lr_scheduler_type="cosine",
        metric_for_best_model="eval_loss",
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        data_collator=data_collator,
        train_dataset=datasets["train"],
        eval_dataset=datasets["test"],
    )
    
    trainer.train()
    trainer.save_model("./model-finetuned-rtx4050")
    tokenizer.save_pretrained("./model-finetuned-rtx4050")

if __name__ == "__main__":
    main()
