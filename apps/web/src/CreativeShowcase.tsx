import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  BookOpen,
  Box,
  Clapperboard,
  Gamepad2,
  Music2,
  Palette,
  Languages,
} from "lucide-react";

export const creativeIdeas = [
  {
    id: "novel",
    label: "Write a novel",
    tool: "Writing",
    description: "Find your story.",
    icon: BookOpen,
    capability: "chat",
    prompt:
      "Help me write a novel. Let's start with the genre, a compelling premise, and the main character.",
    image: "novel",
    caption: "Stories worth telling",
    color: "#ffae73",
  },
  {
    id: "art",
    label: "Create some art",
    tool: "Art & images",
    description: "Make the imagined real.",
    icon: Palette,
    capability: "text_to_image",
    prompt:
      "Create a cinematic piece of fantasy concept art: a lone traveler overlooking an ancient city at sunset, with warm light and rich atmospheric detail.",
    image: "art",
    caption: "Imagine every detail",
    color: "#eaa2b8",
  },
  {
    id: "game",
    label: "Build a game",
    tool: "Game development",
    description: "Dream up a new world.",
    icon: Gamepad2,
    capability: "chat",
    prompt:
      "Help me build a small browser game. Ask me about the game idea and visual style, then help me develop its mechanics and code.",
    image: "game",
    caption: "Worlds to get lost in",
    color: "#cfb4ff",
  },
  {
    id: "music",
    label: "Write a song",
    tool: "Music & lyrics",
    description: "Give your ideas a voice.",
    icon: Music2,
    capability: "chat",
    prompt:
      "Help me write an original song. Let's choose a mood and theme, then develop the lyrics, song structure, and chord ideas.",
    caption: "Find your rhythm",
    color: "#fa8caf",
  },
  {
    id: "model",
    label: "Make a 3D model",
    tool: "3D models",
    description: "Give ideas dimension.",
    icon: Box,
    capability: "image_to_3d",
    prompt: "Create a detailed 3D concept from this reference image.",
    caption: "A whole new dimension",
    color: "#a6b8f4",
  },
  {
    id: "film",
    label: "Start your screenplay",
    tool: "Film & storyboards",
    description: "Set your story in motion.",
    icon: Clapperboard,
    capability: "chat",
    prompt:
      "Help me start a screenplay. Let's develop a strong logline, the main characters, and an opening scene.",
    image: "film",
    caption: "Every frame, a story",
    color: "#ffa079",
  },
];

export const promptIdeas = [
  creativeIdeas[0],
  creativeIdeas[2],
  creativeIdeas[5],
  creativeIdeas[3],
  creativeIdeas[1],
  {
    id: "language",
    label: "Learn a language",
    icon: Languages,
    capability: "chat",
    prompt:
      "I'd like to learn a language. Help me choose one and start practicing.",
  },
];

/** DOM transforms keep the artwork crisp and avoid a WebGL bundle on the home screen. */
export function CreativeShowcase() {
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const phase = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const gradient = useId();
  const stopped = reducedMotion;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    let frame = 0;
    let previous = 0;
    let width = element.clientWidth;
    let height = element.clientHeight;
    function draw() {
      cards.current.forEach((card, index) => {
        if (!card) return;
        const angle =
          phase.current + (index / creativeIdeas.length) * Math.PI * 2;
        const depth = (1 - Math.cos(angle)) / 2;
        const x = Math.sin(angle) * width * 0.365;
        const y = -Math.cos(angle) * height * 0.31;
        const scale = 0.78 + depth * 0.22;
        card.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) perspective(800px) rotateY(${-Math.sin(angle) * 22}deg) rotateZ(${Math.sin(angle) * 4}deg) scale(${scale})`;
        card.style.zIndex = String(2 + Math.round(depth * 100));
        card.style.filter = `brightness(${0.82 + depth * 0.18})`;
      });
    }
    function tick(now: number) {
      if (previous)
        phase.current += Math.min(now - previous, 64) * ((Math.PI * 2) / 70000);
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!stopped && !document.hidden) frame = requestAnimationFrame(tick);
    }
    const resize = new ResizeObserver(() => {
      width = element.clientWidth;
      height = element.clientHeight;
      draw();
    });
    resize.observe(element);
    draw();
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [stopped]);

  return (
    <section className="creative-showcase" aria-hidden="true">
      <div className="orbit-stage" ref={stage}>
        <svg
          className="orbit-ring"
          viewBox="0 0 1000 440"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#ffac63" />
              <stop offset=".48" stopColor="#e48175" />
              <stop offset="1" stopColor="#ef4f93" />
            </linearGradient>
          </defs>
          <ellipse
            className="orbit-ring-glow"
            cx="500"
            cy="220"
            rx="365"
            ry="136.4"
            stroke={`url(#${gradient})`}
          />
          <ellipse
            cx="500"
            cy="220"
            rx="365"
            ry="136.4"
            stroke={`url(#${gradient})`}
          />
        </svg>
        <div className="orbit-center-glow" aria-hidden="true" />
        {creativeIdeas.map((idea, index) => {
          const Icon = idea.icon;
          return (
            <div
              key={idea.id}
              className={`orbit-card orbit-card-${idea.id}`}
              ref={(node) => {
                cards.current[index] = node;
              }}
              style={{ "--card-accent": idea.color } as CSSProperties}
            >
              {idea.image ? (
                <img
                  src={`/creative/${idea.image}.webp`}
                  alt=""
                  width="600"
                  height="400"
                  draggable="false"
                />
              ) : idea.id === "music" ? (
                <div className="wave-art" aria-hidden="true">
                  <div className="wave-bars">
                    {Array.from({ length: 35 }, (_, i) => (
                      <i
                        key={i}
                        style={
                          {
                            "--bar-height": `${15 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.31)) * 70}%`,
                            "--bar-delay": `${-i * 0.11}s`,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>
                  <Music2 size={30} strokeWidth={1.5} />
                </div>
              ) : (
                <div className="model-art" aria-hidden="true">
                  <div className="model-grid" />
                  <div className="model-gem">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
              <span className="orbit-card-caption">
                <Icon size={13} />
                <span>{idea.caption}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
