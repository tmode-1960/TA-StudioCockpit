/* thomo.ART StudioCockpit - VideoMaker Module Controller */
(function () {
  "use strict";

  const _STUDIO_HEADER_IDS = new Set([
    "gpuText", "hwBadge", "comfyStatus", "comfyStatusText", "brandVersion", "btnSettings"
  ]);
  function vmGetEl(id) {
    const vmEl = document.getElementById("vm_" + id);
    if (vmEl) return vmEl;
    if (_STUDIO_HEADER_IDS.has(id)) return null;
    return document.getElementById(id);
  }

  // Sync language with StudioCockpit
  function syncStudioLang() {
    const l = (localStorage.getItem("studio_lang") || document.documentElement.lang || "de").toLowerCase();
    const nextLang = l.startsWith("en") ? "en" : "de";
    if (typeof currentLang !== "undefined" && currentLang !== nextLang) {
      currentLang = nextLang;
      localStorage.setItem("tavideomaker.lang", currentLang);
    }
    if (typeof applyI18n === "function") applyI18n();
    if (typeof renderScenes === "function" && typeof state !== "undefined" && Array.isArray(state.scenes)) {
      renderScenes();
    }
  }

/* thomo.ART VideoMaker Bilingual System (English [Default] & Deutsch) */

const I18N = {
  en: {
    // Header & Brand
    edition: "(Lantern House Edition)",
    connecting: "Connecting to ComfyUI...",
    comfyConnected: "ComfyUI Connected",
    comfyDisconnected: "ComfyUI Offline (Ready)",
    settings: "Settings",
    modelsTab: "Models & Status",

    // Hardware & Profil
    profileEco: "Eco (8 GB VRAM)",
    profileBalanced: "Balanced (12–16 GB)",
    profileUltra: "Ultra (24 GB+)",
    vramDetected: "GPU: {gpu} • VRAM: {vram} GB",
    ecoNotice: "8 GB VRAM detected: Optimized to 480p/512p with auto-upscaling to 1080p to prevent out-of-memory errors.",
    gpuOptimalNotice: "Detected Hardware: {gpu} ({vram} GB VRAM) • Optimal for MiniMax H3 ✅",

    // Modes
    mode: "Mode",
    modeDirector: "🎬 Storyboard Director",
    modeQuick: "⚡ Quick Clip",
    modeLongClip: "🎵 Long Clip",
    modeLipsync: "🗣️ Lipsync & Avatar",

    // Left Column Settings
    profileAndVram: "Profile & VRAM:",
    resolution: "Resolution & Format",
    optgroupLandscape: "Landscape (16:9)",
    optgroupPortrait: "Portrait (9:16 - Shorts / Reels / TikTok)",
    optgroupSquare: "Square (1:1)",
    resEco480: "480p Widescreen (854×480) [Recommended for 8 GB]",
    res720: "720p HD (1280×720) [Standard]",
    res1080: "1080p Full HD (1920×1080) [Recommended for RTX 3090 / 24 GB]",
    resPortrait480: "480p Portrait (480×854) [Recommended for 8 GB]",
    resPortrait720: "720p HD Portrait (720×1280) [Standard]",
    resPortrait1080: "1080p Full HD Portrait (1080×1920) [Recommended for RTX 3090 / 24 GB]",
    resSquare512: "512×512 Square [Recommended for 8 GB]",
    fps: "Frame Rate (FPS)",
    fps16: "16 FPS (Fast & Fluid)",
    fps24: "24 FPS (Cinematic Standard)",
    fps30: "30 FPS (Smooth)",
    autoUpscale1080: "Auto-upscale final video to 1080p+",
    seeds: "Random Seeds",
    videoSeed: "Video Seed",
    randomize: "Random",
    vramOptimizationTitle: "💡 VRAM Optimization",

    // Tabs
    tabStoryboard: "🎬 Director & Storyboard",
    tabQuick: "⚡ Quick Clip",
    tabLongClip: "🎵 Long Clip",
    tabLipsync: "🗣️ Lipsync Studio",
    tabPlayer: "🎞️ Studio Player & Edit",
    tabModels: "⚙️ Models & Status",

    // Storyboard
    storyboardTitle: "Timeline & Storyboard",
    storyboardMusicStyleLabel: "🎵 Film Music Style / Atmosphere (H3):",
    storyboardMusicStylePlaceholder: "e.g. Slow acoustic guitar, warm ambient strings, 80 bpm, emotional cinematic (no vocals/dialogue)...",
    sceneDialoguePlaceholder: "Spoken dialogue <d>...</d> in this shot (optional)...",
    sceneSubjectPlaceholder: "Character name (<Subject 1>)...",
    aiAssistantTitle: "✨ AI Script Assistant",
    aiScenesCount: "Scenes:",
    aiIdeaPlaceholder: "Describe your video story or concept (e.g. 'A futuristic cyberpunk chase through neon-lit streets with flying vehicles')...",
    generateStoryboard: "Draft Storyboard Scenes",
    drafting: "Drafting...",
    addScene: "+ Add Scene",
    saveProject: "💾 Save Project",
    loadProject: "📂 Load Project",
    projectSavedToast: "Project file saved successfully!",
    projectLoadedToast: "Project loaded successfully!",
    projectLoadError: "Failed to load project file: ",
    resetDefaultScenes: "↺ Reset Defaults",
    clearAllScenes: "🗑️ Clear All",
    emptyStoryboardHint: "No scenes in storyboard. Click '+ Add Scene', 'Reset Defaults' or add clips from Lipsync Studio.",
    stitchAll: "🎞️ Stitch All Scenes (Export Film)",
    btnAnimaticPreview: "🎬 Animatic Preview (Fast)",
    renderAll: "✨ Render Full Storyboard (AI Film)",
    renderScene: "Render Scene",
    btnRenderScene: "🎬 Render Scene",
    sceneRendered: "Scene rendered successfully!",
    fromPrevLabel: "Seamless continuity (link from previous shot)",
    firstFrameLabel: "Start Frame (Optional - empty for Text-to-Video):",
    lastFrameLabel: "End Frame (Optional):",
    dropImagePrompt: "+ Drop or Pick Image (Optional)",
    quickFramesHint: "💡 Text-to-Video: Leave image slots empty to generate purely from your prompt. Add an image for Image-to-Video.",
    sceneFramesHint: "💡 Leave empty for pure Text-to-Video. Add start/end images for Image-to-Video (FL2VA).",
    autoLinkedBadge: "🔗 Auto: Last frame of previous shot",
    sceneDuration: "Duration (seconds)",
    scenePrompt: "Shot Prompt & Camera Direction",
    deleteScene: "Delete",

    // Quick Clip
    quickClipTitle: "⚡ Quick Single-Shot Clip",
    videoTitleLabel: "Video Title / Filename:",
    videoTitlePlaceholder: "e.g. Hedgehog_Feast (saved as Hedgehog_Feast.mp4)",
    elapsedTime: "Elapsed Time:",
    renderCompletedIn: "Generation completed in {time}!",
    quickPromptLabel: "Prompt / Visual Description:",
    quickPromptPlaceholder: "A majestic golden eagle soaring above misty alpine mountain lakes during sunset, photorealistic, 8k...",
    quickDurationLabel: "Duration (seconds):",
    quickAudioCheckbox: "🎵 Auto Sound (AI Scene-Matched)",
    quickAudioHint: "Automatically matches an atmospheric soundscape based on your video prompt.",
    quickAudioAutoBadge: "✨ Auto-Scene Sound",
    btnSelectQuickAudio: "📂 Custom Sound",
    btnPreviewAudioRange: "Preview",
    quickWaveformHint: "💡 Tip: Click or drag on the waveform with the mouse to move the audio selection window.",
    quickAudioStartLabel: "⏱️ Audio Start Time:",
    btnSyncAudioPos: "⏱️ From Player Position",
    quickAudioVolumePrefix: "🔊 Volume: {vol}%",
    btnRenderQuick: "🚀 Render Quick Clip",

    // Long Clip
    longClipTitle: "🎵 Long Clip (Continuous MiniMax H3 Take)",
    longClipSubtitle: "Generate continuous, cinematic long videos (10–30+ sec) with audio synchronization and turbo sampling.",
    longClipEngineBadge: "✨ MiniMax H3 Ref2Vid • Turbo",
    longFramesHint: "💡 The start frame sets the opening. With an optional end frame, MiniMax interpolates continuous motion towards the target frame.",
    longTitlePlaceholder: "Video Title (e.g. Cyberpunk Dance Video)",
    longPromptLabel: "Prompt & Scene Description",
    longPromptPlaceholder: "Describe motion, camera, and mood (e.g. High energy dance performance on a neon stage, fluid motion, dynamic camera pans)...",
    longDurationLabel: "Video Duration (Seconds):",
    longAudioHeading: "🎵 Audio Track & Music Synchronization",
    longAudioHint: "Upload a song or beat (MP3, WAV, FLAC). Video motion is generated in sync with the audio track.",
    btnSelectLongAudio: "📁 Choose Audio Track",
    longTurboCheckbox: "⚡ Enable Turbo Sampling (Few-Step LoRA, ~90s render time)",
    longTurboHint: "Reduces diffusion steps for maximum rendering speed",
    turboModeLabel: "Sampling / Steps",
    turboMode8Steps: "⚡ Turbo (8 Steps — Fast)",
    turboMode20Steps: "🎬 Standard (20 Steps — Quality)",
    modeMorph: "🌀 Morph & Transform",
    tabMorph: "🌀 Morph & Transform",
    morphTitle: "🌀 Morph & Transformation",
    morphSubtitle: "Fluid, surreal morphing transitions between start and end frame (or purely from prompt).",
    morphPromptPlaceholder: "e.g. Seamless surreal morphing transformation, fluid environmental shift, dreamy evolving motion...",
    morphStrengthLabel: "Morph LoRA Strength",
    morphEndHoldLabel: "Hold End Frame (sec)",
    btnRenderMorph: "🌀 Generate Morph Clip",
    upscaleEngineLabel: "Upscale Engine",
    upscaleFfmpeg: "⚡ FFmpeg Lanczos (Fast)",
    upscaleRelayvsr: "✨ RelayVSR AI 2x (AI-HD)",
    filmLutLabel: "Film LUT (Color Look)",
    filmLutNone: "No LUT (Original)",
    btnRenderLong: "🎵 Generate Long Clip",

    // Lipsync Studio
    lipsyncTitle: "🗣️ Lipsync & Avatar Studio",
    lipsyncSubtitle: "Animate any portrait or character image with realistic lip movements synchronized to an audio file (.mp3, .wav, .flac) via MiniMax H3 + Wav2Vec2.",
    lipsyncEngineBadge: "MiniMax H3 + Wav2Vec2 + Demucs",
    lipsyncPortraitLabel: "Portrait / Character Image (Required):",
    lipsyncSecondFrameLabel: "2nd Pose / End Frame (Optional):",
    lipsyncAudioLabel: "Speech / Song Audio File:",
    dropAudioPrompt: "🎵 + Drop or Pick Audio (.mp3, .wav, .flac)",
    lipsyncStartSecLabel: "Audio Start (s):",
    lipsyncDurationSecLabel: "Clip Duration (s):",
    lipsyncStrengthLabel: "Visual Fidelity:",
    lipsyncPromptLabel: "Visual Scene & Expression Prompt:",
    lipsyncPromptPlaceholder: "e.g. A realistic woman speaking expressively into the camera with natural lip sync, subtle head movement, warm studio lighting...",
    lipsyncSubjectLabel: "Character / Subject (<Subject 1>):",
    lipsyncSubjectPlaceholder: "e.g. Elena (mapped to <Picture 1>)",
    lipsyncDialogueLangLabel: "Spoken Language:",
    langOptGerman: "Deutsch ([German])",
    langOptEnglish: "English ([English])",
    lipsyncDialogueLabel: "🗣️ Spoken Dialogue / Lyrics (<d>...</d> Tag):",
    lipsyncDialoguePlaceholder: "Enter exact spoken words or lyrics here — automatically wrapped in <Subject 1> says: <d>[Language] ...</d> for precise H3 lip sync...",
    btnTranscribeAudio: "🎙️ Recognize Text from Audio",
    transcribingAudio: "⏳ Recognizing speech...",
    lipsyncCameraPresetLabel: "🎥 Camera Direction Preset (H3 Guide):",
    camPresetSteadyCloseup: "Steady Close-Up Portrait (Recommended)",
    camPresetSlowPushIn: "Slow Push-In on Face",
    camPresetSubtleOrbit: "Subtle Half-Circle Orbit",
    camPresetSubtleTilt: "Gentle Vertical Tilt",
    camPresetOverShoulder: "Conversational Medium Shot",
    camPresetDynamicStage: "Music Video / Performance Beat",
    camPresetCustom: "Custom Camera Direction",
    lipsyncCutLabel: "Camera & Cut Direction:",
    lipsyncCutPlaceholder: "e.g. Medium close-up portrait shot, shallow depth of field, steady camera",
    lipsyncMusicStyleLabel: "🎵 Instrumental Background Style (music_style – Optional):",
    lipsyncMusicStylePlaceholder: "e.g. Warm cello, soft piano, slow tempo, 80 bpm (instrumental mood only, no vocals)...",
    lipsyncBgmLabel: "🎵 Optional Background Music (.mp3, .wav):",
    btnSelectBgm: "📂 Choose Music",
    bgmVolumePrefix: "🔊 Music Volume: {vol}%",
    lipsyncAlignPausesLabel: "✂️ Smart Camera Cut at Speech Pauses (Activity Gap)",
    lipsyncDemucsLabel: "🎤 Isolate Vocals (Hybrid Demucs – recommended for songs with instruments)",
    lipsyncCaptionsLabel: "💬 Render Lyric / Speech Captions onto Video",
    lipsyncLyricsTextLabel: "Lyrics / Spoken Text (for on-screen captions):",
    lipsyncLyricsPlaceholder: "Paste spoken text or song lyrics here...",
    btnRenderLipsyncAi: "🚀 Render Lipsync Video (ComfyUI AI)",
    btnRenderLipsyncPreview: "🎬 Fast Audio Preview (FFmpeg)",
    btnAddLipsyncToStoryboard: "➕ Add Clip to Storyboard",
    btnCancelRender: "✕ Cancel",
    cancelConfirmTitle: "Cancel Generation?",
    cancelConfirm: "Do you really want to cancel the running generation?",
    btnConfirmCancel: "✕ Yes, Cancel",
    btnKeepRunning: "Keep Running",
    cancelRequested: "Cancelling generation...",
    cancelledToast: "Generation cancelled.",

    // Studio Player
    playerTitle: "🎬 Film Player & Preview",
    bgmLabel: "Soundtrack (e.g. from tA-MusicMaker):",
    bgmPlaceholder: "Path to a .mp3 / .wav / .flac track...",
    btnReStitch: "Remix & Export",

    // Models Tab
    modelsTitle: "MiniMax H3 Models & Storage Location",
    btnCheckNow: "Check Status Again",
    btnOpenDownloadDialog: "Open Download Dialog",
    extensionsTitle: "🔌 ComfyUI Extensions & Nodes",
    extensionsSubtitle: "Essential custom node packs for video and audio processing:",
    installedBadge: "Installed ✅",
    missingBadge: "Not Installed ❌",
    btnInstallNode: "📥 Install in Background",
    installingNode: "⏳ Installing Git repo...",
    btnRestartComfy: "🔄 Restart ComfyUI",
    restartingComfy: "⏳ Restarting ComfyUI...",
    restartComfyNotice: "Restart ComfyUI after installing new custom nodes:",
    restartingComfySuccess: "ComfyUI successfully restarted! ✅",
    restartingComfyManualNotice: "Automatic restart unavailable. Please restart ComfyUI manually (close & reopen window).",
    folderOpened: "Folder opened:",
    errorOpeningFolder: "Error opening folder:",
    animaticOfflineNotice: "ComfyUI offline — generating Animatic Preview...",
    renderFailed: "Render failed:",
    extensionInstalled: "Extension successfully installed! Please restart ComfyUI.",
    extensionInstallError: "Installation error:",
    renderJobActiveError: "Another render job is currently running! Please wait or cancel it.",
    comfyOfflineError: "ComfyUI is not reachable at http://127.0.0.1:8188. Please start ComfyUI or choose Animatic Preview.",
    noScenesError: "No scenes found in the storyboard.",
    portraitRequiredError: "Please upload a portrait image (reference frame) first.",
    audioRequiredError: "Please upload an audio file (.mp3, .wav, .flac) first.",
    autoFixDirectorTitle: "Setting up Video Extension...",
    autoFixDirectorSuccess: "MiniMax H3 Director was automatically set up for you! ✅",
    directorNeedsRestartPrompt: "Extension installed! Please restart ComfyUI once (close & reopen window) to activate nodes.",
    directorMissingErrorPrompt: "ComfyUI extension 'ComfyUI-MiniMaxH3-Director' is missing. Please configure your ComfyUI path in Settings (⚙️) or install it into custom_nodes.",

    // Model Pre-Flight Dialog
    modelModalTitle: "Check Required AI Models",
    modelModalIntro: "The following model weights are required for MiniMax H3 video generation:",
    targetFolderLabel: "Target Models Directory (ComfyUI / Local):",
    btnBrowse: "📂 Browse...",
    modelsTip: "Tip: Usually the models folder of your ComfyUI installation (e.g. D:\\ComfyUI\\models or C:\\ComfyUI\\models)",
    modelSizeLabel: "Estimated Download & Storage size:",
    freeDiskLabel: "Available storage on target drive:",
    diskOk: "Sufficient free space ✅",
    diskWarning: "Warning: Low disk space on target drive!",
    btnDownloadNow: "Download Now",
    btnCancel: "Cancel",
    downloadInProgress: "Downloading models...",
    speed: "Speed",
    remainingTime: "Remaining",
    allModelsReady: "All required models are present and ready to render!",
    modelsPresentNotice: "All checkpoints are available in:",
    missingModelsNotice: "⚠️ Missing models ({missing} of {total})",

    // Settings Modal
    settingsTitle: "Settings",
    settingsInitialNoticeTitle: "👋 Welcome to thomo.ART VideoMaker!",
    settingsInitialNoticeText: "Please configure your ComfyUI installation or models and output folders first. AI models will only be checked or downloaded after you set your preferred directories.",
    cfgTheme: "Theme / Appearance",
    themeDark: "Dark (Dark Studio)",
    themeLight: "Light (Light Studio)",
    cfgLang: "Language / Sprache",
    cfgComfyUrl: "ComfyUI Server URL",
    cfgComfyDir: "ComfyUI Base Directory (optional)",
    cfgOutputDir: "Video Output Directory (e.g. F:\\Outputs\\... or D:\\...)",
    outputDirHint: "Directory where rendered scenes and finished films will be saved.",
    btnOpenOutputFolder: "Open Output Folder",
    cfgModelsDir: "Models Directory (e.g. D:\\ComfyUI\\models or C:\\ComfyUI\\models)",
    modelsDirHint: "Where MiniMax H3 checkpoints are stored and loaded.",
    cfgSave: "Save & Apply",
    cancel: "Cancel",
    cfgLlmProvider: "AI Storyboard Assistant (LLM Engine)",
    cfgOllamaUrl: "Ollama Server URL & Model",
    btnTestLlm: "Test Connection",
    cfgGeminiKey: "Gemini API Key & Model (Optional)",
    cfgTeaCacheLabel: "⚡ TeaCache Acceleration (1.5x-2x faster diffusion if node installed)",
    cfgSubtitlesLabel: "🗣️ Automatic .srt subtitle generation from audio transcription",
    lipsyncSrtLabel: "Generate subtitles / lyrics (.srt)",
    creditsTitle: "Copyright & Credits",
    creditsText: "I would like to thank CodexMundi for their support and for testing the app.",
    copyrightNotice: "© 2026 thomo.ART • VideoMaker • CodexMundi Edition",

    // Missing HTML / UI keys
    morphEngineBadge: "✨ AnimateDiff-Style H3 LoRA",
    startFrameOpt: "Start Frame (Optional)",
    endFrameOpt: "End Frame (Optional)",
    dropOrPickImage: "+ Drop or Pick Image",
    promptVisualLabel: "Prompt / Visual Description:",
    durationSecLabel: "Duration (Seconds):",
    progressRenderingScenes: "Rendering Scenes...",
    progressGeneratingClip: "Generating Clip...",
    progressGeneratingMorph: "Generating Morph Clip...",
    progressGeneratingLong: "Generating Long Clip...",
    progressRenderingLipsync: "Rendering Lipsync Video...",
    quickAudioVolumeDefault: "🔊 Volume: 100%",
    longAudioVolumeDefault: "🔊 Volume: 100%",
    bgmVolumeDefault: "🔊 Music Volume: 25%",
    btnImageToPrompt: "✨ Image→Prompt",
    videoTitleTip: "Video title / filename for the exported movie",
    saveProjectTip: "Save project to file",
    loadProjectTip: "Load project from file",
    resetDefaultScenesTip: "Restore demo scenes",
    clearAllScenesTip: "Clear all scenes in storyboard",
    btnCancelRenderTip: "Cancel",
    clearQuickAudioTip: "Reset to Auto-Sound",
    clearLongAudioTip: "Remove audio",
    removeBgmTip: "Remove",
    analyzeStartImageTip: "Analyze start image with VLM/Gemini and use as video prompt",
    genStartImageTip: "Generate start image with MiniMax H3 Image",
    genPortraitImageTip: "Generate portrait with MiniMax H3 Image",
    tierMinimaxH3: "MiniMax H3 Video (FL2VA / FastH3)",
    tierMorphLora: "🌀 Morph & Transform LoRA (AnimateDiff Style)",
    tierRelayVsr: "✨ RelayVSR AI 2x Upscaler (480p → 1080p)",
    tierMinimaxH3Image: "MiniMax H3 Image (Start Frame / Multi-Ref)",
    tierWan22: "Wan 2.2 (TI2V 5B / 14B MoE / LightX2V)",
    tierWan21: "Wan 2.1 (Legacy / InfiniteTalk)",
    detectingModels: "Detecting models...",
    detectingExtensions: "Detecting extensions...",
    detectingHardware: "Detecting hardware...",
    downloading: "Downloading...",
    initializing: "Initializing...",
    alertDefaultTitle: "Notification",
    alertDefaultMsg: "Message text here...",
    confirmDefaultTitle: "Confirmation",
    confirmDefaultMsg: "Are you sure?",
    toastClose: "Close",
    stopBtn: "Stop",
    startingStatus: "Starting...",
    aiDiffusionProgress: "AI Diffusion (ComfyUI)...",
    animaticProgress: "Generating Animatic Preview...",
    sceneAnalyzeTip: "Analyze start image and suggest prompt",
    sceneGenTip: "Generate start image with MiniMax H3 Image",
    projectSaveError: "Error saving project: ",
    invalidProjectFormat: "Invalid project format",
    downloadStartError: "Could not start download",
    modelDownloadedToast: "{model} downloaded!",
    downloadFailedToast: "Download failed: ",
    connectionError: "Connection error: ",
    imageUploadFailed: "Image upload failed: ",
    dropUploadFailed: "Drop upload failed: ",
    imageAnalysisFailed: "Image analysis failed",
    renderNetworkError: "Render network error: ",
    renderStartError: "Could not start render: ",
    renderingError: "Rendering error: ",
    renderRequestFailed: "Render request failed: ",
    stitchSuccess: "Film stitched successfully!",
    stitchFailed: "Stitch failed: ",
    stitchNetworkError: "Stitch network error: ",
    quickPromptRequired: "Please enter a prompt for the quick clip.",
    quickRenderFailed: "Quick clip render failed: ",
    quickRenderError: "Quick clip error: ",
    audioUploadFailed: "Audio upload failed: ",
    longRenderFailed: "Long clip render failed: ",
    longRenderError: "Long clip error: ",
    invalidAudioDrop: "Please drop a valid audio file (.mp3, .wav, .flac).",
    transcriptionFailed: "Transcription failed",
    transcriptionError: "Transcription error: ",
    bgmUploadFailed: "BGM upload failed: ",
    lipsyncStartFailed: "Lipsync start failed",
    lipsyncError: "Lipsync Error: ",
    lipsyncRequestError: "Lipsync request error: ",
    morphLoraMissing: "Morph LoRA missing — opening download dialog.",
    morphClipFailed: "Morph clip failed: ",
    morphClipError: "Morph clip error: ",
    imageAdoptFailed: "Could not adopt image.",
    imageTransferError: "Image transfer error: ",
  },
  de: {
    // Header & Brand
    edition: "(Lantern House Edition)",
    connecting: "Verbinde mit ComfyUI...",
    comfyConnected: "ComfyUI verbunden",
    comfyDisconnected: "ComfyUI offline (Bereit)",
    settings: "Einstellungen",
    modelsTab: "Modelle & Status",

    // Hardware & Profil
    profileEco: "Eco (8 GB VRAM)",
    profileBalanced: "Balanced (12–16 GB)",
    profileUltra: "Ultra (24 GB+)",
    vramDetected: "GPU: {gpu} • VRAM: {vram} GB",
    ecoNotice: "8 GB VRAM erkannt: Optimiert auf 480p/512p mit Auto-Upscaling auf 1080p zur Vermeidung von Speichermangel.",
    gpuOptimalNotice: "Erkannte Hardware: {gpu} ({vram} GB VRAM) • Optimal für MiniMax H3 ✅",

    // Modes
    mode: "Modus",
    modeDirector: "🎬 Storyboard Regie",
    modeQuick: "⚡ Quick Clip",
    modeLongClip: "🎵 Long Clip",
    modeLipsync: "🗣️ Lipsync & Avatar",

    // Left Column Settings
    profileAndVram: "Profil & VRAM:",
    resolution: "Auflösung & Format",
    optgroupLandscape: "Querformat (16:9)",
    optgroupPortrait: "Hochformat (9:16 - Shorts / Reels / TikTok)",
    optgroupSquare: "Quadratisch (1:1)",
    resEco480: "480p Breitbild (854×480) [Empfohlen für 8 GB]",
    res720: "720p HD (1280×720) [Standard]",
    res1080: "1080p Full HD (1920×1080) [Empfohlen für RTX 3090 / 24 GB]",
    resPortrait480: "480p Hochkant (480×854) [Empfohlen für 8 GB]",
    resPortrait720: "720p HD Hochkant (720×1280) [Standard]",
    resPortrait1080: "1080p Full HD Hochkant (1080×1920) [Empfohlen für RTX 3090 / 24 GB]",
    resSquare512: "512×512 Quadratisch [Empfohlen für 8 GB]",
    fps: "Bildwiederholrate (FPS)",
    fps16: "16 FPS (Schnell & Flüssig)",
    fps24: "24 FPS (Cinematic Standard)",
    fps30: "30 FPS (Flüssig)",
    autoUpscale1080: "Fertigen Film automatisch auf 1080p+ upscalen",
    seeds: "Zufalls-Samen (Seeds)",
    videoSeed: "Video Seed",
    randomize: "Zufällig",
    vramOptimizationTitle: "💡 VRAM Optimierung",

    // Tabs
    tabStoryboard: "🎬 Regie & Storyboard",
    tabQuick: "⚡ Quick Clip",
    tabLongClip: "🎵 Long Clip",
    tabLipsync: "🗣️ Lipsync Studio",
    tabPlayer: "🎞️ Studio Player & Schnitt",
    tabModels: "⚙️ Modelle & Status",

    // Storyboard
    storyboardTitle: "Szenen-Ablauf & Regieplan",
    storyboardMusicStyleLabel: "🎵 Filmmusik-Stil / Atmosphäre (H3):",
    storyboardMusicStylePlaceholder: "z. B. Sanfte Akustikgitarre, warme Streicher, 80 bpm, filmisch-emotional (rein instrumental, ohne Gesang)...",
    sceneDialoguePlaceholder: "Gesprochener Dialog <d>...</d> in dieser Szene (optional)...",
    sceneSubjectPlaceholder: "Charaktername (<Subject 1>)...",
    aiAssistantTitle: "✨ KI-Drehbuch Assistent",
    aiScenesCount: "Szenen:",
    aiIdeaPlaceholder: "Beschreibe die Story oder Video-Idee (z. B. 'Eine Cyberpunk-Verfolgungsjagd durch nächtliche Straßen mit schwebenden Autos')...",
    generateStoryboard: "Szenen automatisch entwerfen",
    drafting: "Entwerfe...",
    addScene: "+ Neue Szene",
    saveProject: "💾 Projekt speichern",
    loadProject: "📂 Projekt laden",
    projectSavedToast: "Projektdatei erfolgreich gespeichert!",
    projectLoadedToast: "Projekt erfolgreich geladen!",
    projectLoadError: "Fehler beim Laden der Projektdatei: ",
    resetDefaultScenes: "↺ Standard wiederherstellen",
    clearAllScenes: "🗑️ Alle leeren",
    emptyStoryboardHint: "Keine Szenen im Storyboard. Klicke auf '+ Neue Szene', 'Standard wiederherstellen' oder füge Clips aus dem Lipsync Studio hinzu.",
    stitchAll: "🎞️ Alle Szenen zusammenfügen (Film exportieren)",
    btnAnimaticPreview: "🎬 Animatic-Vorschau (Schnell)",
    renderAll: "✨ Storyboard KI-Rendern (ComfyUI)",
    renderScene: "Szene rendern",
    btnRenderScene: "🎬 Szene Rendern",
    sceneRendered: "Szene erfolgreich gerendert!",
    fromPrevLabel: "Nahtlos anschließen (Kontinuität von vorheriger Szene)",
    firstFrameLabel: "Startbild (Optional - leer für Text-zu-Video):",
    lastFrameLabel: "Endbild (Optional):",
    dropImagePrompt: "+ Bild ablegen oder wählen (Optional)",
    quickFramesHint: "💡 Text-to-Video: Bild-Slots einfach leer lassen, um rein aus dem Text-Prompt zu generieren. Mit Startbild wird das Bild animiert (Bild-zu-Video).",
    sceneFramesHint: "💡 Leer lassen für reines Text-to-Video. Bilder hinzufügen für Bild-zu-Video (FL2VA-Führung).",
    autoLinkedBadge: "🔗 Auto: Endframe der vorherigen Szene",
    sceneDuration: "Dauer (Sekunden)",
    scenePrompt: "Szenen-Prompt & Kameraführung",
    deleteScene: "Löschen",

    // Quick Clip
    quickClipTitle: "⚡ Quick Single-Shot Clip",
    videoTitleLabel: "Videotitel / Dateiname:",
    videoTitlePlaceholder: "z. B. Igel_Abenteuer (wird als Igel_Abenteuer.mp4 gespeichert)",
    elapsedTime: "Verstrichene Zeit:",
    renderCompletedIn: "Generierung abgeschlossen in {time}!",
    quickPromptLabel: "Prompt / Bildbeschreibung:",
    quickPromptPlaceholder: "Ein majestätischer Adler gleitet über alpine Bergseen im goldenen Abendlicht, photorealistisch, 8k...",
    quickDurationLabel: "Dauer (Sekunden):",
    quickAudioCheckbox: "🎵 Auto Sound (automatisch passend zum Video)",
    quickAudioHint: "Wählt vollautomatisch eine passende Klangatmosphäre anhand deines Prompts.",
    quickAudioAutoBadge: "✨ Auto-Szene Sound",
    btnSelectQuickAudio: "📂 Eigener Sound",
    btnPreviewAudioRange: "Vorhören",
    quickWaveformHint: "💡 Tipp: Mit der Maus auf die Wellenform klicken oder ziehen, um den Bereich zu verschieben.",
    quickAudioStartLabel: "⏱️ Audio-Startzeit:",
    btnSyncAudioPos: "⏱️ Aus Player übernehmen",
    quickAudioVolumePrefix: "🔊 Lautstärke: {vol}%",
    btnRenderQuick: "🚀 Quick Clip Rendern",

    // Long Clip
    longClipTitle: "🎵 Long Clip (MiniMax H3 Continuous Take)",
    longClipSubtitle: "Erstelle lange, flüssige KI-Videos (10–30+ Sek.) mit musik-synchroner Bewegung und Turbo-Sampling.",
    longClipEngineBadge: "✨ MiniMax H3 Ref2Vid • Turbo",
    longFramesHint: "💡 Startbild definiert den Anfang des Takes. Mit optionalem Endbild interpoliert MiniMax die Bewegung kontinuierlich bis zum Zielbild.",
    longTitlePlaceholder: "Titel des Videos (z. B. Cyberpunk Dance Video)",
    longPromptLabel: "Prompt & Szenen-Beschreibung",
    longPromptPlaceholder: "Beschreibe Bewegung, Kamera und Atmosphäre (z. B. High energy dance performance auf Neon-Bühne, dynamische Kamerafahrten)...",
    longDurationLabel: "Dauer des Videos (Sekunden):",
    longAudioHeading: "🎵 Audio-Track & Musik-Synchronisation",
    longAudioHint: "Lade einen Song oder Beat (MP3, WAV, FLAC) hoch. Das Video wird synchron zur Musik generiert.",
    btnSelectLongAudio: "📁 Audio-Track wählen",
    longTurboCheckbox: "⚡ Turbo-Sampling aktivieren (Few-Step LoRA, ~90s Renderzeit)",
    longTurboHint: "Reduziert Schritte für maximale Render-Geschwindigkeit",
    turboModeLabel: "Sampling / Steps",
    turboMode8Steps: "⚡ Turbo (8 Steps — Schnell)",
    turboMode20Steps: "🎬 Standard (20 Steps — Qualität)",
    modeMorph: "🌀 Morph & Transform",
    tabMorph: "🌀 Morph & Transform",
    morphTitle: "🌀 Morph & Transformation",
    morphSubtitle: "Fließende, surreale Verwandlungen zwischen Start- und Zielbild (oder rein aus dem Prompt).",
    morphPromptPlaceholder: "z. B. Nahtlose surreale Morphing-Verwandlung, fließende Übergänge, traumartige Bewegung...",
    morphStrengthLabel: "Morph-LoRA Stärke",
    morphEndHoldLabel: "Endbild halten (Sek.)",
    btnRenderMorph: "🌀 Morph-Clip generieren",
    upscaleEngineLabel: "Upscale-Engine",
    upscaleFfmpeg: "⚡ FFmpeg Lanczos (Schnell)",
    upscaleRelayvsr: "✨ RelayVSR AI 2x (KI-HD)",
    filmLutLabel: "Film-LUT (Farblook)",
    filmLutNone: "Kein LUT (Original)",
    btnRenderLong: "🎵 Long Clip generieren",

    // Lipsync Studio
    lipsyncTitle: "🗣️ Lipsync & Avatar Studio",
    lipsyncSubtitle: "Animiere ein Porträt- oder Personenbild mit realistischen Lippenbewegungen synchron zu einer Audiodatei (.mp3, .wav, .flac) via MiniMax H3 + Wav2Vec2.",
    lipsyncEngineBadge: "MiniMax H3 + Wav2Vec2 + Demucs",
    lipsyncPortraitLabel: "Porträt / Personenbild (Erforderlich):",
    lipsyncSecondFrameLabel: "2. Pose / Endbild (Optional):",
    lipsyncAudioLabel: "Sprach- oder Gesangs-Audiodatei:",
    dropAudioPrompt: "🎵 + Audiodatei ablegen oder wählen (.mp3, .wav, .flac)",
    lipsyncStartSecLabel: "Audio-Start (s):",
    lipsyncDurationSecLabel: "Clip-Dauer (s):",
    lipsyncStrengthLabel: "Bildtreue:",
    lipsyncPromptLabel: "Visuelle Szene & Ausdrucks-Prompt:",
    lipsyncPromptPlaceholder: "z. B. Eine realistische Frau spricht oder singt ausdrucksstark in die Kamera, natürliche Lippenbewegung, sanfte Kopfbewegung, warmes Studiolicht...",
    lipsyncSubjectLabel: "Charakter / Subjekt (<Subject 1>):",
    lipsyncSubjectPlaceholder: "z. B. Elena (wird mit <Picture 1> verknüpft)",
    lipsyncDialogueLangLabel: "Gesprochene Sprache:",
    langOptGerman: "Deutsch ([German])",
    langOptEnglish: "Englisch ([English])",
    lipsyncDialogueLabel: "🗣️ Gesprochener Text / Dialog (<d>...</d> Tag):",
    lipsyncDialoguePlaceholder: "Gesprochenen Satz oder Liedtext hier eingeben — wird automatisch als <Subject 1> says: <d>[Language] ...</d> für präzise H3-Lippenbewegung formatiert...",
    btnTranscribeAudio: "🎙️ Text aus Audio erkennen",
    transcribingAudio: "⏳ Erkenne Sprache...",
    lipsyncCameraPresetLabel: "🎥 Kamera-Regie Preset (H3 Guide):",
    camPresetSteadyCloseup: "Ruhige Porträt-Einstellung (Steady Close-Up – Empfohlen)",
    camPresetSlowPushIn: "Langsamer Zoom auf das Gesicht (Slow Push-In)",
    camPresetSubtleOrbit: "Sanfter Halbkreis-Schwenk (Subtle Orbit)",
    camPresetSubtleTilt: "Sanfte Neigung (Subtle Vertical Tilt)",
    camPresetOverShoulder: "Dialog- / Halbtotale (Conversational Medium Shot)",
    camPresetDynamicStage: "Musikvideo / Performance-Dynamik (Rhythmic Stage)",
    camPresetCustom: "Eigene Kamera-Anweisung (Freitext)",
    lipsyncCutLabel: "Kamera- & Schnitt-Regie:",
    lipsyncCutPlaceholder: "z. B. Medium Close-Up Porträtaufnahme, geringe Tiefenschärfe, ruhige Kameraführung",
    lipsyncMusicStyleLabel: "🎵 Instrumentaler Musik-Stil / Atmosphäre (music_style – Optional):",
    lipsyncMusicStylePlaceholder: "z. B. Warmes Cello, sanftes Piano, 80 bpm (nur Instrumentierung & Stimmung, kein Gesang)...",
    lipsyncBgmLabel: "🎵 Optionale Hintergrundmusik (.mp3, .wav):",
    btnSelectBgm: "📂 Musik wählen",
    bgmVolumePrefix: "🔊 Musik-Lautstärke: {vol}%",
    lipsyncAlignPausesLabel: "✂️ Intelligenter Schnitt bei Sprechpausen (Activity Gap)",
    lipsyncDemucsLabel: "🎤 Stimme isolieren (Hybrid Demucs – empfohlen bei Songs mit Hintergrundmusik)",
    lipsyncCaptionsLabel: "💬 Untertitel / Songtext ins Video einblenden",
    lipsyncLyricsTextLabel: "Songtext / Gesprochener Text (für Untertitel im Video):",
    lipsyncLyricsPlaceholder: "Gesprochenen Text oder Lyrics hier einfügen...",
    btnRenderLipsyncAi: "🚀 Lipsync-Video KI-Rendern (ComfyUI)",
    btnRenderLipsyncPreview: "🎬 Schnelle Audio-Vorschau (FFmpeg)",
    btnAddLipsyncToStoryboard: "➕ Zum Storyboard hinzufügen",
    btnCancelRender: "✕ Abbrechen",
    cancelConfirmTitle: "Generierung abbrechen?",
    cancelConfirm: "Möchtest du die laufende Generierung wirklich abbrechen?",
    btnConfirmCancel: "✕ Ja, abbrechen",
    btnKeepRunning: "Weiterlaufen lassen",
    cancelRequested: "Generierung wird abgebrochen...",
    cancelledToast: "Generierung wurde abgebrochen.",

    // Studio Player
    playerTitle: "🎬 Film-Player & Voransicht",
    bgmLabel: "Hintergrundmusik (z.B. aus tA-MusicMaker):",
    bgmPlaceholder: "Pfad zu einem .mp3 / .wav / .flac Song...",
    btnReStitch: "Neu Abmischen",

    // Models Tab
    modelsTitle: "MiniMax H3 Modelle & Speicherort",
    btnCheckNow: "Status neu prüfen",
    btnOpenDownloadDialog: "Download-Dialog öffnen",
    extensionsTitle: "🔌 ComfyUI Erweiterungen & Nodes",
    extensionsSubtitle: "Wichtige Custom-Node Pakete für Video- und Audioproduktion:",
    installedBadge: "Installiert ✅",
    missingBadge: "Nicht installiert ❌",
    btnInstallNode: "📥 Im Hintergrund installieren",
    installingNode: "⏳ Installiere Erweiterung...",
    btnRestartComfy: "🔄 ComfyUI neu starten",
    restartingComfy: "⏳ Starte ComfyUI neu...",
    restartComfyNotice: "Nach Installation neuer Custom Nodes ComfyUI neu starten:",
    restartingComfySuccess: "ComfyUI erfolgreich neu gestartet! ✅",
    restartingComfyManualNotice: "Automatischer Neustart nicht möglich. Bitte ComfyUI kurz manuell neu starten.",
    folderOpened: "Ordner geöffnet:",
    errorOpeningFolder: "Fehler beim Öffnen des Ordners:",
    animaticOfflineNotice: "ComfyUI offline — erstelle Storyboard Animatic...",
    renderFailed: "Rendern fehlgeschlagen:",
    extensionInstalled: "Erweiterung erfolgreich installiert! Bitte ComfyUI neu starten.",
    extensionInstallError: "Installationsfehler:",
    renderJobActiveError: "Ein anderer Render-Job läuft bereits! Bitte warten oder abbrechen.",
    comfyOfflineError: "ComfyUI ist nicht erreichbar unter http://127.0.0.1:8188. Bitte starte ComfyUI oder wähle Animatic-Preview.",
    noScenesError: "Keine Szenen im Storyboard vorhanden.",
    portraitRequiredError: "Bitte zuerst ein Porträtbild (Referenzbild) hochladen.",
    audioRequiredError: "Bitte zuerst eine Audiodatei (.mp3, .wav, .flac) hochladen.",
    autoFixDirectorTitle: "Richte Video-Erweiterung ein...",
    autoFixDirectorSuccess: "MiniMax H3 Director wurde automatisch für dich eingerichtet! ✅",
    directorNeedsRestartPrompt: "Erweiterung installiert! Bitte ComfyUI kurz neu starten (Fenster schließen & öffnen), damit die Nodes aktiv werden.",
    directorMissingErrorPrompt: "Die ComfyUI-Erweiterung 'ComfyUI-MiniMaxH3-Director' fehlt. Bitte prüfe deinen ComfyUI-Pfad in den Einstellungen (⚙️) oder installiere sie in custom_nodes.",

    // Model Pre-Flight Dialog
    modelModalTitle: "Benötigte KI-Modelle überprüfen",
    modelModalIntro: "Für die Videogenerierung mit MiniMax H3 fehlen folgende Modelldateien auf Ihrem System:",
    targetFolderLabel: "Zielordner für Modelle (ComfyUI / Lokal):",
    btnBrowse: "📂 Durchsuchen...",
    modelsTip: "Tipp: Üblicherweise der models-Ordner Ihrer ComfyUI-Installation (z. B. D:\\ComfyUI\\models oder C:\\ComfyUI\\models)",
    modelSizeLabel: "Voraussichtlicher Download- & Speicherbedarf:",
    freeDiskLabel: "Verfügbarer Speicherplatz auf Ziellaufwerk:",
    diskOk: "Ausreichend Speicher frei ✅",
    diskWarning: "Warnung: Wenig freier Speicherplatz auf der Festplatte!",
    btnDownloadNow: "Jetzt herunterladen",
    btnCancel: "Abbrechen",
    downloadInProgress: "Lade Modelle herunter...",
    speed: "Geschwindigkeit",
    remainingTime: "Verbleibend",
    allModelsReady: "Alle benötigten Modelle sind installiert und einsatzbereit!",
    modelsPresentNotice: "Alle Checkpoints sind vorhanden in:",
    missingModelsNotice: "⚠️ Fehlende Modelle ({missing} von {total})",

    // Settings Modal
    settingsTitle: "Einstellungen",
    settingsInitialNoticeTitle: "👋 Willkommen bei thomo.ART VideoMaker!",
    settingsInitialNoticeText: "Bitte konfigurieren Sie zuerst die Pfade zu Ihrer ComfyUI-Installation oder dem gewünschten Modell- und Ausgabeordner. Erst danach werden benötigte KI-Modelle geprüft und bei Bedarf heruntergeladen.",
    cfgTheme: "Erscheinungsbild / Thema",
    themeDark: "Dunkel (Dark Studio)",
    themeLight: "Hell (Light Studio)",
    cfgLang: "Sprache (Language)",
    cfgComfyUrl: "ComfyUI Server URL",
    cfgComfyDir: "ComfyUI Basis-Pfad (optional)",
    cfgOutputDir: "Video-Ausgabeordner (z. B. F:\\Outputs\\... oder D:\\...)",
    outputDirHint: "Verzeichnis, in dem gerenderte Szenen und fertige Filme gespeichert werden.",
    btnOpenOutputFolder: "Ausgabeordner öffnen",
    cfgModelsDir: "Modell-Speicherort (z. B. D:\\ComfyUI\\models oder C:\\ComfyUI\\models)",
    modelsDirHint: "Hier werden die MiniMax H3 Checkpoints gesucht und abgelegt.",
    cfgSave: "Speichern & Übernehmen",
    cancel: "Abbrechen",
    cfgLlmProvider: "KI-Drehbuch Assistent (LLM Engine)",
    cfgOllamaUrl: "Ollama Server URL & Modell",
    btnTestLlm: "Verbindung testen",
    cfgGeminiKey: "Gemini API Key & Modell (optional)",
    cfgTeaCacheLabel: "⚡ TeaCache Beschleunigung (1.5x–2x Speedup bei Diffusion)",
    cfgSubtitlesLabel: "🗣️ Automatischer .srt Untertitel-Export bei Audiotranskription",
    lipsyncSrtLabel: "Untertitel / Karaoke (.srt) erzeugen",
    creditsTitle: "Copyright & Danksagung",
    creditsText: "Ich danke CodexMundi herzlich für die Unterstützung und das Testen der App.",
    copyrightNotice: "© 2026 thomo.ART • VideoMaker • CodexMundi Edition",

    // Fehlende HTML- / UI-Keys
    morphEngineBadge: "✨ AnimateDiff-Stil H3 LoRA",
    startFrameOpt: "Startbild (Optional)",
    endFrameOpt: "Endbild (Optional)",
    dropOrPickImage: "+ Bild ablegen oder wählen",
    promptVisualLabel: "Prompt / Bildbeschreibung:",
    durationSecLabel: "Dauer (Sekunden):",
    progressRenderingScenes: "Rendere Szenen...",
    progressGeneratingClip: "Generiere Clip...",
    progressGeneratingMorph: "Generiere Morph-Clip...",
    progressGeneratingLong: "Generiere Long Clip...",
    progressRenderingLipsync: "Rendere Lipsync-Video...",
    quickAudioVolumeDefault: "🔊 Lautstärke: 100%",
    longAudioVolumeDefault: "🔊 Lautstärke: 100%",
    bgmVolumeDefault: "🔊 Musik-Lautstärke: 25%",
    btnImageToPrompt: "✨ Bild→Prompt",
    videoTitleTip: "Videotitel / Name für die Filmdatei",
    saveProjectTip: "Projekt als Datei speichern",
    loadProjectTip: "Projekt aus Datei laden",
    resetDefaultScenesTip: "Demo-Szenen wiederherstellen",
    clearAllScenesTip: "Alle Szenen im Storyboard leeren",
    btnCancelRenderTip: "Abbrechen",
    clearQuickAudioTip: "Auf Auto-Sound zurücksetzen",
    clearLongAudioTip: "Audio entfernen",
    removeBgmTip: "Entfernen",
    analyzeStartImageTip: "Startbild mit VLM/Gemini analysieren und als Video-Prompt übernehmen",
    genStartImageTip: "Startbild mit MiniMax H3 Image generieren",
    genPortraitImageTip: "Porträt mit MiniMax H3 Image generieren",
    tierMinimaxH3: "MiniMax H3 Video (FL2VA / FastH3)",
    tierMorphLora: "🌀 Morph & Transform LoRA (AnimateDiff Stil)",
    tierRelayVsr: "✨ RelayVSR AI 2x Upscaler (480p → 1080p)",
    tierMinimaxH3Image: "MiniMax H3 Image (Startbild / Multi-Ref)",
    tierWan22: "Wan 2.2 (TI2V 5B / 14B MoE / LightX2V)",
    tierWan21: "Wan 2.1 (Legacy / InfiniteTalk)",
    detectingModels: "Erkenne Modelle...",
    detectingExtensions: "Erkenne Erweiterungen...",
    detectingHardware: "Erkenne Hardware...",
    downloading: "Lade herunter...",
    initializing: "Initialisiere...",
    alertDefaultTitle: "Hinweis",
    alertDefaultMsg: "Nachrichtentext...",
    confirmDefaultTitle: "Bestätigung",
    confirmDefaultMsg: "Bist du sicher?",
    toastClose: "Schließen",
    stopBtn: "Stopp",
    startingStatus: "Starte...",
    aiDiffusionProgress: "KI-Diffusion (ComfyUI)...",
    animaticProgress: "Erstelle Animatic-Vorschau...",
    sceneAnalyzeTip: "Startbild analysieren und Prompt vorschlagen",
    sceneGenTip: "Startbild mit MiniMax H3 Image generieren",
    projectSaveError: "Fehler beim Speichern des Projekts: ",
    invalidProjectFormat: "Ungültiges Projektformat",
    downloadStartError: "Download konnte nicht gestartet werden",
    modelDownloadedToast: "{model} heruntergeladen!",
    downloadFailedToast: "Download fehlgeschlagen: ",
    connectionError: "Verbindungsfehler: ",
    imageUploadFailed: "Bild-Upload fehlgeschlagen: ",
    dropUploadFailed: "Drop-Upload fehlgeschlagen: ",
    imageAnalysisFailed: "Bildanalyse fehlgeschlagen",
    renderNetworkError: "Render-Netzwerkfehler: ",
    renderStartError: "Render konnte nicht gestartet werden: ",
    renderingError: "Render-Fehler: ",
    renderRequestFailed: "Render-Anfrage fehlgeschlagen: ",
    stitchSuccess: "Film erfolgreich zusammengefügt!",
    stitchFailed: "Zusammenfügen fehlgeschlagen: ",
    stitchNetworkError: "Netzwerkfehler beim Zusammenfügen: ",
    quickPromptRequired: "Bitte gib einen Prompt für den Quick Clip ein.",
    quickRenderFailed: "Quick-Clip-Render fehlgeschlagen: ",
    quickRenderError: "Quick-Clip-Fehler: ",
    audioUploadFailed: "Audio-Upload fehlgeschlagen: ",
    longRenderFailed: "Long-Clip-Render fehlgeschlagen: ",
    longRenderError: "Long-Clip-Fehler: ",
    invalidAudioDrop: "Bitte eine gültige Audiodatei (.mp3, .wav, .flac) ablegen.",
    transcriptionFailed: "Transkription fehlgeschlagen",
    transcriptionError: "Transkriptionsfehler: ",
    bgmUploadFailed: "BGM-Upload fehlgeschlagen: ",
    lipsyncStartFailed: "Lipsync-Start fehlgeschlagen",
    lipsyncError: "Lipsync-Fehler: ",
    lipsyncRequestError: "Lipsync-Anfragefehler: ",
    morphLoraMissing: "Morph LoRA fehlt – Download wird geöffnet.",
    morphClipFailed: "Morph-Clip fehlgeschlagen: ",
    morphClipError: "Morph-Clip-Fehler: ",
    imageAdoptFailed: "Bild konnte nicht übernommen werden.",
    imageTransferError: "Fehler bei Bildübergabe: ",
  }
};

// Default language synced from StudioCockpit
const _initStudioLang = (localStorage.getItem("studio_lang") || document.documentElement.lang || localStorage.getItem("tavideomaker.lang") || "en").toLowerCase();
let currentLang = _initStudioLang.startsWith("en") ? "en" : "de";

function t(key, vars = {}) {
  let str = (I18N[currentLang] && I18N[currentLang][key]) || (I18N["en"] && I18N["en"][key]) || (I18N["de"] && I18N["de"][key]) || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return str;
}

function applyI18n() {
  document.querySelectorAll("[data-video-i18n]").forEach(el => {
    const key = el.getAttribute("data-video-i18n");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-video-i18n-label]").forEach(el => {
    const key = el.getAttribute("data-video-i18n-label");
    el.setAttribute("label", t(key));
  });
  document.querySelectorAll("[data-video-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-video-i18n-placeholder");
    el.setAttribute("placeholder", t(key));
  });
  document.querySelectorAll("[data-video-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-video-i18n-title");
    el.setAttribute("title", t(key));
  });
}


