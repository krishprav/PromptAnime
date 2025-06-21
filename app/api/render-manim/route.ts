// app/api/render-manim/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// Helper function to execute shell commands
const execShellCommand = (cmd: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(`Command execution error for "${cmd}": ${error.message}`);
        // Resolve with stderr for Manim errors, as Manim often outputs errors to stderr
        // but might still produce some output or partial files.
        // The calling function should check for specific error patterns in stderr.
        resolve({ stdout, stderr }); 
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pythonCode: string = body.code;
    const sceneName: string = body.sceneName || "GeneratedScene"; // Default scene name

    if (!pythonCode || typeof pythonCode !== 'string') {
      return NextResponse.json({ success: false, message: "Invalid Manim code provided." }, { status: 400 });
    }

    console.log(`API Route: Received Manim code for rendering scene: ${sceneName}`);

    // --- Temporary File Handling ---
    const tempDir = path.join(process.cwd(), 'tmp_manim_renders');
    const publicDirForVideos = path.join(process.cwd(), 'public', 'manim_videos');
    const uniqueId = uuidv4();
    const pythonFilePath = path.join(tempDir, `${uniqueId}_${sceneName}.py`);
    const outputDir = path.join(tempDir, uniqueId); // Manim will create subdirs here
    
    // Ensure directories exist
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(publicDirForVideos, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true }); // Manim needs this base output dir

    await fs.writeFile(pythonFilePath, pythonCode);
    console.log(`Temporary Manim script saved to: ${pythonFilePath}`);

    // --- Manim Execution ---
    // Adjust quality: -ql (low), -qm (medium), -qh (high), -qk (4k)
    // Adjust frame rate: --frame_rate 15 (default 15 for -ql, 30 for -qm, 60 for -qh)
    // Output directory needs to be specified relative to where Manim runs or absolute.
    // The `manim render` command is simpler and often preferred over `manim -pql ...`
    // Manim automatically creates media/videos/<script_name_without_py>/<quality>/<SceneName>.mp4
    
    // We need to tell Manim where to output files relative to the script's location or use absolute paths
    // For simplicity, let Manim output to its default relative media directory, then we copy.
    // The script name for Manim is `${uniqueId}_${sceneName}.py`
    // So, default output would be relative to `tempDir` in `media/videos/${uniqueId}_${sceneName}/<quality>/${sceneName}.mp4`

    const manimCommand = `manim render -ql "${pythonFilePath}" ${sceneName} --media_dir "${outputDir}"`;
    
    console.log(`Executing Manim command: ${manimCommand}`);
    const { stdout, stderr } = await execShellCommand(manimCommand);

    let logs = `Stdout:\n${stdout}\n\nStderr:\n${stderr}`;
    console.log("Manim Execution Logs:\n", logs);

    // --- Output File Handling ---
    // Manim's output structure: <media_dir>/videos/<script_name_no_ext>/<quality>/<SceneName>.mp4
    // Our script name (without .py) is `${uniqueId}_${sceneName}`
    // Our quality is low (`-ql`), which typically means 480p15 or similar.
    // We need to find the exact output path. Manim's output path can be tricky.
    // Let's try to find the mp4 file in the output directory.
    
    const videoDirForScene = path.join(outputDir, 'videos', `${uniqueId}_${sceneName}`, '480p15');
    const videoFileName = `${sceneName}.mp4`;
    const finalVideoPath = path.join(videoDirForScene, videoFileName);
    
    let videoUrl: string | undefined = undefined;

    try {
        await fs.access(finalVideoPath); // Check if file exists
        const publicVideoFileName = `${uniqueId}_${sceneName}.mp4`;
        const publicVideoPath = path.join(publicDirForVideos, publicVideoFileName);
        await fs.copyFile(finalVideoPath, publicVideoPath);
        videoUrl = `/manim_videos/${publicVideoFileName}`; // URL relative to /public
        console.log(`Manim video successfully rendered and copied to: ${publicVideoPath}`);
        logs += `\nVideo available at: ${videoUrl}`;
    } catch (fileError) {
        console.error(`Error accessing or copying Manim output file: ${finalVideoPath}`, fileError);
        logs += `\nError: Could not find or access the rendered video file. Manim might have failed. Check stderr. Searched: ${finalVideoPath}`;
        // Check stderr for common Manim errors
        if (stderr.includes("No scenes found") || stderr.includes("ModuleNotFoundError") || stderr.includes("SyntaxError")) {
             return NextResponse.json({ success: false, message: "Manim script error or no scenes found. Check logs.", logs }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: "Manim rendering process completed, but output video not found. Check logs.", logs }, { status: 500 });
    } finally {
      // --- Cleanup ---
      // await fs.rm(tempDir, { recursive: true, force: true }).catch(err => console.error("Error cleaning up temp dir:", err));
      // Defer cleanup or make it more robust, as quick cleanup might interfere if file serving is also from temp
      // For now, we are copying to public, so temp can be cleaned.
      await fs.unlink(pythonFilePath).catch(err => console.error(`Error deleting temp script ${pythonFilePath}:`, err));
      // Consider removing the entire uniqueId outputDir after copying
      await fs.rm(outputDir, { recursive: true, force: true }).catch(err => console.error(`Error deleting temp output dir ${outputDir}:`, err));
    }

    return NextResponse.json({
      success: true,
      videoUrl: videoUrl,
      message: "Manim animation rendered successfully.",
      logs: logs
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("API Route: Unhandled error processing Manim render request:", error);
    return NextResponse.json({ success: false, message: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}
