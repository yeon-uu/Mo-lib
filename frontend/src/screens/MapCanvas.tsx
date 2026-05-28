import React, { useRef, useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  Animated as RNAnimated,
} from 'react-native';
import Svg from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import EdgeLine from '../components/graph/EdgeLine';
import NodeCircle from '../components/graph/NodeCircle';
import { calculateAllNodePositions, Node as LayoutNode, Edge as LayoutEdge } from '../utils/layoutUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 타입 정의
type DomainType = 'movie' | 'music' | 'book';

interface NodeData extends LayoutNode {
  title: string;
  domain: DomainType;
  description: string;
  emotion_tags: string[];
}

// 도메인 아이콘
const DOMAIN_ICONS: Record<DomainType, string> = {
  movie: '▶',
  music: '♪',
  book: '📖',
};

// 목 데이터 (x, y 좌표 제거 - 레이아웃 알고리즘으로 자동 계산)
const MOCK_NODES_RAW: NodeData[] = [
  // Map 1: 명량 (node1-4)
  {
    id: 'node1',
    map_id: 'map1',
    title: '명량',
    domain: 'movie' as const,
    is_root: true,
    step_order: 0,
    description: '조선 최고의 전투',
    emotion_tags: ['#웅장함'],
  },
  {
    id: 'node2',
    map_id: 'map1',
    title: 'Norwegian Wood',
    domain: 'music' as const,
    is_root: false,
    step_order: 1,
    description: '비틀즈의 명곡',
    emotion_tags: ['#몽환'],
  },
  {
    id: 'node3',
    map_id: 'map1',
    title: '해변의 카프카',
    domain: 'book' as const,
    is_root: false,
    step_order: 2,
    description: '무라카미 하루키',
    emotion_tags: ['#고독'],
  },
  {
    id: 'node4',
    map_id: 'map1',
    title: '멜랑꼴리아',
    domain: 'movie' as const,
    is_root: false,
    step_order: 3,
    description: '현재 과몰입 중',
    emotion_tags: ['#우울'],
  },
  // Map 2: Fly to the moon (node5-7)
  {
    id: 'node5',
    map_id: 'map2',
    title: 'Fly Me to the Moon',
    domain: 'music' as const,
    is_root: true,
    step_order: 0,
    description: '프랭크 시나트라',
    emotion_tags: ['#로맨틱'],
  },
  {
    id: 'node6',
    map_id: 'map2',
    title: 'La La Land',
    domain: 'movie' as const,
    is_root: false,
    step_order: 1,
    description: '꿈을 향한 도전',
    emotion_tags: ['#감성'],
  },
  {
    id: 'node7',
    map_id: 'map2',
    title: '달',
    domain: 'book' as const,
    is_root: false,
    step_order: 2,
    description: '파커 하비의 시집',
    emotion_tags: ['#몽환'],
  },
  // Map 3: 프로젝트 헤일메리 (node8-10)
  {
    id: 'node8',
    map_id: 'map3',
    title: '프로젝트 헤일메리',
    domain: 'book' as const,
    is_root: true,
    step_order: 0,
    description: '앤디 위어의 SF 소설',
    emotion_tags: ['#스릴'],
  },
  {
    id: 'node9',
    map_id: 'map3',
    title: '인터스텔라',
    domain: 'movie' as const,
    is_root: false,
    step_order: 1,
    description: '우주를 향한 여정',
    emotion_tags: ['#웅장함'],
  },
  {
    id: 'node10',
    map_id: 'map3',
    title: 'Space Oddity',
    domain: 'music' as const,
    is_root: false,
    step_order: 2,
    description: '데이비드 보위',
    emotion_tags: ['#고독'],
  },
];

const MOCK_EDGES: LayoutEdge[] = [
  // Map 1 edges
  { id: 'e1', source_node_id: 'node1', target_node_id: 'node2' },
  { id: 'e2', source_node_id: 'node2', target_node_id: 'node3' },
  { id: 'e3', source_node_id: 'node3', target_node_id: 'node4' },
  // Map 2 edges
  { id: 'e4', source_node_id: 'node5', target_node_id: 'node6' },
  { id: 'e5', source_node_id: 'node6', target_node_id: 'node7' },
  // Map 3 edges
  { id: 'e6', source_node_id: 'node8', target_node_id: 'node9' },
  { id: 'e7', source_node_id: 'node9', target_node_id: 'node10' },
];