/* thomo.ART VideoMaker Web Frontend Application Logic */

function isTurboMode() {
  const sel = vmGetEl("selTurboMode");
  return sel ? sel.value !== "quality" : true;
}

function autoMatchResolutionAspect(imgUrl) {
  const sel = vmGetEl("selResolution");
  if (!sel || !imgUrl) return;
  const probe = new Image();
  probe.onload = () => {
    const w = probe.naturalWidth || 0;
    const h = probe.naturalHeight || 0;
    if (!w || !h) return;
    const cur = sel.value || "720p";
    const isPortraitImg = h > w * 1.15;
    const isLandscapeImg = w > h * 1.15;
    const mapToPortrait = { "480p": "480p_portrait", "720p": "720p_portrait", "1080p": "1080p_portrait" };
    const mapToLandscape = { "480p_portrait": "480p", "720p_portrait": "720p", "1080p_portrait": "1080p" };
    if (isPortraitImg && mapToPortrait[cur]) {
      sel.value = mapToPortrait[cur];
      saveUiState();
      showToast(currentLang === "de" ? "Hochkant-Bild erkannt → Auflösung auf 9:16 umgestellt" : "Portrait image detected → Switched resolution to 9:16", "info", 3500);
    } else if (isLandscapeImg && mapToLandscape[cur]) {
      sel.value = mapToLandscape[cur];
      saveUiState();
      showToast(currentLang === "de" ? "Querformat-Bild erkannt → Auflösung auf 16:9 umgestellt" : "Landscape image detected → Switched resolution to 16:9", "info", 3500);
    }
  };
  probe.src = imgUrl;
}

function startJobProgressPoller(pBar, pStats, pTitle) {
  return setInterval(async () => {
    try {
      const jr = await fetch("/api/video/jobs/active");
      if (!jr.ok) return;
      const job = await jr.json();
      if (job && job.is_running) {
        const rawPct = typeof job.progress === "number" ? job.progress : job.progress_pct;
        if (typeof rawPct === "number") {
          const pct = Math.max(5, Math.min(99, Math.round(rawPct)));
          if (pBar) pBar.style.width = `${pct}%`;
          if (pStats) pStats.textContent = `${pct}%`;
        }
        if (pTitle && job.stage) pTitle.textContent = job.stage;
      }
    } catch (e) {}
  }, 1500);
}

const DEFAULT_SCENES = [
  {
    id: 1,
    title: "Scene 1: Establishing Shot",
    prompt: "Cinematic wide-angle aerial shot of a neon-lit futuristic cyberpunk metropolis, rainy reflective skyscraper facades, 8k, anamorphic lens.",
    duration: 4.5,
    from_prev: false,
    first_frame: null,
    last_frame: null,
    status: "ready",
    video_url: null,
  },
  {
    id: 2,
    title: "Scene 2: Character in Focus",
    prompt: "Camera glides closer to a solitary protagonist in a dark high-tech trenchcoat on a rooftop terrace, visor reflections, dynamic wind.",
    duration: 4.0,
    from_prev: true,
    first_frame: null,
    last_frame: null,
    status: "ready",
    video_url: null,
  },
  {
    id: 3,
    title: "Scene 3: Climax & Motion",
    prompt: "A sleek hovering flying vehicle accelerates from the volumetric fog, headlights flaring dramatically, seamless continuous motion.",
    duration: 4.0,
    from_prev: true,
    first_frame: null,
    last_frame: null,
    status: "ready",
    video_url: null,
  }
];

let state = {
  comfyConnected: false,
  hardware: null,
  activeMode: "director",
  activeTab: "storyboard",
  config: {
    comfy_url: "http://127.0.0.1:8188",
    comfy_dir: "",
    models_dir: "",
    theme: "dark",
    language: "en",
  },
  scenes: JSON.parse(JSON.stringify(DEFAULT_SCENES)),
  quickClip: {
    first_frame: null,
    last_frame: null,
    video_url: null,
    audio_file: null,
    audio_filename: "",
    audio_volume: 1.0,
    refpacks: [],
  },
  morphClip: {
    first_frame: null,
    last_frame: null,
    video_url: null,
  },
  lipsync: {
    portrait_image: null,
    second_image: null,
    audio_file: null,
    audio_filename: "",
    bgm_file: null,
    bgm_filename: "",
    bgm_volume: 0.25,
    video_url: null,
  },
  longClip: {
    first_frame: null,
    last_frame: null,
    video_url: null,
    audio_file: null,
    audio_filename: "",
    audio_volume: 1.0,
    turbo: true,
    refpacks: [],
  },
  modelsCheckedOnStartup: false,
};

