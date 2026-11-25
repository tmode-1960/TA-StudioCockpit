"""Model Manifest and Disk Space Verification for tA-VideoMaker.

Defines required models for MiniMax H3 (and lightweight fallbacks),
checks local presence, verifies disk space, and provides download endpoints.
"""

from __future__ import annotations

import os
import shutil
import sys
from typing import Dict, List, Optional

# Official Hugging Face models hosted by Comfy-Org for MiniMax H3
KNOWN_VIDEO_MODELS: Dict[str, dict] = {
    # 1. Main Diffusion Backbone (Pruned INT8 / FastH3 8-Step / Hybrid / Ref2VA)
    "minimax_h3_fl2va_pruned_int8_convrot.safetensors": {
        "name": "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
        "title": "MiniMax H3 Diffusion Model (FL2VA / FastH3 8-Step / Ref2VA INT8)",
        "description": "Haupt-Diffusionsmodell für Video- und Stereo-Audio-Generierung (inkl. FastH3 8-Step, Hybrid & Ref2VA Varianten)",
        "description_en": "Primary diffusion model for video and stereo audio generation (incl. FastH3 8-Step, Hybrid & Ref2VA variants)",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 14.5,
        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors",
        "tier": "minimax_h3",
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
        "alternatives": [
            "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
            "fastvideo_fasth3_8step_v2_pruned_int8_convrot.safetensors",
            "minimax_h3_hybrid_fl2va_ref2va_b30-49-int8.safetensors",
            "MiniMax_H3_Ref2VA_pruned_int8_convrot.safetensors",
            "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
            "minimax_h3_fl2va_bf16.safetensors",
            "minimax_h3_ref2va_bf16.safetensors",
        ],
    },

    # 2. Text Encoder (Qwen3-VL 32B INT4 / INT8 / AWQ / BF16)
    "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors": {
        "name": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
        "title": "Qwen3-VL 32B Text Encoder (INT4 / INT8 / AWQ)",
        "description": "Versteht Prompts & Bildreferenzen (unterstützt INT4_convrot, INT8_convrot, AWQ & BF16)",
        "description_en": "Understands prompts & image references (supports INT4_convrot, INT8_convrot, AWQ & BF16)",
        "directory": "text_encoders",
        "alt_directories": ["text_encoders", "clip"],
        "comfy_category": "clips",
        "size_gb": 15.7,
        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
        "tier": "minimax_h3",
        "tiers": ["minimax_h3", "minimax_h3_image"],
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
        "alternatives": [
            "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
            "qwen3vl_32b_minimax_h3_int4_convrot.safetensors",
            "qwen3vl_32b_minimax_h3_int8_convrot.safetensors",
            "qwen3vl_32b_minimax_h3_bf16.safetensors",
        ],
    },

    # 3. Video VAE
    "minimax_h3_video_vae_fp16.safetensors": {
        "name": "minimax_h3_video_vae_fp16.safetensors",
        "title": "MiniMax H3 Video VAE (FP16)",
        "description": "Dekodiert latente Frames in fertige Videobilder",
        "description_en": "Decodes latent video frames into full-resolution video frames",
        "directory": "vae",
        "alt_directories": ["vae"],
        "comfy_category": "vaes",
        "size_gb": 0.4,
        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors",
        "tier": "minimax_h3",
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
        "alternatives": [
            "minimax_h3_video_vae_fp16.safetensors",
            "minimax_h3_video_vae_bf16.safetensors",
            "minimax_h3_video_vae_int8_convrot.safetensors",
            "minimax_h3_video_vae.safetensors",
            "minimax_video_vae_fp16.safetensors",
            "minimax_video_vae.safetensors",
            "minimax_h3_vae_fp16.safetensors",
            "minimax_h3_vae.safetensors",
            "minimax_vae.safetensors",
        ],
    },

    # 4. Audio VAE
    "minimax_h3_audio_vae_fp32.safetensors": {
        "name": "minimax_h3_audio_vae_fp32.safetensors",
        "title": "MiniMax H3 Audio VAE (FP32)",
        "description": "Dekodiert latente Tonspuren in 32 kHz Stereo-Audio",
        "description_en": "Decodes latent audio channels into 32 kHz stereo audio",
        "directory": "vae",
        "alt_directories": ["vae"],
        "comfy_category": "vaes",
        "size_gb": 0.3,
        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors",
        "tier": "minimax_h3",
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
        "alternatives": [
            "minimax_h3_audio_vae_fp32.safetensors",
            "minimax_h3_audio_vae_fp16.safetensors",
            "minimax_h3_audio_vae.safetensors",
            "minimax_audio_vae.safetensors",
        ],
    },

    # 5. Wav2Vec 2.0 Audio Activity & Lipsync Encoder (Optional addon for Eclipse Lipsync)
    "wav2vec2_large_english_fp16.safetensors": {
        "name": "wav2vec2_large_english_fp16.safetensors",
        "title": "Wav2Vec 2.0 Large Audio Encoder (FP16)",
        "description": "Akustische Sprach- und Gesangsanalyse für präzisen MiniMax H3 Lipsync",
        "description_en": "Acoustic speech and vocal analysis for precise MiniMax H3 lipsync",
        "directory": "audio_encoders",
        "alt_directories": ["audio_encoders"],
        "comfy_category": "audio_encoders",
        "size_gb": 0.6,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/audio_encoders/wav2vec2_large_english_fp16.safetensors",
        "tier": "minimax_h3",
        "optional": True,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # 6. MiniMax H3 8-Step Turbo Acceleration LoRA (Required for 8-Step Turbo speed on standard UNETs)
    "minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors": {
        "name": "minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors",
        "title": "MiniMax H3 FL2V 8-Step Turbo LoRA (BF16)",
        "description": "8-Step Beschleunigungs-LoRA (reduziert Renderzeit von 20 auf 8 Steps)",
        "description_en": "8-Step turbo speedup LoRA (cuts render steps from 20 down to 8)",
        "directory": "loras",
        "alt_directories": ["loras"],
        "comfy_category": "loras",
        "size_gb": 1.96,
        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/loras/minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors",
        "tier": "minimax_h3",
        "optional": False,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # 7. Optional lightweight alternative for low-end cards
    "wan2.1_t2v_1.3b_bf16.safetensors": {
        "name": "wan2.1_t2v_1.3b_bf16.safetensors",
        "title": "Wan 2.1 T2V 1.3B (Ultra-Lightweight)",
        "description": "Extrem schnelles und speichersparendes Alternativmodell für 8 GB Grafikkarten",
        "description_en": "Ultra-fast and memory-efficient fallback model for 8 GB GPUs",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 3.2,
        "url": "https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B/resolve/main/wan2.1_t2v_1.3b_bf16.safetensors",
        "tier": "wan_lite",
        "recommended_for": ["8gb"],
    },

    # 8. Wan 2.1 14B High-Quality T2V & I2V
    "wan2.1_t2v_14B_bf16.safetensors": {
        "name": "wan2.1_t2v_14B_bf16.safetensors",
        "title": "Wan 2.1 T2V 14B (Cinematic Text-to-Video)",
        "description": "Führendes Open-Source Text-zu-Video Diffusionsmodell (14B Parameter, BF16 / FP8 / GGUF)",
        "description_en": "State-of-the-art open-source text-to-video diffusion model (14B parameters, BF16 / FP8 / GGUF)",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 14.2,
        "url": "https://huggingface.co/Wan-AI/Wan2.1-T2V-14B/resolve/main/wan2.1_t2v_14B_bf16.safetensors",
        "tier": "wan_2.1",
        "recommended_for": ["12gb", "16gb", "24gb"],
        "alternatives": [
            "wan2.1_t2v_14B_bf16.safetensors",
            "wan2.1_t2v_14B_fp8.safetensors",
            "wan2.1_t2v_14B_Q4_K_M.gguf",
            "wan2.1_t2v_14b_fp8.safetensors",
            "wan2.1_t2v_14B_q8.gguf",
        ],
    },

    # 9. Wan 2.1 I2V 14B 480P
    "wan2.1_i2v_480p_14B_bf16.safetensors": {
        "name": "wan2.1_i2v_480p_14B_bf16.safetensors",
        "title": "Wan 2.1 I2V 14B 480P (Image-to-Video)",
        "description": "Bild-zu-Video Generation mit nativer Dynamik und Prompt-Treue (480P)",
        "description_en": "Image-to-video generation with native dynamics and prompt adherence (480P)",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 14.2,
        "url": "https://huggingface.co/Wan-AI/Wan2.1-I2V-14B-480P/resolve/main/wan2.1_i2v_480p_14B_bf16.safetensors",
        "tier": "wan_2.1",
        "recommended_for": ["12gb", "16gb", "24gb"],
        "alternatives": [
            "wan2.1_i2v_480p_14B_bf16.safetensors",
            "wan2.1_i2v_480p_14B_fp8.safetensors",
            "wan2.1_i2v_720p_14B_fp8.safetensors",
            "wan2.1_i2v_480p_14B_Q4_K_M.gguf",
        ],
    },

    # 10. Wan 2.1 Text Encoder (UMT5-XXL FP8)
    "umt5_xxl_fp8_e4m3fn_scaled.safetensors": {
        "name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
        "title": "UMT5-XXL Text Encoder (Wan 2.1)",
        "description": "Fortschrittlicher Text-Encoder für Wan 2.1 Prompts (FP8 skaliert)",
        "description_en": "Advanced multilingual text encoder for Wan 2.1 prompt conditioning (FP8 scaled)",
        "directory": "text_encoders",
        "alt_directories": ["text_encoders", "clip"],
        "comfy_category": "clips",
        "size_gb": 5.1,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors",
        "tier": "wan_2.1",
        "tiers": ["wan_2.1", "wan_2.2"],
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # 11. Wan 2.1 Video VAE
    "wan_2.1_vae.safetensors": {
        "name": "wan_2.1_vae.safetensors",
        "title": "Wan 2.1 Video VAE",
        "description": "Dekodiert latente Frames für Wan 2.1 Videos",
        "description_en": "Decodes Wan 2.1 latent frames into RGB video frames",
        "directory": "vae",
        "alt_directories": ["vae"],
        "comfy_category": "vaes",
        "size_gb": 1.4,
        "url": "https://huggingface.co/Wan-AI/Wan2.1-T2V-14B/resolve/main/Wan2.1_VAE.pth",
        "tier": "wan_2.1",
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
        "alternatives": ["wan_2.1_vae.safetensors", "Wan2.1_VAE.pth", "wan2.1_vae.safetensors"],
    },

    # 12. Wan 2.1 InfiniteTalk Talking Head Lipsync
    "wan2.1_infiniteTalk_single_fp16.safetensors": {
        "name": "wan2.1_infiniteTalk_single_fp16.safetensors",
        "title": "Wan 2.1 InfiniteTalk (Single Speaker)",
        "description": "Audio-gesteuerte Mimik- und Gestikanimation für realistische Talking-Head-Avatare",
        "description_en": "Audio-driven facial and body motion synthesis for talking-head avatars",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "loras"],
        "comfy_category": "unets",
        "size_gb": 2.8,
        "url": "https://huggingface.co/MeiGen-AI/InfiniteTalk/resolve/main/wan2.1_infiniteTalk_single_fp16.safetensors",
        "tier": "wan_2.1",
        "optional": True,
        "recommended_for": ["12gb", "16gb", "24gb"],
    },

    # 13. MMAudio Synchformer Audio & Foley AI
    "mmaudio_large_44k_v2_fp16.safetensors": {
        "name": "mmaudio_large_44k_v2_fp16.safetensors",
        "title": "MMAudio Large V2 (Video-to-Audio Foley)",
        "description": "Generiert bildsynchrone Foley- und Umgebungsgeräusche direkt aus dem Video",
        "description_en": "Generates frame-synchronized Foley and ambient sounds directly from video",
        "directory": "mmaudio",
        "alt_directories": ["mmaudio", "audio_encoders"],
        "comfy_category": "mmaudio",
        "size_gb": 3.7,
        "url": "https://huggingface.co/Kijai/MMAudio_safetensors/resolve/main/mmaudio_large_44k_v2_fp16.safetensors",
        "tier": "minimax_h3",
        "optional": True,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # 14. MiniMax H3 Image (Startbild / Character-Sheet Generator)
    "minimax_h3_image_pruned_int8_convrot.safetensors": {
        "name": "minimax_h3_image_pruned_int8_convrot.safetensors",
        "title": "MiniMax H3 Image (Text-to-Image & Multi-Ref Editor, INT8)",
        "description": "Schnelle Startbild-, Character-Sheet- und Multi-Referenz-Generierung (bis zu 16 Referenzen)",
        "description_en": "Fast keyframe, character-sheet and multi-reference image generation (up to 16 references)",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 19.54,
        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3-Image/resolve/main/diffusion_models/minimax_h3_image_pruned_int8_convrot.safetensors",
        "tier": "minimax_h3_image",
        "recommended_for": ["12gb", "16gb", "24gb"],
        "alternatives": [
            "minimax_h3_image_pruned_int8_convrot.safetensors",
            "minimax_h3_image_pruned_w4a8.safetensors",
            "minimax_h3_image_pruned_bf16.safetensors",
        ],
    },

    # 15. MiniMax H3 Image VAE
    "minimax_h3_image_vae_fp16.safetensors": {
        "name": "minimax_h3_image_vae_fp16.safetensors",
        "title": "MiniMax H3 Image VAE (FP16)",
        "description": "VAE-Decoder für MiniMax H3 Image (bis 4K Auflösung)",
        "description_en": "VAE decoder for MiniMax H3 Image (up to 4K resolution)",
        "directory": "vae",
        "alt_directories": ["vae"],
        "comfy_category": "vaes",
        "size_gb": 1.09,
        "url": "https://huggingface.co/Comfy-Org/MiniMax-H3-Image/resolve/main/vae/minimax_h3_image_vae_fp16.safetensors",
        "tier": "minimax_h3_image",
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # 15b. Seedream-Style LoRA for MiniMax H3 Image (Optional)
    "Seedreamstyle_H3_Resume_6K.safetensors": {
        "name": "Seedreamstyle_H3_Resume_6K.safetensors",
        "title": "Seedream-Style LoRA (MiniMax H3 Image 6K)",
        "description": "Optionale Style-LoRA für filmisches Licht, Kontrast & feines Film-Grain (6 Steps / LCM)",
        "description_en": "Optional style LoRA for cinematic lighting, contrast and film grain (6 steps / LCM)",
        "directory": "loras",
        "alt_directories": ["loras"],
        "comfy_category": "loras",
        "size_gb": 0.45,
        "url": "https://huggingface.co/Nebsh/Seedreamstyle-H3-6K/resolve/main/Seedreamstyle_H3_Resume_6K.safetensors",
        "tier": "minimax_h3_image",
        "tiers": ["minimax_h3_image", "minimax_h3"],
        "optional": True,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # 16. Wan 2.2 TI2V 5B (Kompaktes Hybrid Text- & Image-to-Video)
    "wan2.2_ti2v_5B_fp16.safetensors": {
        "name": "wan2.2_ti2v_5B_fp16.safetensors",
        "title": "Wan 2.2 TI2V 5B (Hybrid T2V/I2V, FP16)",
        "description": "Effizientes Wan 2.2 Hybrid-Modell für Text- & Bild-zu-Video (ideal für 8–12 GB GPUs)",
        "description_en": "Efficient Wan 2.2 hybrid model for text- and image-to-video (ideal for 8–12 GB GPUs)",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 9.31,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_ti2v_5B_fp16.safetensors",
        "tier": "wan_2.2",
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # 17. Wan 2.2 Video VAE (5B)
    "wan2.2_vae.safetensors": {
        "name": "wan2.2_vae.safetensors",
        "title": "Wan 2.2 Video VAE (5B 16x16x4)",
        "description": "Spezialisierter High-Compression Video-VAE für Wan 2.2 5B",
        "description_en": "High-compression video VAE required for Wan 2.2 5B",
        "directory": "vae",
        "alt_directories": ["vae"],
        "comfy_category": "vaes",
        "size_gb": 1.31,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/vae/wan2.2_vae.safetensors",
        "tier": "wan_2.2",
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # 18. Wan 2.2 T2V 14B MoE (High/Low Noise FP8)
    "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors": {
        "name": "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors",
        "title": "Wan 2.2 T2V 14B High-Noise (FP8)",
        "description": "Wan 2.2 14B Mixture-of-Experts High-Noise Backbone für Text-to-Video",
        "description_en": "Wan 2.2 14B Mixture-of-Experts high-noise backbone for text-to-video",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 13.31,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors",
        "tier": "wan_2.2",
        "optional": True,
        "recommended_for": ["12gb", "16gb", "24gb"],
    },
    "wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors": {
        "name": "wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors",
        "title": "Wan 2.2 T2V 14B Low-Noise (FP8)",
        "description": "Wan 2.2 14B Mixture-of-Experts Low-Noise Backbone für Text-to-Video",
        "description_en": "Wan 2.2 14B Mixture-of-Experts low-noise backbone for text-to-video",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 13.31,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors",
        "tier": "wan_2.2",
        "optional": True,
        "recommended_for": ["12gb", "16gb", "24gb"],
    },

    # 19. Wan 2.2 I2V 14B MoE (High/Low Noise FP8)
    "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors": {
        "name": "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors",
        "title": "Wan 2.2 I2V 14B High-Noise (FP8)",
        "description": "Wan 2.2 14B Mixture-of-Experts High-Noise Backbone für Image-to-Video",
        "description_en": "Wan 2.2 14B Mixture-of-Experts high-noise backbone for image-to-video",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 13.31,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors",
        "tier": "wan_2.2",
        "optional": True,
        "recommended_for": ["12gb", "16gb", "24gb"],
    },
    "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors": {
        "name": "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors",
        "title": "Wan 2.2 I2V 14B Low-Noise (FP8)",
        "description": "Wan 2.2 14B Mixture-of-Experts Low-Noise Backbone für Image-to-Video",
        "description_en": "Wan 2.2 14B Mixture-of-Experts low-noise backbone for image-to-video",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 13.31,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors",
        "tier": "wan_2.2",
        "optional": True,
        "recommended_for": ["12gb", "16gb", "24gb"],
    },

    # 20. Wan 2.2 S2V 14B (Speech-to-Video / Audio-Driven)
    "wan2.2_s2v_14B_fp8_scaled.safetensors": {
        "name": "wan2.2_s2v_14B_fp8_scaled.safetensors",
        "title": "Wan 2.2 S2V 14B (Speech-to-Video, FP8)",
        "description": "Audio-gesteuerte Video- und Charakteranimation der Generation Wan 2.2",
        "description_en": "Audio-driven cinematic video and character synthesis for Wan 2.2",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 15.27,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_s2v_14B_fp8_scaled.safetensors",
        "tier": "wan_2.2",
        "optional": True,
        "recommended_for": ["12gb", "16gb", "24gb"],
    },

    # 21. Wan 2.2 LightX2V 4-Step Distillation LoRAs
    "wan2.2_t2v_lightx2v_4steps_lora_v1.1_high_noise.safetensors": {
        "name": "wan2.2_t2v_lightx2v_4steps_lora_v1.1_high_noise.safetensors",
        "title": "Wan 2.2 T2V LightX2V 4-Step LoRA (High-Noise)",
        "description": "4-Step Turbo-LoRA für extrem schnelles Wan 2.2 T2V Rendering",
        "description_en": "4-step turbo distillation LoRA for ultra-fast Wan 2.2 T2V rendering",
        "directory": "loras",
        "alt_directories": ["loras"],
        "comfy_category": "loras",
        "size_gb": 1.14,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_t2v_lightx2v_4steps_lora_v1.1_high_noise.safetensors",
        "tier": "wan_2.2",
        "optional": True,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },
    "wan2.2_t2v_lightx2v_4steps_lora_v1.1_low_noise.safetensors": {
        "name": "wan2.2_t2v_lightx2v_4steps_lora_v1.1_low_noise.safetensors",
        "title": "Wan 2.2 T2V LightX2V 4-Step LoRA (Low-Noise)",
        "description": "4-Step Turbo-LoRA für extrem schnelles Wan 2.2 T2V Rendering",
        "description_en": "4-step turbo distillation LoRA for ultra-fast Wan 2.2 T2V rendering",
        "directory": "loras",
        "alt_directories": ["loras"],
        "comfy_category": "loras",
        "size_gb": 1.14,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_t2v_lightx2v_4steps_lora_v1.1_low_noise.safetensors",
        "tier": "wan_2.2",
        "optional": True,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },
    "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors": {
        "name": "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors",
        "title": "Wan 2.2 I2V LightX2V 4-Step LoRA (High-Noise)",
        "description": "4-Step Turbo-LoRA für extrem schnelles Wan 2.2 I2V Rendering",
        "description_en": "4-step turbo distillation LoRA for ultra-fast Wan 2.2 I2V rendering",
        "directory": "loras",
        "alt_directories": ["loras"],
        "comfy_category": "loras",
        "size_gb": 1.14,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors",
        "tier": "wan_2.2",
        "optional": True,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },
    "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors": {
        "name": "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors",
        "title": "Wan 2.2 I2V LightX2V 4-Step LoRA (Low-Noise)",
        "description": "4-Step Turbo-LoRA für extrem schnelles Wan 2.2 I2V Rendering",
        "description_en": "4-step turbo distillation LoRA for ultra-fast Wan 2.2 I2V rendering",
        "directory": "loras",
        "alt_directories": ["loras"],
        "comfy_category": "loras",
        "size_gb": 1.14,
        "url": "https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors",
        "tier": "wan_2.2",
        "optional": True,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # --- Morph / Transformation Style LoRA ---
    "animatediff_style_h3.safetensors": {
        "name": "animatediff_style_h3.safetensors",
        "title": "AnimateDiff Style & Morph LoRA (MiniMax H3)",
        "description": "Erzeugt fließende, traumartige Morphing- und Transformations-Übergänge in MiniMax H3",
        "description_en": "Produces fluid, dreamlike morphing and transformation transitions in MiniMax H3",
        "directory": "loras",
        "alt_directories": ["loras"],
        "comfy_category": "loras",
        "size_gb": 0.16,
        "url": "https://huggingface.co/Charlietooth/Animatediff_style_Minimax_H3/resolve/main/animatediff_style_h3.safetensors",
        "tier": "morph_lora",
        "optional": False,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },

    # --- RelayVSR AI 2x Video Upscaler ---
    "relayvsr_x2_lightx2v_int8_convrot.safetensors": {
        "name": "relayvsr_x2_lightx2v_int8_convrot.safetensors",
        "title": "RelayVSR 2x Diffusion Upscaler (INT8)",
        "description": "Schnelles 2x KI-Video-Upscaling (ideal für 480p → 1080p ohne Flimmern)",
        "description_en": "Fast 2x AI video super-resolution backbone (ideal for 480p → 1080p without flicker)",
        "directory": "diffusion_models",
        "alt_directories": ["diffusion_models", "unet"],
        "comfy_category": "unets",
        "size_gb": 5.16,
        "url": "https://huggingface.co/Comfy-Org/RelayVSR/resolve/main/diffusion_models/relayvsr_x2_lightx2v_int8_convrot.safetensors",
        "tier": "relayvsr",
        "optional": False,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },
    "relayvsr_flash_vae_x2_fp32.safetensors": {
        "name": "relayvsr_flash_vae_x2_fp32.safetensors",
        "title": "RelayVSR 2x Flash VAE (FP32)",
        "description": "Flash-Decoder-VAE für detailreiches RelayVSR 2x Video-Upscaling",
        "description_en": "Flash decoder VAE for crisp RelayVSR 2x video reconstruction",
        "directory": "vae",
        "alt_directories": ["vae"],
        "comfy_category": "vaes",
        "size_gb": 0.13,
        "url": "https://huggingface.co/Comfy-Org/RelayVSR/resolve/main/vae/relayvsr_flash_vae_x2_fp32.safetensors",
        "tier": "relayvsr",
        "optional": False,
        "recommended_for": ["8gb", "12gb", "16gb", "24gb"],
    },
}


def get_disk_free_gb(path: str) -> float:
    """Returns free space in GB on the drive where path is located."""
    try:
        abs_path = os.path.abspath(path)
        drive = os.path.splitdrive(abs_path)[0] or abs_path
        total, used, free = shutil.disk_usage(drive)
        return round(free / (1024 ** 3), 2)
    except Exception:
        return 0.0


def check_models_status(
    comfy_base_dir: Optional[str] = None,
    custom_target_dir: Optional[str] = None,
    tier: str = "minimax_h3",
    comfy_available: Optional[dict] = None,
    lang: str = "de",
    include_optional: bool = False,
) -> dict:
    raw_models = [
        m for m in KNOWN_VIDEO_MODELS.values()
        if (m.get("tier") == tier or tier in m.get("tiers", []))
        and (include_optional or not m.get("optional", False))
    ]
    models_to_check = []
    is_en = str(lang or "").lower().startswith("en")
    for m in raw_models:
        m_copy = dict(m)
        if is_en and m.get("description_en"):
            m_copy["description"] = m["description_en"]
        models_to_check.append(m_copy)

    search_dirs = []

    # 1. Custom user directory from Settings
    if custom_target_dir and custom_target_dir.strip():
        c_clean = custom_target_dir.strip()
        search_dirs.append(c_clean)
        search_dirs.append(os.path.join(c_clean, "models"))

    # 2. ComfyUI Base Directory
    if comfy_base_dir and os.path.isdir(comfy_base_dir):
        if os.path.basename(comfy_base_dir.rstrip("/\\")).lower() == "models":
            search_dirs.append(comfy_base_dir)
        else:
            search_dirs.append(os.path.join(comfy_base_dir, "models"))
            search_dirs.append(os.path.join(comfy_base_dir, "ComfyUI", "models"))
            try:
                from comfy_client import _find_subfolder_recursive
                nested_models = _find_subfolder_recursive(comfy_base_dir, "models", max_depth=4)
                if nested_models and nested_models not in search_dirs:
                    search_dirs.append(nested_models)
            except Exception:
                pass
            # Check extra_model_paths.yaml in comfy_base_dir and parent
            parent_dir = os.path.dirname(comfy_base_dir)
            for yaml_f in [
                os.path.join(comfy_base_dir, "extra_model_paths.yaml"),
                os.path.join(parent_dir, "extra_model_paths.yaml") if parent_dir else "",
            ]:
                if yaml_f and os.path.isfile(yaml_f):
                    try:
                        with open(yaml_f, "r", encoding="utf-8", errors="ignore") as yf:
                            for y_line in yf:
                                if "base_path:" in y_line or "base_path" in y_line:
                                    parts = y_line.strip().split(":", 1)
                                    if len(parts) > 1:
                                        pv = parts[1].strip().strip("'\"")
                                        if os.path.isdir(pv) and pv not in search_dirs:
                                            search_dirs.append(pv)
                                            search_dirs.append(os.path.join(pv, "models"))
                    except Exception:
                        pass

    # 3. Environment Variables
    for env_key in ("COMFYUI_PATH", "COMFY_HOME"):
        if os.environ.get(env_key) and os.path.isdir(os.environ[env_key]):
            search_dirs.append(os.path.join(os.environ[env_key], "models"))

    # 4. Local App models fallback (Permanent directory, never temp _MEIPASS!)
    if getattr(sys, "frozen", False):
        app_root = os.path.dirname(os.path.abspath(sys.executable))
    else:
        app_root = os.path.dirname(os.path.abspath(__file__))
    local_models_dir = os.path.abspath(os.path.join(app_root, "models"))
    search_dirs.append(local_models_dir)

    resolved_root = search_dirs[0] if search_dirs else local_models_dir
    try:
        os.makedirs(resolved_root, exist_ok=True)
    except Exception:
        pass

    present = []
    missing = []
    total_missing_size = 0.0

    subfolders_to_try = ["", "MINIMAX", "MINIMAX H3", "minimax_h3", "minimax"]

    def _find_model_entry(model: dict) -> Optional[dict]:
        fname = model["name"]
        cat_dirs = model.get("alt_directories", [model["directory"]])
        alt_names = model.get("alternatives", [fname])
        alt_names_lower = {a.lower(): a for a in alt_names}

        if comfy_available and isinstance(comfy_available, dict):
            comfy_cat = model.get("comfy_category", "")
            avail_list = comfy_available.get(comfy_cat, [])
            for item in avail_list:
                base_lower = os.path.basename(str(item).replace("\\", "/")).lower()
                if base_lower in alt_names_lower:
                    return {**model, "name": str(item), "local_path": f"ComfyUI ({item})"}

        for s_root in search_dirs:
            if not os.path.isdir(s_root):
                continue
            for c_dir in cat_dirs + [""]:
                base_cat = os.path.join(s_root, c_dir) if c_dir else s_root
                if not os.path.isdir(base_cat):
                    continue
                for sub in subfolders_to_try:
                    folder = os.path.join(base_cat, sub) if sub else base_cat
                    for candidate in alt_names:
                        cp = os.path.join(folder, candidate)
                        if os.path.isfile(cp) and os.path.getsize(cp) > 1024 * 1024:
                            return {**model, "name": candidate, "local_path": cp}
                try:
                    for root_w, dirs_w, files_w in os.walk(base_cat):
                        rel_w = os.path.relpath(root_w, base_cat)
                        rel_depth = 0 if rel_w == "." else rel_w.count(os.sep) + 1
                        if rel_depth > 4:
                            dirs_w[:] = []
                            continue
                        for f_name in files_w:
                            if f_name.lower() in alt_names_lower:
                                cp = os.path.join(root_w, f_name)
                                if os.path.isfile(cp) and os.path.getsize(cp) > 1024 * 1024:
                                    return {**model, "name": f_name, "local_path": cp}
                except Exception:
                    pass
        return None

    for model in models_to_check:
        found_entry = _find_model_entry(model)
        if found_entry:
            present.append(found_entry)
        else:
            missing.append(model)
            total_missing_size += model.get("size_gb", 0.0)

    optional_raw = [
        m for m in KNOWN_VIDEO_MODELS.values()
        if (m.get("tier") == tier or tier in m.get("tiers", []))
        and m.get("optional", False)
    ]
    optional_present = []
    optional_missing = []
    for m in optional_raw:
        m_copy = dict(m)
        if is_en and m.get("description_en"):
            m_copy["description"] = m["description_en"]
        found_opt = _find_model_entry(m_copy)
        if found_opt:
            optional_present.append(found_opt)
        else:
            optional_missing.append(m_copy)

    free_gb = get_disk_free_gb(resolved_root)
    has_space = free_gb >= (total_missing_size + 2.0) if missing else True

    return {
        "tier": tier,
        "is_ready": len(missing) == 0,
        "total_models": len(models_to_check),
        "present_count": len(present),
        "missing_count": len(missing),
        "present_models": present,
        "missing_models": missing,
        "optional_present_models": optional_present,
        "optional_missing_models": optional_missing,
        "total_download_size_gb": round(total_missing_size, 2),
        "target_dir": resolved_root,
        "free_space_gb": free_gb,
        "has_sufficient_space": has_space,
    }
