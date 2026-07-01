// Import URL polyfill for Supabase compatibility with React Native's JS environment
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

// Initialize Supabase only if valid configuration credentials are provided
if (
  supabaseUrl &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your-supabase-anon-key'
) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.log('Supabase credentials not configured. History operations will run in local mock mode.');
}

/**
 * Check if Supabase client is properly initialized
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return supabase !== null;
}

/**
 * Saves a visual analysis result to Supabase
 * @param {string} promptType - The chosen category (academic, safety, inventory)
 * @param {object} geminiResponse - The JSON response from Gemini
 * @param {object|null} roboflowResponse - The object detection response from Roboflow (optional)
 * @returns {Promise<object|null>} The inserted database record, or null
 */
export async function saveAnalysis(promptType, geminiResponse, roboflowResponse = null) {
  if (!supabase) {
    console.log('Supabase not configured. Skipping database save.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('vision_history')
      .insert([
        {
          prompt_type: promptType,
          gemini_response: geminiResponse,
          roboflow_response: roboflowResponse,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      throw error;
    }
    return data?.[0] || null;
  } catch (error) {
    console.error('Error saving analysis history in Supabase:', error);
    // Throw error so ResultScreen can display if database saving failed
    throw error;
  }
}

/**
 * Retrieves past analysis logs ordered by date (newest first)
 * @returns {Promise<Array>} List of historical analysis entries
 */
export async function getHistory() {
  if (!supabase) {
    console.log('Supabase not configured. Returning empty history list.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('vision_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching analysis history from Supabase:', error);
    throw error;
  }
}
