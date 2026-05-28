import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 레이아웃 상수
const LAYER_SPACING = 180; // 레이어 간 세로 간격
const NODE_SPACING = 160; // 노드 간 최소 가로 간격
const START_Y = 200; // 시작 Y 좌표

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
}

export interface PositionedNode extends Node {
  x: number;
  y: number;
}

/**
 * step_order와 edge 정보를 기반으로 노드 위치를 계산하는 트리 레이아웃 알고리즘
 */
export function calculateNodePositions(
  nodes: Node[],
  edges: Edge[],
  mapId: string
): PositionedNode[] {
  // 해당 맵의 노드만 필터링
  const mapNodes = nodes.filter((n) => n.map_id === mapId);

  if (mapNodes.length === 0) {
    return [];
  }

  // step_order별로 노드 그룹화
  const layerMap = new Map<number, Node[]>();
  let maxStepOrder = 0;

  mapNodes.forEach((node) => {
    const layer = node.step_order;
    if (!layerMap.has(layer)) {
      layerMap.set(layer, []);
    }
    layerMap.get(layer)!.push(node);
    maxStepOrder = Math.max(maxStepOrder, layer);
  });

  // edge 정보로 부모-자식 관계 맵 생성
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source_node_id)) {
      childrenMap.set(edge.source_node_id, []);
    }
    childrenMap.get(edge.source_node_id)!.push(edge.target_node_id);
    parentMap.set(edge.target_node_id, edge.source_node_id);
  });

  // 루트 노드 찾기
  const rootNode = mapNodes.find((n) => n.is_root) || mapNodes[0];

  // 노드 위치 저장
  const positions = new Map<string, { x: number; y: number }>();

  // DFS로 트리 순회하며 위치 계산
  function layoutSubtree(nodeId: string, layer: number, leftBound: number, rightBound: number): number {
    const node = mapNodes.find((n) => n.id === nodeId);
    if (!node) return leftBound;

    const children = childrenMap.get(nodeId) || [];
    const y = START_Y + layer * LAYER_SPACING;

    if (children.length === 0) {
      // 리프 노드: 현재 가능한 왼쪽 경계에 배치
      const x = leftBound;
      positions.set(nodeId, { x, y });
      return x + NODE_SPACING;
    }

    // 자식 노드들의 위치를 먼저 계산
    let currentLeft = leftBound;
    const childPositions: number[] = [];

    children.forEach((childId) => {
      const childNode = mapNodes.find((n) => n.id === childId);
      if (childNode) {
        currentLeft = layoutSubtree(childId, childNode.step_order, currentLeft, rightBound);
        const childPos = positions.get(childId);
        if (childPos) {
          childPositions.push(childPos.x);
        }
      }
    });

    // 부모 노드는 자식들의 중앙에 배치
    let parentX: number;
    if (childPositions.length > 0) {
      const minChildX = Math.min(...childPositions);
      const maxChildX = Math.max(...childPositions);
      parentX = (minChildX + maxChildX) / 2;
    } else {
      parentX = leftBound;
    }

    positions.set(nodeId, { x: parentX, y });
    return currentLeft;
  }

  // 레이아웃 시작점 계산 (화면 중앙 기준)
  const startX = SCREEN_WIDTH * 2; // 캔버스 중심

  // 루트부터 레이아웃 시작
  layoutSubtree(rootNode.id, rootNode.step_order, startX - (mapNodes.length * NODE_SPACING) / 2, startX + (mapNodes.length * NODE_SPACING) / 2);

  // 각 레이어별로 남은 노드들 배치 (연결되지 않은 노드가 있을 경우)
  layerMap.forEach((layerNodes, layer) => {
    let unpositionedNodes = layerNodes.filter((n) => !positions.has(n.id));

    if (unpositionedNodes.length > 0) {
      // 이미 배치된 노드들의 최대 X 좌표 찾기
      let maxX = startX;
      positions.forEach((pos) => {
        maxX = Math.max(maxX, pos.x);
      });

      unpositionedNodes.forEach((node) => {
        maxX += NODE_SPACING;
        positions.set(node.id, {
          x: maxX,
          y: START_Y + layer * LAYER_SPACING,
        });
      });
    }
  });

  // 최종 결과 생성
  return mapNodes.map((node) => {
    const pos = positions.get(node.id) || { x: startX, y: START_Y };
    return {
      ...node,
      x: pos.x,
      y: pos.y,
    };
  });
}

/**
 * 여러 맵의 모든 노드 위치를 계산
 */
export function calculateAllNodePositions(
  nodes: Node[],
  edges: Edge[]
): PositionedNode[] {
  const mapIds = Array.from(new Set(nodes.map((n) => n.map_id)));

  let allPositionedNodes: PositionedNode[] = [];
  let currentXOffset = 0;

  mapIds.forEach((mapId, index) => {
    const mapPositionedNodes = calculateNodePositions(nodes, edges, mapId);

    // 각 맵 클러스터를 가로로 배치 (겹치지 않도록)
    const offsetNodes = mapPositionedNodes.map((node) => ({
      ...node,
      x: node.x + currentXOffset,
    }));

    allPositionedNodes = [...allPositionedNodes, ...offsetNodes];

    // 다음 맵을 위한 오프셋 계산
    if (mapPositionedNodes.length > 0) {
      const maxX = Math.max(...mapPositionedNodes.map((n) => n.x));
      const minX = Math.min(...mapPositionedNodes.map((n) => n.x));
      const clusterWidth = maxX - minX;
      currentXOffset += clusterWidth + NODE_SPACING * 3; // 맵 간 여유 공간
    }
  });

  return allPositionedNodes;
}
