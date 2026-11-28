# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

block_cipher = None

extra_datas = []
extra_binaries = []
extra_hiddenimports = []
for _pkg in ('faster_whisper', 'ctranslate2'):
    try:
        _r = collect_all(_pkg)
        extra_datas += _r[0]
        extra_binaries += _r[1]
        extra_hiddenimports += _r[2]
    except Exception:
        pass

a = Analysis(
    ['server.py'],
    pathex=['.'],
    binaries=extra_binaries,
    datas=[
        ('web/index.html', 'web'),
        ('web/app.js', 'web'),
        ('web/gif_module.js', 'web'),
        ('web/gallery_module.js', 'web'),
        ('web/video_module.js', 'web'),
        ('web/style.css', 'web'),
        ('web/favicon.ico', 'web'),
        ('web/logo.png', 'web'),
        ('web/music', 'web/music'),
        ('workflows/TA-FLEXMOD-LLM_v2.93.json', 'workflows'),
        ('workflows/discord_gif/*.json', 'workflows/discord_gif'),
        ('workflows/music_maker/YuE2-Song.json', 'workflows/music_maker'),
        ('data/plenio_templates.json', 'data'),
        ('modules/music_maker/wsl_vocal_align.py', 'modules/music_maker'),
        ('media/minimaxH3Lipsync_v41.json', 'media'),
        ('media/luts/*.cube', 'media/luts'),
        ('media/sounds/*', 'media/sounds'),
        ('app.ico', '.'),
    ] + extra_datas,
    hiddenimports=[
        'PIL',
        'PIL.Image',
        'PIL.PngImagePlugin',
        'webview',
        'modules',
        'modules.discord_gif',
        'modules.gallery_indexer',
        'modules.updater',
        'modules.video_maker',
        'modules.video_comfy',
        'modules.video_models',
        'modules.video_stitcher',
        'modules.music_maker',
        'modules.music_maker.music_service',
        'modules.music_maker.comfy_client',
        'modules.music_maker.workflow_converter',
        'modules.music_maker.voice_swap',
        'modules.music_maker.srt_translate',
    ] + extra_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='StudioCockpit',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='app.ico',
)
