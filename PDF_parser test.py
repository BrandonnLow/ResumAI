import PyPDF2
import os
import json
import re
import datetime
from dotenv import load_dotenv
from dateutil import parser
from langchain_openai import ChatOpenAI
from langchain.agents import create_openai_tools_agent, AgentExecutor
from langchain.tools import tool
from langchain.prompts import ChatPromptTemplate
import uuid

load_dotenv(".env.local")

def get_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text
    return text

@tool
def analyze_resume(text: str) -> str:
    """For resume"""
    return f"Analyzing student resume: {text[:500]}..."

def create_student_resume_agent():
    llm = ChatOpenAI(model="gpt-4", temperature=0)
    tools = [analyze_resume]
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a student career advisor extracting structured data from resumes.
Please return ONLY a JSON object with the following structure. 
If any field is missing in the resume, leave it as an empty string ("") for scalars or empty array ([]) for lists.

{{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "education": [
    {{
      "field": "",
      "degree": "",
      "institution": "",
      "startDate": "",
      "endDate": ""
    }}
  ],
  "workExperience": [
    {{
      "company": "",
      "position": "",
      "startDate": "",
      "endDate": "",
      "description": []
    }}
  ],
  "projects": [
    {{
      "name": "",
      "link": "",
      "description": [],
      "technologies": []
    }}
  ],
  "skills": [
    {{
      "name": ""
    }}
  ],
  "extracurriculars": [
    {{
      "name": "",
      "startDate": "",
      "endDate": "",
      "description": ""
    }}
  ],
  "additionalInfo": ""
}}

All dates must be in YYYY-MM-DD format if possible.
For work experience and project descriptions, return as arrays of strings.
For technologies, return as array of strings.
"""
        ),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    agent = create_openai_tools_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=False)

def normalize_date(date_str):
    if not date_str:
        return ""
    date_str = date_str.strip()
    if date_str.lower() == "present":
        return "" 
    try:
        parsed_date = parser.parse(date_str, fuzzy=True, dayfirst=False)
        return parsed_date.strftime("%Y-%m-%d")
    except:
        return ""

def clean_education_entries(education_list):
    cleaned = []
    for edu in education_list:
        cleaned.append({
            "id": str(uuid.uuid4())[:8],
            "field": edu.get("field", "") or "",
            "degree": edu.get("degree", "") or "",
            "institution": edu.get("institution", "") or "",
            "startDate": normalize_date(edu.get("startDate", "")),
            "endDate": normalize_date(edu.get("endDate", ""))
        })
    return cleaned

def clean_work_entries(work_list):
    cleaned = []
    for work in work_list:
        description = work.get("description", [])
        if isinstance(description, str):
            description = [description] if description else []
        elif not isinstance(description, list):
            description = []
        
        cleaned.append({
            "id": str(uuid.uuid4())[:8],
            "company": work.get("company", "") or "",
            "position": work.get("position", "") or "",
            "startDate": normalize_date(work.get("startDate", "")),
            "endDate": normalize_date(work.get("endDate", "")),
            "description": description
        })
    return cleaned

def clean_project_entries(project_list):
    cleaned = []
    for project in project_list:
        description = project.get("description", [])
        if isinstance(description, str):
            description = [description] if description else []
        elif not isinstance(description, list):
            description = []
            
        technologies = project.get("technologies", [])
        if isinstance(technologies, str):
            technologies = [technologies] if technologies else []
        elif not isinstance(technologies, list):
            technologies = []
        
        cleaned.append({
            "id": str(uuid.uuid4())[:8],
            "name": project.get("name", "") or "",
            "link": project.get("link", "") or "",
            "description": description,
            "technologies": technologies
        })
    return cleaned

def clean_skills_entries(skills_list):
    cleaned = []
    for skill in skills_list:
        if isinstance(skill, str):
            cleaned.append({
                "id": str(uuid.uuid4())[:8],
                "name": skill
            })
        elif isinstance(skill, dict):
            cleaned.append({
                "id": str(uuid.uuid4())[:8],
                "name": skill.get("name", "") or ""
            })
    return cleaned

def clean_extracurricular_entries(extra_list):
    cleaned = []
    for extra in extra_list:
        cleaned.append({
            "id": str(uuid.uuid4())[:8],
            "name": extra.get("name", "") or extra.get("title", "") or "",
            "startDate": normalize_date(extra.get("startDate", "")),
            "endDate": normalize_date(extra.get("endDate", "")),
            "description": extra.get("description", "") or ""
        })
    return cleaned

def ensure_profile_shape(parsed_json):
    profile = {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "summary": "",
        "education": [],
        "workExperience": [],
        "projects": [],
        "skills": [],
        "extracurriculars": [],
        "additionalInfo": ""
    }
    
    for key in ["name", "email", "phone", "location", "summary", "additionalInfo"]:
        profile[key] = parsed_json.get(key, "") or ""
    
    profile["education"] = clean_education_entries(parsed_json.get("education", []))
    profile["workExperience"] = clean_work_entries(parsed_json.get("workExperience", []))
    profile["projects"] = clean_project_entries(parsed_json.get("projects", []))
    profile["skills"] = clean_skills_entries(parsed_json.get("skills", []))
    profile["extracurriculars"] = clean_extracurricular_entries(parsed_json.get("extracurriculars", []))
    
    return profile

def parse_student_resume(pdf_path):
    text = get_text_from_pdf(pdf_path)
    agent = create_student_resume_agent()
    result = agent.invoke({"input": f"Extract all the relevant fields from this resume in JSON format: {text}"})
    raw_output = result.get('output', '').strip()
    parsed_json = json.loads(raw_output)
    final_profile = ensure_profile_shape(parsed_json)
    return final_profile

if __name__ == "__main__":
    result = parse_student_resume("PDF_parser_resume.pdf")
    print(json.dumps(result, indent=2))