// --- Time Format Helpers ---
function formatElapsed(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDurationReadable(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (currentLang === "de") {
    if (m > 0) return `${m} Minute${m > 1 ? 'n' : ''} und ${s} Sekunde${s !== 1 ? 'n' : ''}`;
    return `${s} Sekunde${s !== 1 ? 'n' : ''}`;
  } else {
    if (m > 0) return `${m} minute${m > 1 ? 's' : ''} and ${s} second${s !== 1 ? 's' : ''}`;
    return `${s} second${s !== 1 ? 's' : ''}`;
  }
}

// --- Studio Toast & Custom Modal Notifications ---
function localizeErrorMessage(msg) {
  if (!msg) return msg || "";
  if (currentLang !== "en") return msg;

  let s = String(msg);
  // Missing custom node
  const missingNodeMatch = s.match(/ComfyUI Custom Node fehlt:\s*['"]?([^'"]+)['"]?/i);
  if (missingNodeMatch) {
    const nodeName = missingNodeMatch[1];
    return `ComfyUI Custom Node missing: '${nodeName}'. This extension is not installed in your ComfyUI setup. Please install 'ComfyUI-MiniMaxH3-Director' (https://github.com/seesee75-commits/ComfyUI-MiniMaxH3-Director) into ComfyUI/custom_nodes/ and restart ComfyUI.`;
  }

  s = s.replace(/ComfyUI Prompt-Validierung fehlgeschlagen:\s*/gi, "ComfyUI prompt validation failed: ");
  s = s.replace(/ComfyUI Rendering fehlgeschlagen:\s*/gi, "ComfyUI rendering failed: ");
  s = s.replace(/ComfyUI Lipsync-Rendering fehlgeschlagen:\s*/gi, "ComfyUI lipsync rendering failed: ");
  s = s.replace(/ComfyUI ist nicht erreichbar unter http:\/\/127\.0\.0\.1:8188\. Bitte starte ComfyUI oder wähle Animatic-Preview\./gi,
    "ComfyUI is not reachable at http://127.0.0.1:8188. Please start ComfyUI or choose Animatic Preview.");
  s = s.replace(/ComfyUI ist nicht erreichbar unter http:\/\/127\.0\.0\.1:8188\. Bitte starte ComfyUI oder nutze Animatic-Vorschau\./gi,
    "ComfyUI is not reachable at http://127.0.0.1:8188. Please start ComfyUI or choose Animatic Preview.");
  s = s.replace(/ComfyUI ist nicht erreichbar\s*\(([^)]+)\):\s*/gi, "ComfyUI is not reachable ($1): ");
  s = s.replace(/Ein anderer Render-Job \(([^)]+)\) läuft bereits! Bitte warten oder abbrechen\./gi,
    "Another render job ($1) is currently running! Please wait or cancel it.");
  s = s.replace(/Ein Render-Job läuft bereits\./gi, "Another render job is already running.");
  s = s.replace(/Keine Szenen im Storyboard vorhanden\./gi, "No scenes found in the storyboard.");
  s = s.replace(/Bitte zuerst ein Porträtbild \(Referenzbild\) hochladen\./gi, "Please upload a portrait image (reference frame) first.");
  s = s.replace(/Bitte zuerst eine Audiodatei hochladen\./gi, "Please upload an audio file first.");
  s = s.replace(/Bitte zuerst eine Audiodatei \(\.mp3, \.wav, \.flac\) hochladen\./gi, "Please upload an audio file (.mp3, .wav, .flac) first.");
  s = s.replace(/Nicht genügend Speicherplatz auf ([^!]+)! Benötigt:\s*([\d.]+)\s*GB, frei:\s*([\d.]+)\s*GB\./gi,
    "Not enough disk space on $1! Required: $2 GB, free: $3 GB.");
  s = s.replace(/ComfyUI custom_nodes Verzeichnis konnte nicht lokalisiert werden\. Bitte ComfyUI-Pfad in den Einstellungen prüfen\./gi,
    "Could not locate ComfyUI custom_nodes directory. Please check ComfyUI path in Settings.");
  s = s.replace(/Erweiterung '([^']+)' ist bereits im custom_nodes Ordner vorhanden\./gi,
    "Extension '$1' is already present in your custom_nodes folder.");
  s = s.replace(/'([^']+)' erfolgreich installiert! Bitte ComfyUI neu starten\./gi,
    "'$1' successfully installed! Please restart ComfyUI.");
  s = s.replace(/'([^']+)' erfolgreich per Direkt-Download installiert! Bitte ComfyUI neu starten\./gi,
    "'$1' successfully installed via direct download! Please restart ComfyUI.");
  s = s.replace(/ComfyUI wurde erfolgreich neu gestartet!/gi, "ComfyUI was successfully restarted! ✅");
  s = s.replace(/Download des fertigen Films fehlgeschlagen:\s*/gi, "Download of finished film failed: ");
  s = s.replace(/Download des fertigen Lipsync-Videos fehlgeschlagen:\s*/gi, "Download of finished lipsync video failed: ");
  s = s.replace(/ComfyUI hat die Generierung beendet, aber keine Ausgabedatei erzeugt\./gi,
    "ComfyUI completed generation, but produced no output file.");
  s = s.replace(/Porträtbild nicht gefunden:\s*/gi, "Portrait image not found: ");
  s = s.replace(/Audiodatei nicht gefunden:\s*/gi, "Audio file not found: ");
  s = s.replace(/Fehler beim Öffnen:\s*/gi, "Error opening folder: ");
  s = s.replace(/Neustart fehlgeschlagen:\s*/gi, "Restart failed: ");
  s = s.replace(/Upload nach ComfyUI fehlgeschlagen:\s*/gi, "Upload to ComfyUI failed: ");
  s = s.replace(/Audio-Upload nach ComfyUI fehlgeschlagen:\s*/gi, "Audio upload to ComfyUI failed: ");

  return s;
}

function showToast(message, type = "info", durationMs = 4500) {
  if (window.__studioUpdating && type === "error") return;
  message = localizeErrorMessage(message);
  const container = vmGetEl("toastContainer");
  if (!container) return;

  const normalizedType = type === "warning" ? "warn" : type;

  // Deduplicate identical active toasts
  const existing = Array.from(container.querySelectorAll(".toast-body")).find(el => el.textContent === message);
  if (existing) return;

  const toast = document.createElement("div");
  toast.className = `toast-item toast-${normalizedType}`;

  const iconMap = {
    success: "✅",
    error: "⚠️",
    warn: "⚡",
    info: "🎬"
  };
  const icon = iconMap[normalizedType] || "🎬";

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-body">${message}</span>
    <button class="toast-close" title="${t("toastClose")}">×</button>
  `;

  const closeBtn = toast.querySelector(".toast-close");
  const removeToast = () => {
    toast.classList.add("hiding");
    setTimeout(() => toast.remove(), 250);
  };

  closeBtn.addEventListener("click", removeToast);
  container.appendChild(toast);

  if (durationMs > 0) {
    setTimeout(removeToast, durationMs);
  }
}

function showNotice(title, message, type = "info") {
  title = localizeErrorMessage(title);
  message = localizeErrorMessage(message);
  const modal = vmGetEl("studioAlertModal");
  if (!modal) {
    showToast(`${title}: ${message}`, type);
    return;
  }
  const iconEl = vmGetEl("studioAlertIcon");
  const titleEl = vmGetEl("studioAlertTitle");
  const msgEl = vmGetEl("studioAlertMessage");
  const btnOk = vmGetEl("btnStudioAlertOk");

  const iconMap = {
    success: "✅",
    error: "⚠️",
    warn: "⚡",
    info: "🎬"
  };
  if (iconEl) iconEl.textContent = iconMap[type] || "🎬";
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  modal.style.display = "flex";
  modal.classList.add("show");

  const close = () => {
    modal.classList.remove("show");
    modal.style.display = "none";
  };
  btnOk.onclick = close;
}

function showConfirm({
  title = "",
  message = "",
  confirmText = "",
  cancelText = "",
  danger = true,
  icon = "🛑"
} = {}) {
  return new Promise((resolve) => {
    const modal = vmGetEl("studioConfirmModal");
    if (!modal) {
      resolve(window.confirm(message || title));
      return;
    }

    const defaultTitle = currentLang === "de" ? "Bestätigung erforderlich" : "Confirmation Required";
    const defaultCancel = currentLang === "de" ? "Abbrechen" : "Cancel";
    const defaultConfirm = currentLang === "de" ? "Bestätigen" : "Confirm";

    const iconEl = vmGetEl("studioConfirmIcon");
    const titleEl = vmGetEl("studioConfirmTitle");
    const msgEl = vmGetEl("studioConfirmMessage");
    const btnCancel = vmGetEl("btnStudioConfirmCancel");
    const btnOk = vmGetEl("btnStudioConfirmOk");

    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title || defaultTitle;
    if (msgEl) msgEl.textContent = message;
    if (btnCancel) btnCancel.textContent = cancelText || defaultCancel;
    if (btnOk) {
      btnOk.textContent = confirmText || defaultConfirm;
      btnOk.className = danger ? "danger" : "primary";
    }

    modal.style.display = "flex";
    requestAnimationFrame(() => {
      modal.classList.add("show");
    });

    let cleanedUp = false;
    let cleanup = () => {};

    const handleAction = (result) => {
      if (cleanedUp) return;
      cleanedUp = true;
      cleanup();
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
      }, 200);
      resolve(result);
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleAction(false);
      }
    };

    const onBackdrop = (e) => {
      if (e.target === modal) {
        handleAction(false);
      }
    };

    cleanup = () => {
      window.removeEventListener("keydown", onKey);
      modal.removeEventListener("click", onBackdrop);
      btnCancel.onclick = null;
      btnOk.onclick = null;
    };

    btnCancel.onclick = () => handleAction(false);
    btnOk.onclick = () => handleAction(true);
    modal.addEventListener("click", onBackdrop);
    window.addEventListener("keydown", onKey);

    setTimeout(() => {
      if (btnCancel) btnCancel.focus();
    }, 50);
  });
}

// Override standard browser alert with dark studio toast
window.alert = function(msg) {
  showToast(msg, "info");
};

// --- Initialization ---
let _vmInitialized = false;
async function initVideoModuleOnce() {
  if (_vmInitialized) return;
  _vmInitialized = true;
  await loadServerConfig();
  applyI18n();
  initTabs();
  initModeSwitch();
  initEventListeners();
  initSettingsModal();
  restoreUiState();
  updateLipsyncSegmentBadge();
  renderScenes();
  pollStatus();
  setInterval(pollStatus, 3000);
}

const H3_CAMERA_PRESET_TEXTS = {
  steady_closeup: "Medium close-up portrait shot, steady camera, natural eye contact and subtle expressive head movement.",
  slow_push_in: "Smooth slow camera push-in toward the subject's face, shallow depth of field, cinematic focus.",
  subtle_orbit: "Smooth subtle camera orbit and gentle tilt around the subject, volumetric rim lighting, seamless motion.",
  subtle_tilt: "Gentle vertical camera tilt following the subject's posture and gaze, natural cinematic framing.",
  over_shoulder: "Conversational medium portrait framing with subtle natural breathing motion and soft background bokeh.",
  dynamic_stage: "Expressive music video performance framing, rhythmic camera movement synchronized with the audio beat.",
};

function updateLipsyncSegmentBadge() {
  const badge = vmGetEl("lipsyncSegmentBadge");
  if (!badge) return;
  const dur = Math.max(1, parseFloat(vmGetEl("lipsyncDurationSec")?.value) || 10);
  const fps = parseInt(vmGetEl("selFps")?.value) || 24;
  const frames = Math.round(dur * fps);
  const segments = Math.max(1, Math.ceil(dur / 5.0));
  const hasP1 = !!state.lipsync.portrait_image;
  const hasP2 = !!state.lipsync.second_image;
  const refTokens = hasP1 ? (hasP2 ? "<Picture 1> + <Picture 2> (Transition)" : "<Picture 1> / <Subject 1>") : (currentLang === "de" ? "Kein Porträt geladen" : "No portrait loaded");
  if (currentLang === "de") {
    badge.innerHTML = `<span>📊 <b>${dur}s</b> @ ${fps} FPS = <b>${frames} Frames</b> (${segments} H3-${segments === 1 ? "Segment" : "Segmente"})</span><span>🔗 ${refTokens}</span>`;
  } else {
    badge.innerHTML = `<span>📊 <b>${dur}s</b> @ ${fps} FPS = <b>${frames} frames</b> (${segments} H3 ${segments === 1 ? "segment" : "segments"})</span><span>🔗 ${refTokens}</span>`;
  }
}

// --- UI State Persistence (Server config.json + localStorage) ---
let _saveUiTimer = null;

function collectUiState() {
  return {
    saved: true,
    activeMode: state.activeMode || "director",
    activeTab: state.activeTab || "storyboard",
    profile: vmGetEl("selProfile")?.value || "ultra",
    resolution: vmGetEl("selResolution")?.value || "1080p",
    autoUpscale: !!vmGetEl("chkAutoUpscale")?.checked,
    filmLut: vmGetEl("selFilmLut")?.value || "",
    fps: vmGetEl("selFps")?.value || "24",
    videoSeed: vmGetEl("videoSeed")?.value || "424242",
    randomSeed: !!vmGetEl("chkRandomSeed")?.checked,
    storyboardTitle: vmGetEl("storyboardTitleInput")?.value || "",
    storyboardMusicStyle: vmGetEl("storyboardMusicStyleInput")?.value || "",
    aiShotCount: vmGetEl("aiShotCount")?.value || "5",
    aiIdea: vmGetEl("aiIdeaInput")?.value || "",
    bgmPath: vmGetEl("bgmPath")?.value || "",
    scenes: state.scenes,
    quickClip: {
      first_frame: state.quickClip.first_frame,
      last_frame: state.quickClip.last_frame,
      video_url: state.quickClip.video_url,
      title: vmGetEl("quickTitleInput")?.value || "",
      prompt: vmGetEl("quickPrompt")?.value || "",
      duration: vmGetEl("quickDuration")?.value || "5",
      audio_enabled: vmGetEl("chkQuickAudio")?.checked || false,
      audio_file: state.quickClip.audio_file,
      audio_filename: state.quickClip.audio_filename,
      audio_start: vmGetEl("quickAudioStartSec")?.value || "0",
      audio_volume: state.quickClip.audio_volume ?? 1.0,
      refpacks: Array.isArray(state.quickClip.refpacks) ? state.quickClip.refpacks : [],
    },
    longClip: {
      first_frame: state.longClip.first_frame,
      last_frame: state.longClip.last_frame,
      video_url: state.longClip.video_url,
      title: vmGetEl("longTitleInput")?.value || "",
      prompt: vmGetEl("longPrompt")?.value || "",
      duration: vmGetEl("longDuration")?.value || "30",
      audio_file: state.longClip.audio_file,
      audio_filename: state.longClip.audio_filename,
      audio_start: vmGetEl("longAudioStartSec")?.value || "0",
      audio_volume: state.longClip.audio_volume ?? 1.0,
      turbo: vmGetEl("chkLongTurbo") ? !!vmGetEl("chkLongTurbo").checked : true,
      refpacks: Array.isArray(state.longClip.refpacks) ? state.longClip.refpacks : [],
    },
    lipsync: {
      portrait_image: state.lipsync.portrait_image,
      second_image: state.lipsync.second_image,
      audio_file: state.lipsync.audio_file,
      audio_filename: state.lipsync.audio_filename,
      bgm_file: state.lipsync.bgm_file,
      bgm_filename: state.lipsync.bgm_filename,
      bgm_volume: state.lipsync.bgm_volume ?? 0.25,
      video_url: state.lipsync.video_url,
      startSec: vmGetEl("lipsyncStartSec")?.value || "0",
      durationSec: vmGetEl("lipsyncDurationSec")?.value || "10",
      strength: vmGetEl("lipsyncStrength")?.value || "0.99",
      title: vmGetEl("lipsyncTitleInput")?.value || "",
      subjectName: vmGetEl("lipsyncSubjectInput")?.value || "",
      dialogueLang: vmGetEl("selLipsyncDialogueLang")?.value || "German",
      dialogueText: vmGetEl("lipsyncDialogueInput")?.value || "",
      prompt: vmGetEl("lipsyncPrompt")?.value || "",
      cameraPreset: vmGetEl("selLipsyncCameraPreset")?.value || "steady_closeup",
      cut: vmGetEl("lipsyncCutInput")?.value || "",
      musicStyle: vmGetEl("lipsyncMusicStyle")?.value || "",
      alignPauses: vmGetEl("chkLipsyncAlignPauses") ? !!vmGetEl("chkLipsyncAlignPauses").checked : true,
      useDemucs: !!vmGetEl("chkLipsyncDemucs")?.checked,
      useCaptions: !!vmGetEl("chkLipsyncCaptions")?.checked,
      captionsText: vmGetEl("lipsyncCaptionsText")?.value || "",
    },
  };
}

function saveUiState() {
  if (state._restoringUi) return;
  const ui = collectUiState();
  state.config.ui_state = ui;
  try {
    localStorage.setItem("tavideomaker.ui_state", JSON.stringify(ui));
  } catch (e) {}

  if (_saveUiTimer) clearTimeout(_saveUiTimer);
  _saveUiTimer = setTimeout(async () => {
    try {
      await fetch("/api/video/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ui_state: ui }),
      });
    } catch (e) {}
  }, 250);
}

function _normalizeLegacyMediaUrls(obj) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === "string") {
        if (obj[i].startsWith("/uploads/") || obj[i].startsWith("/output/")) {
          obj[i] = "/api/video" + obj[i];
        }
      } else {
        _normalizeLegacyMediaUrls(obj[i]);
      }
    }
    return;
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === "string") {
      if (v.startsWith("/uploads/") || v.startsWith("/output/")) {
        obj[k] = "/api/video" + v;
      }
    } else if (v && typeof v === "object") {
      _normalizeLegacyMediaUrls(v);
    }
  }
}

function restoreUiState(customUi = null) {
  let ui = customUi || state.config?.ui_state;
  if (!ui || !ui.saved) {
    if (!customUi) {
      try {
        const raw = localStorage.getItem("tavideomaker.ui_state");
        if (raw) ui = JSON.parse(raw);
      } catch (e) {}
    }
  }
  if (!ui || !ui.saved) return;
  _normalizeLegacyMediaUrls(ui);

  state._restoringUi = true;
  state.hasRestoredUiState = true;

  try {
    // 1. Left column controls
    if (ui.profile && vmGetEl("selProfile")) {
      vmGetEl("selProfile").value = ui.profile;
      const notice = vmGetEl("cardEcoNotice");
      if (notice) notice.style.display = ui.profile === "eco" ? "block" : "none";
    }
    if (ui.resolution && vmGetEl("selResolution")) {
      vmGetEl("selResolution").value = ui.resolution;
    }
    if (typeof ui.autoUpscale === "boolean" && vmGetEl("chkAutoUpscale")) {
      vmGetEl("chkAutoUpscale").checked = ui.autoUpscale;
    }
    if (ui.filmLut !== undefined && vmGetEl("selFilmLut")) {
      vmGetEl("selFilmLut").dataset.pendingValue = ui.filmLut;
      vmGetEl("selFilmLut").value = ui.filmLut;
    }
    if (ui.fps && vmGetEl("selFps")) {
      vmGetEl("selFps").value = ui.fps;
    }
    if (ui.videoSeed !== undefined && vmGetEl("videoSeed")) {
      vmGetEl("videoSeed").value = ui.videoSeed;
    }
    if (typeof ui.randomSeed === "boolean" && vmGetEl("chkRandomSeed")) {
      vmGetEl("chkRandomSeed").checked = ui.randomSeed;
    }

    // 2. Storyboard & AI Assistant
    if (ui.storyboardTitle !== undefined && vmGetEl("storyboardTitleInput")) {
      vmGetEl("storyboardTitleInput").value = ui.storyboardTitle;
    }
    if (ui.storyboardMusicStyle !== undefined && vmGetEl("storyboardMusicStyleInput")) {
      vmGetEl("storyboardMusicStyleInput").value = ui.storyboardMusicStyle;
    }
    if (ui.aiShotCount && vmGetEl("aiShotCount")) {
      vmGetEl("aiShotCount").value = ui.aiShotCount;
    }
    if (ui.aiIdea !== undefined && vmGetEl("aiIdeaInput")) {
      vmGetEl("aiIdeaInput").value = ui.aiIdea;
    }
    if (ui.bgmPath !== undefined && vmGetEl("bgmPath")) {
      vmGetEl("bgmPath").value = ui.bgmPath;
    }
    if (Array.isArray(ui.scenes)) {
      state.scenes = ui.scenes;
    }

    // 3. Quick Clip
    if (ui.quickClip) {
      const qc = ui.quickClip;
      if (qc.title !== undefined && vmGetEl("quickTitleInput")) {
        vmGetEl("quickTitleInput").value = qc.title;
      }
      if (qc.prompt !== undefined && vmGetEl("quickPrompt")) {
        vmGetEl("quickPrompt").value = qc.prompt;
      }
      if (qc.duration !== undefined && vmGetEl("quickDuration")) {
        vmGetEl("quickDuration").value = qc.duration;
        updateQuickDurationButtons(qc.duration);
      }
      if (qc.first_frame) {
        state.quickClip.first_frame = qc.first_frame;
        const qFirstDrop = vmGetEl("quickFirstFrameDrop");
        if (qFirstDrop) {
          qFirstDrop.classList.add("has-image");
          qFirstDrop.innerHTML = `<img src="${escapeHtml(qc.first_frame)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetQuickFrame('first')">×</button>`;
        }
      }
      if (qc.last_frame) {
        state.quickClip.last_frame = qc.last_frame;
        const qLastDrop = vmGetEl("quickLastFrameDrop");
        if (qLastDrop) {
          qLastDrop.classList.add("has-image");
          qLastDrop.innerHTML = `<img src="${escapeHtml(qc.last_frame)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetQuickFrame('last')">×</button>`;
        }
      }
      if (qc.audio_enabled !== undefined && vmGetEl("chkQuickAudio")) {
        vmGetEl("chkQuickAudio").checked = !!qc.audio_enabled;
      }
      if (qc.audio_start !== undefined && vmGetEl("quickAudioStartSec")) {
        vmGetEl("quickAudioStartSec").value = qc.audio_start;
      }
      if (qc.audio_file) {
        state.quickClip.audio_file = qc.audio_file;
        state.quickClip.audio_filename = qc.audio_filename || qc.audio_file.split("/").pop();
        state.quickClip.audio_volume = qc.audio_volume !== undefined ? parseFloat(qc.audio_volume) : 1.0;
        const badge = vmGetEl("quickAudioBadge");
        const clearBtn = vmGetEl("btnClearQuickAudio");
        const controls = vmGetEl("quickAudioControls");
        const volInput = vmGetEl("quickAudioVolume");
        if (badge) {
          badge.textContent = `🎵 ${state.quickClip.audio_filename}`;
          badge.style.display = "inline-block";
        }
        if (clearBtn) clearBtn.style.display = "inline-block";
        if (controls) controls.style.display = "block";
        if (volInput) {
          volInput.value = Math.round(state.quickClip.audio_volume * 100);
          updateQuickAudioVolumeDisplay(volInput.value);
        }
        loadQuickAudioWaveform(qc.audio_file);
      }
      state.quickClip.refpacks = Array.isArray(qc.refpacks) ? qc.refpacks : [];
      if (typeof renderRefPacksPanel === "function") renderRefPacksPanel("quick");
    }

    // 3b. Long Clip
    if (ui.longClip) {
      const lc = ui.longClip;
      state.longClip.refpacks = Array.isArray(lc.refpacks) ? lc.refpacks : [];
      if (typeof renderRefPacksPanel === "function") renderRefPacksPanel("long");
      if (lc.title !== undefined && vmGetEl("longTitleInput")) {
        vmGetEl("longTitleInput").value = lc.title;
      }
      if (lc.prompt !== undefined && vmGetEl("longPrompt")) {
        vmGetEl("longPrompt").value = lc.prompt;
      }
      if (lc.duration !== undefined && vmGetEl("longDuration")) {
        vmGetEl("longDuration").value = lc.duration;
        updateLongDurationButtons(lc.duration);
      }
      if (lc.turbo !== undefined && vmGetEl("chkLongTurbo")) {
        vmGetEl("chkLongTurbo").checked = !!lc.turbo;
      }
      if (lc.first_frame) {
        state.longClip.first_frame = lc.first_frame;
        const lFirstDrop = vmGetEl("longFirstFrameDrop");
        if (lFirstDrop) {
          lFirstDrop.classList.add("has-image");
          lFirstDrop.innerHTML = `<img src="${escapeHtml(lc.first_frame)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLongFrame('first')">×</button>`;
        }
      }
      if (lc.last_frame) {
        state.longClip.last_frame = lc.last_frame;
        const lLastDrop = vmGetEl("longLastFrameDrop");
        if (lLastDrop) {
          lLastDrop.classList.add("has-image");
          lLastDrop.innerHTML = `<img src="${escapeHtml(lc.last_frame)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLongFrame('last')">×</button>`;
        }
      }
      if (lc.audio_start !== undefined && vmGetEl("longAudioStartSec")) {
        vmGetEl("longAudioStartSec").value = lc.audio_start;
      }
      if (lc.audio_file) {
        state.longClip.audio_file = lc.audio_file;
        state.longClip.audio_filename = lc.audio_filename || lc.audio_file.split("/").pop();
        state.longClip.audio_volume = lc.audio_volume !== undefined ? parseFloat(lc.audio_volume) : 1.0;
        const badge = vmGetEl("longAudioBadge");
        const clearBtn = vmGetEl("btnClearLongAudio");
        const controls = vmGetEl("longAudioControls");
        const volInput = vmGetEl("longAudioVolume");
        if (badge) {
          badge.textContent = `🎵 ${state.longClip.audio_filename}`;
          badge.style.display = "inline-block";
        }
        if (clearBtn) clearBtn.style.display = "inline-block";
        if (controls) controls.style.display = "block";
        if (volInput) {
          volInput.value = Math.round(state.longClip.audio_volume * 100);
          updateLongAudioVolumeDisplay(volInput.value);
        }
        loadLongAudioWaveform(lc.audio_file);
      }
    }

    // 4. Lipsync Studio
    if (ui.lipsync) {
      const ls = ui.lipsync;
      if (ls.startSec !== undefined && vmGetEl("lipsyncStartSec")) {
        vmGetEl("lipsyncStartSec").value = ls.startSec;
      }
      if (ls.durationSec !== undefined && vmGetEl("lipsyncDurationSec")) {
        vmGetEl("lipsyncDurationSec").value = ls.durationSec;
      }
      if (ls.strength !== undefined && vmGetEl("lipsyncStrength")) {
        vmGetEl("lipsyncStrength").value = ls.strength;
      }
      if (ls.title !== undefined && vmGetEl("lipsyncTitleInput")) {
        vmGetEl("lipsyncTitleInput").value = ls.title;
      }
      if (ls.subjectName !== undefined && vmGetEl("lipsyncSubjectInput")) {
        vmGetEl("lipsyncSubjectInput").value = ls.subjectName;
      }
      if (ls.dialogueLang && vmGetEl("selLipsyncDialogueLang")) {
        vmGetEl("selLipsyncDialogueLang").value = ls.dialogueLang;
      }
      if (ls.dialogueText !== undefined && vmGetEl("lipsyncDialogueInput")) {
        vmGetEl("lipsyncDialogueInput").value = ls.dialogueText;
      }
      if (ls.prompt !== undefined && vmGetEl("lipsyncPrompt")) {
        vmGetEl("lipsyncPrompt").value = ls.prompt;
      }
      if (ls.cameraPreset && vmGetEl("selLipsyncCameraPreset")) {
        vmGetEl("selLipsyncCameraPreset").value = ls.cameraPreset;
      }
      if (ls.cut !== undefined && vmGetEl("lipsyncCutInput")) {
        vmGetEl("lipsyncCutInput").value = ls.cut;
      }
      if (ls.musicStyle !== undefined && vmGetEl("lipsyncMusicStyle")) {
        vmGetEl("lipsyncMusicStyle").value = ls.musicStyle;
      }
      if (typeof ls.alignPauses === "boolean" && vmGetEl("chkLipsyncAlignPauses")) {
        vmGetEl("chkLipsyncAlignPauses").checked = ls.alignPauses;
      }
      if (typeof ls.useDemucs === "boolean" && vmGetEl("chkLipsyncDemucs")) {
        vmGetEl("chkLipsyncDemucs").checked = ls.useDemucs;
      }
      if (typeof ls.useCaptions === "boolean" && vmGetEl("chkLipsyncCaptions")) {
        vmGetEl("chkLipsyncCaptions").checked = ls.useCaptions;
        const lsCaptionsBox = vmGetEl("lipsyncCaptionsBox");
        if (lsCaptionsBox) lsCaptionsBox.style.display = ls.useCaptions ? "flex" : "none";
      }
      if (ls.captionsText !== undefined && vmGetEl("lipsyncCaptionsText")) {
        vmGetEl("lipsyncCaptionsText").value = ls.captionsText;
      }
      if (ls.portrait_image) {
        state.lipsync.portrait_image = ls.portrait_image;
        const lsPortraitDrop = vmGetEl("lipsyncPortraitDrop");
        if (lsPortraitDrop) {
          lsPortraitDrop.classList.add("has-image");
          lsPortraitDrop.innerHTML = `<img src="${escapeHtml(ls.portrait_image)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLipsyncFrame('portrait')">×</button>`;
        }
      }
      if (ls.second_image) {
        state.lipsync.second_image = ls.second_image;
        const lsSecondDrop = vmGetEl("lipsyncSecondDrop");
        if (lsSecondDrop) {
          lsSecondDrop.classList.add("has-image");
          lsSecondDrop.innerHTML = `<img src="${escapeHtml(ls.second_image)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLipsyncFrame('second')">×</button>`;
        }
      }
      if (ls.audio_file) {
        state.lipsync.audio_file = ls.audio_file;
        state.lipsync.audio_filename = ls.audio_filename || ls.audio_file.split("/").pop();
        const drop = vmGetEl("lipsyncAudioDrop");
        const player = vmGetEl("lipsyncAudioPreview");
        if (drop) {
          drop.classList.add("has-audio");
          drop.innerHTML = `
            <span style="font-size:12px; color:var(--accent2); font-weight:600;">🎵 ${state.lipsync.audio_filename}</span>
            <button class="btn-remove-frame" onclick="event.stopPropagation(); resetLipsyncAudio()">×</button>
          `;
        }
        if (player) {
          player.src = ls.audio_file;
          player.style.display = "block";
        }
      }
      if (ls.bgm_file) {
        state.lipsync.bgm_file = ls.bgm_file;
        state.lipsync.bgm_filename = ls.bgm_filename || ls.bgm_file.split("/").pop();
        state.lipsync.bgm_volume = ls.bgm_volume !== undefined ? parseFloat(ls.bgm_volume) : 0.25;
        const badge = vmGetEl("lipsyncBgmBadge");
        const clearBtn = vmGetEl("btnClearLipsyncBgm");
        const controls = vmGetEl("lipsyncBgmControls");
        const player = vmGetEl("lipsyncBgmPreview");
        const volInput = vmGetEl("lipsyncBgmVolume");
        if (badge) {
          badge.textContent = `🎵 ${state.lipsync.bgm_filename}`;
          badge.style.display = "inline-block";
        }
        if (clearBtn) clearBtn.style.display = "inline-block";
        if (controls) controls.style.display = "flex";
        if (player) {
          player.src = ls.bgm_file;
          player.volume = state.lipsync.bgm_volume;
        }
        if (volInput) {
          volInput.value = Math.round(state.lipsync.bgm_volume * 100);
          updateBgmVolumeDisplay(volInput.value);
        }
      }
    }

    // 5. Active Tab & Mode
    // If the last active tab was player or models, restore the actual creative mode tab (quick, storyboard, lipsync)
    let targetTab = ui.activeTab;
    if (targetTab === "player" || targetTab === "models" || !targetTab) {
      const modeToTab = { director: "storyboard", quick: "quick", lipsync: "lipsync" };
      targetTab = modeToTab[ui.activeMode] || "quick";
    }
    const tabBtn = document.querySelector(`.tabs button[data-tab="${targetTab}"]`);
    if (tabBtn) {
      tabBtn.click();
    } else {
      document.querySelector('.tabs button[data-tab="quick"]')?.click();
    }
  } finally {
    state._restoringUi = false;
  }
}

// --- Project File Save & Load ---
function saveProjectFile() {
  try {
    const projectData = {
      app: "tA-VideoMaker",
      format_version: "1.0",
      saved_at: new Date().toISOString(),
      ui_state: collectUiState()
    };
    const title = (vmGetEl("storyboardTitleInput")?.value || "").trim() ||
                  (vmGetEl("lipsyncTitleInput")?.value || "").trim() ||
                  (vmGetEl("quickTitleInput")?.value || "").trim() ||
                  "video_project";
    const safeTitle = title.replace(/[^a-zA-Z0-9_\-\u00C0-\u017F]+/g, "_").substring(0, 50);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${safeTitle}_${dateStr}.tav.json`;

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);

    showToast(t("projectSavedToast"), "success");
  } catch (err) {
    showToast(t("projectSaveError") + err, "error");
  }
}

function loadProjectFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const ui = data.ui_state || data;
      if (!ui || typeof ui !== "object") {
        throw new Error(t("invalidProjectFormat"));
      }
      ui.saved = true;
      restoreUiState(ui);
      renderScenes();
      saveUiState();
      showToast(t("projectLoadedToast") || `Projekt '${file.name}' erfolgreich geladen!`, "success");
    } catch (err) {
      showToast((t("projectLoadError") || "Fehler beim Laden der Projektdatei: ") + err.message, "error");
    }
  };
  reader.readAsText(file);
}

// --- Config Handling ---
async function loadServerConfig() {
  try {
    const res = await fetch("/api/video/config");
    if (res.ok) {
      state.config = await res.json();
      const _cfgLang = (localStorage.getItem("studio_lang") || document.documentElement.lang || localStorage.getItem("tavideomaker.lang") || state.config.language || "de").toLowerCase();
      currentLang = _cfgLang.startsWith("en") ? "en" : "de";
      applyTheme(state.config.theme || "dark");
    }
  } catch (err) {
    console.warn("Could not load server config:", err);
  }
}

function applyTheme() {}

// --- Tab Switching ---
function initTabs() {
  document.querySelectorAll(".tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      state.activeTab = tab;

      // Sync left mode switch highlight
      const modeMap = { storyboard: "director", quick: "quick", morph: "morph", longclip: "longclip", lipsync: "lipsync" };
      if (modeMap[tab]) {
        state.activeMode = modeMap[tab];
        document.querySelectorAll("#vm_modeSeg button").forEach(b => {
          b.classList.toggle("active", b.getAttribute("data-mode") === modeMap[tab]);
        });
      }

      document.querySelectorAll("#moduleVideoView .tab-pane").forEach(pane => pane.style.display = "none");
      const targetPane = vmGetEl("tabContent" + tab.charAt(0).toUpperCase() + tab.slice(1));
      if (targetPane) targetPane.style.display = "block";

      if (tab === "quick") {
        setTimeout(() => {
          renderQuickWaveformCanvas();
        }, 50);
      }

      if (tab === "longclip") {
        setTimeout(() => {
          renderLongWaveformCanvas();
        }, 50);
      }

      if (tab === "player") {
        const player = vmGetEl("studioVideoPlayer");
        if (player && (!player.src || player.src.endsWith("/") || player.src === window.location.href)) {
          fetch("/api/video/media").then(r => r.json()).then(data => {
            if (data && data.items && data.items.length > 0) {
              const latest = data.items.find(x => x.name.endsWith(".mp4") || x.name.endsWith(".webm"));
              if (latest) {
                player.src = latest.url;
              }
            }
          }).catch(() => {});
        }
      }

      if (tab === "models") {
        checkModels(false);
        loadExtensions();
      }

      saveUiState();
    });
  });
}

// --- Mode Switch ---
function initModeSwitch() {
  const segBtns = document.querySelectorAll("#vm_modeSeg button");
  segBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      segBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.getAttribute("data-mode");
      state.activeMode = mode;
      
      if (mode === "quick") {
        document.querySelector('.tabs button[data-tab="quick"]').click();
      } else if (mode === "morph") {
        document.querySelector('.tabs button[data-tab="morph"]').click();
      } else if (mode === "longclip") {
        document.querySelector('.tabs button[data-tab="longclip"]').click();
      } else if (mode === "lipsync") {
        document.querySelector('.tabs button[data-tab="lipsync"]').click();
      } else {
        document.querySelector('.tabs button[data-tab="storyboard"]').click();
      }
      saveUiState();
    });
  });
}

// --- Status & Hardware Polling ---
async function pollStatus() {
  try {
    const res = await fetch("/api/video/status");
    if (!res.ok) throw new Error("Status failed");
    const data = await res.json();
    
    state.comfyConnected = data.comfy_alive;
    state.hardware = data.hardware;

    const statusEl = vmGetEl("comfyStatus");
    const statusTextEl = vmGetEl("comfyStatusText");
    const gpuTextEl = vmGetEl("gpuText");

    if (data.hardware) {
      if (gpuTextEl) {
        gpuTextEl.textContent = `GPU: ${data.hardware.gpu_name} • ${data.hardware.vram_gb} GB VRAM`;
      }
      
      if (!state.modelsCheckedOnStartup) {
        state.modelsCheckedOnStartup = true;
        // Only apply default hardware profile if the user has no saved UI state yet
        if (!state.hasRestoredUiState && data.hardware.profile) {
          vmGetEl("selProfile").value = data.hardware.profile;
          applyHardwareProfile(data.hardware.profile);
        }

        const hasPathsConfigured = Boolean(
          (state.config.models_dir && state.config.models_dir.trim()) ||
          (state.config.comfy_dir && state.config.comfy_dir.trim()) ||
          state.config.setup_completed
        );

        if (!hasPathsConfigured) {
          openSettingsModal(true);
        } else {
          checkModels(true);
        }
      }
    }

    if (data.comfy_alive) {
      if (statusEl) statusEl.className = "status ok";
      if (statusTextEl) statusTextEl.textContent = t("comfyConnected");
      state.directorNodeReady = Boolean(data.minimax_node_installed);

      if (data.minimax_node_installed === false && !state.autoFixAttempted) {
        state.autoFixAttempted = true;
        fetch("/api/video/comfy/auto_fix_director", { method: "POST" })
          .then(r => r.json())
          .then(res => {
            if (res.node_ready) {
              state.directorNodeReady = true;
              showToast(t("autoFixDirectorSuccess"), "success", 5000);
            } else if (res.needs_restart) {
              showToast(t("directorNeedsRestartPrompt"), "warn", 9000);
            }
          })
          .catch(e => console.log("[AutoFix] Check error:", e));
      }
    } else {
      if (statusEl) statusEl.className = "status bad";
      if (statusTextEl) statusTextEl.textContent = t("comfyDisconnected");
    }
  } catch (err) {
    const statusEl = vmGetEl("comfyStatus");
    const statusTextEl = vmGetEl("comfyStatusText");
    if (statusEl) statusEl.className = "status bad";
    if (statusTextEl) statusTextEl.textContent = t("comfyDisconnected");
  }
}

// --- Hardware Profile Adaptation ---
function applyHardwareProfile(profile) {
  const selRes = vmGetEl("selResolution");
  const notice = vmGetEl("cardEcoNotice");
  if (!selRes) return;
  const isPortrait = (selRes.value || "").includes("portrait");

  if (profile === "eco") {
    selRes.value = isPortrait ? "480p_portrait" : "480p";
    if (notice) notice.style.display = "block";
    const chkUpscale = vmGetEl("chkAutoUpscale");
    if (chkUpscale) chkUpscale.checked = true;
  } else if (profile === "balanced") {
    selRes.value = isPortrait ? "720p_portrait" : "720p";
    if (notice) notice.style.display = "none";
  } else {
    // Ultra (e.g. RTX 3090 / 24 GB VRAM)
    selRes.value = isPortrait ? "1080p_portrait" : "1080p";
    if (notice) notice.style.display = "none";
  }
  saveUiState();
}

// --- Config Sync Helper ---
async function syncAndSaveModelsDir(newDir) {
  if (!newDir) return;
  state.config.models_dir = newDir;
  const cfgInput = vmGetEl("cfgModelsDir");
  if (cfgInput) cfgInput.value = newDir;
  try {
    await fetch("/api/video/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ models_dir: newDir })
    });
  } catch (e) {
    console.warn("Could not sync models_dir to config:", e);
  }
}

// --- Folder Browser Helper ---
async function handleBrowseFolder(inputElId, onSelectCallback = null) {
  const currentVal = vmGetEl(inputElId).value.trim();
  try {
    const res = await fetch("/api/video/browse_folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initial_dir: currentVal })
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.ok && data.path) {
      vmGetEl(inputElId).value = data.path;
      if (onSelectCallback) onSelectCallback(data.path, data.free_space_gb);
    }
  } catch (err) {
    console.error("Browse folder failed:", err);
  }
}

// --- Pre-Flight Model Verification ---
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSelectedModelTier() {
  const sel = vmGetEl("modelTierSelect");
  return (sel && sel.value) ? sel.value : "minimax_h3";
}

async function checkModels(showModalIfMissing = true, tierOverride = null) {
  try {
    const tier = tierOverride || getSelectedModelTier();
    const customDir = state.config.models_dir ? `&custom_dir=${encodeURIComponent(state.config.models_dir)}` : "";
    const res = await fetch(`/api/video/models/check?tier=${encodeURIComponent(tier)}${customDir}`);
    if (!res.ok) return;
    const data = await res.json();

    const container = vmGetEl("modelStatusContainer");
    const optMissing = data.optional_missing_models || [];
    const optPresent = data.optional_present_models || [];
    let optionalHtml = "";
    if (optMissing.length > 0 || optPresent.length > 0) {
      const optRows = [
        ...optPresent.map(m => `
          <div class="model-item">
            <div>
              <b>${escapeHtml(m.title)}</b><br>
              <span style="font-size:11px; color:var(--mute);">${escapeHtml(m.description || "")}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="model-size">${m.size_gb} GB</span>
              <span style="background:rgba(51,214,166,0.15); color:var(--accent2); padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600; white-space:nowrap;">${t("installedBadge")}</span>
            </div>
          </div>
        `),
        ...optMissing.map(m => `
          <div class="model-item">
            <div>
              <b>${escapeHtml(m.title)}</b><br>
              <span style="font-size:11px; color:var(--mute);">${escapeHtml(m.description || "")}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="model-size">${m.size_gb} GB</span>
              <button class="secondary" style="padding:4px 10px; font-size:11px; white-space:nowrap;" onclick="downloadOptionalModel('${escapeHtml(m.name)}', this)">⬇ Download</button>
            </div>
          </div>
        `),
      ].join("");
      optionalHtml = `
        <div style="margin-top:14px; padding-top:12px; border-top:1px solid var(--border);">
          <div style="font-size:12px; font-weight:600; color:var(--text); margin-bottom:8px;">
            ${currentLang === "de" ? "Optionale Addons &amp; LoRAs" : "Optional Addons &amp; LoRAs"}
          </div>
          <div class="model-list">${optRows}</div>
        </div>
      `;
    }

    if (data.is_ready) {
      container.innerHTML = `
        <div style="color:var(--accent2); font-weight:600; padding:12px; background:rgba(51,214,166,0.1); border-radius:8px; border:1px solid var(--accent2);">
          ✅ ${t("allModelsReady")}
        </div>
        <p style="font-size:12px; color:var(--mute); margin-top:8px;">
          ${t("modelsPresentNotice")} <br><code>${data.target_dir}</code>
        </p>
        ${optionalHtml}
      `;
    } else {
      let missingHtml = data.missing_models.map(m => `
        <div class="model-item">
          <div>
            <b>${m.title}</b><br>
            <span style="font-size:11px; color:var(--mute);">${m.description}</span>
          </div>
          <div class="model-size">${m.size_gb} GB</div>
        </div>
      `).join("");

      container.innerHTML = `
        <div style="color:var(--warn); margin-bottom:10px; font-weight:600;">
          ${t("missingModelsNotice", { missing: data.missing_count, total: data.total_models })}
        </div>
        <div class="model-list">${missingHtml}</div>
        <div style="margin-top:10px; font-size:13px;">
          ${t("targetFolderLabel")} <code>${data.target_dir}</code><br>
          ${t("modelSizeLabel")} <b>${data.total_download_size_gb} GB</b> • ${t("freeDiskLabel")} <b>${data.free_space_gb} GB</b>
        </div>
        <button class="primary" style="margin-top:12px;" onclick="window.vmOpenDownloadModal && window.vmOpenDownloadModal()">${t("btnOpenDownloadDialog")}</button>
        ${optionalHtml}
      `;

      if (showModalIfMissing && data.missing_models.length > 0) {
        showModelModal(data);
      }
    }
  } catch (err) {
    console.error("Model check failed:", err);
  }
}

function showModelModal(data) {
  state.activeDownloadTier = data.tier || getSelectedModelTier();
  const modal = vmGetEl("modelModal");
  const list = vmGetEl("modalMissingList");
  
  const gpuNotice = vmGetEl("modalGpuNotice");
  if (state.hardware) {
    gpuNotice.textContent = t("gpuOptimalNotice", {
      gpu: state.hardware.gpu_name,
      vram: state.hardware.vram_gb
    });
  }

  vmGetEl("modalTargetDirInput").value = data.target_dir;

  list.innerHTML = data.missing_models.map(m => `
    <div class="model-item">
      <div>
        <b>${escapeHtml(m.title)}</b><br>
        <span style="font-size:11px; color:var(--mute);">${escapeHtml(m.name)}</span>
      </div>
      <div class="model-size">${escapeHtml(String(m.size_gb ?? ""))} GB</div>
    </div>
  `).join("");

  vmGetEl("modalTotalSize").textContent = `${data.total_download_size_gb} GB`;
  vmGetEl("modalFreeDisk").textContent = `${data.free_space_gb} GB`;

  const verdict = vmGetEl("modalSpaceVerdict");
  if (data.has_sufficient_space) {
    verdict.style.color = "var(--accent2)";
    verdict.textContent = t("diskOk");
    vmGetEl("btnConfirmDownload").disabled = false;
  } else {
    verdict.style.color = "var(--danger)";
    verdict.textContent = t("diskWarning");
    vmGetEl("btnConfirmDownload").disabled = true;
  }

  modal.classList.add("show");
}

function openDownloadModal() {
  checkModels(true);
}

async function downloadOptionalModel(modelName, btnEl) {
  const tier = getSelectedModelTier();
  const origText = btnEl ? btnEl.textContent : "";
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = "⏳ 0%";
  }
  try {
    const res = await fetch("/api/video/models/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, model_name: modelName }),
    });
    const d = await res.json();
    if (!res.ok || !d.ok) {
      showToast(d.error || t("downloadStartError"), "error", 7000);
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = origText;
      }
      return;
    }
    const timer = setInterval(async () => {
      try {
        const pRes = await fetch("/api/video/models/download_progress");
        if (!pRes.ok) return;
        const prog = await pRes.json();
        if (btnEl) btnEl.textContent = `⏳ ${prog.progress_pct}%`;
        if (prog.done) {
          clearInterval(timer);
          showToast(t("modelDownloadedToast", { model: modelName }), "success", 5000);
          checkModels(false);
        } else if (prog.error) {
          clearInterval(timer);
          showToast(prog.error, "error", 7000);
          if (btnEl) {
            btnEl.disabled = false;
            btnEl.textContent = origText;
          }
        }
      } catch (_) {}
    }, 1000);
  } catch (err) {
    showToast(t("downloadFailedToast") + err, "error", 7000);
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = origText;
    }
  }
}

