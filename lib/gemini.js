import * as FileSystem from 'expo-file-system/legacy';

// JSON Response Schema that the models are instructed to fill:
// {
//   "objects": ["Item 1", "Item 2"],
//   "context": "Brief description of the context...",
//   "activities": ["Activity 1", "Activity 2"],
//   "recommendations": ["Recommendation 1", "Recommendation 2"]
// }

export const PROMPTS = {
  academic: `Analyze this image from an academic/educational perspective. 
Identify educational elements, learning tools, scientific topics, or subject matter. 
Provide your response strictly in the following JSON format:
{
  "objects": ["List of key academic/educational objects observed"],
  "context": "A detailed explanation of the scientific, historical, or educational context of the image.",
  "activities": ["List of potential educational activities, research, or study items related to this scene"],
  "recommendations": ["Actionable study recommendations, research questions, or educational follow-ups"]
}`,

  safety: `Analyze this image from a safety, security, and hazard detection perspective.
Identify safety equipment, potential hazards, signs, or security concerns.
Provide your response strictly in the following JSON format:
{
  "objects": ["List of safety equipment, warning signs, or physical elements observed"],
  "context": "A detailed explanation of the safety environment, level of risk, and general situational context.",
  "activities": ["List of immediate safety checks, monitoring activities, or precautionary measures required"],
  "recommendations": ["Actionable safety improvements, hazard mitigation guidelines, or training recommendations"]
}`,

  inventory: `Analyze this image from an inventory, asset tracking, and count perspective.
Identify items, products, equipment, tools, and their general quantities.
Provide your response strictly in the following JSON format:
{
  "objects": ["List of items, assets, or stock detected along with approximate counts or labels"],
  "context": "A detailed explanation of the storage conditions, cataloging status, or warehouse context.",
  "activities": ["List of stock check, sorting, replenishing, or cataloging activities suggested by the image"],
  "recommendations": ["Actionable recommendations for stock organization, tracking improvements, or replenishment needs"]
}`
};

/**
 * Reads a local image URI and converts it to a base64 string
 * @param {string} uri - Local image path from camera
 * @returns {Promise<string>} Base64 encoded file content
 */
export async function imageToBase64(uri) {
  try {
    if (!uri) {
      throw new Error('No image URI provided.');
    }
    // Clean file protocol prefix if present
    const cleanUri = uri.startsWith('file://') ? uri.substring(7) : uri;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    return base64;
  } catch (error) {
    console.error('Error reading image file:', error);
    throw new Error('Failed to process image file: ' + error.message);
  }
}

/**
 * Routes the base64 image and prompt to the correct API provider (OpenRouter or Gemini)
 * @param {string} base64Image - Base64 string of the image
 * @param {string} promptText - Selected prompt instruction
 * @returns {Promise<object>} Parsed JSON result
 */
export async function analyzeImage(base64Image, promptText) {
  const openRouterKey = process.env.EXPO_PUBLIC_OPENROUTER_KEY;

  if (openRouterKey && openRouterKey !== 'your-openrouter-api-key') {
    console.log('Using OpenRouter Free Vision API for analysis...');
    return await analyzeWithOpenRouter(base64Image, promptText, openRouterKey);
  } else {
    console.log('Using Google Gemini API for analysis...');
    const geminiKey = process.env.EXPO_PUBLIC_GEMINI_KEY;
    return await analyzeWithGemini(base64Image, promptText, geminiKey);
  }
}

/**
 * Sends request to OpenRouter using Llama 3.2 11B Vision Free model
 */
async function analyzeWithOpenRouter(base64Image, promptText, apiKey) {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const requestBody = {
    model: 'openrouter/free',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: promptText + '\nReturn ONLY a valid JSON object. Do not include markdown code block wraps (like ```json ... ```), just return the raw JSON object.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    response_format: {
      type: 'json_object'
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/JerichoBelino/LabAct2',
        'X-Title': 'VisionAI Mobile'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content;

    if (!textResponse) {
      throw new Error('Empty response received from OpenRouter model.');
    }

    // Clean markdown brackets if returned
    const cleanText = textResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error in OpenRouter API call:', error);
    throw error;
  }
}

/**
 * Sends request to Google Gemini API
 */
async function analyzeWithGemini(base64Image, promptText, apiKey) {
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('EXPO_PUBLIC_GEMINI_KEY is not configured in .env file.');
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: promptText
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API HTTP Error Response:', errorText);
      if (response.status === 429) {
        throw new Error('Gemini API rate limit/quota exceeded. Please wait a moment before trying again, or check your Google AI Studio billing/plan.');
      }
      throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('Empty response received from Gemini model.');
    }

    // Clean markdown code blocks if returned by the model
    const cleanText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedData = JSON.parse(cleanText);
    return parsedData;
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    throw error;
  }
}
