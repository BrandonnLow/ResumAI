import os
import glob
import json
import torch
from datetime import datetime
from typing import Dict

from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments, DataCollatorForLanguageModeling, BitsAndBytesConfig

from datasets import Dataset
from peft import (
    LoraConfig,
    get_peft_model,
)

def prepare_data(data_path: str, text_processor, max_length: int, val_split: float = 0.05) -> Dict[str, Dataset]:
    text_files = glob.glob(os.path.join(data_path, "*.txt"))
    
    all_content = []
    for file_path in text_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            if content.strip():
                if len(content) > max_length * 10:
                    content = content[:max_length * 10]
                all_content.append(content)
    
    def process_text(examples):
        results = text_processor(
            examples["text"],
            truncation=True,
            max_length=max_length,
            padding="max_length",
        )
        
        return {
            "input_ids": results["input_ids"],
            "attention_mask": results["attention_mask"],
        }
    
    data = Dataset.from_dict({"text": all_content})
    
    processed_data = data.map(
        process_text,
        batched=True,
        batch_size=2,
        remove_columns=["text"],
    )
    
    if val_split > 0:
        split_data = processed_data.train_test_split(
            test_size=val_split, 
            seed=3944
        )
        return {
            "train": split_data["train"],
            "validation": split_data["test"]
        }
    else:
        return {"train": processed_data}

def load_model_and_processor():
    torch.cuda.empty_cache()
    
    model_path = "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B" # main change from 1.5B 
    
    text_processor = AutoTokenizer.from_pretrained(
        model_path,
        device_map = "cuda",
        use_fast=True,
        trust_remote_code=True
    )
    
    if text_processor.pad_token is None:
        text_processor.pad_token = text_processor.eos_token
    
    model_settings = {
        "trust_remote_code": True,
        "torch_dtype": torch.float16,
        "device_map": "cuda",
        "low_cpu_mem_usage": True,
        "attn_implementation": "eager",
        "use_cache": False,
        "use_flash_attention_2": False
    }
    
    network = AutoModelForCausalLM.from_pretrained(
        model_path, 
        **model_settings,
        device_map = "cuda", 
        quantization_config=BitsAndBytesConfig(
            llm_int8_enable_fp32_cpu_offload=True, load_in_8bit=True, bnb_8bit_compute_dtype=torch.float16 # my gpu can't handle whole model
        ))
    
    network.gradient_checkpointing_enable()
    
    target_layers = ["q_proj", "v_proj"]
    lora_settings = LoraConfig(
        r=4,
        lora_alpha=8,
        target_modules=target_layers,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    network = get_peft_model(network, lora_settings)
    network.print_trainable_parameters()
    
    return network, text_processor

def main():    
    save_dir = "./saved-model"
    os.makedirs(save_dir, exist_ok=True)
    
    network, text_processor = load_model_and_processor()
    
    training_data = prepare_data(
        "./data", 
        text_processor, 
        1024,
        0.05
    )
    
    data_handler = DataCollatorForLanguageModeling(
        tokenizer=text_processor,
        mlm=False,
    )
    
    training_config = TrainingArguments(
        output_dir=save_dir,
        overwrite_output_dir=True,
        num_train_epochs=3,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=4,
        learning_rate=5e-5,
        weight_decay=0.01,
        warmup_steps=50,
        logging_dir=os.path.join(save_dir, "logs"),
        logging_steps=20,
        save_strategy="steps",
        eval_strategy="steps",
        eval_steps=200,
        save_steps=800,
        save_total_limit=1,
        load_best_model_at_end=True,
        fp16=False,
        bf16=True,
        optim="adamw_torch",
        dataloader_num_workers=0,
        dataloader_pin_memory=False,
        group_by_length=False,
        gradient_checkpointing=True,
        max_grad_norm=1.0,
        lr_scheduler_type="cosine",
        disable_tqdm=False,
        metric_for_best_model="eval_loss",
    )
    
    trainer = Trainer(
        model=network,
        args=training_config,
        data_collator=data_handler,
        train_dataset=training_data["train"],
        eval_dataset=training_data.get("validation", None),
    )
    
    trainer.train()
    
    trainer.save_model(save_dir)
    text_processor.save_pretrained(save_dir)

if __name__ == "__main__":
    torch.cuda.empty_cache()
    main()