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

export const processContent = async (
  originalContent: string
): Promise<{
  simplifiedContent: string;
  embeddings: number[];
  tags: string[];
}> => {
  try {
    const openaiInstance = getOpenAIInstance();

    const tagsPrompt = `
      Generate 2-3 (Max 5) relevant tags for the following content.
      Tags should be:
      - Single words or short phrases
      - Lowercase with hyphens for spaces
      - Highly relevant to content
      - Avoid generic tags

      Return the response as a JSON object with one key: "tags" (array of strings).

      Content:
      \`\`\`text
      ${originalContent}
      \`\`\`
    `;

    const tagsResponse = await openaiInstance.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: tagsPrompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const responseContent = tagsResponse.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error(
        'Failed to process content: No content in OpenAI response for tags.'
      );
    }

    let parsedResponse: { tags: string[] };
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (jsonError) {
      throw new Error(
        `Failed to parse OpenAI response as JSON for tags: ${responseContent}`
      );
    }

    const tags = parsedResponse.tags || [];

    // Use originalContent as simplifiedContent
    const simplifiedContent = originalContent;

    // Generate Embeddings for original content
    const embeddings = await generateEmbeddings(originalContent);
    if (!embeddings) {
      throw new Error(
        'Failed to generate embeddings for the simplified content.'
      );
    }

    return { simplifiedContent, embeddings, tags };
  } catch (error) {
    console.error('Error processing content:', error);
    throw error; // Re-throw to be handled by the caller
  }
};
