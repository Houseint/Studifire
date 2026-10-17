/**
 * Studify - FeatherIcons (set compartilhado).
 * Ícones SVG estilo feather/lucide via react-native-svg (stroke 2, caps/joins round).
 * Fonte única: ProgressIcons re-exporta daqui (mantém a API antiga) e as telas
 * fora do Progresso usam os mesmos ícones no lugar dos emojis de chrome.
 */
import React from 'react';
import { Svg, Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

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

export function BookOpenIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </>
    ),
  });
}

export function BookIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
  });
}

export function CheckIcon({ size = 24, color = '#fff', testID }) {
  return base({ size, color, testID, children: <Polyline points="20 6 9 17 4 12" /> });
}

export function ClockIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Circle cx="12" cy="12" r="10" />
        <Polyline points="12 6 12 12 16 14" />
      </>
    ),
  });
}

export function FlameIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    ),
  });
}

export function SproutIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
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

export function TrophyIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
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

export function PencilIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  });
}

export function ArrowLeftIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Line x1="19" y1="12" x2="5" y2="12" />
        <Polyline points="12 19 5 12 12 5" />
      </>
    ),
  });
}

export function ArrowRightIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Line x1="5" y1="12" x2="19" y2="12" />
        <Polyline points="12 5 19 12 12 19" />
      </>
    ),
  });
}

export function PlusIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Line x1="12" y1="5" x2="12" y2="19" />
        <Line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
  });
}

export function HomeIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <Polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  });
}

export function SearchIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Circle cx="11" cy="11" r="8" />
        <Line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
  });
}

export function HelpCircleIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <Line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  });
}

export function BellIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
  });
}

export function TargetIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Circle cx="12" cy="12" r="10" />
        <Circle cx="12" cy="12" r="6" />
        <Circle cx="12" cy="12" r="2" />
      </>
    ),
  });
}

export function CameraIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <Circle cx="12" cy="13" r="4" />
      </>
    ),
  });
}

export function SunIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Circle cx="12" cy="12" r="4" />
        <Line x1="12" y1="2" x2="12" y2="4" />
        <Line x1="12" y1="20" x2="12" y2="22" />
        <Line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
        <Line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
        <Line x1="2" y1="12" x2="4" y2="12" />
        <Line x1="20" y1="12" x2="22" y2="12" />
        <Line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
        <Line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
      </>
    ),
  });
}

export function MoonIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  });
}

export function TrendingUpIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <Polyline points="17 6 23 6 23 12" />
      </>
    ),
  });
}

export function SparklesIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <Path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    ),
  });
}

export function CalendarIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <Line x1="16" y1="2" x2="16" y2="6" />
        <Line x1="8" y1="2" x2="8" y2="6" />
        <Line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  });
}

export function RefreshCwIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Polyline points="23 4 23 10 17 10" />
        <Polyline points="1 20 1 14 7 14" />
        <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
        <Path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </>
    ),
  });
}

export function ZapIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: <Polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  });
}

export function UserIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
      </>
    ),
  });
}

export function BotIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M12 8V4H8" />
        <Rect x="4" y="8" width="16" height="12" rx="2" />
        <Line x1="2" y1="14" x2="4" y2="14" />
        <Line x1="20" y1="14" x2="22" y2="14" />
        <Line x1="15" y1="13" x2="15" y2="15" />
        <Line x1="9" y1="13" x2="9" y2="15" />
      </>
    ),
  });
}

export function MapIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M1 6L1 22L8 18L16 22L23 18L23 2L16 6L8 2L1 6z" />
        <Line x1="8" y1="2" x2="8" y2="18" />
        <Line x1="16" y1="6" x2="16" y2="22" />
      </>
    ),
  });
}

export function XIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Line x1="18" y1="6" x2="6" y2="18" />
        <Line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
  });
}

export function ImageIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <Circle cx="8.5" cy="8.5" r="1.5" />
        <Polyline points="21 15 16 10 5 21" />
      </>
    ),
  });
}

export function FileTextIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Polyline points="14 2 14 8 20 8" />
        <Line x1="16" y1="13" x2="8" y2="13" />
        <Line x1="16" y1="17" x2="8" y2="17" />
      </>
    ),
  });
}

export function LinkIcon({ size = 24, color = '#fff', testID }) {
  return base({
    size,
    color,
    testID,
    children: (
      <>
        <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
  });
}

export default {
  BookOpenIcon,
  BookIcon,
  CheckIcon,
  ClockIcon,
  FlameIcon,
  SproutIcon,
  TrophyIcon,
  PencilIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  HomeIcon,
  SearchIcon,
  HelpCircleIcon,
  BellIcon,
  TargetIcon,
  CameraIcon,
  SunIcon,
  MoonIcon,
  TrendingUpIcon,
  SparklesIcon,
  CalendarIcon,
  RefreshCwIcon,
  ZapIcon,
  UserIcon,
  BotIcon,
  MapIcon,
  XIcon,
  ImageIcon,
  FileTextIcon,
  LinkIcon,
};
