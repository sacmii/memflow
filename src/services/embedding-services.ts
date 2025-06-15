import { OpenAI } from 'openai';

let openai: OpenAI | null = null;

const getOpenAIInstance = (): OpenAI => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not set.');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 10000,
    });
  }
  return openai;
};

export const generateEmbeddings = async (
  text: string
): Promise<number[] | null> => {
  try {
    const openaiInstance = getOpenAIInstance();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid input: text must be a non-empty string.');
    }
    let cleanedText = text.trim();
    if (cleanedText.length > 32000) {
      cleanedText = cleanedText.slice(0, 32000);
      console.warn('Input text was truncated to 32000 characters.');
    }
    console.log(
      `Generating embeddings for text: ${cleanedText.substring(0, 50)}...`
    );
    const response = await openaiInstance.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanedText,
      encoding_format: 'float',
      dimensions: 1536,
    });
    const embeddings = response.data[0]?.embedding;
    if (!embeddings || !Array.isArray(embeddings)) {
      throw new Error('Failed to generate valid embeddings.');
    }
    console.log(`Generated embeddings: ${embeddings.length} dimensions.`);
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return null;
  }
};

export const generateTags = async (content: string): Promise<string[]> => {
  try {
    const openaiInstance = getOpenAIInstance();
    const prompt = `
      Analyze the following text and generate 2-3 (Max 5) relevant tags.
      Tags should be:
      - Single words or short phrases
      - Lowercase with hyphens for spaces
      - Highly relevant to content
      - Avoid generic tags
      - Return tags as a comma-separated list.

      Content:
      \`\`\`text
      ${content}
      \`\`\`
    `;

    const response = await openaiInstance.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const tagsString = response.choices[0]?.message?.content;
    if (!tagsString) {
      throw new Error(
        'Failed to generate tags: No content in OpenAI response.'
      );
    }

    return tagsString.split(',').map(tag => tag.trim().toLowerCase());
  } catch (error) {
    console.error('Error generating tags:', error);
    return [];
  }
};
