import openai from './api';
import { UserProfile, QuestionCategory, Job } from '../../types';

// Extract information from resume PDF
export const extractResumeInfo = async (resumeText: string): Promise<Partial<UserProfile>> => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an AI assistant that extracts structured information from resumes.
          Extract the following details from the provided resume text:
          - Name
          - Email
          - Phone
          - Location
          - Summary (create a compelling professional summary even if one isn't explicitly present in the resume)
          - Education (institution, degree, field, start/end dates, GPA)
          - Work Experience (company, position, start/end dates, description)
          - Projects (name, description, technologies, link)
          - Skills
          - Extracurriculars (name, role, description, dates)

          For the Summary, if not explicitly provided, generate a concise, well-written professional summary that highlights the candidate's key qualifications, experience, and career focus based on the resume content.

          Format your response as a JSON object with appropriate fields.`
                },
                {
                    role: "user",
                    content: resumeText
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            console.error("Empty response from OpenAI");
            return {};
        }

        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            return {};
        }
    } catch (error) {
        console.error("Error extracting resume info:", error);
        return {};
    }
};

// Enhance profile content
export const beautifyProfile = async (profile: UserProfile): Promise<Partial<UserProfile>> => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an expert resume writer and career coach that transforms ordinary job profiles into powerful, impactful career documents.

ENHANCEMENT GUIDELINES:
1. QUANTIFY ACHIEVEMENTS: Add specific metrics, percentages, and numbers to work experience (e.g., "Increased sales by 27%" instead of "Increased sales")
2. USE POWER VERBS: Replace weak verbs with strong action verbs (e.g., "Spearheaded" instead of "Led", "Orchestrated" instead of "Managed")
3. HIGHLIGHT OUTCOMES: Focus on results and impact, not just responsibilities
4. ADD SPECIFICITY: Include technologies, methodologies, and industry-specific terminology where appropriate
5. IMPROVE STRUCTURE: Ensure consistent formatting and presentation
6. ENHANCE SUMMARY: Create a compelling professional summary that highlights key strengths and unique value proposition

Only enhance factual content - do NOT invent new information or metrics.
Return ONLY the enhanced version as JSON matching the original structure.
Focus especially on work experience descriptions, project descriptions, and the professional summary.`
                },
                {
                    role: "user",
                    content: JSON.stringify(profile)
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            console.error("Empty response from OpenAI");
            return {};
        }

        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            return {};
        }
    } catch (error) {
        console.error("Error beautifying profile:", error);
        return {};
    }
};

// Generate interview questions with proper context prioritization
export const generateQuestions = async (
    profile: UserProfile,
    categories: QuestionCategory[],
    count: number = 5,
    job?: Job
): Promise<{ text: string; category: QuestionCategory }[]> => {
    try {
        let systemPrompt = '';
        let userPrompt = '';

        if (job) {
            // JOB-SPECIFIC: Prioritize job context first, then candidate profile
            systemPrompt = `You are an AI assistant that generates highly targeted interview questions for specific job positions.

PRIORITY CONTEXT ORDER:
1. Job Requirements (PRIMARY) - Generate questions that directly assess fit for this specific role
2. Candidate Background (SECONDARY) - Use candidate info to customize question complexity and examples

QUESTION GENERATION STRATEGY:
- Focus heavily on skills, experiences, and qualities required for this specific position
- Ask about challenges and scenarios relevant to this company and role
- Assess technical competencies mentioned in the job description
- Evaluate cultural fit for this specific company
- Test problem-solving abilities relevant to the role's responsibilities
- If candidate background doesn't align with job requirements, ask questions that reveal transferable skills and learning ability

Generate ${count} challenging but fair interview questions that would realistically be asked for this position.
Create questions that help assess if the candidate can succeed in THIS SPECIFIC ROLE.

Categories to focus on: ${categories.join(', ')}.

Return questions as a JSON array of objects with 'text' and 'category' properties.
Example format:
{
  "questions": [
    {"text": "Tell me about a time you faced a challenge in your previous role?", "category": "Behavioral"},
    {"text": "Why do you want to work at our company?", "category": "Motivational"}
  ]
}
The 'category' must be one of: Motivational, Behavioral, Technical, Personality.`;

            userPrompt = `TARGET POSITION DETAILS:
Company: ${job.company}
Role: ${job.title}
${job.description ? `Job Description: ${job.description}` : ''}

CANDIDATE BACKGROUND (for context and customization):
${JSON.stringify(profile)}

Generate questions that primarily assess fit for the ${job.title} position at ${job.company}, using the candidate's background to appropriately calibrate question difficulty and examples.`;

        } else {
            // GENERAL: Use candidate profile as primary context
            systemPrompt = `You are an AI assistant that generates relevant interview questions for job candidates based on their background and experience.

Generate ${count} general interview questions that are appropriate for the candidate's profile and experience level.
Create challenging but fair questions that would be asked in real interviews across various companies and roles.

Categories to focus on: ${categories.join(', ')}.

For technical questions, ensure they're appropriate for the candidate's skills and experience level.
Return questions as a JSON array of objects with 'text' and 'category' properties.
Example format:
{
  "questions": [
    {"text": "Tell me about a time you faced a challenge in your previous role?", "category": "Behavioral"},
    {"text": "Why do you want to work at our company?", "category": "Motivational"}
  ]
}
The 'category' must be one of: Motivational, Behavioral, Technical, Personality.`;

            userPrompt = `CANDIDATE PROFILE: ${JSON.stringify(profile)}

Generate general interview questions suitable for this candidate's background and experience level.`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            console.error("Empty response from OpenAI");
            return [];
        }

        try {
            const parsedContent = JSON.parse(content);
            // Handle different possible response formats
            if (Array.isArray(parsedContent)) {
                return parsedContent;
            } else if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
                return parsedContent.questions;
            } else {
                // Create fallback questions if format is unexpected
                console.error("Unexpected response format:", parsedContent);
                return categories.map((category, index) => ({
                    text: `Interview question ${index + 1} for ${category} category`,
                    category: category
                }));
            }
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            // Create fallback questions if parsing fails
            return categories.map((category, index) => ({
                text: `Interview question ${index + 1} for ${category} category`,
                category: category
            }));
        }
    } catch (error) {
        console.error("Error generating questions:", error);
        // Create fallback questions if API call fails
        return categories.map((category, index) => ({
            text: `Interview question ${index + 1} for ${category} category`,
            category: category
        }));
    }
};

