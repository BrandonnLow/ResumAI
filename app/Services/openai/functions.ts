import openai from './api';
import { UserProfile, QuestionCategory, Job } from '../../types';

// Generate interview questions
export const generateQuestions = async (
    profile: UserProfile,
    categories: QuestionCategory[],
    count: number = 5,
    job?: Job
): Promise<{ text: string; category: QuestionCategory }[]> => {
    try {
        let systemPrompt = 'You are an AI assistant that generates relevant interview questions.';
        let userPrompt = '';

        if (job) {
            systemPrompt += ' Generate questions tailored to the specific job and company.';
            userPrompt = `Generate ${count} interview questions for this job:
Company: ${job.company}
Role: ${job.title}
${job.description ? `Description: ${job.description}` : ''}

Candidate Profile: ${JSON.stringify(profile)}

Categories to focus on: ${categories.join(', ')}.

Return as JSON array with 'text' and 'category' properties.`;
        } else {
            systemPrompt += ' Generate general interview questions based on the candidate\'s background.';
            userPrompt = `Generate ${count} general interview questions for this candidate:
${JSON.stringify(profile)}

Categories to focus on: ${categories.join(', ')}.

Return as JSON array with 'text' and 'category' properties.`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) return [];

        const parsedContent = JSON.parse(content);
        return parsedContent.questions || parsedContent || [];
    } catch (error) {
        console.error("Error generating questions:", error);
        // Return fallback questions
        return categories.map((category, index) => ({
            text: `Sample ${category} question ${index + 1}`,
            category: category
        }));
    }
};

// Get feedback on answers
export const getAnswerFeedback = async (
    question: string,
    answer: string,
    profile: UserProfile,
    job?: Job
): Promise<string> => {
    try {
        let systemPrompt = 'You are an interview coach providing constructive feedback on interview answers.';
        let userPrompt = '';

        if (job) {
            systemPrompt += ' Focus on how well the answer fits the specific role and company.';
            userPrompt = `Job Context:
Company: ${job.company}
Role: ${job.title}

Question: ${question}
Answer: ${answer}

Candidate: ${JSON.stringify(profile)}

Provide specific feedback on this answer for the job context.`;
        } else {
            userPrompt = `Question: ${question}
Answer: ${answer}
Candidate: ${JSON.stringify(profile)}

Provide constructive feedback on this interview answer.`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        return response.choices[0].message.content || "Great answer! Keep practicing to improve further.";
    } catch (error) {
        console.error("Error getting feedback:", error);
        return "Sorry, I couldn't provide feedback at this time. Your answer looks good!";
    }
};

// Suggest tags for answers
export const suggestTags = async (
    question: string,
    answer: string,
    job?: Job
): Promise<string[]> => {
    try {
        let systemPrompt = 'You are an AI that suggests relevant tags for interview answers. Return 3-5 tags as JSON array.';
        let userPrompt = `Question: ${question}
Answer: ${answer}
${job ? `Job Context: ${job.title} at ${job.company}` : ''}

Suggest relevant tags for categorizing this answer.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) return ['interview'];

        const parsedContent = JSON.parse(content);
        return parsedContent.tags || parsedContent || ['interview'];
    } catch (error) {
        console.error("Error suggesting tags:", error);
        return ['interview'];
    }
};