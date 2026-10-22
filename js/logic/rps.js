/** 石头剪刀布的纯逻辑。顺序：0 石头，1 剪刀，2 布。 */

export const CHOICES = Object.freeze([
  Object.freeze({ id: 'rock', label: '石头', emoji: '✊' }),
  Object.freeze({ id: 'scissors', label: '剪刀', emoji: '✌️' }),
  Object.freeze({ id: 'paper', label: '布', emoji: '✋' }),
]);

/**
 * @param {number} player 玩家出拳下标
 * @param {number} opponent 对手出拳下标
 * @returns {'win' | 'lose' | 'draw'}
 */
export function judge(player, opponent) {
  if (player === opponent) return 'draw';
  return (player + 1) % 3 === opponent ? 'win' : 'lose';
}

export const RESULT_LABEL = Object.freeze({ win: '胜利', lose: '失败', draw: '平局' });
