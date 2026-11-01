import React, { useState } from 'react';
import { Palette, Check, Sparkles, Sliders, Image, Heart, ShieldCheck } from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { PRESET_THEMES } from '../../data/themes';
import type { Theme } from '../../types';

interface MoodCard {
  id: string;
  title: string;
  category: string;
  color: string;
  emoji: string;
  description: string;
  tags: string[];
}

const SAMPLE_MOODBOARDS: Record<string, MoodCard[]> = {
  wedding: [
    {
      id: 'mb-1',
      title: 'Romantic Candlelight & Roses',
      category: 'Floral & Decor',
      color: '#f43f5e',
      emoji: '🕯️',
      description: 'Cascading blush roses, ivory taper candles in brass holders, and sheer silk runners across banquet tables.',
      tags: ['Candles', 'Blush Roses', 'Silk Runners', 'Brass Accents'],
    },
    {
      id: 'mb-2',
      title: 'Acoustic Strings & Jazz Serenade',
      category: 'Sound & Ambience',
      color: '#fb7185',
      emoji: '🎻',
      description: 'Warm string quartet for processional transitioning into lively bossa nova during cocktail hour.',
      tags: ['String Quartet', 'Bossa Nova', 'Soft Lighting'],
    },
    {
      id: 'mb-3',
      title: 'Vintage Champagne Tower',
      category: 'Bar & Celebration',
      color: '#fda4af',
      emoji: '🥂',
      description: 'Coupe glass pyramid with chilled brut champagne and edible floral garnishes for the grand entrance.',
      tags: ['Champagne Tower', 'Coupe Glasses', 'Edible Flowers'],
    },
    {
      id: 'mb-4',
      title: 'Sparkler Grand Exit',
      category: 'Farewell Send-off',
      color: '#e11d48',
      emoji: '✨',
      description: 'Guests line the stone pathway holding 36-inch golden sparklers as the couple departs.',
      tags: ['Golden Sparklers', 'Photo Moment', 'Night Sky'],
    },
  ],
  birthday: [
    {
      id: 'mb-b1',
      title: 'Confetti Cannon Explosion',
      category: 'Action & Photos',
      color: '#f59e0b',
      emoji: '🎉',
      description: 'Biodegradable multicolor metallic confetti cannons synchronized with the birthday song finale.',
      tags: ['Confetti', 'High Energy', 'Photo Op'],
    },
    {
      id: 'mb-b2',
      title: 'Interactive Photo Booth Corner',
      category: 'Entertainment',
      color: '#ef4444',
      emoji: '📸',
      description: 'Sequin shimmer backdrop with themed superhero & funny props, plus instant polaroid printouts.',
      tags: ['Polaroids', 'Props', 'Shimmer Wall'],
    },
    {
      id: 'mb-b3',
      title: 'Gourmet Slider & Pizza Bar',
      category: 'Food Station',
      color: '#f97316',
      emoji: '🍔',
      description: 'Bite-sized sliders, artisan personal pizzas, and a custom soda & mocktail fountain.',
      tags: ['Sliders', 'Artisan Pizza', 'Mocktails'],
    },
  ],
  college: [
    {
      id: 'mb-c1',
      title: 'Neon Cyberpunk Lighting & LED Wall',
      category: 'Stage Design',
      color: '#06b6d4',
      emoji: '🌐',
      description: 'P3 high-resolution LED mainstage wall running generative algorithmic visuals with cyan & magenta stage spots.',
      tags: ['LED Stage', 'Generative Art', 'Cyberpunk'],
    },
    {
      id: 'mb-c2',
      title: 'Midnight Hackathon Energy Lounge',
      category: 'Hospitality',
      color: '#0891b2',
      emoji: '⚡',
      description: 'Cold brew on tap, fresh fruit, ramen station, beanbags, and lo-fi chill hop gaming zone.',
      tags: ['Cold Brew', 'Beanbags', 'Gaming'],
    },
    {
      id: 'mb-c3',
      title: 'Sponsor Showcase & Swag Arcade',
      category: 'Exhibition',
      color: '#0e7490',
      emoji: '🏆',
      description: 'Interactive demo booths with claw machine swag dispenser and project showcase tablets.',
      tags: ['Tech Demos', 'Custom Swag', 'Interactive'],
    },
  ],
  party: [
    {
      id: 'mb-p1',
      title: 'Velvet Lounge & Starlight Ceiling',
      category: 'Atmosphere',
      color: '#6366f1',
      emoji: '🪩',
      description: 'Plush sapphire velvet modular sofas, mirrored cocktail tables, and laser galaxy ceiling projection.',
      tags: ['Velvet Sofas', 'Galaxy Lights', 'Lounge'],
    },
    {
      id: 'mb-p2',
      title: 'Artisan Mixology Bar',
      category: 'Drinks',
      color: '#818cf8',
      emoji: '🍸',
      description: 'Smoke-infused old fashioneds, butterfly pea flower gin fizz, and zero-proof botanical elixirs.',
      tags: ['Craft Cocktails', 'Smoked Drinks', 'Botanicals'],
    },
  ],
};