// --- ComfyUI Extensions & Nodes Management ---
async function loadExtensions() {
  const container = vmGetEl("extensionListContainer");
  if (!container) return;

  try {
    const res = await fetch("/api/video/comfy/extensions");
    if (!res.ok) throw new Error("Status failed");
    const data = await res.json();
    const exts = data.extensions || [];

    if (exts.length === 0) {
      container.innerHTML = `<span style="font-size:12px; color:var(--mute);">No extensions detected.</span>`;
      return;
    }

    const anyNeedsRestart = exts.some(e => e.needs_restart);
    const restartBtnHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:8px; border-top:1px solid var(--border);">
        <span style="font-size:11px; color:${anyNeedsRestart ? '#fbbf24' : 'var(--mute)'}; font-weight:${anyNeedsRestart ? '600' : '400'};">${t("restartComfyNotice")}</span>
        <button class="secondary${anyNeedsRestart ? ' btn-restart-blink' : ''}" id="btnRestartComfyInList" style="font-size:11px; padding:5px 12px;" onclick="restartComfyUI('btnRestartComfyInList')">${t("btnRestartComfy")}</button>
      </div>
    `;

    container.innerHTML = exts.map((ext, idx) => {
      const isInstalled = ext.installed;
      const needsRestart = ext.needs_restart;
      const requiredBadge = ext.required
        ? `<span style="background:rgba(255,77,77,0.15); color:var(--danger); padding:2px 6px; border-radius:3px; font-size:10px; font-weight:700; margin-left:6px;">${currentLang === "de" ? "Erforderlich" : "Required"}</span>`
        : "";
      let statusBadge = "";
      if (isInstalled) {
        statusBadge = `<span style="background:rgba(51,214,166,0.15); color:var(--accent2); padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600;">${t("installedBadge")}</span>`;
      } else if (needsRestart) {
        statusBadge = `<span style="background:rgba(245,158,11,0.15); color:#f59e0b; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:600;" title="${currentLang === "de" ? "Dateien sind im custom_nodes Ordner vorhanden. Bitte ComfyUI neu starten!" : "Files present in custom_nodes folder. Please restart ComfyUI!"}">${currentLang === "de" ? "Neustart nötig 🔄" : "Restart needed 🔄"}</span>`;
      } else {
        statusBadge = `<button class="primary" id="btnInstallExt_${idx}" style="padding:4px 10px; font-size:11px;" onclick="installExtension('${ext.repo_url}', '${ext.folder}', 'btnInstallExt_${idx}')">${t("btnInstallNode")}</button>`;
      }

      return `
        <div style="background:var(--panel-bg); border:1px solid ${!isInstalled && ext.required ? 'var(--danger)' : 'var(--border)'}; border-radius:6px; padding:10px 14px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <b style="font-size:13px; color:var(--text);">${ext.title}</b>${requiredBadge}
            <span style="font-size:11px; color:var(--mute); margin-left:8px;">custom_nodes/${ext.folder}</span>
            <div style="font-size:11px; color:var(--mute); margin-top:2px;">${ext.description}</div>
          </div>
          <div>${statusBadge}</div>
        </div>
      `;
    }).join("") + restartBtnHtml;
  } catch (err) {
    container.innerHTML = `<span style="font-size:12px; color:var(--danger);">Error loading extensions: ${err}</span>`;
  }
}

async function restartComfyUI(btnId) {
  const btn = btnId ? vmGetEl(btnId) : null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = t("restartingComfy");
  }
  showToast(t("restartingComfy"), "info", 5000);
  try {
    const res = await fetch("/api/video/comfy/restart", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      showToast(data.message || t("restartingComfySuccess") || "ComfyUI was successfully restarted! ✅", "success", 5000);
      loadExtensions();
      pollStatus();
    } else {
      showToast(data.message || t("restartingComfyManualNotice") || "Automatic restart unavailable. Please restart ComfyUI manually.", "warn", 7000);
    }
  } catch (err) {
    showToast((currentLang === "de" ? "Neustart fehlgeschlagen: " : "Restart failed: ") + err, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = t("btnRestartComfy");
    }
  }
}

async function installExtension(repoUrl, folderName, btnId) {
  const btn = vmGetEl(btnId);
  if (btn) {
    btn.disabled = true;
    btn.textContent = t("installingNode");
  }

  try {
    const res = await fetch("/api/video/comfy/install_extension", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl, folder: folderName })
    });
    const data = await res.json();
    if (data.ok) {
      showToast(data.message || t("extensionInstalled"), "success", 6000);
      loadExtensions();
    } else {
      showToast(t("extensionInstallError") + " " + (data.error || ""), "error", 7000);
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("btnInstallNode");
      }
    }
  } catch (err) {
    showToast(t("extensionInstallError") + " " + err, "error", 7000);
    if (btn) {
      btn.disabled = false;
      btn.textContent = t("btnInstallNode");
    }
  }
}

// --- Start Background Download ---
async function startModelDownload() {
  const targetDir = vmGetEl("modalTargetDirInput").value.trim();
  if (targetDir) {
    await syncAndSaveModelsDir(targetDir);
  }

  vmGetEl("btnConfirmDownload").disabled = true;
  vmGetEl("btnCancelModal").disabled = false;
  vmGetEl("modalDownloadProgressBox").style.display = "block";

  try {
    const tier = state.activeDownloadTier || getSelectedModelTier();
    const res = await fetch("/api/video/models/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, target_dir: targetDir })
    });
    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || t("downloadStartError"), "error");
      vmGetEl("btnConfirmDownload").disabled = false;
      vmGetEl("btnCancelModal").disabled = false;
      return;
    }

    const timer = setInterval(async () => {
      const pRes = await fetch("/api/video/models/download_progress");
      if (!pRes.ok) return;
      const prog = await pRes.json();

      vmGetEl("dlProgressBar").style.width = prog.progress_pct + "%";
      vmGetEl("dlCurrentFile").textContent = prog.current_file || t("initializing");
      vmGetEl("dlStats").textContent = `${prog.progress_pct}% • ${prog.speed_mbps} MB/s`;

      if (prog.done) {
        clearInterval(timer);
        vmGetEl("modelModal").classList.remove("show");
        showToast(t("allModelsReady"), "success", 6000);
        checkModels(false);
      } else if (prog.error) {
        clearInterval(timer);
        showToast(prog.error, "error", 7000);
        vmGetEl("btnCancelModal").disabled = false;
      }
    }, 1000);

  } catch (err) {
    showToast(t("connectionError") + err, "error");
    vmGetEl("btnCancelModal").disabled = false;
  }
}

// --- Settings Dialog Logic ---
function openSettingsModal(isFirstRun = false) {
  if (isFirstRun) return;
  const btn = document.getElementById("btnSettings");
  if (btn) btn.click();
}

function initSettingsModal() {}

// --- Drag & Drop Helper ---
function attachDropHandler(element, onFileDropped) {
  if (!element) return;
  element.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.add("dragover");
  });
  element.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove("dragover");
  });
  element.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith("image/")) {
      await onFileDropped(files[0]);
    }
  });
}

// --- Image Upload Helpers ---
async function uploadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/video/upload_image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            image_base64: reader.result,
          })
        });
        const data = await res.json();
        if (data.ok) resolve(data.url);
        else reject(data.error);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function triggerSceneImageUpload(idx, type) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      if (type === "first") {
        state.scenes[idx].first_frame = url;
      } else {
        state.scenes[idx].last_frame = url;
      }
      renderScenes();
    } catch (err) {
      showToast(t("imageUploadFailed") + err, "error");
    }
  };
  input.click();
}

function removeSceneFrame(idx, type) {
  if (type === "first") {
    state.scenes[idx].first_frame = null;
  } else {
    state.scenes[idx].last_frame = null;
  }
  renderScenes();
}

// --- Storyboard Rendering ---
function renderScenes() {
  const container = vmGetEl("sceneList");
  container.innerHTML = "";

  if (!state.scenes || state.scenes.length === 0) {
    const emptyNotice = document.createElement("div");
    emptyNotice.style.cssText = "padding:28px 16px; text-align:center; color:var(--mute); background:var(--panel-bg); border:1px dashed var(--border); border-radius:8px; font-size:13px; margin:10px 0;";
    emptyNotice.innerHTML = `<span>🎬 ${t("emptyStoryboardHint") || (currentLang === "de" ? "Keine Szenen im Storyboard. Klicke auf '+ Neue Szene', 'Standard wiederherstellen' oder füge Clips aus dem Lipsync Studio hinzu." : "No scenes in storyboard. Click '+ Add Scene', 'Reset Defaults' or add clips from Lipsync Studio.")}</span>`;
    container.appendChild(emptyNotice);
    saveUiState();
    return;
  }

  state.scenes.forEach((sc, idx) => {
    const card = document.createElement("div");
    card.className = "scene-card" + (sc.from_prev ? " connected" : "");
    
    // First frame block
    let firstFrameContent = "";
    if (sc.from_prev && idx > 0) {
      firstFrameContent = `<div class="frame-auto-badge">${t("autoLinkedBadge")}</div>`;
    } else if (sc.first_frame) {
      firstFrameContent = `<img src="${escapeHtml(sc.first_frame)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); removeSceneFrame(${idx}, 'first')">×</button>`;
    } else {
      firstFrameContent = `<span style="font-size:11px; color:var(--mute);">${t("dropImagePrompt")}</span>`;
    }

    // Last frame block
    let lastFrameContent = "";
    if (sc.last_frame) {
      lastFrameContent = `<img src="${escapeHtml(sc.last_frame)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); removeSceneFrame(${idx}, 'last')">×</button>`;
    } else {
      lastFrameContent = `<span style="font-size:11px; color:var(--mute);">${t("dropImagePrompt")}</span>`;
    }

    const playBtnHtml = sc.video_url
      ? `<button class="secondary" style="padding:4px 10px; font-size:11px;" onclick="playClip('${sc.video_url}', true)">▶ Play</button>`
      : "";

    card.innerHTML = `
      <div class="scene-head">
        <span class="scene-badge">#${idx + 1} • ${sc.title}</span>
        <div class="scene-actions">
          ${playBtnHtml}
          <button class="btn-mini" onclick="deleteScene(${idx})">${t("deleteScene")}</button>
        </div>
      </div>
      <div class="field">
        <textarea rows="2" onchange="updateScenePrompt(${idx}, this.value)">${sc.prompt || ""}</textarea>
      </div>

      <div class="scene-h3-row">
        <input type="text" value="${(sc.subject_name || "").replace(/"/g, "&quot;")}" placeholder="${t("sceneSubjectPlaceholder")}" style="padding:5px 8px; font-size:11px; border-radius:6px; background:var(--bg); border:1px solid var(--line); color:var(--text);" onchange="updateSceneField(${idx}, 'subject_name', this.value)">
        <input type="text" value="${(sc.dialogue || "").replace(/"/g, "&quot;")}" placeholder="${t("sceneDialoguePlaceholder")}" style="padding:5px 8px; font-size:11px; border-radius:6px; background:var(--bg); border:1px solid var(--line); color:var(--text);" onchange="updateSceneField(${idx}, 'dialogue', this.value)">
        <select style="padding:4px 6px; font-size:11px; border-radius:6px; background:var(--bg); border:1px solid var(--line); color:var(--text);" onchange="updateSceneField(${idx}, 'camera_preset', this.value)">
          <option value="steady_closeup" ${sc.camera_preset === "steady_closeup" ? "selected" : ""}>${t("camPresetSteadyCloseup")}</option>
          <option value="slow_push_in" ${sc.camera_preset === "slow_push_in" ? "selected" : ""}>${t("camPresetSlowPushIn")}</option>
          <option value="subtle_orbit" ${sc.camera_preset === "subtle_orbit" ? "selected" : ""}>${t("camPresetSubtleOrbit")}</option>
          <option value="subtle_tilt" ${sc.camera_preset === "subtle_tilt" ? "selected" : ""}>${t("camPresetSubtleTilt")}</option>
          <option value="over_shoulder" ${sc.camera_preset === "over_shoulder" ? "selected" : ""}>${t("camPresetOverShoulder")}</option>
          <option value="dynamic_stage" ${sc.camera_preset === "dynamic_stage" ? "selected" : ""}>${t("camPresetDynamicStage")}</option>
          <option value="custom" ${(!sc.camera_preset || sc.camera_preset === "custom") ? "selected" : ""}>${t("camPresetCustom")}</option>
        </select>
      </div>

      <!-- Frame Reference Slots (FL2VA) -->
      <div class="frame-slots">
        <div class="frame-box">
          <div class="frame-box-label" style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
            <div>
              <span>${t("firstFrameLabel")}</span>
              <span class="h3-token-pill">&lt;Picture 1&gt; / &lt;Subject 1&gt;</span>
            </div>
            <div style="display:flex; gap:4px;">
              <button type="button" class="btn-mini" style="padding:2px 6px; font-size:10px;" onclick="event.stopPropagation(); analyzeSceneStartImage(${idx}, this)" title="${t("sceneAnalyzeTip")}">✨</button>
              <button type="button" class="btn-mini" style="padding:2px 6px; font-size:10px;" onclick="event.stopPropagation(); generateSceneStartImage(${idx}, this)" title="${t("sceneGenTip")}">🎨 H3</button>
            </div>
          </div>
          <div class="frame-dropzone frame-first-drop ${sc.first_frame ? 'has-image' : ''}" onclick="${(!sc.from_prev || idx === 0) ? `triggerSceneImageUpload(${idx}, 'first')` : ''}">
            ${firstFrameContent}
          </div>
        </div>
        <div class="frame-box">
          <div class="frame-box-label">
            <span>${t("lastFrameLabel")}</span>
            <span class="h3-token-pill">&lt;Picture 2&gt;</span>
          </div>
          <div class="frame-dropzone frame-last-drop ${sc.last_frame ? 'has-image' : ''}" onclick="triggerSceneImageUpload(${idx}, 'last')">
            ${lastFrameContent}
          </div>
        </div>
      </div>
      <div style="font-size:10.5px; color:var(--mute); margin-top:-4px; margin-bottom:6px;">${t("sceneFramesHint")}</div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <label class="check" style="font-size:12px;">
          <input type="checkbox" ${sc.from_prev ? "checked" : ""} ${idx === 0 ? "disabled" : ""} onchange="updateSceneContinuity(${idx}, this.checked)">
          <span>${t("fromPrevLabel")}</span>
        </label>
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:12px; color:var(--mute);">${t("sceneDuration")}:</span>
          <input type="number" min="2" max="60" step="0.5" value="${sc.duration}" style="width:65px; padding:3px 6px;" onchange="updateSceneDuration(${idx}, this.value)">
          ${sc.video_url ? `<button class="secondary" id="btnRetakeScene_${idx}" style="padding:4px 8px; font-size:11px;" onclick="retakeSingleScene(${idx})" title="Segment mit neuem Seed neu rendern">🔄 Retake</button>` : ""}
          <button class="primary" id="btnRenderScene_${idx}" style="padding:4px 10px; font-size:11px;" onclick="renderSingleScene(${idx})">${sc.status === 'rendering' ? '⏳ Rendering...' : t("renderScene")}</button>
        </div>
      </div>
    `;

    // Attach drag & drop events to the scene dropzones
    const firstDropEl = card.querySelector(".frame-first-drop");
    const lastDropEl = card.querySelector(".frame-last-drop");
    if (firstDropEl && (!sc.from_prev || idx === 0)) {
      attachDropHandler(firstDropEl, async (file) => {
        try {
          const url = await uploadImageFile(file);
          state.scenes[idx].first_frame = url;
          renderScenes();
        } catch (err) {
          showToast(t("dropUploadFailed") + err, "error");
        }
      });
    }
    if (lastDropEl) {
      attachDropHandler(lastDropEl, async (file) => {
        try {
          const url = await uploadImageFile(file);
          state.scenes[idx].last_frame = url;
          renderScenes();
        } catch (err) {
          showToast(t("dropUploadFailed") + err, "error");
        }
      });
    }

    container.appendChild(card);
  });
  saveUiState();
}

function updateScenePrompt(idx, val) { state.scenes[idx].prompt = val; saveUiState(); }
function updateSceneField(idx, field, val) { state.scenes[idx][field] = val; saveUiState(); }
function updateSceneDuration(idx, val) { state.scenes[idx].duration = parseFloat(val) || 4.0; saveUiState(); }
function updateSceneContinuity(idx, val) { 
  state.scenes[idx].from_prev = val; 
  renderScenes();
}
function deleteScene(idx) {
  state.scenes.splice(idx, 1);
  renderScenes();
  saveUiState();
}

function resetDefaultScenes() {
  state.scenes = JSON.parse(JSON.stringify(DEFAULT_SCENES));
  renderScenes();
  saveUiState();
  showToast(currentLang === "de" ? "Standard-Szenen wiederhergestellt!" : "Default scenes restored!", "success");
}

function clearAllScenes() {
  if (!state.scenes || state.scenes.length === 0) return;
  state.scenes = [];
  renderScenes();
  saveUiState();
  showToast(currentLang === "de" ? "Alle Szenen geleert." : "All scenes cleared.", "info");
}

function playClip(url, autoplay = false) {
  const player = vmGetEl("studioVideoPlayer");
  if (player && url) {
    player.src = url;
    player.load();
    if (autoplay) {
      player.play().catch(() => {});
    } else {
      player.pause();
      player.currentTime = 0;
    }
    const playerTabBtn = document.querySelector('.tabs button[data-tab="player"]');
    if (playerTabBtn) playerTabBtn.click();
  }
}

function resetCancelButtons() {
  const cancelBtns = document.querySelectorAll(".btn-cancel-render");
  cancelBtns.forEach(b => {
    b.disabled = false;
    b.textContent = t("btnCancelRender") || (currentLang === "de" ? "✕ Abbrechen" : "✕ Cancel");
  });
}

async function cancelActiveRender() {
  const confirmMsg = t("cancelConfirm") || (currentLang === "de"
    ? "Möchtest du die laufende Generierung wirklich abbrechen?"
    : "Do you really want to cancel the running generation?");

  const confirmed = await showConfirm({
    title: t("cancelConfirmTitle") || (currentLang === "de" ? "Generierung abbrechen?" : "Cancel Generation?"),
    message: confirmMsg,
    confirmText: t("btnConfirmCancel") || (currentLang === "de" ? "✕ Ja, abbrechen" : "✕ Yes, Cancel"),
    cancelText: t("btnKeepRunning") || (currentLang === "de" ? "Weiterlaufen lassen" : "Keep Running"),
    danger: true,
    icon: "🛑"
  });
  if (!confirmed) return;

  const cancelBtns = document.querySelectorAll(".btn-cancel-render");
  cancelBtns.forEach(b => {
    b.disabled = true;
    b.textContent = currentLang === "de" ? "⏳ Breche ab..." : "⏳ Cancelling...";
  });

  try {
    const res = await fetch("/api/video/cancel_render", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    if (data.ok) {
      showToast(
        t("cancelRequested") || (currentLang === "de" ? "Generierung wird abgebrochen..." : "Cancelling generation..."),
        "info",
        3500
      );
    }
  } catch (err) {
    console.error("Cancel render error:", err);
  }
}

function formatJobStage(stage) {
  if (!stage) return "";
  if (currentLang !== "en") return stage;

  let s = stage;
  s = s.replace(/ComfyUI generiert Frames\.\.\. \((\d+)s\)/gi, "ComfyUI generating frames... ($1s)");
  s = s.replace(/ComfyUI lädt Modell in VRAM \/ berechnet Frames\.\.\. \((\d+)s\)/gi, "ComfyUI loading model into VRAM / calculating frames... ($1s)");
  s = s.replace(/Starte MiniMax H3 Lipsync-Pipeline in ComfyUI\.\.\./gi, "Starting MiniMax H3 Lipsync pipeline in ComfyUI...");
  s = s.replace(/Initialisiere Lipsync Studio\.\.\./gi, "Initializing Lipsync Studio...");
  s = s.replace(/Lade Portr[äa]tbild & Audio in ComfyUI hoch\.\.\./gi, "Uploading portrait image & audio to ComfyUI...");
  s = s.replace(/Lade fertiges Lipsync-Video herunter\.\.\./gi, "Downloading finished lipsync video...");
  s = s.replace(/Erstelle schnelle Audio-Video-Vorschau \(FFmpeg\)\.\.\./gi, "Generating fast audio-video preview (FFmpeg)...");
  s = s.replace(/Initialisiere MiniMax H3 Director Storyboard\.\.\./gi, "Initializing MiniMax H3 Director Storyboard...");
  s = s.replace(/Reiht Film-Workflow in ComfyUI ein\.\.\./gi, "Queueing film workflow in ComfyUI...");
  s = s.replace(/Lade fertigen Film herunter\.\.\./gi, "Downloading finished film...");
  s = s.replace(/Post-Processing Film\.\.\./gi, "Post-processing film...");
  s = s.replace(/Szene (\d+) von (\d+) \(Animatic-Preview\)/gi, "Scene $1 of $2 (Animatic Preview)");
  s = s.replace(/Stitching Animatic Preview\.\.\./gi, "Stitching Animatic Preview...");
  s = s.replace(/Initialisiere\.\.\./gi, "Initializing...");
  s = s.replace(/Mische Hintergrundmusik hinzu\.\.\./gi, "Mixing background music...");
  s = s.replace(/Abbruch angefordert\.\.\./gi, "Cancelling generation...");
  s = s.replace(/Abgebrochen durch Benutzer/gi, "Cancelled by user");
  s = s.replace(/Vom Benutzer abgebrochen/gi, "Cancelled by user");
  return s;
}

// --- Auto-Check & Repair Missing Director Node ---
async function ensureDirectorReady() {
  if (!state.comfyConnected || state.directorNodeReady) return true;
  try {
    showToast(t("autoFixDirectorTitle") || "Richte Video-Erweiterung ein...", "info", 4000);
    const fixRes = await fetch("/api/video/comfy/auto_fix_director", { method: "POST" });
    const fixData = await fixRes.json();
    if (fixData.node_ready) {
      state.directorNodeReady = true;
      showToast(t("autoFixDirectorSuccess") || "MiniMax H3 Director einsatzbereit!", "success", 4000);
      return true;
    }
    if (fixData.needs_restart) {
      showToast(fixData.message || t("directorNeedsRestartPrompt"), "warn", 9000);
      return false;
    }
    showToast(fixData.message || t("directorMissingErrorPrompt") || "ComfyUI-MiniMaxH3-Director fehlt. Bitte ComfyUI-Pfad in den Einstellungen prüfen.", "error", 10000);
    return false;
  } catch (e) {
    console.log("[AutoFix] error:", e);
    showToast(t("directorMissingErrorPrompt") || "ComfyUI-MiniMaxH3-Director fehlt.", "error", 9000);
    return false;
  }
}

// --- Shared MiniMax H3 Start-Image Generator ---
async function generateH3StartImage(defaultPrompt, buttonEl, onImageUrl) {
  if (typeof window.switchStudioModule === "function") {
    const pos = document.getElementById("posPrompt");
    if (pos && defaultPrompt) pos.value = defaultPrompt;
    window.switchStudioModule("image");
    showToast(
      currentLang === "de"
        ? "Bitte Bild im Bilder-Studio generieren und dann auf '🎬 An VideoMaker' klicken."
        : "Generate an image in Image Studio, then click '🎬 Send to VideoMaker'.",
      "info",
      6000
    );
  }
}

function generateSceneStartImage(idx, btnEl) {
  const sc = state.scenes[idx];
  if (!sc) return;
  generateH3StartImage(sc.prompt || "", btnEl, (url) => {
    sc.from_prev = false;
    sc.first_frame = url;
    renderScenes();
  });
}

async function analyzeStartImageToPrompt(imageUrl, btnEl, onPrompt) {
  if (!imageUrl) {
    showToast(currentLang === "de" ? "Bitte zuerst ein Startbild hochladen oder generieren." : "Please upload or generate a start image first.", "error");
    return;
  }
  const origText = btnEl ? btnEl.textContent : "";
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = "⏳";
  }
  try {
    const res = await fetch("/api/video/ai/analyze_image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      showToast(data.error || t("imageAnalysisFailed"), "error", 6000);
      return;
    }
    onPrompt(data.prompt);
    saveUiState();
    showToast(currentLang === "de" ? `Prompt erstellt (${data.provider})` : `Prompt created (${data.provider})`, "success");
  } catch (err) {
    showToast(t("imageAnalysisFailed") + ": " + err, "error", 6000);
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = origText;
    }
  }
}

function analyzeSceneStartImage(idx, btnEl) {
  const sc = state.scenes[idx];
  if (!sc) return;
  analyzeStartImageToPrompt(sc.first_frame, btnEl, (promptText) => {
    sc.prompt = promptText;
    renderScenes();
  });
}

function retakeSingleScene(idx) {
  const sc = state.scenes[idx];
  if (!sc) return;
  sc._retakeSeed = Math.floor(Math.random() * 2147483647);
  renderSingleScene(idx);
}

// --- Single Scene Render ---
async function renderSingleScene(idx) {
  const sc = state.scenes[idx];
  const btn = vmGetEl(`btnRenderScene_${idx}`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Rendering...";
  }
  sc.status = "rendering";

  const engine = state.comfyConnected ? "comfyui" : "animatic";
  if (engine === "comfyui") {
    const isReady = await ensureDirectorReady();
    if (!isReady) {
      sc.status = "ready";
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("btnRenderScene") || "🎬 Szene Rendern";
      }
      renderScenes();
      return;
    }
  }

  if (!state.comfyConnected) {
    showToast(t("animaticOfflineNotice") || (currentLang === "de" ? "ComfyUI offline — erstelle Storyboard Animatic..." : "ComfyUI offline — generating Animatic Preview..."), "info", 4000);
  }

  const resVal = vmGetEl("selectResolution")?.value || "720p";
  const fpsVal = parseInt(vmGetEl("selectFps")?.value || "24", 10);
  const seedInput = vmGetEl("inputVideoSeed");
  const seedVal = sc._retakeSeed
    ? sc._retakeSeed
    : (seedInput && seedInput.value ? parseInt(seedInput.value, 10) : Math.floor(Math.random() * 1000000));
  delete sc._retakeSeed;

  try {
    const musicStyle = (vmGetEl("storyboardMusicStyleInput")?.value || "").trim();
    const res = await fetch("/api/video/render_scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scene_id: sc.id || (idx + 1),
        prompt: sc.prompt,
        duration: sc.duration,
        resolution: resVal,
        fps: fpsVal,
        seed: seedVal,
        engine: engine,
        first_frame: sc.first_frame,
        last_frame: sc.last_frame,
        subject_name: sc.subject_name || "",
        dialogue: sc.dialogue || "",
        dialogue_lang: currentLang === "de" ? "German" : "English",
        camera_preset: sc.camera_preset || "",
        music_style: musicStyle,
        turbo: isTurboMode(),
      })
    });
    const data = await res.json();
    if (data.ok && data.video_url) {
      sc.video_url = data.video_url;
      sc.status = "done";
      renderScenes();
      showToast(t("sceneRendered"), "success");
      playClip(data.video_url, false);
    } else {
      showToast(t("renderFailed") + " " + (data.error || ""), "error");
      sc.status = "ready";
      renderScenes();
    }
  } catch (err) {
    showToast(t("renderNetworkError") + err, "error");
    sc.status = "ready";
    renderScenes();
  }
}

// --- Render Full Storyboard ---
async function renderAllScenes(engine = "comfyui") {
  const btn = vmGetEl("btnRenderAll");
  const btnAnimatic = vmGetEl("btnAnimatic");
  const progressBox = vmGetEl("storyboardProgressBox");
  const progressBar = vmGetEl("sbProgressBar");
  const progressStats = vmGetEl("sbProgressStats");
  const progressTitle = vmGetEl("sbProgressTitle");

  if (!state.scenes || state.scenes.length === 0) return;

  if (engine === "comfyui" && !state.comfyConnected) {
    showToast(t("comfyOfflineError"), "warn", 6000);
    return;
  }

  if (engine === "comfyui") {
    const isConfirmed = await showConfirm({
      title: currentLang === "de" ? "Storyboard rendern?" : "Render Storyboard?",
      message: currentLang === "de"
        ? `Möchtest du alle ${state.scenes.length} Szenen des Storyboards über ComfyUI rendern?`
        : `Do you want to render all ${state.scenes.length} storyboard scenes via ComfyUI?`,
      confirmText: currentLang === "de" ? "✨ Ja, Storyboard rendern" : "✨ Yes, Render Storyboard",
      cancelText: currentLang === "de" ? "Abbrechen" : "Cancel",
      danger: false,
      icon: "🎬"
    });
    if (!isConfirmed) return;
  }

  if (engine === "comfyui") {
    const isReady = await ensureDirectorReady();
    if (!isReady) return;
  }

  if (btn) btn.disabled = true;
  if (btnAnimatic) btnAnimatic.disabled = true;
  resetCancelButtons();
  progressBox.style.display = "block";
  progressBar.style.width = "5%";
  progressStats.textContent = t("startingStatus");
  progressTitle.textContent = engine === "comfyui" ? t("aiDiffusionProgress") : t("animaticProgress");

  const titleInput = vmGetEl("storyboardTitleInput");
  const filmTitle = titleInput ? titleInput.value.trim() : "";
  const sbTimer = vmGetEl("sbProgressTimer");
  const sbDoneBadge = vmGetEl("sbDoneBadge");
  if (sbDoneBadge) sbDoneBadge.style.display = "none";
  let elapsedSeconds = 0;
  if (sbTimer) sbTimer.textContent = "⏱️ 00:00";
  const timerInterval = setInterval(() => {
    elapsedSeconds++;
    if (sbTimer) sbTimer.textContent = `⏱️ ${formatElapsed(elapsedSeconds)}`;
  }, 1000);

  const resVal = vmGetEl("selResolution").value;
  const fpsVal = parseInt(vmGetEl("selFps").value) || 24;
  const seedVal = getEffectiveVideoSeed();
  const autoUpscale = vmGetEl("chkAutoUpscale").checked;
  const bgmPath = vmGetEl("bgmPath").value.trim();
  const musicStyle = (vmGetEl("storyboardMusicStyleInput")?.value || "").trim();

  try {
    const res = await fetch("/api/video/render_storyboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: filmTitle,
        scenes: state.scenes,
        resolution: resVal,
        fps: fpsVal,
        seed: seedVal,
        auto_upscale: autoUpscale,
        bgm_path: bgmPath,
        music_style: musicStyle,
        engine: engine,
        turbo: isTurboMode(),
        lut: vmGetEl("selFilmLut")?.value || "",
      })
    });
    const data = await res.json();
    if (!data.ok) {
      clearInterval(timerInterval);
      showToast(t("renderStartError") + data.error, "error", 6000);
      if (btn) btn.disabled = false;
      if (btnAnimatic) btnAnimatic.disabled = false;
      progressBox.style.display = "none";
      return;
    }

    // Poll active job
    let pollDone = false;
    const pollTimer = setInterval(async () => {
      if (pollDone) return;
      try {
        const jobRes = await fetch("/api/video/jobs/active");
        if (!jobRes.ok || pollDone) return;
        const job = await jobRes.json();
        if (pollDone) return;

        if (job.stage) {
          progressTitle.textContent = formatJobStage(job.stage);
        }
        progressBar.style.width = `${job.progress_pct || 0}%`;
        progressStats.textContent = `${job.progress_pct || 0}%`;

        if (job.stage === "done" && job.output_file) {
          pollDone = true;
          clearInterval(timerInterval);
          clearInterval(pollTimer);
          const durationFormatted = job.duration_formatted || formatDurationReadable(elapsedSeconds);
          if (sbDoneBadge) {
            sbDoneBadge.style.display = "block";
            sbDoneBadge.textContent = currentLang === "de"
              ? `✅ Fertiggestellt in ${durationFormatted}!`
              : `✅ Completed in ${durationFormatted}!`;
          }
          const successToast = currentLang === "de"
            ? `Film fertig in ${durationFormatted}!`
            : `Storyboard film finished in ${durationFormatted}!`;
          showToast(successToast, "success", 8000);

          setTimeout(() => {
            if (btn) btn.disabled = false;
            if (btnAnimatic) btnAnimatic.disabled = false;
            progressBox.style.display = "none";
            playClip(job.output_file, false);
          }, 1800);
        } else if (job.stage === "cancelled" || job.cancel_requested) {
          pollDone = true;
          clearInterval(timerInterval);
          clearInterval(pollTimer);
          if (btn) btn.disabled = false;
          if (btnAnimatic) btnAnimatic.disabled = false;
          progressBox.style.display = "none";
          showToast(t("cancelledToast") || (currentLang === "de" ? "Generierung wurde abgebrochen." : "Generation cancelled."), "info", 5000);
        } else if (job.stage === "error") {
          pollDone = true;
          clearInterval(timerInterval);
          clearInterval(pollTimer);
          if (btn) btn.disabled = false;
          if (btnAnimatic) btnAnimatic.disabled = false;
          showToast(t("renderingError") + job.error, "error", 8000);
          progressBox.style.display = "none";
        }
      } catch (e) {
        console.warn("Polling active job error:", e);
      }
    }, 1000);

  } catch (err) {
    clearInterval(timerInterval);
    showToast(t("renderRequestFailed") + err, "error");
    if (btn) btn.disabled = false;
    if (btnAnimatic) btnAnimatic.disabled = false;
    progressBox.style.display = "none";
  }
}

// --- Stitch Scenes ---
async function stitchAllScenes() {
  const clips = state.scenes.map(s => s.video_url).filter(Boolean);
  if (clips.length === 0) {
    showToast(
      currentLang === "de"
        ? "Keine gerenderten Szenen vorhanden. Bitte zuerst Szenen rendern."
        : "No rendered scenes found. Please render storyboard scenes first.",
      "warn",
      5000
    );
    return;
  }
  const autoUpscale = vmGetEl("chkAutoUpscale").checked;
  const bgmPath = vmGetEl("bgmPath").value.trim();
  const lutVal = vmGetEl("selFilmLut")?.value || "";

  try {
    const res = await fetch("/api/video/stitch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clips: clips,
        upscale_1080p: autoUpscale,
        bgm_path: bgmPath,
        lut: lutVal,
      })
    });
    const data = await res.json();
    if (data.ok && data.output_file) {
      showToast(t("stitchSuccess"), "success");
      playClip(data.output_file, false);
    } else {
      showToast(t("stitchFailed") + (data.error || ""), "error");
    }
  } catch (err) {
    showToast(t("stitchNetworkError") + err, "error");
  }
}

function getEffectiveVideoSeed() {
  const input = vmGetEl("videoSeed");
  if (vmGetEl("chkRandomSeed")?.checked) {
    const rnd = Math.floor(100000 + Math.random() * 900000000);
    if (input) input.value = rnd;
    return rnd;
  }
  return parseInt(input?.value, 10) || 424242;
}

// --- Quick Clip Render ---
async function renderQuickClip() {
  const prompt = vmGetEl("quickPrompt").value.trim();
  if (!prompt) {
    showToast(t("quickPromptRequired"), "warn");
    return;
  }

  // Pre-check if another job is already rendering
  try {
    const jobRes = await fetch("/api/video/jobs/active");
    if (jobRes.ok) {
      const active = await jobRes.json();
      if (active && active.is_running) {
        showToast(
          currentLang === "de"
            ? `Ein anderer Render-Job (${active.type || "Job"}) läuft bereits! Bitte warten oder abbrechen.`
            : `Another render job (${active.type || "job"}) is currently active! Please wait or cancel it.`,
          "warn",
          6000
        );
        return;
      }
    }
  } catch (e) {}

  const titleInput = vmGetEl("quickTitleInput");
  const clipTitle = titleInput ? titleInput.value.trim() : "";
  const duration = parseFloat(vmGetEl("quickDuration").value) || 5.0;
  const resVal = vmGetEl("selResolution").value;
  const fpsVal = parseInt(vmGetEl("selFps").value) || 24;

  if (state.comfyConnected) {
    const isReady = await ensureDirectorReady();
    if (!isReady) return;
  }

  const btn = vmGetEl("btnRenderQuick");
  const pBox = vmGetEl("quickProgressBox");
  const pBar = vmGetEl("quickProgressBar");
  const pStats = vmGetEl("quickProgressStats");
  const pTimer = vmGetEl("quickProgressTimer");
  const pDoneBadge = vmGetEl("quickDoneBadge");

  btn.disabled = true;
  resetCancelButtons();
  pBox.style.display = "block";
  pBar.style.width = "10%";
  pStats.textContent = "10%";
  if (pDoneBadge) pDoneBadge.style.display = "none";

  const pTitle = vmGetEl("quickProgressTitle");
  let elapsedSeconds = 0;
  if (pTimer) pTimer.textContent = "⏱️ 00:00";
  const timerInterval = setInterval(() => {
    elapsedSeconds++;
    if (pTimer) pTimer.textContent = `⏱️ ${formatElapsed(elapsedSeconds)}`;
  }, 1000);

  const pollInterval = startJobProgressPoller(pBar, pStats, pTitle);

  try {
    const res = await fetch("/api/video/render_quick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: clipTitle,
        prompt,
        duration,
        resolution: resVal,
        fps: fpsVal,
        seed: getEffectiveVideoSeed(),
        first_frame: state.quickClip.first_frame,
        last_frame: state.quickClip.last_frame,
        auto_sound: !!vmGetEl("chkQuickAudio")?.checked,
        audio_file: state.quickClip.audio_file,
        audio_start: parseFloat(vmGetEl("quickAudioStartSec")?.value) || 0.0,
        audio_volume: state.quickClip.audio_volume ?? 1.0,
        turbo: isTurboMode(),
        auto_upscale: !!vmGetEl("chkAutoUpscale")?.checked,
        upscale_engine: vmGetEl("selUpscaleEngine")?.value || "ffmpeg",
        refpacks: Array.isArray(state.quickClip.refpacks) ? state.quickClip.refpacks : [],
      })
    });
    const data = await res.json();
    clearInterval(timerInterval);
    clearInterval(pollInterval);
    clearInterval(pollInterval);

    if (data.ok && data.video_url) {
      pBar.style.width = "100%";
      pStats.textContent = "100%";
      state.quickClip.video_url = data.video_url;

      const durationFormatted = data.duration_formatted || formatDurationReadable(elapsedSeconds);
      const soundInfo = data.sound_track ? ` • 🎵 ${data.sound_track}` : "";
      if (pDoneBadge) {
        pDoneBadge.style.display = "block";
        pDoneBadge.textContent = (currentLang === "de"
          ? `✅ Fertiggestellt in ${durationFormatted}`
          : `✅ Completed in ${durationFormatted}`) + soundInfo;
      }
      const successToast = (currentLang === "de"
        ? `Quick Clip fertig in ${durationFormatted}!`
        : `Quick Clip rendered in ${durationFormatted}!`) + soundInfo;
      showToast(successToast, "success", 7000);

      setTimeout(() => {
        pBox.style.display = "none";
        btn.disabled = false;
        playClip(data.video_url, false);
      }, 1500);
    } else {
      showToast(t("quickRenderFailed") + (data.error || ""), "error");
      pBox.style.display = "none";
      btn.disabled = false;
    }
  } catch (err) {
    clearInterval(timerInterval);
    clearInterval(pollInterval);
    showToast(t("quickRenderError") + err, "error");
    pBox.style.display = "none";
    btn.disabled = false;
  }
}

// --- AI Storyboard Generator ---
async function generateAiStoryboard() {
  const idea = vmGetEl("aiIdeaInput").value;
  const count = vmGetEl("aiShotCount").value;
  const btn = vmGetEl("btnAiDraft");

  btn.disabled = true;
  btn.textContent = t("drafting");

  try {
    const res = await fetch("/api/video/ai/storyboard_assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, shot_count: count, vibe: "cinematic" })
    });
    if (!res.ok) throw new Error("AI Assistant failed");
    const data = await res.json();
    if (data.storyboard) {
      state.scenes = data.storyboard;
      renderScenes();
      const badge = vmGetEl("aiDirectorBadge");
      if (badge && data.provider) {
        badge.textContent = "Director: " + data.provider;
        badge.style.display = "inline";
      }
      showToast(currentLang === "de" ? `Storyboard erfolgreich mit ${data.provider || "AI"} generiert!` : `Storyboard generated successfully with ${data.provider || "AI"}!`, "success");
    }
  } catch (err) {
    showToast("Error drafting storyboard: " + err, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = t("generateStoryboard");
  }
}

// --- Quick Frame Reset ---
function resetQuickFrame(type) {
  if (type === "first") {
    state.quickClip.first_frame = null;
    const drop = vmGetEl("quickFirstFrameDrop");
    if (drop) {
      drop.classList.remove("has-image");
      drop.innerHTML = `<span style="font-size:11px; color:var(--mute);">${t("dropImagePrompt")}</span>`;
    }
  } else {
    state.quickClip.last_frame = null;
    const drop = vmGetEl("quickLastFrameDrop");
    if (drop) {
      drop.classList.remove("has-image");
      drop.innerHTML = `<span style="font-size:11px; color:var(--mute);">${t("dropImagePrompt")}</span>`;
    }
  }
  saveUiState();
}

// --- Long Clip Frame Reset ---
function resetLongFrame(type) {
  if (type === "first") {
    state.longClip.first_frame = null;
    const drop = vmGetEl("longFirstFrameDrop");
    if (drop) {
      drop.classList.remove("has-image");
      drop.innerHTML = `<span style="font-size:11px; color:var(--mute);">${t("dropImagePrompt")}</span>`;
    }
  } else {
    state.longClip.last_frame = null;
    const drop = vmGetEl("longLastFrameDrop");
    if (drop) {
      drop.classList.remove("has-image");
      drop.innerHTML = `<span style="font-size:11px; color:var(--mute);">${t("dropImagePrompt")}</span>`;
    }
  }
  saveUiState();
}

// --- Quick Clip Audio & Waveform Handling ---
let quickAudioData = {
  totalDuration: 0,
  peaks: null,
};
let quickAudioPreviewEl = null;
let quickAudioPreviewRaf = null;
let isQuickWaveformDragging = false;
let quickWaveformDragMode = null;
let quickDragMoveOffset = 0;
const _quickAudioPeakCache = new Map();

function formatTimeSec(sec) {
  if (isNaN(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

// --- Quick Clip Duration Preset Helper ---
function updateQuickDurationButtons(sec) {
  const val = parseFloat(sec);
  document.querySelectorAll("#vm_quickDurationPresets .duration-preset-btn").forEach(btn => {
    const bDur = parseFloat(btn.getAttribute("data-dur"));
    btn.classList.toggle("active", bDur === val);
  });
}

window.setQuickDuration = function(sec) {
  const el = vmGetEl("quickDuration");
  if (el) {
    el.value = sec;
  }
  updateQuickDurationButtons(sec);
  updateQuickWaveformUI();
  renderQuickWaveformCanvas();
  saveUiState();
};

function getQuickAudioClipDuration() {
  const durInput = vmGetEl("quickDuration");
  return parseFloat(durInput ? durInput.value : 5.0) || 5.0;
}

function getQuickAudioStartSec() {
  const inp = vmGetEl("quickAudioStartSec");
  return parseFloat(inp ? inp.value : 0.0) || 0.0;
}

function setQuickAudioStartSec(val) {
  const inp = vmGetEl("quickAudioStartSec");
  const total = quickAudioData.totalDuration || 0;
  const clipDur = getQuickAudioClipDuration();
  const maxStart = Math.max(0, total - clipDur);
  const clamped = Math.max(0, Math.min(maxStart, val));
  if (inp && document.activeElement !== inp) {
    inp.value = clamped.toFixed(1);
  }
  updateQuickWaveformUI();
  renderQuickWaveformCanvas();
  saveUiState();
}

function updateQuickWaveformUI() {
  const total = quickAudioData.totalDuration || 0;
  const clipDur = getQuickAudioClipDuration();
  const start = getQuickAudioStartSec();
  const endSec = Math.min(total, start + clipDur);

  const infoLbl = vmGetEl("quickWaveformInfo");
  if (infoLbl) {
    if (total > 0) {
      infoLbl.textContent = `${formatTimeSec(start)} - ${formatTimeSec(endSec)} (${clipDur.toFixed(1)}s)`;
    } else {
      infoLbl.textContent = `0:00.0 - ${formatTimeSec(clipDur)} (${clipDur.toFixed(1)}s)`;
    }
  }

  const durInfo = vmGetEl("quickAudioDurationInfo");
  if (durInfo && total > 0) {
    durInfo.textContent = currentLang === "de"
      ? `Gesamtlänge: ${formatTimeSec(total)}`
      : `Total: ${formatTimeSec(total)}`;
  }
}

async function loadQuickAudioWaveform(url) {
  if (!url) return;
  if (_quickAudioPeakCache.has(url)) {
    quickAudioData = _quickAudioPeakCache.get(url);
    initQuickWaveformMouseEvents();
    updateQuickWaveformUI();
    renderQuickWaveformCanvas();
    return;
  }
  try {
    const resp = await fetch(url);
    const ab = await resp.arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const audioBuf = await ctx.decodeAudioData(ab);
    const totalDuration = audioBuf.duration;
    const channelData = audioBuf.getChannelData(0);
    const numBars = 220;
    const blockSize = Math.max(1, Math.floor(channelData.length / numBars));
    const peaks = new Float32Array(numBars);
    let maxPeak = 0.001;
    for (let i = 0; i < numBars; i++) {
      const start = i * blockSize;
      let sum = 0;
      const step = Math.max(1, Math.floor(blockSize / 32));
      for (let j = 0; j < blockSize; j += step) {
        const v = Math.abs(channelData[start + j] || 0);
        if (v > sum) sum = v;
      }
      peaks[i] = sum;
      if (sum > maxPeak) maxPeak = sum;
    }
    for (let i = 0; i < numBars; i++) {
      peaks[i] = Math.min(1.0, peaks[i] / maxPeak);
    }
    try { ctx.close(); } catch (_) {}
    quickAudioData = { totalDuration, peaks };
    _quickAudioPeakCache.set(url, quickAudioData);
    initQuickWaveformMouseEvents();
    updateQuickWaveformUI();
    renderQuickWaveformCanvas();
  } catch (err) {
    console.error("Waveform load error:", err);
  }
}

function renderQuickWaveformCanvas() {
  const canvas = vmGetEl("quickWaveformCanvas");
  if (!canvas) return;
  const wrap = vmGetEl("quickWaveformWrap");
  if (wrap) {
    const rect = wrap.getBoundingClientRect();
    if (rect.width > 0 && (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height))) {
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    }
  }

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const peaks = quickAudioData.peaks;
  const total = quickAudioData.totalDuration || 0;
  const clipDur = getQuickAudioClipDuration();
  const startSec = getQuickAudioStartSec();

  const startFrac = total > 0 ? Math.max(0, Math.min(1, startSec / total)) : 0;
  const endFrac = total > 0 ? Math.max(0, Math.min(1, (startSec + clipDur) / total)) : Math.min(1, clipDur / 30);
  const selX1 = startFrac * w;
  const selX2 = endFrac * w;

  ctx.fillStyle = "rgba(246, 103, 68, 0.18)";
  ctx.fillRect(selX1, 0, Math.max(2, selX2 - selX1), h);

  ctx.strokeStyle = "#f66744";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(selX1, 0); ctx.lineTo(selX1, h);
  ctx.moveTo(selX2, 0); ctx.lineTo(selX2, h);
  ctx.stroke();

  if (peaks && peaks.length > 0) {
    const barWidth = Math.max(1, (w / peaks.length) - 1);
    for (let i = 0; i < peaks.length; i++) {
      const bx = (i / peaks.length) * w;
      const barHeight = Math.max(2, peaks[i] * (h - 8));
      const by = (h - barHeight) / 2;
      const inSelection = bx >= selX1 && bx <= selX2;
      ctx.fillStyle = inSelection ? "#f66744" : "#4a5568";
      ctx.fillRect(bx, by, barWidth, barHeight);
    }
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(currentLang === "de" ? "Keine Audiodaten geladen" : "No audio loaded", w / 2, h / 2 + 4);
  }

  if (quickAudioPreviewEl && !quickAudioPreviewEl.paused && total > 0) {
    const playFrac = quickAudioPreviewEl.currentTime / total;
    const playX = playFrac * w;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0); ctx.lineTo(playX, h);
    ctx.stroke();
  }
}

function initQuickWaveformMouseEvents() {
  const wrap = vmGetEl("quickWaveformWrap");
  if (!wrap || wrap._mouseInited) return;
  wrap._mouseInited = true;

  let isDragging = false;
  const updateFromPointer = (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const total = quickAudioData.totalDuration || 0;
    if (total <= 0) return;
    const frac = Math.max(0, Math.min(1, x / rect.width));
    const clickSec = frac * total;
    setQuickAudioStartSec(clickSec);
  };

  wrap.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    if (quickAudioPreviewEl && !quickAudioPreviewEl.paused) stopQuickAudioPreview();
    updateFromPointer(e);
  });
  window.addEventListener("mousemove", (e) => {
    if (isDragging) updateFromPointer(e);
  });
  window.addEventListener("mouseup", () => {
    if (isDragging) isDragging = false;
  });
  window.addEventListener("resize", () => {
    if (wrap.offsetParent) {
      renderQuickWaveformCanvas();
    }
  });
}

function toggleQuickAudioPreview() {
  if (quickAudioPreviewEl && !quickAudioPreviewEl.paused) {
    stopQuickAudioPreview();
  } else {
    playQuickAudioRange();
  }
}

function playQuickAudioRange() {
  if (!state.quickClip.audio_file) return;
  const start = getQuickAudioStartSec();
  const clipDur = getQuickAudioClipDuration();
  const endSec = start + clipDur;

  if (!quickAudioPreviewEl) {
    quickAudioPreviewEl = new Audio();
  }
  quickAudioPreviewEl.src = state.quickClip.audio_file;
  quickAudioPreviewEl.volume = state.quickClip.audio_volume ?? 1.0;
  quickAudioPreviewEl.currentTime = start;

  const btnIco = vmGetEl("icoPreviewQuickAudio");
  const btnTxt = vmGetEl("txtPreviewQuickAudio");
  if (btnIco) btnIco.textContent = "⏹";
  if (btnTxt) btnTxt.textContent = t("stopBtn");

  quickAudioPreviewEl.play().catch(e => console.error("Preview play failed:", e));

  const checkEnd = () => {
    if (!quickAudioPreviewEl || quickAudioPreviewEl.paused) return;
    if (quickAudioPreviewEl.currentTime >= endSec || quickAudioPreviewEl.ended) {
      stopQuickAudioPreview();
      return;
    }
    renderQuickWaveformCanvas();
    quickAudioPreviewRaf = requestAnimationFrame(checkEnd);
  };
  quickAudioPreviewRaf = requestAnimationFrame(checkEnd);
}

function stopQuickAudioPreview() {
  if (quickAudioPreviewRaf) {
    cancelAnimationFrame(quickAudioPreviewRaf);
    quickAudioPreviewRaf = null;
  }
  if (quickAudioPreviewEl) {
    quickAudioPreviewEl.pause();
  }
  const btnIco = vmGetEl("icoPreviewQuickAudio");
  const btnTxt = vmGetEl("txtPreviewQuickAudio");
  if (btnIco) btnIco.textContent = "▶";
  if (btnTxt) btnTxt.textContent = t("btnPreviewAudioRange") || (currentLang === "de" ? "Vorhören" : "Preview");
  renderQuickWaveformCanvas();
}

async function handleQuickAudioSelected(file) {
  try {
    const data = await uploadAudioFile(file);
    state.quickClip.audio_file = data.url;
    state.quickClip.audio_filename = data.filename || file.name;

    const chk = vmGetEl("chkQuickAudio");
    const badge = vmGetEl("quickAudioBadge");
    const clearBtn = vmGetEl("btnClearQuickAudio");
    const controls = vmGetEl("quickAudioControls");
    const volInput = vmGetEl("quickAudioVolume");

    if (chk) chk.checked = true;
    if (badge) {
      badge.textContent = `🎵 ${state.quickClip.audio_filename}`;
      badge.style.display = "inline-block";
    }
    if (clearBtn) clearBtn.style.display = "inline-block";
    if (controls) controls.style.display = "block";
    if (volInput) {
      volInput.value = Math.round((state.quickClip.audio_volume ?? 1.0) * 100);
      updateQuickAudioVolumeDisplay(volInput.value);
    }
    loadQuickAudioWaveform(data.url);
    saveUiState();
    showToast(currentLang === "de" ? "Sound für Quick Clip geladen!" : "Audio track loaded for Quick Clip!", "success");
  } catch (err) {
    showToast(t("audioUploadFailed") + err, "error");
  }
}

function resetQuickAudio() {
  stopQuickAudioPreview();
  state.quickClip.audio_file = null;
  state.quickClip.audio_filename = "";
  quickAudioData = { totalDuration: 0, peaks: null };

  const badge = vmGetEl("quickAudioBadge");
  const clearBtn = vmGetEl("btnClearQuickAudio");
  const controls = vmGetEl("quickAudioControls");
  const fileInput = vmGetEl("quickAudioFileInput");
  const info = vmGetEl("quickAudioDurationInfo");

  if (badge) badge.style.display = "none";
  if (clearBtn) clearBtn.style.display = "none";
  if (controls) controls.style.display = "none";
  if (info) info.textContent = "";
  if (fileInput) fileInput.value = "";
  saveUiState();
}

// --- Long Clip Duration Preset Helper ---
function updateLongDurationButtons(sec) {
  const val = parseFloat(sec);
  document.querySelectorAll("#vm_longDurationPresets .duration-preset-btn").forEach(btn => {
    const bDur = parseFloat(btn.getAttribute("data-dur"));
    btn.classList.toggle("active", bDur === val);
  });
}

window.setLongDuration = function(sec) {
  const el = vmGetEl("longDuration");
  if (el) {
    el.value = sec;
  }
  updateLongDurationButtons(sec);
  updateLongWaveformUI();
  renderLongWaveformCanvas();
  saveUiState();
};

// --- Long Clip Audio & Waveform Handling ---
let longAudioData = {
  totalDuration: 0,
  peaks: null,
};
let longAudioPreviewEl = null;
let longAudioPreviewRaf = null;

function getLongAudioClipDuration() {
  const durInput = vmGetEl("longDuration");
  return Math.max(5.0, parseFloat(durInput ? durInput.value : 30.0) || 30.0);
}

function getLongAudioStartSec() {
  const inp = vmGetEl("longAudioStartSec");
  return parseFloat(inp ? inp.value : 0.0) || 0.0;
}

function setLongAudioStartSec(val) {
  const inp = vmGetEl("longAudioStartSec");
  const total = longAudioData.totalDuration || 0;
  const clipDur = getLongAudioClipDuration();
  const maxStart = Math.max(0, total - clipDur);
  const clamped = Math.max(0, Math.min(maxStart, val));
  if (inp && document.activeElement !== inp) {
    inp.value = clamped.toFixed(1);
  }
  updateLongWaveformUI();
  renderLongWaveformCanvas();
  saveUiState();
}

function updateLongWaveformUI() {
  const total = longAudioData.totalDuration || 0;
  const clipDur = getLongAudioClipDuration();
  const start = getLongAudioStartSec();
  const endSec = Math.min(total, start + clipDur);

  const infoLbl = vmGetEl("longWaveformInfo");
  if (infoLbl) {
    if (total > 0) {
      infoLbl.textContent = `${formatTimeSec(start)} - ${formatTimeSec(endSec)} (${clipDur.toFixed(1)}s)`;
    } else {
      infoLbl.textContent = `0:00.0 - ${formatTimeSec(clipDur)} (${clipDur.toFixed(1)}s)`;
    }
  }

  const durInfo = vmGetEl("longAudioDurationInfo");
  if (durInfo && total > 0) {
    durInfo.textContent = currentLang === "de"
      ? `Gesamtlänge: ${formatTimeSec(total)}`
      : `Total: ${formatTimeSec(total)}`;
  }
}

async function loadLongAudioWaveform(url) {
  if (!url) {
    longAudioData.peaks = null;
    longAudioData.totalDuration = 0;
    updateLongWaveformUI();
    renderLongWaveformCanvas();
    return;
  }
  try {
    const resp = await fetch(url);
    const ab = await resp.arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const audioBuf = await ctx.decodeAudioData(ab);
    const totalDuration = audioBuf.duration;
    const channelData = audioBuf.getChannelData(0);
    const numBars = 220;
    const blockSize = Math.max(1, Math.floor(channelData.length / numBars));
    const peaks = new Float32Array(numBars);
    let maxPeak = 0.001;
    for (let i = 0; i < numBars; i++) {
      const start = i * blockSize;
      let sum = 0;
      const step = Math.max(1, Math.floor(blockSize / 32));
      for (let j = 0; j < blockSize; j += step) {
        const v = Math.abs(channelData[start + j] || 0);
        if (v > sum) sum = v;
      }
      peaks[i] = sum;
      if (sum > maxPeak) maxPeak = sum;
    }
    for (let i = 0; i < numBars; i++) {
      peaks[i] = peaks[i] / maxPeak;
    }
    longAudioData.peaks = peaks;
    longAudioData.totalDuration = totalDuration;
    try { ctx.close(); } catch (e) {}

    updateLongWaveformUI();
    renderLongWaveformCanvas();
  } catch (err) {
    console.error("Long waveform load error:", err);
  }
}

function renderLongWaveformCanvas() {
  const canvas = vmGetEl("longWaveformCanvas");
  if (!canvas) return;
  const wrap = vmGetEl("longWaveformWrap");
  if (wrap) {
    const rect = wrap.getBoundingClientRect();
    if (rect.width > 0 && (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height))) {
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    }
  }

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const peaks = longAudioData.peaks;
  const total = longAudioData.totalDuration || 0;
  const clipDur = getLongAudioClipDuration();
  const startSec = getLongAudioStartSec();

  const startFrac = total > 0 ? Math.max(0, Math.min(1, startSec / total)) : 0;
  const endFrac = total > 0 ? Math.max(0, Math.min(1, (startSec + clipDur) / total)) : Math.min(1, clipDur / 30);
  const selX1 = startFrac * w;
  const selX2 = endFrac * w;

  ctx.fillStyle = "rgba(246, 103, 68, 0.18)";
  ctx.fillRect(selX1, 0, Math.max(2, selX2 - selX1), h);

  ctx.strokeStyle = "#f66744";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(selX1, 0); ctx.lineTo(selX1, h);
  ctx.moveTo(selX2, 0); ctx.lineTo(selX2, h);
  ctx.stroke();

  if (peaks && peaks.length > 0) {
    const barWidth = Math.max(1, (w / peaks.length) - 1);
    for (let i = 0; i < peaks.length; i++) {
      const bx = (i / peaks.length) * w;
      const barHeight = Math.max(2, peaks[i] * (h - 8));
      const by = (h - barHeight) / 2;
      const inSelection = bx >= selX1 && bx <= selX2;
      ctx.fillStyle = inSelection ? "#f66744" : "#4a5568";
      ctx.fillRect(bx, by, barWidth, barHeight);
    }
  } else {
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(currentLang === "de" ? "Keine Audiodaten geladen" : "No audio loaded", w / 2, h / 2 + 4);
  }

  if (longAudioPreviewEl && !longAudioPreviewEl.paused && total > 0) {
    const playFrac = longAudioPreviewEl.currentTime / total;
    const playX = playFrac * w;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0); ctx.lineTo(playX, h);
    ctx.stroke();
  }
}

function initLongWaveformInteractions() {
  const wrap = vmGetEl("longWaveformWrap");
  if (!wrap) return;

  let isDragging = false;
  const updateFromPointer = (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const total = longAudioData.totalDuration || 0;
    if (total <= 0) return;
    const frac = Math.max(0, Math.min(1, x / rect.width));
    const clickSec = frac * total;
    setLongAudioStartSec(clickSec);
  };

  wrap.addEventListener("mousedown", (e) => {
    isDragging = true;
    updateFromPointer(e);
  });
  window.addEventListener("mousemove", (e) => {
    if (isDragging) updateFromPointer(e);
  });
  window.addEventListener("mouseup", () => {
    if (isDragging) isDragging = false;
  });
}

function updateLongAudioVolumeDisplay(val) {
  const txt = vmGetEl("longAudioVolumeText");
  if (txt) {
    const pattern = t("quickAudioVolumePrefix") || (currentLang === "de" ? "🔊 Lautstärke: {vol}%" : "🔊 Volume: {vol}%");
    txt.textContent = pattern.replace("{vol}", val);
  }
}

function togglePreviewLongAudioRange() {
  if (longAudioPreviewEl && !longAudioPreviewEl.paused) {
    stopLongAudioPreview();
  } else {
    playLongAudioRange();
  }
}

function playLongAudioRange() {
  if (!state.longClip.audio_file) return;
  const start = getLongAudioStartSec();
  const clipDur = getLongAudioClipDuration();
  const endSec = start + clipDur;

  if (!longAudioPreviewEl) {
    longAudioPreviewEl = new Audio();
  }
  longAudioPreviewEl.src = state.longClip.audio_file;
  longAudioPreviewEl.volume = state.longClip.audio_volume ?? 1.0;
  longAudioPreviewEl.currentTime = start;

  const btnIco = vmGetEl("icoPreviewLongAudio");
  const btnTxt = vmGetEl("txtPreviewLongAudio");
  if (btnIco) btnIco.textContent = "⏸";
  if (btnTxt) btnTxt.textContent = currentLang === "de" ? "Stopp" : "Stop";

  longAudioPreviewEl.play().catch(e => console.error("Preview play failed:", e));

  const checkEnd = () => {
    if (!longAudioPreviewEl || longAudioPreviewEl.paused) return;
    if (longAudioPreviewEl.currentTime >= endSec || longAudioPreviewEl.ended) {
      stopLongAudioPreview();
      return;
    }
    renderLongWaveformCanvas();
    longAudioPreviewRaf = requestAnimationFrame(checkEnd);
  };
  longAudioPreviewRaf = requestAnimationFrame(checkEnd);
}

function stopLongAudioPreview() {
  if (longAudioPreviewRaf) {
    cancelAnimationFrame(longAudioPreviewRaf);
    longAudioPreviewRaf = null;
  }
  if (longAudioPreviewEl) {
    longAudioPreviewEl.pause();
  }
  const btnIco = vmGetEl("icoPreviewLongAudio");
  const btnTxt = vmGetEl("txtPreviewLongAudio");
  if (btnIco) btnIco.textContent = "▶";
  if (btnTxt) btnTxt.textContent = t("btnPreviewAudioRange") || (currentLang === "de" ? "Vorhören" : "Preview");
  renderLongWaveformCanvas();
}

async function handleLongAudioSelected(file) {
  try {
    const data = await uploadAudioFile(file);
    state.longClip.audio_file = data.url;
    state.longClip.audio_filename = data.filename || file.name;

    const badge = vmGetEl("longAudioBadge");
    const clearBtn = vmGetEl("btnClearLongAudio");
    const controls = vmGetEl("longAudioControls");
    const volInput = vmGetEl("longAudioVolume");

    if (badge) {
      badge.textContent = `🎵 ${state.longClip.audio_filename}`;
      badge.style.display = "inline-block";
    }
    if (clearBtn) clearBtn.style.display = "inline-block";
    if (controls) controls.style.display = "block";
    if (volInput) {
      volInput.value = Math.round((state.longClip.audio_volume ?? 1.0) * 100);
      updateLongAudioVolumeDisplay(volInput.value);
    }
    loadLongAudioWaveform(data.url);
    saveUiState();
    showToast(currentLang === "de" ? `Audiospur "${file.name}" geladen!` : `Audio track "${file.name}" loaded!`, "success");
  } catch (err) {
    showToast(t("audioUploadFailed") + err, "error");
  }
}

function clearLongAudio() {
  stopLongAudioPreview();
  state.longClip.audio_file = null;
  state.longClip.audio_filename = "";
  longAudioData = { totalDuration: 0, peaks: null };

  const badge = vmGetEl("longAudioBadge");
  const clearBtn = vmGetEl("btnClearLongAudio");
  const controls = vmGetEl("longAudioControls");
  const fileInput = vmGetEl("longAudioFileInput");
  const info = vmGetEl("longAudioDurationInfo");

  if (badge) badge.style.display = "none";
  if (clearBtn) clearBtn.style.display = "none";
  if (controls) controls.style.display = "none";
  if (info) info.textContent = "";
  if (fileInput) fileInput.value = "";
  updateLongWaveformUI();
  renderLongWaveformCanvas();
  saveUiState();
}

// --- Long Clip Render ---
async function renderLongClip() {
  const prompt = vmGetEl("longPrompt").value.trim();
  if (!prompt) {
    showToast(currentLang === "de" ? "Bitte gib einen Prompt für den Long Clip ein." : "Please enter a prompt for the long clip.", "warn");
    return;
  }

  try {
    const jobRes = await fetch("/api/video/jobs/active");
    if (jobRes.ok) {
      const active = await jobRes.json();
      if (active && active.is_running) {
        showToast(
          currentLang === "de"
            ? `Ein anderer Render-Job (${active.type || "Job"}) läuft bereits! Bitte warten oder abbrechen.`
            : `Another render job (${active.type || "job"}) is currently active! Please wait or cancel it.`,
          "warn",
          6000
        );
        return;
      }
    }
  } catch (e) {}

  const titleInput = vmGetEl("longTitleInput");
  const clipTitle = titleInput ? titleInput.value.trim() : "";
  const duration = parseFloat(vmGetEl("longDuration").value) || 30.0;
  const resVal = vmGetEl("selResolution").value;
  const fpsVal = parseInt(vmGetEl("selFps").value) || 24;
  const turbo = !!vmGetEl("chkLongTurbo")?.checked;

  if (state.comfyConnected) {
    const isReady = await ensureDirectorReady();
    if (!isReady) return;
  }

  const btn = vmGetEl("btnRenderLong");
  const pBox = vmGetEl("longProgressBox");
  const pBar = vmGetEl("longProgressBar");
  const pStats = vmGetEl("longProgressStats");
  const pTimer = vmGetEl("longProgressTimer");
  const pDoneBadge = vmGetEl("longDoneBadge");

  btn.disabled = true;
  resetCancelButtons();
  pBox.style.display = "block";
  pBar.style.width = "10%";
  pStats.textContent = "10%";
  if (pDoneBadge) pDoneBadge.style.display = "none";

  const pTitle = vmGetEl("longProgressTitle");
  let elapsedSeconds = 0;
  if (pTimer) pTimer.textContent = "⏱️ 00:00";
  const timerInterval = setInterval(() => {
    elapsedSeconds++;
    if (pTimer) pTimer.textContent = `⏱️ ${formatElapsed(elapsedSeconds)}`;
  }, 1000);

  const pollInterval = startJobProgressPoller(pBar, pStats, pTitle);

  try {
    const res = await fetch("/api/video/render_long_clip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: clipTitle,
        prompt,
        duration,
        resolution: resVal,
        fps: fpsVal,
        seed: getEffectiveVideoSeed(),
        first_frame: state.longClip.first_frame,
        last_frame: state.longClip.last_frame,
        audio_file: state.longClip.audio_file,
        audio_start: parseFloat(vmGetEl("longAudioStartSec")?.value) || 0.0,
        audio_volume: state.longClip.audio_volume ?? 1.0,
        turbo: turbo,
        refpacks: Array.isArray(state.longClip.refpacks) ? state.longClip.refpacks : [],
      })
    });
    const data = await res.json();
    clearInterval(timerInterval);
    clearInterval(pollInterval);

    if (data.ok && data.video_url) {
      state.longClip.video_url = data.video_url;
      pBar.style.width = "100%";
      pStats.textContent = "100%";
      const durationFormatted = data.duration_formatted || `${data.elapsed_sec}s`;
      const soundInfo = data.sound_track ? ` • 🎵 ${data.sound_track}` : "";

      if (pDoneBadge) {
        pDoneBadge.style.display = "block";
        pDoneBadge.textContent = (currentLang === "de"
          ? `✅ Fertiggestellt in ${durationFormatted}`
          : `✅ Completed in ${durationFormatted}`) + soundInfo;
      }
      const successToast = (currentLang === "de"
        ? `Long Clip fertig in ${durationFormatted}!`
        : `Long Clip rendered in ${durationFormatted}!`) + soundInfo;
      showToast(successToast, "success", 8000);

      setTimeout(() => {
        pBox.style.display = "none";
        btn.disabled = false;
        playClip(data.video_url, false);
      }, 1500);
    } else {
      showToast(t("longRenderFailed") + (data.error || ""), "error");
      pBox.style.display = "none";
      btn.disabled = false;
    }
  } catch (err) {
    clearInterval(timerInterval);
    clearInterval(pollInterval);
    showToast(t("longRenderError") + err, "error");
    pBox.style.display = "none";
    btn.disabled = false;
  }
}

function updateQuickAudioVolumeDisplay(val) {
  const volText = vmGetEl("quickAudioVolumeText");
  if (volText) {
    const pattern = t("quickAudioVolumePrefix") || (currentLang === "de" ? "🔊 Lautstärke: {vol}%" : "🔊 Volume: {vol}%");
    volText.textContent = pattern.replace("{vol}", val);
  }
}

// --- Lipsync & Avatar Studio Logic ---
async function uploadAudioFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/video/upload_audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            audio_base64: reader.result,
          })
        });
        const data = await res.json();
        if (data.ok) resolve(data);
        else reject(data.error);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function attachAudioDropHandler(element, onFileDropped) {
  if (!element) return;
  element.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.add("dragover");
  });
  element.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove("dragover");
  });
  element.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const f = files[0];
      if (f.type.startsWith("audio/") || /\.(mp3|wav|flac|ogg|m4a)$/i.test(f.name)) {
        await onFileDropped(f);
      } else {
        showToast(t("invalidAudioDrop"), "warn");
      }
    }
  });
}

function resetLipsyncFrame(type) {
  if (type === "portrait") {
    state.lipsync.portrait_image = null;
    const drop = vmGetEl("lipsyncPortraitDrop");
    if (drop) {
      drop.classList.remove("has-image");
      drop.innerHTML = `<span style="font-size:11px; color:var(--mute);">${t("dropImagePrompt")}</span>`;
    }
  } else {
    state.lipsync.second_image = null;
    const drop = vmGetEl("lipsyncSecondDrop");
    if (drop) {
      drop.classList.remove("has-image");
      drop.innerHTML = `<span style="font-size:11px; color:var(--mute);">${t("dropImagePrompt")}</span>`;
    }
  }
  updateLipsyncSegmentBadge();
  saveUiState();
}

async function transcribeLipsyncAudio() {
  if (!state.lipsync.audio_file) {
    showToast(
      currentLang === "de"
        ? "Bitte zuerst eine Audiodatei (.mp3, .wav, .flac) hochladen."
        : "Please upload an audio file first.",
      "warn"
    );
    return;
  }
  const btn = vmGetEl("btnTranscribeAudio");
  const origText = btn ? btn.textContent : "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = t("transcribingAudio");
  }
  const startSec = parseFloat(vmGetEl("lipsyncStartSec")?.value) || 0.0;
  const durSec = parseFloat(vmGetEl("lipsyncDurationSec")?.value) || 15.0;
  const langVal = vmGetEl("selLipsyncDialogueLang")?.value || "German";

  try {
    const res = await fetch("/api/video/transcribe_audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audio_file: state.lipsync.audio_file,
        start_time: startSec,
        duration: durSec,
        language: langVal,
      }),
    });
    const data = await res.json();
    if (data.ok && data.text) {
      const dlgEl = vmGetEl("lipsyncDialogueInput");
      if (dlgEl) dlgEl.value = data.text;
      const capEl = vmGetEl("lipsyncCaptionsText");
      if (capEl && !capEl.value.trim()) capEl.value = data.text;
      saveUiState();
      showToast(
        currentLang === "de"
          ? "Sprache erfolgreich erkannt und als <d>...</d> Dialog übernommen!"
          : "Speech recognized and inserted into <d>...</d> dialogue!",
        "success"
      );
    } else {
      showToast(data.error || t("transcriptionFailed"), "warn", 6000);
    }
  } catch (err) {
    showToast(t("transcriptionError") + err, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = origText || t("btnTranscribeAudio");
    }
  }
}

function resetLipsyncAudio() {
  state.lipsync.audio_file = null;
  state.lipsync.audio_filename = "";
  const drop = vmGetEl("lipsyncAudioDrop");
  const badge = vmGetEl("lipsyncAudioNameBadge");
  const player = vmGetEl("lipsyncAudioPreview");
  if (drop) {
    drop.classList.remove("has-audio");
    drop.innerHTML = `<span id="lipsyncAudioDropText" style="font-size:12px; color:var(--mute);">${t("dropAudioPrompt")}</span>`;
  }
  if (badge) badge.textContent = "";
  if (player) {
    player.pause();
    player.removeAttribute("src");
    player.style.display = "none";
  }
  saveUiState();
}

async function handleLipsyncAudioSelected(file) {
  try {
    const data = await uploadAudioFile(file);
    state.lipsync.audio_file = data.url;
    state.lipsync.audio_filename = data.filename || file.name;

    const drop = vmGetEl("lipsyncAudioDrop");
    const badge = vmGetEl("lipsyncAudioNameBadge");
    const player = vmGetEl("lipsyncAudioPreview");
    if (drop) {
      drop.classList.add("has-audio");
      drop.innerHTML = `
        <span style="font-size:12px; color:var(--accent2); font-weight:600;">🎵 ${state.lipsync.audio_filename}</span>
        <button class="btn-remove-frame" onclick="event.stopPropagation(); resetLipsyncAudio()">×</button>
      `;
    }
    if (badge) badge.textContent = "";
    if (player) {
      player.src = data.url;
      player.style.display = "block";
      player.onloadedmetadata = () => {
        if (player.duration && isFinite(player.duration)) {
          const durInput = vmGetEl("lipsyncDurationSec");
          if (durInput) {
            const suggested = Math.min(20, Math.max(2, Math.round(player.duration * 2) / 2));
            durInput.value = suggested;
            saveUiState();
          }
        }
      };
    }
    saveUiState();
  } catch (err) {
    showToast(t("audioUploadFailed") + err, "error");
  }
}

async function handleLipsyncBgmSelected(file) {
  try {
    const data = await uploadAudioFile(file);
    state.lipsync.bgm_file = data.url;
    state.lipsync.bgm_filename = data.filename || file.name;

    const badge = vmGetEl("lipsyncBgmBadge");
    const clearBtn = vmGetEl("btnClearLipsyncBgm");
    const controls = vmGetEl("lipsyncBgmControls");
    const player = vmGetEl("lipsyncBgmPreview");
    const volInput = vmGetEl("lipsyncBgmVolume");

    if (badge) {
      badge.textContent = `🎵 ${state.lipsync.bgm_filename}`;
      badge.style.display = "inline-block";
    }
    if (clearBtn) clearBtn.style.display = "inline-block";
    if (controls) controls.style.display = "flex";
    if (player) {
      player.src = data.url;
      player.volume = (state.lipsync.bgm_volume ?? 0.25);
    }
    if (volInput) {
      volInput.value = Math.round((state.lipsync.bgm_volume ?? 0.25) * 100);
      updateBgmVolumeDisplay(volInput.value);
    }
    saveUiState();
  } catch (err) {
    showToast(t("bgmUploadFailed") + err, "error");
  }
}

function resetLipsyncBgm() {
  state.lipsync.bgm_file = null;
  state.lipsync.bgm_filename = "";
  const badge = vmGetEl("lipsyncBgmBadge");
  const clearBtn = vmGetEl("btnClearLipsyncBgm");
  const controls = vmGetEl("lipsyncBgmControls");
  const player = vmGetEl("lipsyncBgmPreview");
  const fileInput = vmGetEl("lipsyncBgmFileInput");
  if (badge) badge.style.display = "none";
  if (clearBtn) clearBtn.style.display = "none";
  if (controls) controls.style.display = "none";
  if (player) {
    player.pause();
    player.src = "";
  }
  if (fileInput) fileInput.value = "";
  saveUiState();
}

function updateBgmVolumeDisplay(val) {
  const volText = vmGetEl("lipsyncBgmVolumeText");
  if (volText) {
    const pattern = t("bgmVolumePrefix") || (currentLang === "de" ? "🔊 Musik-Lautstärke: {vol}%" : "🔊 Music Volume: {vol}%");
    volText.textContent = pattern.replace("{vol}", val);
  }
}

async function renderLipsyncVideo(engine = "comfyui") {
  if (!state.lipsync.portrait_image) {
    showToast(
      currentLang === "de"
        ? "Bitte zuerst ein Porträtbild (Referenzbild) hochladen."
        : "Please upload a portrait / character image first.",
      "warn"
    );
    return;
  }
  if (!state.lipsync.audio_file) {
    showToast(
      currentLang === "de"
        ? "Bitte zuerst eine Audiodatei (.mp3, .wav, .flac) hochladen."
        : "Please upload an audio file (.mp3, .wav, .flac) first.",
      "warn"
    );
    return;
  }

  if (engine === "comfyui" && !state.comfyConnected) {
    showToast(
      currentLang === "de"
        ? "ComfyUI ist nicht verbunden. Bitte ComfyUI starten oder 'Schnelle Audio-Vorschau (FFmpeg)' wählen."
        : "ComfyUI is offline. Please start ComfyUI or choose 'Fast Audio Preview (FFmpeg)'.",
      "warn",
      6000
    );
    return;
  }

  const btnAi = vmGetEl("btnRenderLipsyncAi");
  const btnPrev = vmGetEl("btnRenderLipsyncPreview");
  const btnAddSb = vmGetEl("btnAddLipsyncToStoryboard");
  const pBox = vmGetEl("lipsyncProgressBox");
  const pTitle = vmGetEl("lipsyncProgressTitle");
  const pTimer = vmGetEl("lipsyncProgressTimer");
  const pStats = vmGetEl("lipsyncProgressStats");
  const pBar = vmGetEl("lipsyncProgressBar");
  const pDone = vmGetEl("lipsyncDoneBadge");

  if (btnAi) btnAi.disabled = true;
  if (btnPrev) btnPrev.disabled = true;
  if (btnAddSb) btnAddSb.style.display = "none";
  resetCancelButtons();
  if (pBox) pBox.style.display = "block";
  if (pDone) pDone.style.display = "none";
  if (pBar) pBar.style.width = "5%";
  if (pStats) pStats.textContent = "5%";
  if (pTitle) {
    pTitle.textContent = engine === "comfyui"
      ? "MiniMax H3 Lipsync (ComfyUI)..."
      : "FFmpeg Audio-Preview...";
  }

  let elapsedSeconds = 0;
  if (pTimer) pTimer.textContent = "⏱️ 00:00";
  const timerInterval = setInterval(() => {
    elapsedSeconds++;
    if (pTimer) pTimer.textContent = `⏱️ ${formatElapsed(elapsedSeconds)}`;
  }, 1000);

  const titleVal = (vmGetEl("lipsyncTitleInput")?.value || "").trim();
  const subjectVal = (vmGetEl("lipsyncSubjectInput")?.value || "").trim();
  const dialogueLangVal = vmGetEl("selLipsyncDialogueLang")?.value || "German";
  const dialogueTextVal = (vmGetEl("lipsyncDialogueInput")?.value || "").trim();
  const promptVal = (vmGetEl("lipsyncPrompt")?.value || "").trim();
  const camPresetVal = vmGetEl("selLipsyncCameraPreset")?.value || "steady_closeup";
  const cutVal = (vmGetEl("lipsyncCutInput")?.value || "").trim();
  const musicStyleVal = (vmGetEl("lipsyncMusicStyle")?.value || "").trim();
  const startSec = parseFloat(vmGetEl("lipsyncStartSec")?.value) || 0.0;
  const durSec = parseFloat(vmGetEl("lipsyncDurationSec")?.value) || 10.0;
  const strengthVal = parseFloat(vmGetEl("lipsyncStrength")?.value) || 0.99;
  const alignPauses = vmGetEl("chkLipsyncAlignPauses") ? !!vmGetEl("chkLipsyncAlignPauses").checked : true;
  const useDemucs = !!vmGetEl("chkLipsyncDemucs")?.checked;
  const useCaptions = !!vmGetEl("chkLipsyncCaptions")?.checked;
  const captionsText = (vmGetEl("lipsyncCaptionsText")?.value || "").trim();

  const resVal = vmGetEl("selResolution").value;
  const fpsVal = parseInt(vmGetEl("selFps").value) || 24;
  const seedVal = getEffectiveVideoSeed();

  try {
    const res = await fetch("/api/video/render_lipsync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portrait_image: state.lipsync.portrait_image,
        second_image: state.lipsync.second_image,
        audio_file: state.lipsync.audio_file,
        title: titleVal,
        subject_name: subjectVal,
        dialogue_lang: dialogueLangVal,
        dialogue_text: dialogueTextVal,
        prompt: promptVal,
        camera_preset: camPresetVal,
        cut_instruction: cutVal,
        music_style: musicStyleVal,
        start_time: startSec,
        duration: durSec,
        resolution: resVal,
        fps: fpsVal,
        seed: seedVal,
        visual_strength: strengthVal,
        align_to_activity_gap: alignPauses,
        use_demucs: useDemucs,
        use_captions: useCaptions,
        captions_text: captionsText,
        bgm_file: state.lipsync.bgm_file,
        bgm_volume: state.lipsync.bgm_volume ?? 0.25,
        turbo: isTurboMode(),
        engine: engine,
      })
    });
    const data = await res.json();
    if (!data.ok) {
      clearInterval(timerInterval);
      showToast(data.error || t("lipsyncStartFailed"), "error", 6000);
      if (btnAi) btnAi.disabled = false;
      if (btnPrev) btnPrev.disabled = false;
      if (pBox) pBox.style.display = "none";
      return;
    }

    let pollDone = false;
    const pollTimer = setInterval(async () => {
      if (pollDone) return;
      try {
        const jobRes = await fetch("/api/video/jobs/active");
        if (!jobRes.ok || pollDone) return;
        const job = await jobRes.json();
        if (pollDone) return;

        if (job.stage && pTitle) {
          pTitle.textContent = formatJobStage(job.stage);
        }
        if (pBar) pBar.style.width = `${job.progress_pct || 0}%`;
        if (pStats) pStats.textContent = `${job.progress_pct || 0}%`;

        if (job.stage === "done" && job.output_file) {
          pollDone = true;
          clearInterval(timerInterval);
          clearInterval(pollTimer);
          state.lipsync.video_url = job.output_file;

          const durationFormatted = job.duration_formatted || formatDurationReadable(elapsedSeconds);
          if (pDone) {
            pDone.style.display = "block";
            pDone.textContent = currentLang === "de"
              ? `✅ Lipsync-Video fertiggestellt in ${durationFormatted}!`
              : `✅ Lipsync video completed in ${durationFormatted}!`;
          }
          if (btnAddSb) btnAddSb.style.display = "inline-flex";

          showToast(
            currentLang === "de"
              ? `Lipsync-Video fertig in ${durationFormatted}!`
              : `Lipsync video finished in ${durationFormatted}!`,
            "success",
            8000
          );

          setTimeout(() => {
            if (btnAi) btnAi.disabled = false;
            if (btnPrev) btnPrev.disabled = false;
            playClip(job.output_file, false);
          }, 1500);
        } else if (job.stage === "cancelled" || job.cancel_requested) {
          pollDone = true;
          clearInterval(timerInterval);
          clearInterval(pollTimer);
          if (btnAi) btnAi.disabled = false;
          if (btnPrev) btnPrev.disabled = false;
          if (pBox) pBox.style.display = "none";
          showToast(t("cancelledToast") || (currentLang === "de" ? "Lipsync-Generierung wurde abgebrochen." : "Lipsync generation cancelled."), "info", 5000);
          return;
        } else if (job.stage === "error") {
          pollDone = true;
          clearInterval(timerInterval);
          clearInterval(pollTimer);
          if (btnAi) btnAi.disabled = false;
          if (btnPrev) btnPrev.disabled = false;
          if (pBox) pBox.style.display = "none";
          showToast(t("lipsyncError") + (job.error || ""), "error", 8000);
        }
      } catch (e) {
        console.warn("Polling lipsync job error:", e);
      }
    }, 1000);
  } catch (err) {
    clearInterval(timerInterval);
    showToast(t("lipsyncRequestError") + err, "error");
    if (btnAi) btnAi.disabled = false;
    if (btnPrev) btnPrev.disabled = false;
    if (pBox) pBox.style.display = "none";
  }
}

function addLipsyncClipToStoryboard() {
  if (!state.lipsync.video_url) return;
  const durSec = parseFloat(vmGetEl("lipsyncDurationSec")?.value) || 10.0;
  const promptVal = (vmGetEl("lipsyncPrompt")?.value || "").trim() || "Lipsync Avatar Shot";
  const newIdx = state.scenes.length + 1;
  state.scenes.push({
    id: newIdx,
    title: `Scene ${newIdx}: Lipsync Shot`,
    prompt: promptVal,
    duration: durSec,
    from_prev: false,
    first_frame: state.lipsync.portrait_image,
    last_frame: state.lipsync.second_image,
    status: "done",
    video_url: state.lipsync.video_url,
  });
  renderScenes();
  showToast(
    currentLang === "de"
      ? `Lipsync-Clip als Szene #${newIdx} zum Storyboard hinzugefügt!`
      : `Lipsync clip added to Storyboard as Scene #${newIdx}!`,
    "success"
  );
  document.querySelector('.tabs button[data-tab="storyboard"]')?.click();
}

