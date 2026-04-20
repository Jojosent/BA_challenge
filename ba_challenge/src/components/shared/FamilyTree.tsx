import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Colors } from '@constants/colors';
import { FamilyMember, RELATION_LABELS, RELATION_COLORS } from '@types/index';

const CARD_W  = 90;
const CARD_H  = 70;
const H_GAP   = 24;
const V_GAP   = 60;
const { width: SCREEN_W } = Dimensions.get('window');

interface NodePosition {
  member: FamilyMember;
  x: number;
  y: number;
}

interface FamilyTreeProps {
  members: FamilyMember[];
  onSelect: (member: FamilyMember) => void;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ members, onSelect }) => {

  // Строим дерево по уровням
  const { positions, svgWidth, svgHeight, lines } = useMemo(() => {
    if (members.length === 0) return { positions: [], svgWidth: 300, svgHeight: 200, lines: [] };

    // Группируем по parentId
    const roots    = members.filter((m) => !m.parentId);
    const byParent: Record<number, FamilyMember[]> = {};

    members.forEach((m) => {
      if (m.parentId) {
        if (!byParent[m.parentId]) byParent[m.parentId] = [];
        byParent[m.parentId].push(m);
      }
    });

    const positions: NodePosition[] = [];
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

    // BFS обход — размещаем уровень за уровнем
    let queue: { member: FamilyMember; level: number; siblingIndex: number; siblingCount: number }[] = [];

    roots.forEach((r, i) => {
      queue.push({ member: r, level: 0, siblingIndex: i, siblingCount: roots.length });
    });

    const levelWidths: Record<number, number> = {};
    const levelCounts: Record<number, number> = {};

    // Считаем сколько нод на каждом уровне
    const countLevels = (nodes: FamilyMember[], level: number) => {
      if (!levelCounts[level]) levelCounts[level] = 0;
      levelCounts[level] += nodes.length;
      nodes.forEach((n) => {
        const children = byParent[n.id] || [];
        if (children.length > 0) countLevels(children, level + 1);
      });
    };
    countLevels(roots, 0);

    const maxNodesInRow = Math.max(...Object.values(levelCounts));
    const totalWidth    = Math.max(
      maxNodesInRow * (CARD_W + H_GAP) + H_GAP,
      SCREEN_W - 40
    );

    // Размещаем ноды
    const placeNode = (
      member: FamilyMember,
      level: number,
      indexInLevel: number,
      countInLevel: number
    ) => {
      const rowWidth = countInLevel * (CARD_W + H_GAP) - H_GAP;
      const startX   = (totalWidth - rowWidth) / 2;
      const x        = startX + indexInLevel * (CARD_W + H_GAP);
      const y        = level * (CARD_H + V_GAP) + V_GAP / 2;

      positions.push({ member, x, y });

      const children = byParent[member.id] || [];
      children.forEach((child, i) => {
        placeNode(child, level + 1, i, children.length);
        // Линия от родителя к ребёнку
        lines.push({
          x1: x + CARD_W / 2,
          y1: y + CARD_H,
          x2: positions.find((p) => p.member.id === child.id)?.x ?? x,
          y2: (level + 1) * (CARD_H + V_GAP) + V_GAP / 2,
        });
      });
    };

    roots.forEach((r, i) => placeNode(r, 0, i, roots.length));

    const maxLevel    = Math.max(...positions.map((p) => Math.floor(p.y / (CARD_H + V_GAP))));
    const svgHeight   = (maxLevel + 1) * (CARD_H + V_GAP) + V_GAP;

    return { positions, svgWidth: totalWidth, svgHeight, lines };
  }, [members]);

  if (members.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🌳</Text>
        <Text style={styles.emptyTitle}>Дерево пустое</Text>
        <Text style={styles.emptyText}>Добавь первого члена семьи</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ width: svgWidth, height: svgHeight }}>

          {/* Линии связей */}
          <Svg
            style={StyleSheet.absoluteFill}
            width={svgWidth}
            height={svgHeight}
          >
            {lines.map((line, i) => (
              <Line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2 + CARD_H / 2}
                stroke={Colors.border}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            ))}
          </Svg>

          {/* Карточки */}
          {positions.map(({ member, x, y }) => {
            const color = RELATION_COLORS[member.relation] || Colors.primary;
            const label = RELATION_LABELS[member.relation] || member.relation;

            return (
              <TouchableOpacity
                key={member.id}
                style={[styles.node, { left: x, top: y, borderColor: color }]}
                onPress={() => onSelect(member)}
                activeOpacity={0.8}
              >
                {/* Аватар */}
                <View style={[styles.nodeAvatar, { backgroundColor: color }]}>
                  <Text style={styles.nodeAvatarTxt}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Имя */}
                <Text style={styles.nodeName} numberOfLines={1}>
                  {member.name}
                </Text>

                {/* Роль */}
                <Text style={[styles.nodeRelation, { color }]} numberOfLines={1}>
                  {label}
                </Text>

                {/* Год рождения */}
                {member.birthYear && (
                  <Text style={styles.nodeBirth}>{member.birthYear}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText:  { fontSize: 14, color: Colors.textSecondary },

  node: {
    position:        'absolute',
    width:           CARD_W,
    height:          CARD_H,
    backgroundColor: Colors.surface,
    borderRadius:    12,
    borderWidth:     1.5,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
    gap:             2,
  },
  nodeAvatar: {
    width:        28,
    height:       28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems:   'center',
  },
  nodeAvatarTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  nodeName:     { fontSize: 10, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  nodeRelation: { fontSize: 9, textAlign: 'center' },
  nodeBirth:    { fontSize: 8, color: Colors.textMuted },
});