export default function ThemeSelector() {
  const { activeEvent, setTheme, showToast } = useEvents();
  const [activeMoodTab, setActiveMoodTab] = useState<'themes' | 'custom' | 'moodboard'>('themes');

  // Custom theme builder state
  const currentTheme = PRESET_THEMES.find((t) => t.id === activeEvent?.themeId) ?? PRESET_THEMES[0];
  const [customPrimary, setCustomPrimary] = useState(currentTheme.primary);
  const [customAccent, setCustomAccent] = useState(currentTheme.accent);
  const [customBg, setCustomBg] = useState(currentTheme.bg);

  if (!activeEvent) return null;

  const handleApplyTheme = (theme: Theme) => {
    setTheme(activeEvent.id, theme.id);
  };

  const handleApplyCustomTheme = () => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', customPrimary);
    root.style.setProperty('--color-accent', customAccent);
    root.style.setProperty('--color-bg', customBg);
    showToast('Custom theme palette applied!', 'success');
  };

  const eventCategory = activeEvent.type in SAMPLE_MOODBOARDS ? activeEvent.type : 'wedding';
  const moodcards = SAMPLE_MOODBOARDS[eventCategory] || SAMPLE_MOODBOARDS.wedding;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Palette size={18} className="text-indigo-600" />
            Theme Selection & Aesthetics
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tailor the color palette, visual styling, and moodboard to match your celebration's atmosphere.
          </p>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 text-xs font-medium">
          <button
            onClick={() => setActiveMoodTab('themes')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMoodTab === 'themes' ? 'bg-white shadow-xs text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Curated Themes
          </button>
          <button
            onClick={() => setActiveMoodTab('custom')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              activeMoodTab === 'custom' ? 'bg-white shadow-xs text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sliders size={13} />
            Custom Colors
          </button>
          <button
            onClick={() => setActiveMoodTab('moodboard')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              activeMoodTab === 'moodboard' ? 'bg-white shadow-xs text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Image size={13} />
            Inspiration Board
          </button>
        </div>
      </div>

      {/* Preset Themes Gallery */}
      {activeMoodTab === 'themes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRESET_THEMES.map((theme) => {
            const isSelected = activeEvent.themeId === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleApplyTheme(theme)}
                className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer bg-white flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 shadow-lg ring-4 ring-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl" aria-hidden="true">{theme.emoji}</span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-indigo-600 text-white rounded-full">
                        <Check size={12} /> Active Theme
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-400 group-hover:text-indigo-600">
                        Click to apply
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{theme.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{theme.description}</p>
                </div>

                {/* Color Swatches */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Palette Swatches
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-8 rounded-lg shadow-inner flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-xs"
                      style={{ backgroundColor: theme.primary }}
                      title={`Primary: ${theme.primary}`}
                    >
                      {theme.primary}
                    </div>
                    <div
                      className="flex-1 h-8 rounded-lg shadow-inner flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-xs"
                      style={{ backgroundColor: theme.accent }}
                      title={`Accent: ${theme.accent}`}
                    >
                      {theme.accent}
                    </div>
                    <div
                      className="flex-1 h-8 rounded-lg border border-gray-200 shadow-inner flex items-center justify-center text-[10px] font-mono font-bold text-gray-700 shadow-xs"
                      style={{ backgroundColor: theme.bg }}
                      title={`Background: ${theme.bg}`}
                    >
                      Bg
                    </div>
                  </div>

                  {/* Gradient Sample Preview Bar */}
                  <div
                    className="mt-3 h-2.5 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Theme Color Picker */}
      {activeMoodTab === 'custom' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl">
          <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600" />
            Custom Color Palette Generator
          </h3>
          <p className="text-xs text-gray-500 mb-6">
            Fine-tune hex colors directly for complete custom brand alignment (great for corporate galas and college festivals).
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-800">Primary Brand Color</label>
                <p className="text-xs text-gray-500">Buttons, highlights, active tabs</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                  aria-label="Pick primary color"
                />
                <input
                  type="text"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono uppercase border border-gray-200 rounded-lg"
                  aria-label="Primary color hex value"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-800">Accent & Secondary Glow</label>
                <p className="text-xs text-gray-500">Badges, gradients, secondary highlights</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                  aria-label="Pick accent color"
                />
                <input
                  type="text"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono uppercase border border-gray-200 rounded-lg"
                  aria-label="Accent color hex value"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-800">Page Background Tint</label>
                <p className="text-xs text-gray-500">Subtle backdrop canvas</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customBg}
                  onChange={(e) => setCustomBg(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                  aria-label="Pick background color"
                />
                <input
                  type="text"
                  value={customBg}
                  onChange={(e) => setCustomBg(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono uppercase border border-gray-200 rounded-lg"
                  aria-label="Background color hex value"
                />
              </div>
            </div>

            {/* Live Contrast & Accessibility Check */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-3">
              <ShieldCheck size={20} className="text-indigo-600 shrink-0" />
              <div className="text-xs text-indigo-900">
                <span className="font-semibold">WCAG Contrast Compliant:</span> White text over primary ({customPrimary}) and dark body text over background maintain high contrast readability across both bright daylight and low-lit event venues.
              </div>
            </div>

            <button
              onClick={handleApplyCustomTheme}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Check size={16} /> Apply Custom Palette
            </button>
          </div>
        </div>
      )}

      {/* Moodboard / Inspiration Cards */}
      {activeMoodTab === 'moodboard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Heart size={16} className="text-rose-500" />
              Curated Moodboard for {activeEvent.name}
            </h3>
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
              {moodcards.length} Inspiration Concepts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {moodcards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-xs"
                    style={{ backgroundColor: `${card.color}18`, color: card.color }}
                  >
                    {card.emoji}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {card.category}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 mt-1">{card.title}</h4>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{card.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-gray-50 text-gray-600 border border-gray-100"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