function initEventListeners() {
  vmGetEl("btnAddScene").addEventListener("click", () => {
    state.scenes.push({
      id: state.scenes.length + 1,
      title: `Scene ${state.scenes.length + 1}: Connecting Shot`,
      prompt: "The action intensifies, subtle cinematic lighting with deep depth of field.",
      duration: 4.0,
      from_prev: true,
      first_frame: null,
      last_frame: null,
      status: "ready",
      video_url: null,
    });
    renderScenes();
  });

  const btnReset = vmGetEl("btnResetScenes");
  if (btnReset) btnReset.addEventListener("click", resetDefaultScenes);

  const btnClear = vmGetEl("btnClearScenes");
  if (btnClear) btnClear.addEventListener("click", clearAllScenes);

  const btnSaveProj = vmGetEl("btnSaveProject");
  if (btnSaveProj) btnSaveProj.addEventListener("click", saveProjectFile);

  const btnLoadProj = vmGetEl("btnLoadProject");
  const projectFileInput = vmGetEl("projectFileInput");
  if (btnLoadProj && projectFileInput) {
    btnLoadProj.addEventListener("click", () => projectFileInput.click());
    projectFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        loadProjectFile(file);
        projectFileInput.value = "";
      }
    });
  }

  vmGetEl("btnRenderAll").addEventListener("click", () => renderAllScenes("comfyui"));
  const btnAnimatic = vmGetEl("btnAnimatic");
  if (btnAnimatic) {
    btnAnimatic.addEventListener("click", () => renderAllScenes("animatic"));
  }
  vmGetEl("btnStitch").addEventListener("click", stitchAllScenes);
  vmGetEl("btnReStitch").addEventListener("click", stitchAllScenes);
  const btnOpenOutputFolderPlayer = vmGetEl("btnOpenOutputFolderPlayer");
  if (btnOpenOutputFolderPlayer) {
    btnOpenOutputFolderPlayer.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/video/open_output_folder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showToast(`${t("errorOpeningFolder")} ${data.error || res.statusText}`, "error");
        }
      } catch (err) {
        showToast(`${t("errorOpeningFolder")} ${err.message || err}`, "error");
      }
    });
  }
  vmGetEl("btnRenderQuick").addEventListener("click", renderQuickClip);
  vmGetEl("btnAiDraft").addEventListener("click", generateAiStoryboard);
  vmGetEl("btnCancelModal").addEventListener("click", async () => {
    try {
      await fetch("/api/video/models/download_cancel", { method: "POST" });
    } catch (e) {}
    vmGetEl("modelModal").classList.remove("show");
    vmGetEl("btnConfirmDownload").disabled = false;
  });

  // Quick clip first frame upload & drop
  const qFirstDrop = vmGetEl("quickFirstFrameDrop");
  const qFirstInput = vmGetEl("quickFirstFileInput");
  if (qFirstDrop && qFirstInput) {
    qFirstDrop.addEventListener("click", () => qFirstInput.click());
    qFirstInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImageFile(file);
        state.quickClip.first_frame = url;
        qFirstDrop.classList.add("has-image");
        qFirstDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetQuickFrame('first')">×</button>`;
        autoMatchResolutionAspect(url);
        saveUiState();
      } catch (err) {
        showToast(t("imageUploadFailed") + err, "error");
      }
    });
    attachDropHandler(qFirstDrop, async (file) => {
      try {
        const url = await uploadImageFile(file);
        state.quickClip.first_frame = url;
        qFirstDrop.classList.add("has-image");
        qFirstDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetQuickFrame('first')">×</button>`;
        autoMatchResolutionAspect(url);
        saveUiState();
      } catch (err) {
        showToast(t("dropUploadFailed") + err, "error");
      }
    });
  }

  // Quick clip last frame upload & drop
  const qLastDrop = vmGetEl("quickLastFrameDrop");
  const qLastInput = vmGetEl("quickLastFileInput");
  if (qLastDrop && qLastInput) {
    qLastDrop.addEventListener("click", () => qLastInput.click());
    qLastInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImageFile(file);
        state.quickClip.last_frame = url;
        qLastDrop.classList.add("has-image");
        qLastDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetQuickFrame('last')">×</button>`;
        saveUiState();
      } catch (err) {
        showToast(t("imageUploadFailed") + err, "error");
      }
    });
    attachDropHandler(qLastDrop, async (file) => {
      try {
        const url = await uploadImageFile(file);
        state.quickClip.last_frame = url;
        qLastDrop.classList.add("has-image");
        qLastDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetQuickFrame('last')">×</button>`;
        saveUiState();
      } catch (err) {
        showToast(t("dropUploadFailed") + err, "error");
      }
    });
  }

  // Quick clip audio upload, clear, sync & volume
  const btnSelQuickAudio = vmGetEl("btnSelectQuickAudio");
  const quickAudioInput = vmGetEl("quickAudioFileInput");
  const btnClearQuickAudio = vmGetEl("btnClearQuickAudio");
  const quickAudioVol = vmGetEl("quickAudioVolume");
  const quickAudioPlayer = vmGetEl("quickAudioPreview");
  const chkQuickAudio = vmGetEl("chkQuickAudio");

  if (btnSelQuickAudio && quickAudioInput) {
    btnSelQuickAudio.addEventListener("click", () => quickAudioInput.click());
    quickAudioInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await handleQuickAudioSelected(file);
    });
  }

  if (btnClearQuickAudio) {
    btnClearQuickAudio.addEventListener("click", resetQuickAudio);
  }

  if (quickAudioVol) {
    quickAudioVol.addEventListener("input", (e) => {
      const val = parseInt(e.target.value) || 0;
      state.quickClip.audio_volume = val / 100;
      updateQuickAudioVolumeDisplay(val);
      if (quickAudioPreviewEl) quickAudioPreviewEl.volume = state.quickClip.audio_volume;
    });
    quickAudioVol.addEventListener("change", () => saveUiState());
  }

  const btnPreviewQuickRange = vmGetEl("btnPreviewQuickAudioRange");
  if (btnPreviewQuickRange) {
    btnPreviewQuickRange.addEventListener("click", toggleQuickAudioPreview);
  }

  const quickDurInput = vmGetEl("quickDuration");
  if (quickDurInput) {
    quickDurInput.addEventListener("input", () => {
      updateQuickDurationButtons(quickDurInput.value);
      updateQuickWaveformUI();
      renderQuickWaveformCanvas();
    });
    quickDurInput.addEventListener("change", () => {
      updateQuickDurationButtons(quickDurInput.value);
      updateQuickWaveformUI();
      renderQuickWaveformCanvas();
      saveUiState();
    });
  }

  const quickStartInput = vmGetEl("quickAudioStartSec");
  if (quickStartInput) {
    quickStartInput.addEventListener("input", () => {
      setQuickAudioStartSec(parseFloat(quickStartInput.value) || 0);
    });
  }

  if (chkQuickAudio) {
    chkQuickAudio.addEventListener("change", () => saveUiState());
  }

  // Long clip render button
  const btnRenderLong = vmGetEl("btnRenderLong");
  if (btnRenderLong) {
    btnRenderLong.addEventListener("click", renderLongClip);
  }

  // Long clip first frame upload & drop
  const lFirstDrop = vmGetEl("longFirstFrameDrop");
  const lFirstInput = vmGetEl("longFirstFileInput");
  if (lFirstDrop && lFirstInput) {
    lFirstDrop.addEventListener("click", () => lFirstInput.click());
    lFirstInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImageFile(file);
        state.longClip.first_frame = url;
        lFirstDrop.classList.add("has-image");
        lFirstDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLongFrame('first')">×</button>`;
        saveUiState();
      } catch (err) {
        showToast(t("imageUploadFailed") + err, "error");
      }
    });
    attachDropHandler(lFirstDrop, async (file) => {
      try {
        const url = await uploadImageFile(file);
        state.longClip.first_frame = url;
        lFirstDrop.classList.add("has-image");
        lFirstDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLongFrame('first')">×</button>`;
        saveUiState();
      } catch (err) {
        showToast(t("dropUploadFailed") + err, "error");
      }
    });
  }

  const btnGenLongStart = vmGetEl("btnGenLongStartImage");
  if (btnGenLongStart && lFirstDrop) {
    btnGenLongStart.addEventListener("click", () => {
      const promptEl = vmGetEl("longPrompt");
      generateH3StartImage(promptEl ? promptEl.value : "", btnGenLongStart, (url) => {
        state.longClip.first_frame = url;
        lFirstDrop.classList.add("has-image");
        lFirstDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLongFrame('first')">×</button>`;
      });
    });
  }

  const btnAnalyzeLongStart = vmGetEl("btnAnalyzeLongStartImage");
  if (btnAnalyzeLongStart) {
    btnAnalyzeLongStart.addEventListener("click", () => {
      analyzeStartImageToPrompt(state.longClip.first_frame, btnAnalyzeLongStart, (promptText) => {
        const promptEl = vmGetEl("longPrompt");
        if (promptEl) promptEl.value = promptText;
      });
    });
  }

  // Long clip last frame upload & drop
  const lLastDrop = vmGetEl("longLastFrameDrop");
  const lLastInput = vmGetEl("longLastFileInput");
  if (lLastDrop && lLastInput) {
    lLastDrop.addEventListener("click", () => lLastInput.click());
    lLastInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImageFile(file);
        state.longClip.last_frame = url;
        lLastDrop.classList.add("has-image");
        lLastDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLongFrame('last')">×</button>`;
        saveUiState();
      } catch (err) {
        showToast(t("imageUploadFailed") + err, "error");
      }
    });
    attachDropHandler(lLastDrop, async (file) => {
      try {
        const url = await uploadImageFile(file);
        state.longClip.last_frame = url;
        lLastDrop.classList.add("has-image");
        lLastDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLongFrame('last')">×</button>`;
        saveUiState();
      } catch (err) {
        showToast(t("dropUploadFailed") + err, "error");
      }
    });
  }

  // Long clip audio upload, clear & volume
  const btnSelLongAudio = vmGetEl("btnSelectLongAudio");
  const longAudioInput = vmGetEl("longAudioFileInput");
  const btnClearLongAudio = vmGetEl("btnClearLongAudio");
  const longAudioVol = vmGetEl("longAudioVolume");

  if (btnSelLongAudio && longAudioInput) {
    btnSelLongAudio.addEventListener("click", () => longAudioInput.click());
    longAudioInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await handleLongAudioSelected(file);
    });
  }

  if (btnClearLongAudio) {
    btnClearLongAudio.addEventListener("click", clearLongAudio);
  }

  if (longAudioVol) {
    longAudioVol.addEventListener("input", (e) => {
      const val = parseInt(e.target.value) || 0;
      state.longClip.audio_volume = val / 100;
      updateLongAudioVolumeDisplay(val);
      if (longAudioPreviewEl) longAudioPreviewEl.volume = state.longClip.audio_volume;
    });
    longAudioVol.addEventListener("change", () => saveUiState());
  }

  const btnPreviewLongRange = vmGetEl("btnPreviewLongAudioRange");
  if (btnPreviewLongRange) {
    btnPreviewLongRange.addEventListener("click", togglePreviewLongAudioRange);
  }

  const longDurInput = vmGetEl("longDuration");
  if (longDurInput) {
    longDurInput.addEventListener("input", () => {
      updateLongDurationButtons(longDurInput.value);
      updateLongWaveformUI();
      renderLongWaveformCanvas();
    });
    longDurInput.addEventListener("change", () => {
      updateLongDurationButtons(longDurInput.value);
      updateLongWaveformUI();
      renderLongWaveformCanvas();
      saveUiState();
    });
  }

  const longStartInput = vmGetEl("longAudioStartSec");
  if (longStartInput) {
    longStartInput.addEventListener("input", () => {
      setLongAudioStartSec(parseFloat(longStartInput.value) || 0);
    });
  }

  const chkLongTurbo = vmGetEl("chkLongTurbo");
  if (chkLongTurbo) {
    chkLongTurbo.addEventListener("change", () => saveUiState());
  }

  initQuickWaveformMouseEvents();
  initLongWaveformInteractions();

  // Lipsync Portrait upload & drop
  const lsPortraitDrop = vmGetEl("lipsyncPortraitDrop");
  const lsPortraitInput = vmGetEl("lipsyncPortraitFileInput");
  if (lsPortraitDrop && lsPortraitInput) {
    lsPortraitDrop.addEventListener("click", () => lsPortraitInput.click());
    lsPortraitInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImageFile(file);
        state.lipsync.portrait_image = url;
        lsPortraitDrop.classList.add("has-image");
        lsPortraitDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLipsyncFrame('portrait')">×</button>`;
        updateLipsyncSegmentBadge();
        saveUiState();
      } catch (err) {
        showToast(t("imageUploadFailed") + err, "error");
      }
    });
    attachDropHandler(lsPortraitDrop, async (file) => {
      try {
        const url = await uploadImageFile(file);
        state.lipsync.portrait_image = url;
        lsPortraitDrop.classList.add("has-image");
        lsPortraitDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLipsyncFrame('portrait')">×</button>`;
        updateLipsyncSegmentBadge();
        saveUiState();
      } catch (err) {
        showToast(t("dropUploadFailed") + err, "error");
      }
    });
  }

  const btnGenLsStart = vmGetEl("btnGenLipsyncStartImage");
  if (btnGenLsStart && lsPortraitDrop) {
    btnGenLsStart.addEventListener("click", () => {
      const lsPromptEl = vmGetEl("lipsyncPromptInput");
      generateH3StartImage(lsPromptEl ? lsPromptEl.value : "", btnGenLsStart, (url) => {
        state.lipsync.portrait_image = url;
        lsPortraitDrop.classList.add("has-image");
        lsPortraitDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLipsyncFrame('portrait')">×</button>`;
        updateLipsyncSegmentBadge();
      });
    });
  }

  // Lipsync 2nd Frame upload & drop
  const lsSecondDrop = vmGetEl("lipsyncSecondDrop");
  const lsSecondInput = vmGetEl("lipsyncSecondFileInput");
  if (lsSecondDrop && lsSecondInput) {
    lsSecondDrop.addEventListener("click", () => lsSecondInput.click());
    lsSecondInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImageFile(file);
        state.lipsync.second_image = url;
        lsSecondDrop.classList.add("has-image");
        lsSecondDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLipsyncFrame('second')">×</button>`;
        updateLipsyncSegmentBadge();
        saveUiState();
      } catch (err) {
        showToast(t("imageUploadFailed") + err, "error");
      }
    });
    attachDropHandler(lsSecondDrop, async (file) => {
      try {
        const url = await uploadImageFile(file);
        state.lipsync.second_image = url;
        lsSecondDrop.classList.add("has-image");
        lsSecondDrop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetLipsyncFrame('second')">×</button>`;
        updateLipsyncSegmentBadge();
        saveUiState();
      } catch (err) {
        showToast(t("dropUploadFailed") + err, "error");
      }
    });
  }

  // Lipsync Audio upload & drop
  const lsAudioDrop = vmGetEl("lipsyncAudioDrop");
  const lsAudioInput = vmGetEl("lipsyncAudioFileInput");
  if (lsAudioDrop && lsAudioInput) {
    lsAudioDrop.addEventListener("click", () => lsAudioInput.click());
    lsAudioInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await handleLipsyncAudioSelected(file);
    });
    attachAudioDropHandler(lsAudioDrop, async (file) => {
      await handleLipsyncAudioSelected(file);
    });
  }

  // Lipsync BGM upload, clear & volume
  const btnSelBgm = vmGetEl("btnSelectLipsyncBgm");
  const bgmInput = vmGetEl("lipsyncBgmFileInput");
  const btnClearBgm = vmGetEl("btnClearLipsyncBgm");
  const bgmVol = vmGetEl("lipsyncBgmVolume");
  const bgmPlayer = vmGetEl("lipsyncBgmPreview");

  if (btnSelBgm && bgmInput) {
    btnSelBgm.addEventListener("click", () => bgmInput.click());
    bgmInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await handleLipsyncBgmSelected(file);
    });
  }

  if (btnClearBgm) {
    btnClearBgm.addEventListener("click", resetLipsyncBgm);
  }

  if (bgmVol) {
    bgmVol.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      state.lipsync.bgm_volume = val / 100;
      updateBgmVolumeDisplay(val);
      if (bgmPlayer) bgmPlayer.volume = state.lipsync.bgm_volume;
    });
    bgmVol.addEventListener("change", () => saveUiState());
  }

  // Lipsync Captions checkbox toggle
  const chkLsCaptions = vmGetEl("chkLipsyncCaptions");
  const lsCaptionsBox = vmGetEl("lipsyncCaptionsBox");
  if (chkLsCaptions && lsCaptionsBox) {
    chkLsCaptions.addEventListener("change", (e) => {
      lsCaptionsBox.style.display = e.target.checked ? "flex" : "none";
      saveUiState();
    });
  }

  // Lipsync Action Buttons & Camera Presets
  const btnLsAi = vmGetEl("btnRenderLipsyncAi");
  if (btnLsAi) btnLsAi.addEventListener("click", () => renderLipsyncVideo("comfyui"));

  const btnLsPrev = vmGetEl("btnRenderLipsyncPreview");
  if (btnLsPrev) btnLsPrev.addEventListener("click", () => renderLipsyncVideo("animatic"));

  const btnLsAddSb = vmGetEl("btnAddLipsyncToStoryboard");
  if (btnLsAddSb) btnLsAddSb.addEventListener("click", addLipsyncClipToStoryboard);

  const btnTranscribe = vmGetEl("btnTranscribeAudio");
  if (btnTranscribe) btnTranscribe.addEventListener("click", transcribeLipsyncAudio);

  const selCamPreset = vmGetEl("selLipsyncCameraPreset");
  const cutInputEl = vmGetEl("lipsyncCutInput");
  if (selCamPreset && cutInputEl) {
    if (!cutInputEl.value.trim()) {
      cutInputEl.value = H3_CAMERA_PRESET_TEXTS[selCamPreset.value] || H3_CAMERA_PRESET_TEXTS.steady_closeup;
    }
    selCamPreset.addEventListener("change", (e) => {
      const presetKey = e.target.value;
      if (H3_CAMERA_PRESET_TEXTS[presetKey]) {
        cutInputEl.value = H3_CAMERA_PRESET_TEXTS[presetKey];
      }
      saveUiState();
    });
  }

  ["lipsyncDurationSec", "selFps"].forEach(id => {
    const el = vmGetEl(id);
    if (el) {
      el.addEventListener("input", updateLipsyncSegmentBadge);
      el.addEventListener("change", updateLipsyncSegmentBadge);
    }
  });

  vmGetEl("btnConfirmDownload").addEventListener("click", startModelDownload);
  vmGetEl("btnBrowseModalDir").addEventListener("click", () => {
    handleBrowseFolder("modalTargetDirInput", async (newPath, freeGb) => {
      if (freeGb !== undefined) {
        vmGetEl("modalFreeDisk").textContent = `${freeGb} GB`;
      }
      if (newPath) {
        await syncAndSaveModelsDir(newPath);
      }
    });
  });

  vmGetEl("modalTargetDirInput").addEventListener("change", async (e) => {
    const val = e.target.value.trim();
    if (val) {
      await syncAndSaveModelsDir(val);
    }
  });
  vmGetEl("btnManualModelCheck").addEventListener("click", () => checkModels(false));
  const modelTierSelect = vmGetEl("modelTierSelect");
  if (modelTierSelect) {
    modelTierSelect.addEventListener("change", () => checkModels(false));
  }

  vmGetEl("selProfile").addEventListener("change", (e) => {
    applyHardwareProfile(e.target.value);
  });

  // Load built-in .cube film LUTs
  (async function loadFilmLuts() {
    const sel = vmGetEl("selFilmLut");
    if (!sel) return;
    try {
      const res = await fetch("/api/video/luts");
      const data = await res.json();
      if (data.ok && Array.isArray(data.luts)) {
        const pending = sel.dataset.pendingValue || sel.value || "";
        while (sel.options.length > 1) sel.remove(1);
        data.luts.forEach(item => {
          const opt = document.createElement("option");
          opt.value = item.id;
          opt.textContent = "🎨 " + item.label;
          sel.appendChild(opt);
        });
        if (pending) sel.value = pending;
      }
    } catch (_) { /* optional */ }
  })();

  const selTurboMode = vmGetEl("selTurboMode");
  const longTurboEl = vmGetEl("chkLongTurbo");
  if (selTurboMode && longTurboEl) {
    selTurboMode.addEventListener("change", () => {
      longTurboEl.checked = selTurboMode.value !== "quality";
    });
    longTurboEl.addEventListener("change", () => {
      selTurboMode.value = longTurboEl.checked ? "turbo" : "quality";
    });
  }

  // Persist all UI control changes automatically
  const persistedIds = [
    "selResolution",
    "chkAutoUpscale",
    "selUpscaleEngine",
    "selFilmLut",
    "selFps",
    "selTurboMode",
    "videoSeed",
    "chkRandomSeed",
    "storyboardTitleInput",
    "storyboardMusicStyleInput",
    "aiShotCount",
    "aiIdeaInput",
    "bgmPath",
    "quickTitleInput",
    "quickPrompt",
    "quickDuration",
    "chkQuickAudio",
    "quickAudioStartSec",
    "lipsyncStartSec",
    "lipsyncDurationSec",
    "lipsyncStrength",
    "lipsyncTitleInput",
    "lipsyncSubjectInput",
    "selLipsyncDialogueLang",
    "lipsyncDialogueInput",
    "lipsyncPrompt",
    "selLipsyncCameraPreset",
    "lipsyncCutInput",
    "lipsyncMusicStyle",
    "chkLipsyncAlignPauses",
    "chkLipsyncDemucs",
    "lipsyncCaptionsText",
  ];
  persistedIds.forEach(id => {
    const el = vmGetEl(id);
    if (el) {
      el.addEventListener("change", saveUiState);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.addEventListener("input", saveUiState);
      }
    }
  });

  const selUpscaleEngine = vmGetEl("selUpscaleEngine");
  if (selUpscaleEngine) {
    selUpscaleEngine.addEventListener("change", () => {
      if (selUpscaleEngine.value === "relayvsr") {
        checkModels(true, "relayvsr");
      }
    });
  }

  initMorphClipHandlers();
}

