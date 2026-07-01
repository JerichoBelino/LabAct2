/**
 * Roboflow API Object Detection Integration
 */

/**
 * Sends a base64 encoded image to the Roboflow Inference API for object detection
 * @param {string} base64Image - Base64 encoded image content
 * @returns {Promise<object|null>} List of predictions, or null if disabled/error
 */
export async function detectObjects(base64Image) {
  const apiKey = process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY;
  const model = process.env.EXPO_PUBLIC_ROBOFLOW_MODEL;

  // Roboflow is optional. If not configured, bypass without crashing.
  if (!apiKey || apiKey === 'your-roboflow-api-key' || !model || model === 'your-model-id') {
    console.log('Roboflow credentials not configured. Bypassing object detection.');
    return null;
  }

  const url = `https://detect.roboflow.com/${model}?api_key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: base64Image,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Roboflow API HTTP Error Response:', errorText);
      throw new Error(`Roboflow API error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling Roboflow object detection API:', error);
    // Return null so the main Gemini analysis still displays even if Roboflow fails
    return null;
  }
}
