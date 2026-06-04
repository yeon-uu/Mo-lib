import React from 'react';
import { Line } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface EdgeLineProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export default function EdgeLine({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeLineProps) {
  const nodeRadius = 28;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / length;
  const unitY = dy / length;

  const startX = sourceX + unitX * nodeRadius;
  const startY = sourceY + unitY * nodeRadius;
  const endX = targetX - unitX * nodeRadius;
  const endY = targetY - unitY * nodeRadius;

  return (
    <>
      {/* glow 효과 */}
      <Line
        x1={startX} y1={startY} x2={endX} y2={endY}
        stroke={Colors.accent.pulsar}
        strokeWidth="4"
        opacity={0.15}
      />
      {/* 메인 선 */}
      <Line
        x1={startX} y1={startY} x2={endX} y2={endY}
        stroke={Colors.background.comet}
        strokeWidth="1.5"
        opacity={0.7}
      />
    </>
  );
}