function setMorphDuration(sec) {
  const inp = vmGetEl("morphDuration");
  if (inp) {
    inp.value = sec;
    saveUiState();
  }
}

function setMorphEndHold(sec) {
  const inp = vmGetEl("morphEndHold");
  if (inp) {
    inp.value = sec;
    saveUiState();
  }
}

function resetMorphFrame(type) {
  const isFirst = type === "first";
  if (isFirst) state.morphClip.first_frame = null;
  else state.morphClip.last_frame = null;
  const drop = vmGetEl(isFirst ? "morphFirstFrameDrop" : "morphLastFrameDrop");
  if (drop) {
    drop.classList.remove("has-image");
    drop.innerHTML = `<span class="frame-placeholder">${t("dropOrPickImage")}</span>`;
  }
  saveUiState();
}

function _bindMorphDropzone(dropId, frameKey) {
  const drop = vmGetEl(dropId);
  if (!drop) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";
  document.body.appendChild(input);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      state.morphClip[frameKey] = url;
      drop.classList.add("has-image");
      drop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); resetMorphFrame('${frameKey === "first_frame" ? "first" : "last"}')">×</button>`;
      if (frameKey === "first_frame") autoMatchResolutionAspect(url);
      saveUiState();
    } catch (err) {
      showToast(t("imageUploadFailed") + err, "error");
    }
  };

  drop.addEventListener("click", () => input.click());
  input.addEventListener("change", (e) => handleFile(e.target.files[0]));
  attachDropHandler(drop, handleFile);
}

