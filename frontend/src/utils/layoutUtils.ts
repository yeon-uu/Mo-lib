import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VERTICAL_SPACING = 200;
const HORIZONTAL_SPACING = 180;
const START_Y = 200;

export interface Node {
  id: string;
  map_id: string;
  is_root: boolean;
  step_order: number;
  [key: string]: any;
}

export interface Edge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  reason?: string | null;
}

export interface PositionedNode extends Node {
  x: number;
  y: number;
}

/**
 * 엣지 기반 트리 레이아웃 알고리즘 (Reingold-Tilford 스타일)
 * - 루트에서 BFS로 깊이(depth)를 계산해 Y 배치 → step_order 오차 무시
 * - 각 노드를 자신의 서브트리 중앙에 배치 → 마인드맵처럼 펼쳐짐
 * - 자식이 없는 리프 노드 간격: HORIZONTAL_SPACING
 */
export function calculateNodePositions(
  nodes: Node[],
  edges: Edge[],
  mapId: string
): PositionedNode[] {
  const mapNodes = nodes.filter((n) => n.map_id === mapId);
  if (mapNodes.length === 0) return [];

  const nodeIds = new Set(mapNodes.map((n) => n.id));

  // 부모→자식 관계 구성
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  mapNodes.forEach((n) => childrenMap.set(n.id, []));

  edges.forEach((e) => {
    if (nodeIds.has(e.source_node_id) && nodeIds.has(e.target_node_id)) {
      childrenMap.get(e.source_node_id)!.push(e.target_node_id);
      parentMap.set(e.target_node_id, e.source_node_id);
    }
  });

  // 루트 노드 탐색 (부모 없는 노드, 우선순위: is_root 플래그)
  const rootCandidates = mapNodes.filter((n) => !parentMap.has(n.id));
  const root =
    rootCandidates.find((n) => n.is_root) ??
    rootCandidates[0] ??
    mapNodes[0];

  // 서브트리 너비 메모이제이션 (리프 = HORIZONTAL_SPACING, 내부 = 자식 합)
  const widthCache = new Map<string, number>();
  const getSubtreeWidth = (id: string): number => {
    if (widthCache.has(id)) return widthCache.get(id)!;
    const children = childrenMap.get(id) ?? [];
    const w =
      children.length === 0
        ? HORIZONTAL_SPACING
        : Math.max(
            children.reduce((sum, c) => sum + getSubtreeWidth(c), 0),
            HORIZONTAL_SPACING
          );
    widthCache.set(id, w);
    return w;
  };
  getSubtreeWidth(root.id);

  // DFS로 좌표 할당: 각 노드는 자신의 서브트리 중앙 X, depth × VERTICAL_SPACING Y
  const positions = new Map<string, { x: number; y: number }>();

  const assignPositions = (id: string, centerX: number, depth: number) => {
    positions.set(id, { x: centerX, y: START_Y + depth * VERTICAL_SPACING });

    const children = childrenMap.get(id) ?? [];
    if (children.length === 0) return;

    const totalWidth = children.reduce((sum, c) => sum + getSubtreeWidth(c), 0);
    let x = centerX - totalWidth / 2;
    children.forEach((childId) => {
      const w = getSubtreeWidth(childId);
      assignPositions(childId, x + w / 2, depth + 1);
      x += w;
    });
  };

  assignPositions(root.id, SCREEN_WIDTH / 2, 0);

  // 엣지에 연결되지 않은 고아 노드 처리
  let orphanX = SCREEN_WIDTH + HORIZONTAL_SPACING;
  mapNodes.forEach((n) => {
    if (!positions.has(n.id)) {
      positions.set(n.id, { x: orphanX, y: START_Y });
      orphanX += HORIZONTAL_SPACING;
    }
  });

  return mapNodes.map((n) => ({ ...n, ...positions.get(n.id)! }));
}

/**
 * 여러 맵의 모든 노드 위치를 계산
 */
export function calculateAllNodePositions(
  nodes: Node[],
  edges: Edge[]
): PositionedNode[] {
  console.log('[calculateAllNodePositions] nodes:', nodes.length, 'edges:', edges.length);
  const mapIds = Array.from(new Set(nodes.map((n) => n.map_id)));
  console.log('[calculateAllNodePositions] mapIds:', mapIds);

  let allPositionedNodes: PositionedNode[] = [];
  let currentXOffset = 0;

  mapIds.forEach((mapId) => {
    const mapPositionedNodes = calculateNodePositions(nodes, edges, mapId);
    console.log('[calculateAllNodePositions] mapId:', mapId, 'positioned:', mapPositionedNodes.length);

    const offsetNodes = mapPositionedNodes.map((node) => ({
      ...node,
      x: node.x + currentXOffset,
    }));

    allPositionedNodes = [...allPositionedNodes, ...offsetNodes];

    if (mapPositionedNodes.length > 0) {
      const maxX = Math.max(...mapPositionedNodes.map((n) => n.x));
      const minX = Math.min(...mapPositionedNodes.map((n) => n.x));
      currentXOffset += (maxX - minX) + HORIZONTAL_SPACING * 4;
    }
  });

  return allPositionedNodes;
}
