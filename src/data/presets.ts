import { BackgroundPreset, CreativeStylePreset, EnhanceOption, SamplePhoto } from '../types';

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: 'sample-portrait',
    name: 'Friendly Portrait',
    category: 'People',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    description: 'Portrait shot of a woman with natural lighting',
  },
  {
    id: 'sample-golden-retriever',
    name: 'Happy Golden Retriever',
    category: 'Pets',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80',
    description: 'Cute smiling dog outdoors',
  },
  {
    id: 'sample-coffee',
    name: 'Coffee & Laptop Desk',
    category: 'Objects',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    description: 'Workstation with coffee and items',
  },
  {
    id: 'sample-urban',
    name: 'City Traveler',
    category: 'Travel',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    description: 'Man in city street with blurred background',
  },
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'beach',
    name: 'Sunny Beach',
    description: 'Tropical golden sand, turquoise waves & swaying palms',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
    prompt:
      'Seamlessly replace the background of this photo behind the main subject with a sun-drenched tropical paradise beach with crystal-clear turquoise ocean waves, soft warm golden sand, and gentle coconut palm trees under a bright blue sky. Match the lighting, shadow direction, and warm sun reflections on the subject so they integrate naturally.',
  },
  {
    id: 'city-skyline',
    name: 'City Skyline',
    description: 'Glamorous modern skyscrapers at twilight golden hour',
    thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=300&q=80',
    prompt:
      'Seamlessly replace the background behind the main subject with a breathtaking metropolitan city skyline with sleek illuminated skyscrapers and modern architectural glass towers at golden hour dusk. Harmonize the rim lighting and ambient city glow onto the subject realistically.',
  },
  {
    id: 'studio-gradient',
    name: 'Studio Gradient',
    description: 'Clean luxury pastel studio backdrop with soft spotlight',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80',
    prompt:
      'Seamlessly place the main subject against an immaculate high-end photo studio backdrop featuring a soft, elegant pastel radial gradient with subtle warm spotlight illumination and gentle floor drop shadows. Keep the subject crisp and studio-lit.',
  },
  {
    id: 'office',
    name: 'Modern Office',
    description: 'Contemporary executive loft with glass and indoor plants',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80',
    prompt:
      'Seamlessly place the subject inside a bright, tastefully designed modern open-concept corporate office with warm timber accents, large panoramic glass windows with soft natural daylight, and elegant blurred greenery in the background. Adjust lighting on the subject to match corporate executive photography.',
  },
  {
    id: 'blurred-nature',
    name: 'Lush Nature Bokeh',
    description: 'Sun-dappled emerald forest with creamy optical bokeh',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80',
    prompt:
      'Seamlessly replace the background with a vibrant, tranquil forest canopy bathed in warm sun rays filtering through green leaves, with creamy f/1.4 camera lens bokeh and delicate floating dust motes. Blend natural golden rim light onto the contours of the subject.',
  },
  {
    id: 'cozy-cafe',
    name: 'Cozy Cafe',
    description: 'Warm bistro interior with fairy lights and rustic wood',
    thumbnail: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80',
    prompt:
      'Seamlessly composite the subject inside a warm and atmospheric artisan coffee shop with soft amber pendant lighting, exposed brick, gentle steam, and cozy rustic cafe aesthetic. Match the warm inviting ambient color cast onto the subject.',
  },
];