function initMorphClipHandlers() {
  _bindMorphDropzone("morphFirstFrameDrop", "first_frame");
  _bindMorphDropzone("morphLastFrameDrop", "last_frame");

  const slider = vmGetEl("morphLoraStrength");
  const valEl = vmGetEl("morphStrengthVal");
  if (slider && valEl) {
    slider.addEventListener("input", () => {
      valEl.textContent = parseFloat(slider.value).toFixed(2);
    });
  }

  const btn = vmGetEl("btnRenderMorph");
  if (btn) btn.addEventListener("click", renderMorphClip);
}

async function renderMorphClip() {
  const prompt = (vmGetEl("morphPromptInput")?.value || "").trim();
  const title = (vmGetEl("morphTitleInput")?.value || "").trim();
  const duration = parseFloat(vmGetEl("morphDuration")?.value) || 5.0;
  const loraStrength = parseFloat(vmGetEl("morphLoraStrength")?.value) || 0.85;
  const resVal = vmGetEl("selResolution")?.value || "720p";
  const fpsVal = parseInt(vmGetEl("selFps")?.value) || 24;

  if (!prompt && !state.morphClip.first_frame) {
    showToast(currentLang === "de" ? "Bitte gib einen Morph-Prompt ein oder wähle ein Startbild." : "Please enter a morph prompt or pick a start frame.", "warn");
    return;
  }

  if (state.comfyConnected) {
    const isReady = await ensureDirectorReady();
    if (!isReady) return;
  }

  const btn = vmGetEl("btnRenderMorph");
  const pBox = vmGetEl("morphProgressBox");
  const pBar = vmGetEl("morphProgressBar");
  const pStats = vmGetEl("morphProgressStats");
  const pTimer = vmGetEl("morphProgressTimer");
  const pTitle = vmGetEl("morphProgressTitle");
  const pDoneBadge = vmGetEl("morphDoneBadge");

  btn.disabled = true;
  resetCancelButtons();
  pBox.style.display = "block";
  pBar.style.width = "10%";
  pStats.textContent = "10%";
  if (pDoneBadge) pDoneBadge.style.display = "none";

  let elapsedSeconds = 0;
  if (pTimer) pTimer.textContent = "⏱️ 00:00";
  const timerInterval = setInterval(() => {
    elapsedSeconds++;
    if (pTimer) pTimer.textContent = `⏱️ ${formatElapsed(elapsedSeconds)}`;
  }, 1000);
  const pollInterval = startJobProgressPoller(pBar, pStats, pTitle);

  try {
    const res = await fetch("/api/video/render_quick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        prompt: prompt || "Seamless surreal morphing transformation, fluid motion",
        duration,
        resolution: resVal,
        fps: fpsVal,
        seed: getEffectiveVideoSeed(),
        first_frame: state.morphClip.first_frame,
        last_frame: state.morphClip.last_frame,
        auto_sound: !!vmGetEl("chkMorphAudio")?.checked,
        turbo: isTurboMode(),
        morph_mode: true,
        lora_strength: loraStrength,
        end_hold: parseFloat(vmGetEl("morphEndHold")?.value) || 0,
        auto_upscale: !!vmGetEl("chkAutoUpscale")?.checked,
        upscale_engine: vmGetEl("selUpscaleEngine")?.value || "ffmpeg",
      }),
    });
    const data = await res.json();
    clearInterval(timerInterval);
    clearInterval(pollInterval);

    if (data.ok && data.video_url) {
      pBar.style.width = "100%";
      pStats.textContent = "100%";
      state.morphClip.video_url = data.video_url;
      const durFmt = data.duration_formatted || formatDurationReadable(elapsedSeconds);
      if (pDoneBadge) {
        pDoneBadge.style.display = "block";
        pDoneBadge.textContent = currentLang === "de" ? `✅ Fertiggestellt in ${durFmt}` : `✅ Completed in ${durFmt}`;
      }
      showToast(currentLang === "de" ? `Morph Clip fertig in ${durFmt}!` : `Morph Clip rendered in ${durFmt}!`, "success", 7000);
      setTimeout(() => {
        pBox.style.display = "none";
        btn.disabled = false;
        playClip(data.video_url, false);
      }, 1500);
    } else {
      pBox.style.display = "none";
      btn.disabled = false;
      if (data.missing_tier === "morph_lora") {
        showToast(data.error || t("morphLoraMissing"), "warn", 5000);
        checkModels(true, "morph_lora");
      } else {
        showToast(t("morphClipFailed") + (data.error || ""), "error");
      }
    }
  } catch (err) {
    clearInterval(timerInterval);
    clearInterval(pollInterval);
    showToast(t("morphClipError") + err, "error");
    pBox.style.display = "none";
    btn.disabled = false;
  }
}


  window.vmOpenDownloadModal = function () {
    if (typeof openDownloadModal === "function") openDownloadModal();
  };

  window.sendImageToVideoMaker = async function (urlOrPath, targetMode) {
    try {
      if (typeof window.switchStudioModule === "function") {
        window.switchStudioModule("video");
      }
      await initVideoModuleOnce();

      const res = await fetch("/api/video/adopt_studio_image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlOrPath }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(data.error || t("imageAdoptFailed"), "error");
        return;
      }

      const mode = targetMode || "quick";
      const targetTab = mode === "lipsync" ? "lipsync" : "quick";
      const tabBtn = document.querySelector(`#vm_tabs button[data-tab="${targetTab}"]`);
      if (tabBtn) tabBtn.click();

      const setFrameDropzone = (dropId, url, resetCall) => {
        const drop = vmGetEl(dropId);
        if (!drop) return;
        drop.classList.add("has-image");
        drop.innerHTML = `<img src="${escapeHtml(url)}"><button class="btn-remove-frame" onclick="event.stopPropagation(); ${resetCall}">×</button>`;
      };

      if (mode === "lipsync") {
        state.lipsync.portrait_image = data.url;
        setFrameDropzone("lipsyncPortraitDrop", data.url, "resetLipsyncFrame('portrait')");
        if (typeof updateLipsyncSegmentBadge === "function") updateLipsyncSegmentBadge();
      } else {
        state.quickClip.first_frame = data.url;
        setFrameDropzone("quickFirstFrameDrop", data.url, "resetQuickFrame('first')");
        state.longClip.first_frame = data.url;
        setFrameDropzone("longFirstFrameDrop", data.url, "resetLongFrame('first')");
        if (typeof autoMatchResolutionAspect === "function") autoMatchResolutionAspect(data.url);
      }
      if (typeof saveUiState === "function") saveUiState();
      showToast(
        currentLang === "de" ? "Bild an VideoMaker übergeben!" : "Image sent to VideoMaker!",
        "success"
      );
    } catch (err) {
      showToast(t("imageTransferError") + err, "error");
    }
  };

  // =========================================================================
  // Optional BExplains RefPacks UI (Quick Clip & Long Clip)
  // =========================================================================
  const REFPACK_ROLES = [
    { id: "character", labelDe: "Character (<Character n>)", labelEn: "Character (<Character n>)" },
    { id: "outfit", labelDe: "Outfit (<Outfit n>)", labelEn: "Outfit (<Outfit n>)" },
    { id: "location", labelDe: "Location (<Location n>)", labelEn: "Location (<Location n>)" },
    { id: "style", labelDe: "Style (<Style n>)", labelEn: "Style (<Style n>)" },
    { id: "item", labelDe: "Item (<Item n>)", labelEn: "Item (<Item n>)" },
    { id: "subject", labelDe: "Subject (<Subject n>)", labelEn: "Subject (<Subject n>)" },
    { id: "motion", labelDe: "Motion (<Motion n>)", labelEn: "Motion (<Motion n>)" },
    { id: "reference", labelDe: "Reference (<Picture n>)", labelEn: "Reference (<Picture n>)" },
    { id: "audio", labelDe: "Audio (<Audio n>)", labelEn: "Audio (<Audio n>)" },
  ];
  let _refPacksCatalog = { installed: false, refpacks: [], bundles: [], loaded: false };

  async function refreshRefPacksCatalog() {
    try {
      const res = await fetch("/api/video/refpacks/list");
      const data = await res.json();
      if (data && data.ok) {
        _refPacksCatalog = {
          installed: !!data.installed,
          refpacks: Array.isArray(data.refpacks) ? data.refpacks : [],
          bundles: Array.isArray(data.bundles) ? data.bundles : [],
          loaded: true,
        };
      }
    } catch (_) {
      _refPacksCatalog.loaded = true;
    }
    renderRefPacksPanel("quick");
    renderRefPacksPanel("long");
  }

  function _getRefPackTargetState(target) {
    return target === "long" ? state.longClip : state.quickClip;
  }

  function renderRefPacksPanel(target) {
    const body = vmGetEl(target === "long" ? "longRefPacksBody" : "quickRefPacksBody");
    const badge = vmGetEl(target === "long" ? "longRefPacksCountBadge" : "quickRefPacksCountBadge");
    if (!body) return;

    const targetState = _getRefPackTargetState(target);
    if (!Array.isArray(targetState.refpacks)) targetState.refpacks = [];
    const activeList = targetState.refpacks;

    if (badge) {
      badge.textContent = activeList.length > 0
        ? (currentLang === "de" ? `${activeList.length} aktiv` : `${activeList.length} active`)
        : (currentLang === "de" ? "inaktiv" : "inactive");
    }

    if (!_refPacksCatalog.loaded) {
      body.innerHTML = `<div style="font-size:11px; color:var(--mute);">${currentLang === "de" ? "Prüfe RefPacks-Status..." : "Checking RefPacks status..."}</div>`;
      return;
    }

    if (!_refPacksCatalog.installed) {
      body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <span style="font-size:11px; color:var(--mute);">
            ${currentLang === "de"
              ? "Optional: Installiere <b>BExplains RefPacks</b> &amp; <b>BExplains MiniMax H3 RefPacks</b> im Tab <i>Models &amp; Status → Extensions</i> (nutzt vorhandene H3-Modelle, keine neuen KI-Modelle nötig)."
              : "Optional: Install <b>BExplains RefPacks</b> &amp; <b>BExplains MiniMax H3 RefPacks</b> in <i>Models &amp; Status → Extensions</i> (uses existing H3 models, no extra AI weights needed)."}
          </span>
          <button type="button" class="btn-mini" onclick="window._vmRefreshRefPacks()">↻ ${currentLang === "de" ? "Prüfen" : "Refresh"}</button>
        </div>
      `;
      return;
    }

    const packOptions = _refPacksCatalog.refpacks.length > 0
      ? _refPacksCatalog.refpacks.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("")
      : `<option value="">${currentLang === "de" ? "(Noch keine RefPacks in models/refpacks)" : "(No RefPacks yet)"}</option>`;

    const roleOptions = REFPACK_ROLES.map(r =>
      `<option value="${r.id}">${escapeHtml(currentLang === "de" ? r.labelDe : r.labelEn)}</option>`
    ).join("");

    const activeHtml = activeList.length > 0
      ? activeList.map((item, idx) => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid var(--line); border-radius:6px; padding:5px 8px; margin-top:6px; font-size:11px;">
            <div>
              <span style="background:rgba(99,102,241,0.18); color:var(--accent); padding:1px 6px; border-radius:4px; font-weight:600; margin-right:6px;">${escapeHtml(item.role)}</span>
              <span style="color:var(--text); font-family:Consolas, monospace;">${escapeHtml(item.filename)}</span>
            </div>
            <button type="button" class="btn-mini" style="color:var(--danger);" onclick="window._vmRemoveRefPack('${target}', ${idx})">✕</button>
          </div>
        `).join("")
      : `<div style="font-size:11px; color:var(--mute); margin-top:6px;">${currentLang === "de" ? "Keine RefPacks aktiv — Standard-Workflow wird genutzt." : "No RefPacks active — using standard workflow."}</div>`;

    body.innerHTML = `
      <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
        <select id="vm_${target}RefPackSelect" style="flex:2; min-width:150px; font-size:11px; padding:5px 8px;">${packOptions}</select>
        <select id="vm_${target}RefPackRole" style="flex:1; min-width:130px; font-size:11px; padding:5px 8px;">${roleOptions}</select>
        <button type="button" class="btn-mini" onclick="window._vmAddRefPack('${target}')">+ ${currentLang === "de" ? "Hinzufügen" : "Add"}</button>
        <button type="button" class="btn-mini" onclick="window._vmRefreshRefPacks()" title="Refresh">↻</button>
      </div>
      ${activeHtml}
      <div style="margin-top:10px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.08); display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
        <input type="text" id="vm_${target}NewRefPackName" placeholder="${currentLang === "de" ? "Neuer Pack-Name (z.B. elena_look)" : "New pack name (e.g. elena_look)"}" style="flex:1; min-width:150px; font-size:11px; padding:4px 8px;">
        <button type="button" class="btn-mini" onclick="window._vmCreateRefPackFromFrame('${target}')" title="${currentLang === "de" ? "Startbild als RefPack speichern" : "Save Start Frame as RefPack"}">💾 ${currentLang === "de" ? "Aus Startbild erstellen" : "Create from Start Frame"}</button>
      </div>
    `;
  }

  window._vmRefreshRefPacks = refreshRefPacksCatalog;

  window._vmAddRefPack = function (target) {
    const sel = vmGetEl(target === "long" ? "longRefPackSelect" : "quickRefPackSelect");
    const roleSel = vmGetEl(target === "long" ? "longRefPackRole" : "quickRefPackRole");
    const fname = sel?.value?.trim();
    if (!fname) {
      showToast(currentLang === "de" ? "Bitte zuerst ein RefPack erstellen oder auswählen." : "Please create or select a RefPack first.", "warning");
      return;
    }
    const role = roleSel?.value || "character";
    const targetState = _getRefPackTargetState(target);
    if (!Array.isArray(targetState.refpacks)) targetState.refpacks = [];
    targetState.refpacks.push({ filename: fname, role });
    saveUiState();
    renderRefPacksPanel(target);
  };

  window._vmRemoveRefPack = function (target, idx) {
    const targetState = _getRefPackTargetState(target);
    if (Array.isArray(targetState.refpacks)) {
      targetState.refpacks.splice(idx, 1);
      saveUiState();
      renderRefPacksPanel(target);
    }
  };

  window._vmCreateRefPackFromFrame = async function (target) {
    const targetState = _getRefPackTargetState(target);
    const imgUrl = targetState.first_frame;
    if (!imgUrl) {
      showToast(currentLang === "de" ? "Bitte zuerst ein Startbild ablegen oder hochladen." : "Please drop or upload a Start Frame first.", "warning");
      return;
    }
    const nameInput = vmGetEl(target === "long" ? "longNewRefPackName" : "quickNewRefPackName");
    const name = (nameInput?.value || "").trim() || `refpack_${Date.now()}`;
    showToast(currentLang === "de" ? `Erstelle RefPack '${name}'...` : `Encoding RefPack '${name}'...`, "info");
    try {
      const res = await fetch("/api/video/refpacks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: imgUrl, reference_megapixels: 0.3, overwrite: false }),
      });
      const data = await res.json();
      if (data.ok && data.filename) {
        showToast(currentLang === "de" ? `RefPack gespeichert: ${data.filename}` : `RefPack saved: ${data.filename}`, "success");
        if (nameInput) nameInput.value = "";
        await refreshRefPacksCatalog();
      } else {
        showToast(data.error || "RefPack-Erstellung fehlgeschlagen", "error");
      }
    } catch (err) {
      showToast(String(err), "error");
    }
  };

  window.addEventListener("studio-module-changed", (ev) => {
    if (ev?.detail?.module === "video") {
      initVideoModuleOnce();
      syncStudioLang();
      refreshRefPacksCatalog();
    }
  });

  window.addEventListener("studio-language-changed", (ev) => {
    const l = (ev?.detail?.lang || localStorage.getItem("studio_lang") || "de").toLowerCase();
    currentLang = l.startsWith("en") ? "en" : "de";
    localStorage.setItem("tavideomaker.lang", currentLang);
    applyI18n();
    if (typeof renderScenes === "function" && typeof state !== "undefined" && Array.isArray(state.scenes)) {
      renderScenes();
    }
  });
})();
