import { http, HttpResponse } from 'msw';

/**
 * MSW handlers for mocking API requests in tests
 * 
 * This file contains mock handlers for:
 * - Supabase API calls
 * - OpenAI API calls
 * - OpenRouter API calls
 */

export const handlers = [
  // Mock Supabase auth endpoints
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
      },
    });
  }),

  // Mock Supabase database queries
  http.get('*/rest/v1/*', () => {
    return HttpResponse.json([]);
  }),

  // Mock OpenAI API
  http.post('https://api.openai.com/v1/images/generations', () => {
    return HttpResponse.json({
      data: [
        {
          url: 'https://example.com/mock-image.png',
          revised_prompt: 'mock revised prompt',
        },
      ],
    });
  }),

  // Mock OpenAI chat completions (for moderation and tagging)
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: 'mock response',
          },
        },
      ],
    });
  }),
];
