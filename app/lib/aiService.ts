import {
  API_TIMEOUT_MS,
  AnimationEngineId,
  ANIMATION_ENGINES_CONFIG,
  DEFAULT_GEMINI_MODEL,    
  DEFAULT_OPENROUTER_MODEL 
} from './config';
import { promiseWithTimeout } from './utils';

const callDirectGeminiAPI = async (
  systemInstruction: string,
  userContent: string,
  modelToUse?: string
): Promise<string> => {
  const geminiApiKey = process.env.NEXT_PUBLIC_DIRECT_GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error("Gemini API key (NEXT_PUBLIC_DIRECT_GEMINI_API_KEY) is not configured.");
    throw new Error("Gemini API key is not configured.");
  }

  const selectedModel = modelToUse || DEFAULT_GEMINI_MODEL;
  const payload = {
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    system_instruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { /* temperature: 0.7, maxOutputTokens: 8192 */ }
  };
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiApiKey}`;

  console.log(`Attempting Direct Gemini API call with model ${selectedModel}... Payload size: ${JSON.stringify(payload).length}`);
  const response = await promiseWithTimeout(
    fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
    API_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse error response from Gemini." } }));
    const errMsg = errorData?.error?.message || response.statusText || 'Unknown Gemini API error';
    console.error('Direct Gemini API Error:', errMsg, 'Status:', response.status, 'Raw Error Data:', errorData);
    throw new Error(`Gemini API request failed: ${errMsg} (Status: ${response.status})`);
  }
  const result = await response.json();
  if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
    let text = result.candidates[0].content.parts[0].text;
    const fenceRegex = /^```(?:[\w\-]*\s*\n)?([\s\S]*?)\n?\s*```$/s;
    const match = text.match(fenceRegex);
    if (match?.[1] && !userContent.toLowerCase().includes("gsap")) {
      text = match[1].trim();
    }
    console.log("Direct Gemini call successful.");
    return text;
  }
  console.error('Unexpected Direct Gemini API response structure:', result);
  throw new Error('Direct Gemini response did not contain expected content.');
};

// --- OpenRouter API Call (Optional Fallback) ---
const callOpenRouterAPI = async (
  systemInstruction: string,
  userContent: string,
  modelToUse?: string
): Promise<string> => {
  const openRouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    throw new Error("OpenRouter API key not configured for this call.");
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PromptAnimatorPro';
  const selectedModel = modelToUse || DEFAULT_OPENROUTER_MODEL;

  const payload = {
    model: selectedModel,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userContent }
    ],
  };
  const apiUrl = `https://openrouter.ai/api/v1/chat/completions`;

  console.log(`Attempting OpenRouter (Fallback) API call with model ${selectedModel}... Payload size: ${JSON.stringify(payload).length}`);
  const response = await promiseWithTimeout(
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': appName,
      },
      body: JSON.stringify(payload)
    }),
    API_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse error response from OpenRouter." } }));
    const errorMessage = errorData?.error?.message || response.statusText || 'Unknown OpenRouter API error';
    console.error('OpenRouter API Error:', errorMessage, 'Status:', response.status, 'Details:', errorData);
    throw new Error(`OpenRouter API request failed: ${errorMessage} (Status: ${response.status})`);
  }
  const result = await response.json();
  if (result.choices?.[0]?.message?.content) {
    let text = result.choices[0].message.content;
    const fenceRegex = /^```(?:[\w\-]*\s*\n)?([\s\S]*?)\n?\s*```$/s;
    const match = text.match(fenceRegex);
    if (match?.[1] && !userContent.toLowerCase().includes("gsap")) {
      text = match[1].trim();
    }
    console.log("OpenRouter fallback call successful.");
    return text;
  }
  console.error('Unexpected OpenRouter API response structure:', result);
  throw new Error('OpenRouter fallback response did not contain expected content.');
};