export const CREATIVE_STYLES: CreativeStylePreset[] = [
  {
    id: 'cartoon-3d',
    name: '3D Animation',
    category: 'Popular',
    iconName: 'Smile',
    badge: 'Trending',
    description: 'Pixar & Disney style 3D animated character',
    previewPrompt: '3D animated movie character style',
    prompt:
      'Transform the photo into a charming, high-end 3D animated film character (Pixar/Disney cinematic style). Render with smooth stylized facial features, luminous eyes, expressive warm facial lighting, soft subsurface scattering on skin, and vibrant stylized textures while keeping the exact subject recognizable.',
  },
  {
    id: 'pro-headshot',
    name: 'Executive Headshot',
    category: 'Popular',
    iconName: 'Briefcase',
    badge: 'Pro',
    description: 'Polished LinkedIn executive portrait with sharp studio attire',
    previewPrompt: 'Corporate professional executive portrait',
    prompt:
      'Transform the subject into a polished, top-tier corporate executive headshot portrait. Clothe the subject in high-end tailored professional business attire (such as a crisp navy or charcoal blazer and shirt), illuminated with flattering Rembrandt three-point studio lighting, subtle catchlights in the eyes, sharp clarity, and a subtle neutral defocused executive studio backdrop.',
  },
  {
    id: 'superhero',
    name: 'Cinematic Superhero',
    category: 'Fun',
    iconName: 'Zap',
    badge: 'Epic',
    description: 'Heroic cinematic suit with dramatic lighting & energy aura',
    previewPrompt: 'Blockbuster superhero movie poster',
    prompt:
      'Transform the subject into an awe-inspiring cinematic blockbuster superhero. Equip them with an intricately detailed tactical-metallic superhero armored suit with luminous energy accents, heroic wind-swept posture, dramatic cinematic rim lighting, volumetric atmospheric smoke, and epic movie-poster aesthetics while faithfully preserving their face and likeness.',
  },
  {
    id: 'old-age',
    name: 'Old-Age Filter',
    category: 'Fun',
    iconName: 'Clock',
    description: 'Realistic mature transformation with distinguished wrinkles',
    previewPrompt: 'Gracefully aged 75-year-old portrait',
    prompt:
      'Transform the subject to realistically appear 40-50 years older. Add natural, anatomically accurate age details including distinguished laugh lines, gentle crow’s feet around the eyes, refined forehead creases, realistic thinning silver-grey hair, and softened mature skin texture while lovingly preserving their recognizable facial structure, warmth, and dignity.',
  },
  {
    id: 'watercolor',
    name: 'Watercolor Wash',
    category: 'Artistic',
    iconName: 'Palette',
    badge: 'Art',
    description: 'Handmade watercolor on heavy textured cold-press paper',
    previewPrompt: 'Fluid watercolor illustration with translucent washes',
    prompt:
      'Transform this photo into an authentic, expressive handmade watercolor painting. Render using fluid wet-on-wet watercolor washes, delicate pigment pooling, vibrant transparent color layers, soft feathered edges, subtle paper grain texture of 300gsm cold-press paper, and delicate artistic paint splatters.',
  },
  {
    id: 'oil-painting',
    name: 'Classical Oil',
    category: 'Artistic',
    iconName: 'Brush',
    description: 'Rich Renaissance impasto canvas with visible brushstrokes',
    previewPrompt: 'Museum quality oil painting on linen canvas',
    prompt:
      'Transform this photo into a classical museum-grade master oil painting on woven canvas. Render with textured visible impasto brushstrokes, rich dynamic pigment saturation, dramatic chiaroscuro lighting, delicate paint cracks, and lustrous varnished depth reminiscent of classical oil portrait masters.',
  },
  {
    id: 'pencil-sketch',
    name: 'Pencil Sketch',
    category: 'Artistic',
    iconName: 'Feather',
    description: 'Intricate graphite hand-drawing with fine cross-hatching',
    previewPrompt: 'Architectural graphite pencil illustration',
    prompt:
      'Transform this photo into an intricate, highly detailed fine-art graphite pencil sketch on slightly textured cream archival paper. Use delicate cross-hatching, varied pencil weights (from soft 6B shadows to sharp 2H outlines), smudge shading for depth, and expressive hand-drawn contours.',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    category: 'Artistic',
    iconName: 'Sparkles',
    description: 'Futuristic sci-fi aesthetic with glowing neon lighting',
    previewPrompt: 'Neon futuristic sci-fi scene with cybernetic accents',
    prompt:
      'Transform this photo into a stunning futuristic cyberpunk neo-noir aesthetic. Bathe the scene in luminous dual-tone neon rim lighting (electric magenta and cyan), subtle glossy wet street reflections, atmospheric steam, and sleek high-tech cybernetic highlights while keeping the subject central and crisp.',
  },
];

export const ENHANCE_OPTIONS: EnhanceOption[] = [
  {
    id: 'magic-polish',
    name: '✨ Magic Auto-Polish',
    description: 'Balanced intelligent enhancement of clarity, color & lighting',
    prompt:
      'Perform an all-around professional photographic enhancement on this image: optimize exposure and dynamic range, enrich color vibrancy, correct white balance, sharpen fine textures, remove digital noise and compression artifacts, and elevate the overall aesthetic to look shot on a high-end full-frame DSLR.',
  },
  {
    id: 'super-sharpness',
    name: '🔍 Super Sharpness & Deblur',
    description: 'Fix motion blur, restore fine eyelash, hair & texture details',
    prompt:
      'Dramatically enhance image sharpness and resolution: resolve soft or blurry areas, reconstruct micro-textures in hair, fabrics, eyes, and background details, apply intelligent edge crisping without halo artifacts, and produce an ultra-sharp, 4K master-grade photo.',
  },
  {
    id: 'studio-portrait',
    name: '👤 Studio Portrait Glow',
    description: 'Flattering skin smoothing, eye catchlights & soft rim light',
    prompt:
      'Enhance this portrait to commercial magazine cover quality: softly balance and even out skin tones while keeping natural skin texture completely intact (no plastic look), brighten eye irises and add sparkling catchlights, gently whiten teeth if visible, and apply soft, flattering magazine studio lighting.',
  },
  {
    id: 'vibrant-hdr',
    name: '🌅 Vibrant Cinematic HDR',
    description: 'Punchy contrast, deep shadows, and luminous golden highlights',
    prompt:
      'Convert this photo into a dramatic high dynamic range (HDR) cinematic image: reveal rich details in deep shadows and bright highlights, amplify depth and local contrast, saturate colors harmoniously, and infuse the image with golden-hour warmth and atmospheric radiance.',
  },
  {
    id: 'super-res',
    name: '🚀 2x Super-Resolution',
    description: 'Double image resolution with Lanczos4 interpolation and edge detail synthesis',
    prompt: 'super-res upscale 2x resolution with edge detail synthesis',
  },
];
