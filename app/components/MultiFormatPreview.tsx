// app/components/MultiFormatPreview.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Play, Pause, Maximize, RefreshCw, AlertTriangle, Brain, Download, Film, Camera, Loader2, Video } from 'lucide-react';
import { AnimationEngineId } from '../lib/config';
import { triggerDownload } from '../lib/utils';
import { renderManimAnimationAPI, ManimRenderResponse } from '../lib/manimService'; // Ensure this path is correct

interface MultiFormatPreviewProps {
  engine: AnimationEngineId | string;
  code: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const MultiFormatPreview: React.FC<MultiFormatPreviewProps> = ({ engine, code, isPlaying, onTogglePlay }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'live' | 'mobile'>('live');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isManimRendering, setIsManimRendering] = useState(false);
  const [manimRenderResult, setManimRenderResult] = useState<ManimRenderResponse | null>(null);
  const [manimRenderLogs, setManimRenderLogs] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const runCodeInIframe = useCallback((htmlContent: string, targetElement: HTMLDivElement) => {
    if (typeof window === 'undefined') return;
    try {
      targetElement.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframeRef.current = iframe;
      iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.border = 'none';
      iframe.style.backgroundColor = '#1e1e1e'; iframe.style.borderRadius = '8px';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-modals');
      targetElement.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (!doc) throw new Error("Iframe document not accessible for writing.");
      doc.open(); doc.write(htmlContent); doc.close();
      if (iframe.contentWindow) {
        iframe.contentWindow.onerror = (message, source, lineno, colno, error) => {
          console.error("Error INSIDE iframe:", message, source, lineno, colno, error);
          setPreviewError(`Runtime error: ${message} (at ${source || 'iframe'}:${lineno || '-'}:${colno || '-'})`);
          return true;
        };
        iframe.contentWindow.addEventListener('error', (event) => {
          if (event.target && (event.target as HTMLScriptElement).src) {
            setPreviewError(`Failed to load script in iframe: ${(event.target as HTMLScriptElement).src}`);
          }
        }, true);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Preview setup error (runCodeInIframe):', error);
      setPreviewError(`Failed to setup preview: ${errorMessage}`);
    }
  }, []);

  const generateHtmlContent = useCallback(() => {
    let htmlContent = '';
    if (engine === 'manim') return ''; 
    switch (engine) {
      case 'p5js': htmlContent = `<!DOCTYPE html><html><head><title>p5.js Preview</title><script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js" defer></script><style>body{margin:0;overflow:hidden;display:flex;justify-content:center;align-items:center;height:100vh;background-color:#f0f0f0;}canvas{display:block;box-shadow:0 0 10px rgba(0,0,0,0.2);}</style></head><body><script>${code}</script></body></html>`; break;
      case 'threejs': htmlContent = `<!DOCTYPE html><html><head><title>Three.js Preview</title><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script><style>body{margin:0;overflow:hidden;background-color:#111;}canvas{display:block;}</style></head><body><script>window.onload=function(){try{(function(){${code}})()}catch(e){console.error('Three.js runtime error:',e);window.parent.postMessage({type:'previewError',message:e.message,source:'threejs-preview'},'*')}};</script></body></html>`; break;
      case 'gsap': htmlContent = code; break;
      case 'babylonjs': htmlContent = `<!DOCTYPE html><html><head><title>Babylon.js Preview</title><script src="https://cdn.babylonjs.com/babylon.js"></script><script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script><style>html,body{overflow:hidden;width:100%;height:100%;margin:0;padding:0}#renderCanvas{width:100%;height:100%;touch-action:none}</style></head><body><canvas id="renderCanvas"></canvas><script>${code}</script></body></html>`; break;
      case 'd3js': htmlContent = `<!DOCTYPE html><html><head><title>D3.js Preview</title><script src="https://d3js.org/d3.v7.min.js"></script><style>body{margin:0;overflow:auto;display:flex;justify-content:center;align-items:center;min-height:100vh;background-color:#fff;padding:20px;box-sizing:border-box}#chart_container{width:100%;max-width:800px;height:auto;min-height:400px}</style></head><body><div id="chart_container"></div><script>${code}</script></body></html>`; break;
      case 'lottie': try { JSON.parse(code); htmlContent = `<!DOCTYPE html><html><head><title>Lottie Preview</title><script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script><style>body{margin:0;overflow:hidden;display:flex;justify-content:center;align-items:center;height:100vh;background-color:#fff}#lottie-container{width:80%;height:80%;max-width:500px;max-height:500px}</style></head><body><div id="lottie-container"></div><script>try{const animData=${code};lottie.loadAnimation({container:document.getElementById('lottie-container'),renderer:'svg',loop:true,autoplay:true,animationData:animData})}catch(e){console.error('Lottie load error:',e);document.body.innerHTML='<p style="color:red;text-align:center;">Lottie Load Error: '+(e instanceof Error?e.message:String(e))+'</p>'}};</script></body></html>`; } catch (e: unknown) { const errorMessage = e instanceof Error ? e.message : 'Unknown error'; setPreviewError(`Invalid Lottie JSON: ${errorMessage}`); return ''; } break;
      case 'anime': htmlContent = `<!DOCTYPE html><html><head><title>Anime.js Preview</title><script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script><style>body{margin:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background-color:#f0f0f0}.element-to-animate{width:100px;height:100px;background-color:#FF1464;border-radius:8px;margin:10px}</style></head><body><div class="element-to-animate" id="elementToAnimate"></div><div class="element-to-animate" id="box1"></div><div class="element-to-animate" id="box2"></div><script>${code}</script></body></html>`; break;
      default: if (code) setPreviewError(`Unsupported engine for HTML preview: ${engine}`); return '';
    }
    return htmlContent;
  }, [code, engine]);

  useEffect(() => {
    if (engine === 'manim') {
      if (previewRef.current && previewRef.current.firstChild?.nodeName === 'IFRAME') {
        previewRef.current.innerHTML = ''; iframeRef.current = null;
      }
      if (!isManimRendering) { setManimRenderResult(null); }
      return;
    }
    if (!previewRef.current) {
      if (code && !previewError) console.warn("MultiFormatPreview: previewRef.current is null. Iframe not ready.");
      return;
    }
    if (!code) {
      previewRef.current.innerHTML = ''; iframeRef.current = null; setPreviewError(null);
      return;
    }
    if (previewError) { console.log("MultiFormatPreview: Skipping iframe render due to existing previewError for non-Manim engine:", previewError); return;}
    
    const htmlContent = generateHtmlContent();
    if (htmlContent) { runCodeInIframe(htmlContent, previewRef.current); }
    else if (!previewError && code) { setPreviewError(`Failed to generate HTML content for preview for engine: ${engine}.`); }
  }, [code, engine, generateHtmlContent, runCodeInIframe, previewError, isManimRendering]);

  useEffect(() => { 
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'previewError' && event.data.source === 'threejs-preview') {
        setPreviewError(`Three.js Error in preview: ${event.data.message}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const toggleFullscreen = () => { 
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const previewContainer = previewRef.current?.closest('.bg-gray-800'); 
    if (!previewContainer) { console.warn("Preview container for fullscreen not found."); return; }
    if (!document.fullscreenElement) { previewContainer.requestFullscreen().catch(err => { setPreviewError(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`); }); }
    else { if (document.exitFullscreen) { document.exitFullscreen(); } }
  };
  useEffect(() => { 
    if (typeof document === 'undefined') return; 
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const startRecording = async () => { 
    if (!iframeRef.current || !iframeRef.current.contentWindow) { setPreviewError("No live preview to record."); return; }
    const iframeDoc = iframeRef.current.contentWindow.document;
    const canvas = iframeDoc.querySelector('canvas');
    if (!canvas) { setPreviewError("Could not find a canvas element in the preview to record."); return; }
    try {
      const stream = canvas.captureStream(30); 
      if (!MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) { setPreviewError("WebM VP9 codec not supported."); return; }
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      recordedChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) recordedChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = () => { const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' }); const url = URL.createObjectURL(blob); setRecordedVideoUrl(url); setIsRecording(false); };
      mediaRecorderRef.current.start(); setIsRecording(true); setRecordedVideoUrl(null); setPreviewError(null);
    } catch (error: unknown) { const errorMessage = error instanceof Error ? error.message : 'Unknown error'; console.error("Error starting recording:", error); setPreviewError(`Failed to start recording: ${errorMessage}.`); setIsRecording(false); }
  };
  const stopRecording = () => { if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') { mediaRecorderRef.current.stop(); } };

  const handleRenderManimClick = async () => {
    if (!code || engine !== 'manim') return;
    setIsManimRendering(true);
    setPreviewError(null); 
    setManimRenderResult(null);
    setManimRenderLogs("Sending Manim code to server for rendering...");
    let sceneName = "GeneratedScene";
    const sceneNameMatch = code.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*Scene\s*\)\s*:/);
    if (sceneNameMatch && sceneNameMatch[1]) { sceneName = sceneNameMatch[1]; }
    console.log(`Extracted/Default Scene Name for Manim: ${sceneName}`);
    const result = await renderManimAnimationAPI(code, sceneName);
    setManimRenderResult(result);
    setManimRenderLogs(result.logs || result.message || "Processing complete.");
    if (!result.success) {
      setPreviewError(result.message || "Manim rendering failed on the server. Check logs.");
    }
    setIsManimRendering(false);
  };
  
  const handleRefreshPreview = useCallback(() => {
    console.log("Refresh/Retry Preview Clicked. Clearing previewError.");
    setPreviewError(null);
    if (engine === 'manim') {
      setManimRenderResult(null); 
    }
  }, [engine]);

  const getPreviewContent = () => {
    if (previewError && !(engine === 'manim' && (isManimRendering || manimRenderResult))) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 bg-red-50 rounded-lg">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <div className="text-lg font-medium mb-1 text-red-600">Preview Error</div>
          <div className="text-sm opacity-85 text-red-500 text-center max-w-md break-words">{previewError}</div>
          <button onClick={handleRefreshPreview} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">
            Retry Preview
          </button>
        </div>
      );
    }
    if (engine === 'manim') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 space-y-3 w-full">
          <Brain className="w-10 h-10 mx-auto text-blue-400" />
          <div className="text-md font-medium text-gray-600">Manim Animation (Python)</div>
          {manimRenderResult?.success && manimRenderResult.videoUrl && (
            <div className="mt-2 w-full max-w-lg"><video ref={videoRef} controls src={manimRenderResult.videoUrl} className="w-full rounded-lg shadow-lg" key={manimRenderResult.videoUrl}>Your browser does not support the video tag.</video></div>
          )}
          {isManimRendering && (<div className="flex flex-col items-center space-y-2 text-sm"><Loader2 className="w-6 h-6 animate-spin text-green-500" /><span>Rendering on Server...</span></div>)}
          {!isManimRendering && !manimRenderResult?.videoUrl && !previewError && (<div className="text-xs opacity-75 text-center max-w-sm">Manim code is rendered on the server to produce a video. Click below to start.</div>)}
          {code && (<div className="mt-2 space-y-2 flex flex-col items-center">
            <button onClick={handleRenderManimClick} disabled={isManimRendering || !code} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed">{isManimRendering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}{isManimRendering ? 'Rendering...' : (manimRenderResult?.videoUrl ? 'Re-render Video' : 'Render Video Preview')}</button>
            <button onClick={() => triggerDownload(`manim_animation_${Date.now()}.py`, code, 'text/x-python')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"><Download className="w-4 h-4 mr-2" /> Download Manim Code</button>
          </div>)}
          {manimRenderLogs && (<div className="mt-2 p-2 bg-gray-700 text-gray-300 rounded-md w-full max-w-lg max-h-32 overflow-y-auto text-xs font-mono"><h4 className="font-semibold mb-1 text-gray-400">Render Logs:</h4><pre className="whitespace-pre-wrap break-all">{manimRenderLogs}</pre></div>)}
          {previewError && engine === 'manim' && (<div className="mt-2 text-sm text-red-400 text-center max-w-md break-words">{previewError}</div>)}
        </div>
      );
    }
    if (!code) { return (<div className="flex flex-col items-center justify-center h-full text-gray-400"><Eye className="w-16 h-16 text-gray-500 mx-auto mb-4" /><div className="text-lg font-medium mb-1 text-gray-600">Ready for Preview</div><div className="text-sm opacity-75">Generate or select code to see your animation.</div></div>); }
    return (<div ref={previewRef} className={`w-full h-full bg-gray-800 ${previewMode === 'mobile' ? 'max-w-xs mx-auto my-auto border-8 border-gray-900 rounded-3xl overflow-hidden shadow-2xl' : ''}`} style={previewMode === 'mobile' ? { aspectRatio: '9/19.5' } : {}} />);
  };
  
  return (
    <div className="border rounded-xl overflow-hidden shadow-lg bg-white">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">Live Preview</span>
            {engine !== 'manim' && (<div className="flex items-center space-x-1 bg-white rounded-lg p-0.5 shadow-sm border">{[{id:'live' as const, name:'Live', icon:<Eye size={14}/>}, {id:'mobile' as const, name:'Mobile', icon:<Camera size={14}/>}].map((mode) => (<button key={mode.id} onClick={() => setPreviewMode(mode.id)} className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${previewMode === mode.id ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>{mode.icon}<span>{mode.name}</span></button>))}</div>)}
          </div>
          <div className="flex items-center space-x-2">
            {engine !== 'manim' && (<button onClick={onTogglePlay} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title={isPlaying ? "Pause" : "Play"} disabled={!code}>{isPlaying ? <Pause className="w-4 h-4 text-gray-600" /> : <Play className="w-4 h-4 text-gray-600" />}</button>)}
            <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Toggle Fullscreen"><Maximize className="w-4 h-4 text-gray-600" /></button>
            <button onClick={handleRefreshPreview} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Refresh Preview / Retry" disabled={(!code && !previewError) || (engine === 'manim' && isManimRendering)}><RefreshCw className="w-4 h-4 text-gray-600" /></button>
          </div>
        </div>
      </div>
      <div className={`bg-gray-800 relative flex items-center justify-center ${isFullscreen ? 'fixed inset-0 z-50' : 'h-96 md:h-[500px]'}`}>{getPreviewContent()}
         {code && !previewError && engine !== 'manim' && !isFullscreen && (engine === 'p5js' || engine === 'threejs' || engine === 'babylonjs' || engine === 'lottie') && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
             <button onClick={isRecording ? stopRecording : startRecording} className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${isRecording ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700'}`}> <Film className="w-3.5 h-3.5" /> <span>{isRecording ? 'Stop Recording' : 'Record Video'}</span> </button>
            {recordedVideoUrl && ( <a href={recordedVideoUrl} download={`animation_${engine}.webm`} className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"> <Download className="w-3.5 h-3.5" /> <span>Download</span> </a> )}
          </div>
        )}
      </div>
    </div>
  );
};
export default MultiFormatPreview;
