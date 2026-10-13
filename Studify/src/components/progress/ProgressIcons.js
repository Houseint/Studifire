/**
 * Studify - ProgressIcons (escopo só-Progresso).
 * Ícones SVG estilo feather/lucide via react-native-svg.
 * strokeWidth 2, strokeLinecap/Linejoin round. Nada em Icon.js foi tocado.
 */
import React from 'react';
import { Svg, Path, Circle, Line, Polyline } from 'react-native-svg';

function base({ size = 24, color = '#fff', children, testID }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      testID={testID}
    >
      {children}
    </Svg>
  );
}

export function BookOpenIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: (
      <>
        <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </>
    ),
  });
}

export function CheckIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: <Polyline points="20 6 9 17 4 12" />,
  });
}

export function ClockIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: (
      <>
        <Circle cx="12" cy="12" r="10" />
        <Polyline points="12 6 12 12 16 14" />
      </>
    ),
  });
}

export function FlameIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: (
      <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    ),
  });
}

export function SproutIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: (
      <>
        <Path d="M7 20h10" />
        <Path d="M10 20c5.5-2.5.8-6.4 3-10" />
        <Path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
        <Path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-3 .2-4.1 1-4.9 2z" />
      </>
    ),
  });
}

export function TrophyIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: (
      <>
        <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <Path d="M4 22h16" />
        <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </>
    ),
  });
}

export function PencilIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  });
}

export function ArrowLeftIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: (
      <>
        <Line x1="19" y1="12" x2="5" y2="12" />
        <Polyline points="12 19 5 12 12 5" />
      </>
    ),
  });
}

export function ArrowRightIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: (
      <>
        <Line x1="5" y1="12" x2="19" y2="12" />
        <Polyline points="12 5 19 12 12 19" />
      </>
    ),
  });
}

export function PlusIcon({ size = 24, color = '#fff' }) {
  return base({
    size,
    color,
    children: (
      <>
        <Line x1="12" y1="5" x2="12" y2="19" />
        <Line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
  });
}

export default {
  BookOpenIcon,
  CheckIcon,
  ClockIcon,
  FlameIcon,
  SproutIcon,
  TrophyIcon,
  PencilIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
};
