import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE_MODEL_NAME = "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B"
MAX_LENGTH = 1000
TEMPERATURE = 0.7 #how ballsy / creative this model can get

def load_models():
    tokenizer = AutoTokenizer.from_pretrained("./model-finetuned-rtx4050", trust_remote_code=True)
    
    
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        trust_remote_code=True,
        torch_dtype=torch.float16,
        device_map="auto",
        low_cpu_mem_usage=True,
    )
    
    
    model = PeftModel.from_pretrained(base_model, "./model-finetuned-rtx4050")
    model.eval()
    
    return model, tokenizer

def generate_response(model, tokenizer, skeleton, userInput):
    
    prompt = f"""Interview Question: {skeleton}

Candidate Answer: {userInput}

Provide detailed feedback on this interview answer. Analyze the response for:
- Clarity
- Insights
- Effectiveness
- How to improve

Feedback:"""
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=MAX_LENGTH)
    
    if torch.cuda.is_available():
        inputs = {k: v.cuda() for k, v in inputs.items()}
    
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=TEMPERATURE,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.1
        )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    feedback = response[len(prompt):].strip()
    
    return feedback

def main():
    model, tokenizer = load_models()
    
    skeleton = "Tell me about a time when you had to solve a technical challenge under pressure."
    userInput = """In my web development class, our team built a student portfolio platform and I was responsible for deployment and hosting. I set up the backend on EC2 with auto-scaling for our demo day when 200+ students would access it simultaneously. When our site crashed during initial testing, I quickly configured load balancing and database connection pooling, which allowed us to handle the traffic smoothly.
"""
    feedback = generate_response(model, tokenizer, skeleton, userInput)
    print(feedback)
    

if __name__== "__main__":
    main()