// --- Unified AI Call Function ---
const unifiedAICall = async (
  systemInstruction: string,
  userContent: string,
  preferredGeminiModel?: string,
  preferredOpenRouterModel?: string,
  serviceContext?: string
): Promise<string> => {
  try {
    console.log(`Unified AI Call (${serviceContext || 'General'}): Trying Direct Gemini with model ${preferredGeminiModel || DEFAULT_GEMINI_MODEL}...`);
    return await callDirectGeminiAPI(systemInstruction, userContent, preferredGeminiModel);
  } catch (geminiError: unknown) {
    const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : 'Unknown Gemini error';
    console.warn(`Direct Gemini failed for ${serviceContext || 'General'}: ${geminiErrorMessage}.`);
    if (process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
      console.warn("Attempting fallback to OpenRouter...");
      try {
        return await callOpenRouterAPI(systemInstruction, userContent, preferredOpenRouterModel || DEFAULT_OPENROUTER_MODEL);
      } catch (openRouterError: unknown) {
        const openRouterErrorMessage = openRouterError instanceof Error ? openRouterError.message : 'Unknown OpenRouter error';
        console.error(`OpenRouter fallback also failed for ${serviceContext || 'General'}: ${openRouterErrorMessage}`);
        throw new Error(`All AI services failed. Gemini: ${geminiErrorMessage}; OpenRouter: ${openRouterErrorMessage}`);
      }
    } else {
      console.warn("OpenRouter API key not configured. No fallback attempted for this call.");
      throw geminiError instanceof Error ? geminiError : new Error(geminiErrorMessage);
    }
  }
};

const commonJsInstructions = "The generated JavaScript code must be entirely self-contained and runnable in a browser environment. Do not include any `<script src=...></script>` tags referencing external local files like 'script.js' or 'style.css'. All necessary libraries (like p5.js, Three.js, Babylon.js, Anime.js) are assumed to be pre-loaded in the environment via CDN, and their global objects (e.g., `p5`, `THREE`, `BABYLON`, `anime`) are directly available. Do not use ES6 `import` statements for these pre-loaded libraries; access them via their global objects. Focus on providing just the core animation logic.";