const MOCK_MAPS = [
  { id: 'map1', title: '명량' },
  { id: 'map2', title: 'Fly to the moon' },
  { id: 'map3', title: '프로젝트 헤일메리' },
];

export default function MapCanvas() {
  // 레이아웃 알고리즘으로 노드 위치 계산
  const MOCK_NODES = useMemo(() => {
    return calculateAllNodePositions(MOCK_NODES_RAW, MOCK_EDGES);
  }, []);

  // 별 배경 랜덤 생성
  const stars = useMemo(() => {
    const count = Math.floor(Math.random() * 6) + 10; // 10~15개
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: Math.random() * 1 + 2, // 2~3px
      opacity: Math.random() * 0.4 + 0.3, // 0.3~0.7
    }));
  }, []);

  // State
  const [selectedMapId, setSelectedMapId] = useState<string>(MOCK_MAPS[MOCK_MAPS.length - 1]?.id || 'map1');
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);

  // Reanimated shared values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // 바텀시트용 Animated (기존 API 유지)
  const bottomSheetY = useRef(new RNAnimated.Value(300)).current;

  // 팬 제스처
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    });

  // 핀치 제스처
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      // 스케일 제한 (0.5 ~ 3)
      const newScale = Math.max(0.5, Math.min(3, savedScale.value * event.scale));
      scale.value = newScale;

      // 핀치 중심점을 기준으로 줌
      const scaleDiff = newScale - savedScale.value;
      translateX.value = savedTranslateX.value - (event.focalX - SCREEN_WIDTH / 2) * scaleDiff / savedScale.value;
      translateY.value = savedTranslateY.value - (event.focalY - SCREEN_HEIGHT / 2) * scaleDiff / savedScale.value;
    });

  // 팬과 핀치를 동시에 처리
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // 선택된 맵의 노드들 필터링
  const selectedMapNodes = useMemo(() => {
    return MOCK_NODES.filter((node) => node.map_id === selectedMapId);
  }, [selectedMapId]);

  // 선택된 맵의 엣지들 필터링
  const selectedMapEdges = useMemo(() => {
    const nodeIds = new Set(selectedMapNodes.map((n) => n.id));
    return MOCK_EDGES.filter(
      (edge) => nodeIds.has(edge.source_node_id) && nodeIds.has(edge.target_node_id)
    );
  }, [selectedMapNodes]);

  // 선택된 맵의 최대 step_order 계산
  const maxStepInMap = useMemo(() => {
    if (selectedMapNodes.length === 0) return 0;
    return Math.max(...selectedMapNodes.map((n) => n.step_order));
  }, [selectedMapNodes]);

  // 클러스터 중심점 계산 (바운딩 박스의 중심)
  const getMapClusterCenter = (mapId: string) => {
    const mapNodes = MOCK_NODES.filter((node) => node.map_id === mapId);
    if (mapNodes.length === 0) return { x: 0, y: 0 };

    const xs = mapNodes.map((n) => n.x);
    const ys = mapNodes.map((n) => n.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
  };

  // 탭 진입 시 마지막 맵의 리프 노드로 자동 포커스
  useEffect(() => {
    if (selectedMapId && selectedMapNodes.length > 0) {
      const maxStep = Math.max(...selectedMapNodes.map((n) => n.step_order));
      const leafNode = selectedMapNodes.find((n) => n.step_order === maxStep);

      if (leafNode) {
        const centerX = SCREEN_WIDTH / 2 - leafNode.x;
        const centerY = SCREEN_HEIGHT / 2 - leafNode.y;
        translateX.value = centerX;
        translateY.value = centerY;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 마운트 시에만 실행

  // pill 탭 시 포커스 이동
  const handlePillPress = (mapId: string) => {
    setSelectedMapId(mapId);

    // 해당 맵의 클러스터 중심으로 이동
    const center = getMapClusterCenter(mapId);
    const centerX = SCREEN_WIDTH / 2 - center.x;
    const centerY = SCREEN_HEIGHT / 2 - center.y;

    translateX.value = withSpring(centerX, {
      damping: 20,
      stiffness: 90,
    });
    translateY.value = withSpring(centerY, {
      damping: 20,
      stiffness: 90,
    });

    // 줌 레벨도 적절하게 조정 (선택 사항)
    scale.value = withSpring(1, {
      damping: 20,
      stiffness: 90,
    });
  };

  // 노드 클릭 핸들러 - 바텀시트 열기
  const handleNodePress = (id: string) => {
    const node = MOCK_NODES.find((n) => n.id === id);
    if (node) {
      setSelectedNode(node);
      RNAnimated.spring(bottomSheetY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  // 바텀시트 닫기
  const closeBottomSheet = () => {
    RNAnimated.spring(bottomSheetY, {
      toValue: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedNode(null);
    });
  };

  // 줌 버튼 핸들러
  const handleZoomIn = () => {
    const newScale = Math.min(scale.value + 0.2, 3);
    scale.value = withSpring(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale.value - 0.2, 0.5);
    scale.value = withSpring(newScale);
  };

  const handleReset = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  };


  // 엣지 좌표 계산
  const getNodeById = (id: string) => selectedMapNodes.find((n) => n.id === id);

  // CTA 버튼 텍스트 결정
  const getCtaText = () => {
    if (!selectedNode) return '여정에 추가';
    if (selectedNode.is_root || (selectedNode.step_order === maxStepInMap && !selectedNode.is_root)) {
      return '과몰입 계속하기';
    }
    return '여정에 추가';
  };

  return (
    <View style={styles.container}>
        {/* 별 배경 */}
        {stars.map((star) => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              },
            ]}
          />
        ))}

        {/* 제스처 캔버스 */}
        <GestureDetector gesture={composedGesture}>
          <View style={styles.canvasContainer}>
            {/* 엣지 + 노드 통합 레이어 (동일한 transform 적용) */}
            <Animated.View style={[styles.graphLayer, animatedStyle]}>
              {/* 엣지 레이어 (화면 크기 고정 SVG) */}
              <Svg
                width={SCREEN_WIDTH * 4}
                height={SCREEN_HEIGHT * 4}
                style={styles.svgLayer}
              >
                {selectedMapEdges.map((edge) => {
                  const source = getNodeById(edge.source_node_id);
                  const target = getNodeById(edge.target_node_id);
                  if (!source || !target) return null;
                  return (
                    <EdgeLine
                      key={edge.id}
                      sourceX={source.x}
                      sourceY={source.y}
                      targetX={target.x}
                      targetY={target.y}
                    />
                  );
                })}
              </Svg>

              {/* 노드 레이어 */}
              {selectedMapNodes.map((node) => (
                <View
                  key={node.id}
                  style={[
                    styles.nodeWrapper,
                    {
                      left: node.x,
                      top: node.y,
                    },
                  ]}
                >
                  <NodeCircle
                    id={node.id}
                    title={node.title}
                    domain={node.domain}
                    is_root={node.is_root}
                    step_order={node.step_order}
                    isCurrentLeaf={node.step_order === maxStepInMap && !node.is_root}
                    onPress={handleNodePress}
                  />
                </View>
              ))}
            </Animated.View>
          </View>
        </GestureDetector>

        {/* 좌측 하단 줌 버튼 */}
        <View style={styles.zoomButtons}>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Text style={styles.zoomButtonText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleReset}>
            <Text style={styles.zoomButtonText}>↔</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 pill 컴포넌트 */}
        <View style={styles.pillContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillScrollContent}
          >
            {MOCK_MAPS.map((map) => (
              <TouchableOpacity
                key={map.id}
                style={[
                  styles.pill,
                  selectedMapId === map.id && styles.pillSelected,
                ]}
                onPress={() => handlePillPress(map.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedMapId === map.id && styles.pillTextSelected,
                  ]}
                >
                  {map.title}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.pillAdd}>
              <Text style={styles.pillAddText}>+</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 바텀시트 */}
        <Modal
          visible={selectedNode !== null}
          transparent
          animationType="none"
          onRequestClose={closeBottomSheet}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeBottomSheet}
          >
            <RNAnimated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: bottomSheetY }],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                {selectedNode && (
                  <View style={styles.bottomSheetContent}>
                    {/* 상단: 아이콘 + 제목 + 메타 */}
                    <View style={styles.bottomSheetHeader}>
                      <Text style={styles.domainIcon}>
                        {DOMAIN_ICONS[selectedNode.domain]}
                      </Text>
                      <View style={styles.bottomSheetHeaderText}>
                        <Text style={styles.bottomSheetTitle}>
                          {selectedNode.title}
                        </Text>
                        <Text style={styles.bottomSheetMeta}>
                          {selectedNode.domain} · step {selectedNode.step_order}
                        </Text>
                      </View>
                    </View>

                    {/* 중단: description */}
                    <Text style={styles.bottomSheetDescription}>
                      {selectedNode.description}
                    </Text>

                    {/* emotion_tags */}
                    <View style={styles.tagsContainer}>
                      {selectedNode.emotion_tags.map((tag: string, index: number) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    {/* 연결 이유 섹션 */}
                    <View style={styles.connectionSection}>
                      <Text style={styles.connectionTitle}>연결 이유</Text>
                      <Text style={styles.connectionText}>
                        이전 작품과의 감정적 연결성을 바탕으로 추천되었습니다.
                      </Text>
                    </View>

                    {/* CTA 버튼 */}
                    <View style={styles.ctaContainer}>
                      <TouchableOpacity style={styles.ctaSecondary}>
                        <Text style={styles.ctaSecondaryText}>상세 보기</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.ctaPrimary}>
                        <Text style={styles.ctaPrimaryText}>{getCtaText()}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </RNAnimated.View>
          </TouchableOpacity>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.deepSpace,
  },
  star: {
    position: 'absolute',
    backgroundColor: Colors.text.starlight,
    borderRadius: 999,
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
  graphLayer: {
    width: SCREEN_WIDTH * 4,
    height: SCREEN_HEIGHT * 4,
    position: 'absolute',
  },
  svgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  nodeWrapper: {
    position: 'absolute',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  zoomButtons: {
    position: 'absolute',
    left: 16,
    bottom: 80,
    gap: 8,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.nebulaBase,
    borderWidth: 1,
    borderColor: Colors.background.comet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: {
    fontSize: 18,
    color: Colors.text.starlight,
    fontWeight: '600',
  },
  // Pill 스타일
  pillContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: `${Colors.accent.orbit}33`,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  pillScrollContent: {
    gap: 8,
    paddingHorizontal: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent.pulsar,
    backgroundColor: 'transparent',
  },
  pillSelected: {
    backgroundColor: Colors.accent.pulsar,
    borderColor: Colors.accent.pulsar,
  },
  pillText: {
    fontSize: 14,
    color: Colors.text.moonmist,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: Colors.text.starlight,
  },
  pillAdd: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillAddText: {
    fontSize: 18,
    color: Colors.text.starlight,
    fontWeight: '600',
  },
  // 바텀시트 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.background.nebulaBase,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: 300,
  },
  bottomSheetContent: {
    gap: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainIcon: {
    fontSize: 24,
  },
  bottomSheetHeaderText: {
    flex: 1,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.starlight,
  },
  bottomSheetMeta: {
    fontSize: 12,
    color: Colors.text.moonmist,
    marginTop: 4,
  },
  bottomSheetDescription: {
    fontSize: 14,
    color: Colors.text.moonmist,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.background.dust,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: Colors.text.moonmist,
  },
  connectionSection: {
    backgroundColor: Colors.background.dust,
    padding: 12,
    borderRadius: 12,
  },
  connectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.starlight,
    marginBottom: 6,
  },
  connectionText: {
    fontSize: 12,
    color: Colors.text.moonmist,
    lineHeight: 18,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  ctaSecondary: {
    flex: 1,
    backgroundColor: Colors.background.dust,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.moonmist,
  },
  ctaPrimary: {
    flex: 1,
    backgroundColor: Colors.accent.nebulaRose,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.starlight,
  },
});
