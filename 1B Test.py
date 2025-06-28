import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel


MODEL_DIR = "./model-finetuned-rtx4050"
BASE_MODEL_NAME = "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B"
MAX_LENGTH = 512
TEMPERATURE = 0.7
TOP_P = 0.9

def load_finetuned_model():
    """Load the fine-tuned model and tokenizer"""
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, trust_remote_code=True)
    
    
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        trust_remote_code=True,
        torch_dtype=torch.float16,
        device_map="auto",
        low_cpu_mem_usage=True,
    )
    
    
    model = PeftModel.from_pretrained(base_model, MODEL_DIR)
    model.eval()
    
    return model, tokenizer

def generate_response(model, tokenizer, skeleton, userInput):
    
    prompt = f"""Interview Question: {skeleton}

Candidate Answer: {userInput}

Provide detailed feedback on this interview answer. Analyze the response for:
- Clarity and structure
- Relevant examples and specifics
- Areas for improvement
- Overall effectiveness

Feedback:"""

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=MAX_LENGTH)
    
    
    if torch.cuda.is_available():
        inputs = {k: v.cuda() for k, v in inputs.items()}
    
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=TEMPERATURE,
            top_p=TOP_P,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.1
        )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    feedback = response[len(prompt):].strip()
    
    return feedback

def main():
    print("Loading fine-tuned model...")
    model, tokenizer = load_finetuned_model()
    print("Model loaded successfully!")
    
    skeleton = "Tell me about a time when you had to solve a technical challenge under pressure."
    userInput = """During my capstone project, our team's database crashed two days before the final presentation. I quickly set up a backup PostgreSQL instance on AWS RDS, migrated our data using custom Python scripts, and updated all API endpoints. We presented on time and got an A+ grade."""
    
    print(f"\nQuestion: {skeleton}")
    print(f"\nAnswer: {userInput}")
    print(f"\nGenerating feedback...")
    
    feedback = generate_response(model, tokenizer, skeleton, userInput)
    
    print(f"\nAI Feedback:\n{feedback}")

if __name__ == "__main__":
    main()