export const generateAIAnimation = async (
  concept: string,
  engine: AnimationEngineId | string,
  learningLevel = 'intermediate',
  duration = 30
): Promise<{ code: string; analysis: string; }> => {
  let systemInstruction = "";
  let userContent = "";
  const engineConfig = ANIMATION_ENGINES_CONFIG[engine as AnimationEngineId];
  const preferredModelForService = engineConfig?.aiModel || DEFAULT_GEMINI_MODEL;

  switch (engine) {
    case 'manim':
      systemInstruction = `You are a world-class mathematics visualization expert using Manim Community version. Your task is to generate complete, runnable Python code for a single Manim scene. The Python code must include all necessary imports (e.g., "from manim import *"). The code must define a class that inherits from "Scene" (e.g., "class MyAnimation(Scene):"). This class must have a "construct" method where the animation logic is defined. The output MUST be ONLY the Python code itself. Do not include any markdown formatting (like \`\`\`python), explanations, introductory text, or any other text outside of the Python code block. Ensure the animation is visually clear and directly explains the concept. If the concept is complex, break it down into logical visual steps.`;
      userContent = `Create a Manim animation scene that explains the concept: "${concept}". Target audience learning level: ${learningLevel}. Approximate animation duration (guide for complexity, not strict timing): ${duration} seconds. Focus on the scene logic within the construct method. Generate Python code only.`;
      break;
    case 'p5js':
      systemInstruction = `You are an expert in creating interactive educational experiences with p5.js in global mode. Your task is to generate complete, runnable JavaScript code for a p5.js sketch. The sketch must include global "function setup() { ... }" and "function draw() { ... }" functions. ${commonJsInstructions} The output MUST be ONLY the JavaScript code itself. Do not include any markdown formatting or explanations. Create a canvas of a reasonable size, e.g., 600x400 or fill window.`;
      userContent = `Build an engaging, hands-on p5.js visualization for concept: "${concept}". Target learning level: ${learningLevel}. Define global setup() and draw() functions. Include intuitive mouse/touch interactions if they enhance understanding. Provide immediate visual feedback. Generate JavaScript code only.`;
      break;
    case 'threejs':
      systemInstruction = `You are an expert in creating immersive Three.js 3D visualizations. Your task is to generate complete, runnable JavaScript code for a Three.js scene. ${commonJsInstructions} Your script MUST create the WebGLRenderer and append \`renderer.domElement\` to \`document.body\`. Do not assume a canvas element with a specific ID already exists. The output MUST be ONLY the JavaScript code itself. The code should typically be wrapped in an IIFE: (function(){ /* your code */ })(); or define functions and call an init/animate sequence.`;
      userContent = `Generate a Three.js 3D visualization of the concept: "${concept}". Target learning level: ${learningLevel}. Use PerspectiveCamera. Implement OrbitControls. Apply lighting and materials. Include an animation loop using requestAnimationFrame. Generate JavaScript code only.`;
      break;
    case 'babylonjs':
      systemInstruction = `You are an expert in creating high-performance Babylon.js 3D simulations. Your task is to generate complete, runnable JavaScript code for a Babylon.js scene. ${commonJsInstructions} Your script MUST get the canvas element using \`document.getElementById('renderCanvas')\` (this ID is provided in the HTML shell) and initialize the Babylon engine with it. Ensure correct class instantiation like \`new BABYLON.Scene(engine);\`. Output ONLY JavaScript.`;
      userContent = `Generate a Babylon.js 3D simulation for concept: "${concept}". Target learning level: ${learningLevel}. Use ArcRotateCamera. Apply lighting. The final code should be runnable on a page with <canvas id="renderCanvas"></canvas>. JavaScript code only.`;
      break;
    case 'lottie':
      systemInstruction = `You are an expert Lottie animation designer. Your task is to generate a complete, valid Lottie JSON animation object. The output MUST be ONLY the Lottie JSON content itself, starting with \`{\` and ending with \`}\`. Do not include any markdown formatting (like \`\`\`json), explanations, or any other text outside of the JSON object. The JSON must strictly adhere to the Lottie JSON specification (e.g., properties like 'v', 'fr', 'ip', 'op', 'w', 'h', 'assets', 'layers').`;
      userContent = `Create a Lottie animation (JSON data) for the concept: "${concept}". Target learning level: ${learningLevel}. Approximate animation duration (guide for complexity): ${duration}s. Generate a single, valid Lottie JSON object only.`;
      break;
    case 'gsap':
      systemInstruction = `You are an expert in creating compelling GSAP timeline animations for the web. Your task is to generate a single, complete HTML document. This document must include all necessary HTML structure, CSS styles (within <style> tags), and JavaScript code (within <script> tags) for the GSAP animation. The JavaScript code must include a <script> tag to load GSAP from a CDN (e.g., "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"). Output ONLY the complete HTML document. No markdown.`;
      userContent = `Create a GSAP web animation for: "${concept}". Learning level: ${learningLevel}. Duration: ~${duration}s. Use GSAP timeline. Complete HTML document only.`;
      break;
    case 'anime':
      systemInstruction = `You are an expert in Anime.js for creating lightweight JavaScript animations. ${commonJsInstructions} The JavaScript code should target HTML elements (e.g., by ID or class like '.myElement', '#box'). You can assume simple placeholder HTML elements like <div id="elementToAnimate" style="width:50px; height:50px; background-color:blue;"></div> exist on the page. Output ONLY JavaScript code.`;
      userContent = `Create an Anime.js animation for: "${concept}". Target learning level: ${learningLevel}. Duration: ~${duration}s. JavaScript code only.`;
      break;
    default:
      throw new Error(`Prompts not configured for engine: ${engine}`);
  }

  try {
    const generatedCode = await unifiedAICall(
      systemInstruction,
      userContent,
      preferredModelForService, // For Gemini
      DEFAULT_OPENROUTER_MODEL,  // For OpenRouter fallback
      `Animation for ${engine}`
    );
    const analysis = `AI (${preferredModelForService} or fallback ${DEFAULT_OPENROUTER_MODEL}) generated code for ${engine}. Review and refine.`;
    return { code: generatedCode, analysis };
  } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     console.error(`Error in generateAIAnimation for ${engine}:`, error);
     throw new Error(`Failed to generate animation for ${engine}: ${errorMessage}`);
  }
};

