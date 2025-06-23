import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel, PeftConfig
import os

def load_finetuned_model(model_path):
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    device_map = {"": 0}  
    try:
        config = PeftConfig.from_pretrained(model_path)
        
        base_model = AutoModelForCausalLM.from_pretrained(
            config.base_model_name_or_path,
            torch_dtype=torch.float16,
            device_map=device_map,
            trust_remote_code=True
        )
        
        model = PeftModel.from_pretrained(base_model, model_path)
    except Exception as e:
        if "CUDA out of memory" in str(e):
            device_map = {"": "cpu"}
            
            base_model = AutoModelForCausalLM.from_pretrained(
                config.base_model_name_or_path,
                torch_dtype=torch.float16,
                device_map=device_map,
                trust_remote_code=True
            )
            
            model = PeftModel.from_pretrained(base_model, model_path)
        else:
            
            model = AutoModelForCausalLM.from_pretrained(
                    model_path,
                    torch_dtype=torch.float16,
                    device_map=device_map,
                    trust_remote_code=True
            )
    return model, tokenizer

def generate_response(model, tokenizer, prompt, max_length=500, temperature=0.9):
    device = next(model.parameters()).device
    
    inputs = tokenizer(prompt, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model.generate(
            inputs["input_ids"],
            max_length=max_length,
            temperature=temperature,
            do_sample=True,
            top_p=0.95,
            num_return_sequences=1,
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    if response.startswith(prompt):
        response = response[len(prompt):]
    
    return response.strip()
