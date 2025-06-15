# Tag System Refactor Implementation Plan

## Objective

Replace manual tag input with OpenAI-generated tags for memories.

## Current Implementation

- Tags are manually provided as string array during memory creation
- Stored in PostgreSQL as text array column
- Used for filtering in search

## Proposed Changes

### 1. Database Changes

- Keep `tags` column in Memory model. No database migration needed for this change.

### 2. OpenAI Tag Generation Service

New function in `embedding-services.ts`:

```typescript
export const generateTags = async (content: string): Promise<string[]> => {
  const prompt = `
    Analyze the following text and generate 3-5 relevant tags.
    Tags should be:
    - Single words or short phrases
    - Lowercase with hyphens for spaces
    - Highly relevant to content
    - Avoid generic tags

    Content: ${content}
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  // Parse response into string array
  return parseTags(response.choices[0].message.content);
};
```

### 3. Memory Controller Changes

- Remove `tags` from `CreateMemoryBody` interface.
- Modify `createMemory` to generate tags internally using `generateTags` and save them.
- Keep `searchMemories` as is, allowing search by existing tags.

### 4. Search Functionality Update

- Remove tag filtering from search
- Keep keyword search and add semantic search using embeddings

## Migration Strategy

1. First deploy code changes (backwards compatible)
2. Run migration to drop tags column
3. Verify functionality

## Testing Plan

1. Unit tests for tag generation
2. Integration tests for memory creation
3. End-to-end tests for search functionality

## Risks

- OpenAI API latency/availability
- Tag quality consistency
- Migration downtime

## Rollback Plan

1. Revert code changes
2. Restore tags column from backup