export const refineAICode = async (code: string, language: string): Promise<{ code: string; analysis:string; }> => {
  const systemInstruction = `You are an expert code refactorer and optimizer for ${language}. Your task is to refine and optimize the provided ${language} code for clarity, performance, and best practices. Add comments where necessary to explain complex parts. Ensure the output is ONLY the refined ${language} code, with no additional text, explanations, or markdown fences. If the input is HTML (for GSAP), refine the HTML, CSS, and JS within it.`;
  const userContent = `Refine and optimize the following ${language} code:\n\n${code}`;
  
  try {
    const refinedCode = await unifiedAICall(
      systemInstruction,
      userContent,
      DEFAULT_GEMINI_MODEL,       // Primary model for this generic task
      DEFAULT_OPENROUTER_MODEL,  // Fallback model
      `Refine ${language} code`
    );
    return { code: refinedCode, analysis: `Code refined by AI. Review changes.` };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in refineAICode for ${language}:`, error);
    throw new Error(`Failed to refine code for ${language}: ${errorMessage}`);
  }
};

export const getAIAssistSuggestions = async (code: string, language: string): Promise<Array<{title: string; description: string}>> => {
  const systemInstruction = `You are an AI assistant. Provide 2-4 brief, actionable suggestions to improve the provided ${language} animation code. Respond STRICTLY with a JSON array of objects. Each object MUST have a "title" (string) and a "description" (string) field. DO NOT output any other text, explanations, or markdown formatting outside the JSON array. Example: [{"title": "Refactor Loop", "description": "Use Array.forEach for cleaner iteration."},{"title":"Add Comments","description":"Explain complex logic."}]`;
  const userContent = `Animation code in ${language}:\n\`\`\`${language}\n${code}\n\`\`\`\nWhat are some improvement suggestions? Respond ONLY with a valid JSON array of objects.`;
  
  try {
    const rawResponse = await unifiedAICall(
      systemInstruction,
      userContent,
      DEFAULT_GEMINI_MODEL,       // Primary model
      DEFAULT_OPENROUTER_MODEL,  // Fallback model
      `Suggestions for ${language}`
    );
    
    let cleanedJson = rawResponse.trim();
    const jsonMatch = cleanedJson.match(/(\[[\s\S]*?\])/); 
    if (jsonMatch && jsonMatch[0]) {
        cleanedJson = jsonMatch[0];
    } else {
      const objectMatch = cleanedJson.match(/(\{[\s\S]*?\})/);
      if (objectMatch && objectMatch[0]) {
        cleanedJson = objectMatch[0];
      } else {
        cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      }
    }
    
    console.log("AI Assist: Cleaned JSON string to parse:", cleanedJson);
    const suggestions = JSON.parse(cleanedJson);

    if (Array.isArray(suggestions) && suggestions.every(s => typeof s.title === 'string' && typeof s.description === 'string')) {
      return suggestions;
    }
    if (typeof suggestions === 'object' && suggestions !== null && typeof (suggestions as Record<string, unknown>).title === 'string' && typeof (suggestions as Record<string, unknown>).description === 'string') {
        console.warn("AI Assist: AI returned a single suggestion object, wrapping it in an array.");
        return [suggestions as {title: string; description: string}];
    }

    console.error("AI Assist: Parsed JSON is not in the expected format (array of suggestion objects):", suggestions);
    throw new Error("AI response for suggestions was not a valid array/object of suggestion items.");

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error getting or parsing AI Assist suggestions for ${language}: ${errorMessage}`);
    return [
      { title: 'AI Suggestions Failed', description: `The AI failed to provide suggestions in the correct format. Original error: ${errorMessage.substring(0, 150)}...` },
      { title: 'Manual Review Recommended', description: `Please manually review your ${language} code for potential improvements.` },
    ];
  }
};