// Provide feedback on answers with job-specific context
export const getAnswerFeedback = async (
    question: string,
    answer: string,
    profile: UserProfile,
    job?: Job
): Promise<string> => {
    try {
        let systemPrompt = '';
        let userPrompt = '';

        if (job) {
            // JOB-SPECIFIC: Focus feedback on job requirements
            systemPrompt = `You are an AI interview coach providing feedback for a specific job application.

FEEDBACK PRIORITY:
1. Assess how well the answer demonstrates fit for the specific role and company
2. Evaluate alignment with job requirements and responsibilities
3. Consider candidate's background as context for realistic expectations

Provide constructive feedback that helps the candidate better align their responses with what this specific employer is looking for.
Focus on relevance to the role, demonstration of required skills, and company culture fit.`;

            userPrompt = `TARGET POSITION:
Company: ${job.company}
Role: ${job.title}
${job.description ? `Job Requirements: ${job.description}` : ''}

INTERVIEW QUESTION: ${question}
CANDIDATE'S ANSWER: ${answer}

CANDIDATE BACKGROUND: ${JSON.stringify(profile)}

Provide specific feedback on how well this answer positions the candidate for the ${job.title} role at ${job.company}. Suggest improvements that would better demonstrate fit for this specific position.`;

        } else {
            // GENERAL: Standard interview feedback
            systemPrompt = `You are an AI interview coach that provides helpful feedback on interview answers.
          Analyze the answer for clarity, relevance, structure, and impact.
          Suggest specific improvements and highlight strengths.
          Consider the candidate's background and provide actionable feedback that helps improve their answer.`;

            userPrompt = `Question: ${question}\nAnswer: ${answer}\nCandidate Profile: ${JSON.stringify(profile)}`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ]
        });

        return response.choices[0].message.content || "Unfortunately, I couldn't generate feedback at this time. Your answer appears complete, but I recommend reviewing it for clarity, relevance, and impact before proceeding.";
    } catch (error) {
        console.error("Error getting answer feedback:", error);
        return "Unfortunately, I couldn't generate feedback at this time. Your answer appears complete, but I recommend reviewing it for clarity, relevance, and impact before proceeding.";
    }
};

// Suggest tags for answers with job context
export const suggestTags = async (
    question: string,
    answer: string,
    job?: Job
): Promise<string[]> => {
    try {
        let systemPrompt = '';
        let userPrompt = '';

        if (job) {
            // JOB-SPECIFIC: Include job-relevant tags
            systemPrompt = `You are an AI assistant that suggests relevant tags for interview answers in the context of a specific job application.
          
          Analyze the question and answer to identify key themes, skills, and qualities demonstrated.
          PRIORITIZE tags that are relevant to the specific job role and company.
          Include technical skills, soft skills, and role-specific competencies.
          
          Suggest 4-6 concise tags that accurately categorize the content with emphasis on job relevance.
          Examples include technical skills (e.g., "Python", "data analysis"), soft skills (e.g., "leadership", "communication"),
          role-specific skills (e.g., "project management", "customer service"), and company-relevant skills.
          
          Return the tags as a JSON array of strings.
          Example format: {"tags": ["leadership", "conflict resolution", "team management", "stakeholder communication"]}`;

            userPrompt = `JOB CONTEXT:
Company: ${job.company}
Role: ${job.title}
${job.description ? `Job Description: ${job.description}` : ''}

INTERVIEW Q&A:
Question: ${question}
Answer: ${answer}

Generate tags that emphasize relevance to the ${job.title} position at ${job.company}.`;

        } else {
            // GENERAL: Standard tag suggestions
            systemPrompt = `You are an AI assistant that suggests relevant tags for interview answers.
          Analyze the question and answer to identify key themes, skills, and qualities demonstrated.
          Suggest 3-5 concise tags that accurately categorize the content.
          Examples include technical skills (e.g., "Python", "data analysis"), soft skills (e.g., "leadership", "communication"),
          and specific experiences (e.g., "project management", "customer service").
          Return the tags as a JSON array of strings.
          Example format: {"tags": ["leadership", "conflict resolution", "team management"]}`;

            userPrompt = `Question: ${question}\nAnswer: ${answer}`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            console.error("Empty response from OpenAI");
            return [];
        }

        try {
            const parsedContent = JSON.parse(content);
            // Handle different possible response formats
            if (Array.isArray(parsedContent)) {
                return parsedContent;
            } else if (parsedContent.tags && Array.isArray(parsedContent.tags)) {
                return parsedContent.tags;
            } else {
                // Extract all values if format is unexpected
                const allValues = Object.values(parsedContent).flat();
                return Array.isArray(allValues) ?
                    allValues.filter(v => typeof v === 'string') :
                    [];
            }
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            return [];
        }
    } catch (error) {
        console.error("Error suggesting tags:", error);
        return [];
    }
};