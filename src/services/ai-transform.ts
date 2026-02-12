/**
 * AI Transformation Service for Pocket Monet
 *
 * This service handles the transformation of photos into Impressionist paintings
 * using OpenAI's DALL-E 3 API.
 */

export interface TransformationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// The exact prompt specified in the PRD
const IMPRESSIONIST_PROMPT = `Transform this photograph into a high-quality Impressionist oil painting. Use thick, visible impasto brushstrokes, textured dabs of paint, and a warm Golden Hour glow. Soften geometric lines into painterly forms, emphasizing light play and vibrant, saturated colors similar to Monet's style.

Technical requirements:
- Use thick, visible 'impasto' brushstrokes and textured dabs of paint
- Apply a warm, 'Golden Hour' glow with vibrant yellows, oranges, and soft purples
- Soften all hard edges and geometric lines into painterly forms
- Use a rich, saturated palette with high contrast between sunlit areas and cool, blue-toned shadows
- Maintain the general composition and perspective but render every pixel as part of a cohesive oil painting
- Emphasize the physical texture of canvas and paint rather than photographic realism`;

/**
 * Transform a photo into an Impressionist painting using OpenAI DALL-E 3
 */
export async function transformToImpressionistPainting(
  base64Image: string,
  apiKey?: string
): Promise<TransformationResult> {
  // Check if API key is available
  const openaiApiKey = apiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!openaiApiKey) {
    return {
      success: false,
      error: 'OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your environment variables.'
    };
  }

  try {
    // Prepare the API request
    const response = await fetch('https://api.openai.com/v1/images/variations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: IMPRESSIONIST_PROMPT,
        image: base64Image,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "natural"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();

    if (result.data && result.data.length > 0) {
      return {
        success: true,
        imageUrl: result.data[0].url
      };
    } else {
      throw new Error('No image generated in API response');
    }

  } catch (error) {
    console.error('AI Transformation Error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during transformation'
    };
  }
}

/**
 * Mock transformation for development/demo purposes
 * Returns the sample Impressionist transformation after a delay
 */
export async function mockTransformation(): Promise<TransformationResult> {
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Return the sample transformation image (from picture.png design)
  return {
    success: true,
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=1200&fit=crop&crop=entropy&auto=format&q=90'
  };
}

/**
 * Check if OpenAI API is configured
 */
export function isApiConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_OPENAI_API_KEY;
}