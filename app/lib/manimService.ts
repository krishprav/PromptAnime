// app/lib/manimService.ts (or add to aiService.ts)

export interface ManimRenderResponse {
    success: boolean;
    videoUrl?: string;
    thumbnailUrl?: string; // Optional
    message?: string;
    logs?: string;
  }
  
  export const renderManimAnimationAPI = async (pythonCode: string, sceneName?: string): Promise<ManimRenderResponse> => {
    console.log("Sending Manim code to /api/render-manim for rendering...");
    try {
      const response = await fetch('/api/render-manim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: pythonCode,
          sceneName: sceneName || "GeneratedScene" // Pass scene name if known, else default
        }),
      });
  
      if (!response.ok) {
        // Try to parse error JSON, otherwise use statusText
        let errorData: { message?: string } = { message: `Server error: ${response.status}`};
        try {
          errorData = await response.json();
        } catch {
          // Ignore if response is not JSON
        }
        console.error("Manim render API error response:", errorData);
        return { success: false, message: errorData.message || `Failed to start Manim rendering. Status: ${response.status}` };
      }
  
      const result = await response.json();
      console.log("Manim render API call successful, result:", result);
      return result as ManimRenderResponse;
  
    } catch (error: unknown) {
      console.error("Error calling Manim render API endpoint:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Network error or an unexpected issue occurred: ${errorMessage}` };
    }
  };
  
