/**
 * Beyond 3D — Tiered Oral Hint System (D5 & D12)
 * Zero DOM dependencies; full 18-level 3-tier dialogue script database matching 00-master-gdd.md.
 *
 * Rules:
 * - Default (Tier 0): No text checklist! Only a short contextual opening line.
 * - Stagnation timer: After 45 seconds in the same stage without progress, the HUD hint indicator
 *   softly pulses to invite pressing `H`.
 * - Pressing `H` advances Tier 1 (现象提醒) -> Tier 2 (思考方向) -> Tier 3 (明确解法).
 * - Advancing to a new beat resets the stagnation timer cleanly.
 */

export const STAGNATION_THRESHOLD_SEC = 45;

export const LEVEL_HINTS = Object.freeze({
  1: {
    name: '前方的人',
    opening: { speaker: 'linxia', text: '别追前面那个人了。我追了她整整半个小时……' },
    tiers: [
      { speaker: 'linxia', text: '我数过自己走过的房间……每走过四间，脚下的红丝带就会重新出现。' },
      { speaker: 'linxia', text: '每走过一间房，窗外的雕像就顺时针转 90°；走满四间刚好转一圈回到原样。' },
      { speaker: 'linxia', text: '四间一循环，第 5 间和第 1 间一样，第 9 间也和第 1 间完全一样！看看你现在左窗外雕像的朝向，把它输入锁盘吧。' },
    ],
  },
  2: {
    name: '没有门通向对面',
    opening: { speaker: 'linxia', text: '重力解除了。我的定位信标在 W− 舱室，但你四周的六扇门里没有它。' },
    tiers: [
      { speaker: 'linxia', text: '我们被三维房间限制住了——一个立方体只有六个面，最多只能开六扇门，所以第 8 个房间一定不在你的六扇门后面。' },
      { speaker: 'linxia', text: '随便挑一扇门飞进隔壁房间看看，隔壁房间的六扇门里就有通向 W− 的门！' },
      { speaker: 'linxia', text: '先飞进任意一扇门，再从那个房间标着 W− 的门飞进去拿起定位器；W+ 有 6 个邻居，每个邻居都能一步到 W−，所以两步走法共有 6 条！' },
    ],
  },
  3: {
    name: '哪边是上',
    opening: { speaker: 'linxia', text: '我明明一直顺着箭头往“上”飞，没有低头也没有转弯，可绕了三间房回来，指针居然自己歪了 90°！' },
    tiers: [
      { speaker: 'linxia', text: '注意看房间角落那条发金光的棱——在四维边界上，一条棱周围只围着 3 个立方体房间，而不是 4 个！' },
      { speaker: 'linxia', text: '三个直角加起来只有 270°，比一整圈 360° 少了 90°。所以绕着这条金棱的三个房间飞一圈，方向就会偏转 90°！' },
      { speaker: 'linxia', text: '从 W+ 出发，依次飞进 X+ 门 → Y+ 门 → W+ 门回到起点，你手里的陀螺指针就会刚好转过 90°，按 E 插进锁槽即可！' },
    ],
  },
  4: {
    name: '一笔走完',
    opening: { speaker: 'linxia', text: '八间房只是这座巨型造物的外壳。不重复走遍八间房并回到 W+，中央裂隙球就会打开。' },
    tiers: [
      { speaker: 'linxia', text: '千万别把正对面的 W− 留到最后一间！因为从 W− 没有门能一步回到起点 W+。' },
      { speaker: 'linxia', text: '看着准星周围的罗盘，只挑标着 ★ 的门飞，并在中途（比如第 4 或第 5 步）先把 W− 走掉。' },
      { speaker: 'linxia', text: '推荐路线：从 W+ 出发，依次走 X+ → Y+ → Z+ → W− → X− → Y− → Z− → 回到 W+，即可一笔走完！' },
    ],
  },
  5: {
    name: '隔页的呼救',
    opening: { speaker: 'linxia', text: '08 号！我听到你的脚步声了！我就在金色拱门和发光树中间，可我眼前没人！' },
    tiers: [
      { speaker: 'linxia', text: '08 号，不用到处乱跑！我们在同一个三维大厅里，只是在不同的 W 折页上。' },
      { speaker: 'linxia', text: '站在原地向上滚动你的鼠标滚轮，切到 W = +1.8 流金折页，你就能看见我身边的金色拱门和发光树了！' },
      { speaker: 'linxia', text: '滚轮切到 W = +1.8，走到西侧金色拱门和东侧发光树正中间找我汇合！' },
    ],
  },
  6: {
    name: '魔戒之门',
    opening: { speaker: 'tomb', text: '三维的锁链，锁不住会在第四维呼吸的人。解开它们。' },
    tiers: [
      { speaker: 'linxia', text: '在三维里两个扣在一起的铁环除非锯断否则解不开，但在四维里，只要把其中一个环沿 W 方向挪开一点点，它们就不在同一个三维切片里了！' },
      { speaker: 'linxia', text: '注意看左右两边那两根发光柱子——右边那根挡住了流金层（W = +1.8），左边那根挡住了星轨层（W = −1.8）。' },
      { speaker: 'linxia', text: '选流金环 B，滚轮切到 W = −1.8 向右拉到底座再滚回 W = 0；选星紫环 C，滚轮切到 W = +1.8 向左拉到底座再滚回 W = 0！' },
    ],
  },
  7: {
    name: '玻璃牢笼',
    opening: { speaker: 'linxia', text: '那是我们飞船的黑匣子！可左边那座玻璃柜六面焊死，连一条缝都没有。' },
    tiers: [
      { speaker: 'linxia', text: '对二维画纸上的小人来说，一个正方形方框就是密不透风的牢笼；但对能离开画纸的我们来说，方框上面根本没有盖子！' },
      { speaker: 'linxia', text: '试试在左边玻璃柜前滚动鼠标滚轮切到 W = +1.8，看看玻璃墙还在不在？' },
      { speaker: 'linxia', text: '滚轮切到 W = +1.8 走进左边柜子正中央 → 滚回 W = 0 拿起黑匣子 → 再切 W = +1.8 走出来放到东侧读取台上！' },
    ],
  },
  8: {
    name: 'S 形回廊',
    opening: { speaker: 'linxia', text: '前面去升降梯的廊桥断成了三层！单走青苍、流金或者星轨任何一层，全都是死胡同。' },
    tiers: [
      { speaker: 'linxia', text: '别只盯着眼前这一层！每当你走到死胡同前，停下脚步看看另外两层的虚影是不是通的。' },
      { speaker: 'linxia', text: '按 Tab 或看右侧高维操作台的三层俯视图，把三张死路叠在一起就是一条完整的 S 形通路！' },
      { speaker: 'linxia', text: '在死墙前滚动鼠标滚轮切换到没墙的那一层继续走，先去流金层(+1.8)和星轨层(−1.8)碰亮两枚信标，最后回青苍层(0.0)进东北角出口！' },
    ],
  },
  9: {
    name: '断渊天梯',
    opening: { speaker: 'linxia', text: '这六级悬浮阶梯分布在不同的 W 折页里！看准下一级颜色，边跳边滚轮把它变成实体！' },
    tiers: [
      { speaker: 'linxia', text: '所有虚影台阶的颜色都代表它所在的层：青色是 W=0，金色是 W=+1.8，蓝色是 W=−1.8。' },
      { speaker: 'linxia', text: '千万别直接往虚影上跳！先用鼠标滚轮把下一级台阶调成完全不透明的实体，再按空格跳过去。' },
      { speaker: 'linxia', text: '按顺序切相跳跃：1阶青(0) → 滚轮向上切金(+1.8)跳2阶 → 滚轮向下切蓝(−1.8)跳3阶 → 切金(+1.8)跳4阶 → 切蓝(−1.8)跳5阶 → 切回青(0)跳上6阶顶台！' },
    ],
  },
  10: {
    name: '星图台',
    opening: { speaker: 'linxia', text: '这四个并排的立体棋盘不是四个房间，而是同一个四维空间在 W = 1, 2, 3, 4 的四张切片！' },
    tiers: [
      { speaker: 'linxia', text: '当你在第 1 个棋盘里被墙挡住时，看看第 2 个棋盘的同一个格子是不是空的？' },
      { speaker: 'linxia', text: '滚动鼠标滚轮就能在 W=1 到 W=4 四个棋盘的相同坐标之间直接跳过去；按 Space 和 Ctrl 可以上下楼层！' },
      { speaker: 'linxia', text: '按 Tab 键切换一下 XYZ 和 XYW 展开视图，或者观察哪个相邻棋盘的同位格没有障碍，滚轮切过去吃掉剩余的绿色星点！' },
    ],
  },
  11: {
    name: '推出围墙',
    opening: { speaker: 'linxia', text: '看 W = 2 棋盘中间那块金色能量箱！它被四面灰墙死死围在正中间，在三维里哪边都推不动。' },
    tiers: [
      { speaker: 'linxia', text: '箱子在 W=2 被前后左右的墙围死了，但它的“第四维方向”（W=1 和 W=3 的同一个位置）有墙吗？' },
      { speaker: 'linxia', text: '要想把箱子往 W+ 方向推到 W=3，你得先站到它在 W 方向的背后——也就是去 W=1 棋盘的同一个 (X,Y,Z) 坐标格！' },
      { speaker: 'linxia', text: '先滚轮切到 W=1 → 走到和 W=2 箱子完全相同的坐标格 → 向上滚动一下鼠标滚轮，就能直接把箱子从围墙里推进 W=3 棋盘！' },
    ],
  },
  12: {
    name: '错车',
    opening: { speaker: 'linxia', text: '单行道里两个箱子撞车了！在三维里谁也退不回去，但我们有第四维这根“避让车道”。' },
    tiers: [
      { speaker: 'linxia', text: '两个箱子在单行道里顶住了，就像火车单线会车一样，需要一条“岔道”。' },
      { speaker: 'linxia', text: '隔壁的 W 切片就是天然的避让岔道！先把挡路的箱子用滚轮推到隔壁 W 棋盘里让开路。' },
      { speaker: 'linxia', text: '在相邻 W 棋盘对准 1 号箱坐标，用滚轮把它推去另一层暂存；等 2 号箱推到终点后，再把 1 号箱推回来归位！（如果箱子在高处，可用 Ctrl 钻到箱子正下方按空格往上顶）' },
    ],
  },
  13: {
    name: '无法退出的环',
    opening: { speaker: 'tomb', text: '踏入第四维的人，往往以为自己无所不能。去试试那四枚环，把真正能解开的环带到祭台上来。' },
    tiers: [
      { speaker: 'linxia', text: '试试把每个环不仅往上下左右拉，还用鼠标滚轮往第四维 W 方向移移看！' },
      { speaker: 'linxia', text: '3 号环套着的无限长光柱只在 W=0 存在，滚轮切到 W=+1.8 就能把它拿下来；但 4 号环套着的光膜在所有 W 切片都无限延伸！' },
      { speaker: 'tomb', text: '在四维空间里，一维的圆环可以绕过一维的无限直线（3号可解），但绝对绕不过二维的无限平面（4号环绕数恒为 1，不可解）。把 1、2、3 号环取下放上祭台吧。' },
    ],
  },
  14: {
    name: '发丝裂缝',
    opening: {
      speaker: 'tomb',
      text: '把这颗球送到那边的底座上。',
    },
    tiers: [
      {
        speaker: 'tomb',
        text: '想象一枚平放在纸面上的硬币——怎样让它通过一道竖直的狭缝？',
      },
      {
        speaker: 'tomb',
        text: '盯着侧视图里 △ 和 ○ 这两个端点，继续拨动滚轮，让它们在左右方向上一起收进两道亮缝之间。',
      },
      {
        speaker: 'tomb',
        text: '把球在第四维转满 90 度让 △ 和 ○ 收进亮缝，按 W 推过狭缝到达对面底座，再反向拨动滚轮放平它。',
      },
    ],
  },
  15: {
    name: '圆环桥',
    opening: { speaker: 'tomb', text: '当一颗空心球壳转入第四维，每一张切片都只是一道圆环。用它架起三座圆环之桥。' },
    tiers: [
      { speaker: 'tomb', text: '三维的球面转进第四维后，任何一张三维切片截到的都不再是球，而是一个圆圈。' },
      { speaker: 'tomb', text: '按 E 抓着球壳滚轮可以改变倾角 θ；松开 E 后滚轮可以切换你所在的 W 切片。倾角决定圆环随 W 偏移的速度！' },
      { speaker: 'tomb', text: '先抓球转到 90° 在 W=0 锁定 1 号大环；再抓球转到 45°，松开球后分别滚轮切去 W=+1.8 和 W=−1.8，就能依次锁定 2 号和 3 号偏心圆环！' },
    ],
  },
  16: {
    name: '镜像圣钥',
    opening: { speaker: 'tomb', text: '你们的左右手在三维里永远无法重合。把右手翻过第四维，它就是左手。' },
    tiers: [
      { speaker: 'tomb', text: '只靠滑动鼠标在三维空间里旋转，有向体积 det 永远是正数，右手钥匙永远变不成左手钥匙。' },
      { speaker: 'tomb', text: '看看左边那张二维 F 纸片——把它翻出桌面转 180° 就能变成镜像；同样，把三维钥匙绕着面转进第四维 180°，就能反转它的手性！' },
      { speaker: 'tomb', text: '向上滚动鼠标滚轮，把 XW 翻转角推到 180°（此时 det 变为负数），再滑动鼠标对准锁孔即可自动吸合解锁！' },
    ],
  },
  17: {
    name: '弯进第四维的人',
    opening: { speaker: 'linxia', text: '08 号，别慌！我没受伤——我的右臂只是被刚才的光膜弯进了第四维 W+ 方向。' },
    tiers: [
      { speaker: 'linxia', text: '先拿左边的训练假人试试手，按 Tab 看看侧面视图——你会发现弯进第四维的部分一直都连得好好的。' },
      { speaker: 'linxia', text: '救我的时候注意看截面大小：滚轮往正确方向转时，发光线框截面会越来越小；如果变大了就是转反了。' },
      { speaker: 'linxia', text: '前面有块力场残片挡着前臂，先按 1 选中我的肩膀段用滚轮转回 0°，再按 2 选中前臂段转回 0° 就好啦！' },
    ],
  },
  18: {
    name: '方舟之心',
    opening: { speaker: 'tomb', text: '我们曾把三维的海弄干，建造了这艘四维的船。帮它移开卡在三维影子里的瓶颈吧。' },
    tiers: [
      { speaker: 'linxia', text: '看瓶颈穿过瓶身肚子的那个交叉口！在三维里克莱因瓶一定会自己撞上自己，所以能量在那里短路了。' },
      { speaker: 'tomb', text: '就像平面上相交的两条线，只要把其中一条抬进第三维就能变成互不触碰的立交桥；把穿过瓶身的那段瓶颈推向第四维 W 吧。' },
      { speaker: 'linxia', text: '按 E 抓住瓶颈交叉段，向上滚动鼠标滚轮把它推到 W = +1.8 消除自交短路，然后我们一起顺着亮起的轨道从瓶子里面走到外面！' },
    ],
  },
});

/**
 * Context-aware hint ladder for Level 14 ("发丝裂缝").
 * Ensures pressing H ALWAYS speaks directly to what the player is trying to solve RIGHT NOW
 * (e.g. restoration on North Pedestal gives restoration prompts, never stale opening coin hints!),
 * and stops Socratic questions cleanly at the "?" so the player makes the mental leap themselves.
 */
export const LEVEL14_PHASE_HINTS = Object.freeze({
  approach: [
    { speaker: 'tomb', text: '走近那颗青色的球，按 E 试着抓住它。' },
    { speaker: 'tomb', text: '按 E 抓住球后，拨动鼠标滚轮看看球会发生什么变化。' },
    { speaker: 'tomb', text: '走近按 E 抓住球，用滚轮把它在第四维转满 90 度立起来，再按 W 推过亮缝。' },
  ],
  grabbed_flat: [
    { speaker: 'tomb', text: '在三维里转它，球的宽度一点也没变。试试拨动鼠标滚轮。' },
    { speaker: 'tomb', text: '想象一枚平放在纸面上的硬币——怎样让它通过一道竖直的狭缝？' },
    { speaker: 'tomb', text: '持续拨动滚轮让球在第四维立直（90 度），等缝边亮起绿光再按 W 推过去。' },
  ],
  tilted: [
    { speaker: 'tomb', text: '青色圆面是这一层切到的球身。往回拨一格，原来的球会回来吗？' },
    { speaker: 'tomb', text: '斜着看，圆面的边缘像个椭圆。整颗球也有这么薄吗？按 W 推到缝前试试。' },
    { speaker: 'tomb', text: '按 Tab 看金色外轮廓。让球在第四维里立直，等两端都收进缝内，再按 W 推。' },
  ],
  tilted_side_open: [
    { speaker: 'tomb', text: '青色是这一层的截面。金色轮廓标出了整颗球占的地方，它们一样宽吗？' },
    { speaker: 'tomb', text: '盯着侧视图里的 △ 和 ○ 两端：继续拨动滚轮，观察它们如何在左右方向上向缝内靠拢。' },
    { speaker: 'tomb', text: '继续拨动滚轮转满 90 度，等 △ 和 ○ 都收进两道亮缝之间、缝边亮起绿光，再按 W 推过去。' },
  ],
  wall_contact: [
    { speaker: 'tomb', text: '这一层的圆面进得去，哪里还留在缝外？按 Tab 看看相邻层。' },
    { speaker: 'tomb', text: '对照两层的缝边。墙沿第四维延伸，另一层里的球身也得进得去。' },
    { speaker: 'tomb', text: '用滚轮把球立直，直到 △ 和 ○ 都收进缝内、缝边亮绿，再按 W 推。' },
  ],
  wall_contact_side_open: [
    { speaker: 'tomb', text: '按 C 在两层之间来回看。球和墙都没动，哪一层的球身还在缝外？' },
    { speaker: 'tomb', text: '每一层都有同一道缝。转动球，看看 △ 和 ○ 在左右方向上占多宽。' },
    { speaker: 'tomb', text: '继续转到整颗球立直，两端都进缝、缝边亮绿，再按 W 推。' },
  ],
  slit_margin: [
    { speaker: 'tomb', text: '两端已经贴着缝边了。再转一点，能给它们留出空隙吗？' },
    { speaker: 'tomb', text: '看两道缝边。把球再立直一点，它们会同时亮绿。' },
    { speaker: 'tomb', text: '调到接近直角，等缝边亮绿，按 W 推过去。' },
  ],
  blade_ready: [
    { speaker: 'tomb', text: '缝边已经亮起绿光——现在试着把球往前推。' },
    { speaker: 'tomb', text: '按住 W 键，把立起来的球稳稳推过亮缝，送到对面的金色底座上。' },
    { speaker: 'tomb', text: '一直按住 W 穿过狭缝到达对面底座，再把球转回底座轮廓的完整球形。' },
  ],
  north_restore: [
    { speaker: 'tomb', text: '看看对面底座亮起的圆球轮廓——还记得它刚才是怎么立起来的吗？' },
    { speaker: 'tomb', text: '它现在还竖立在第四维里。把刚才让它立起来的动作反过来做一次。' },
    { speaker: 'tomb', text: '反向拨动鼠标滚轮，把圆球重新放平回我们这一层，它就会完整复原并打开巨墙。' },
  ],
  completed: [
    { speaker: 'tomb', text: '巨墙已经向两侧敞开，按 WASD 穿过前方通道踏上发光的传送台即可前往下一关。' },
  ],
});

export class TieredHintController {
  constructor(levelId = 14, options = {}) {
    this.stagnationThresholdSec = options.stagnationThresholdSec ?? STAGNATION_THRESHOLD_SEC;
    this.setLevel(levelId);
  }

  setLevel(levelId) {
    if (!LEVEL_HINTS[levelId]) {
      throw new RangeError(`Unknown levelId for hints: ${levelId}`);
    }
    this.levelId = levelId;
    this.currentTier = 0; // 0 = none triggered yet, 1..3 = tier 1..3
    this.phaseTiers = {};
    this.lastPhase = null;
    this.stagnationSec = 0;
    this.pulseSuggested = false;
    this.lastBeat = 0;
    this.completed = false;
  }

  getOpeningLine() {
    return LEVEL_HINTS[this.levelId].opening;
  }

  getMaxTier() {
    return LEVEL_HINTS[this.levelId].tiers.length;
  }

  /**
   * Call every frame with delta seconds and the level's current beat (0..3).
   * If the player advances to a new beat or puzzle phase, stagnation resets without disturbing them.
   * When stagnation hits 45s, `pulseSuggested` becomes true (gentle HUD glow, no popup!).
   */
  update(dtSec, currentBeat = this.lastBeat, isCompleted = false, currentPhase = null) {
    if (isCompleted) {
      this.completed = true;
      this.pulseSuggested = false;
      return { pulseSuggested: false, justBecameSuggested: false };
    }

    if (currentBeat > this.lastBeat || (currentPhase && currentPhase !== this.lastPhase)) {
      this.lastBeat = Math.max(this.lastBeat, currentBeat);
      if (currentPhase) this.lastPhase = currentPhase;
      this.stagnationSec = 0;
      this.pulseSuggested = false;
    }

    const wasSuggested = this.pulseSuggested;
    if (this.currentTier < this.getMaxTier() || currentPhase) {
      this.stagnationSec += Math.max(0, dtSec);
      if (this.stagnationSec >= this.stagnationThresholdSec) {
        this.pulseSuggested = true;
      }
    } else {
      this.pulseSuggested = false;
    }

    return {
      pulseSuggested: this.pulseSuggested,
      justBecameSuggested: !wasSuggested && this.pulseSuggested,
    };
  }

  /**
   * Triggered when player presses `H` (or clicks HUD hint pill).
   * Advances 1 -> 2 -> 3 (repeating Tier 3 if already at max so player can re-hear it).
   */
  requestNextHint() {
    const entry = LEVEL_HINTS[this.levelId];
    const nextTier = Math.min(this.currentTier + 1, entry.tiers.length);
    this.currentTier = nextTier;
    this.stagnationSec = 0;
    this.pulseSuggested = false;
    const hint = entry.tiers[nextTier - 1];
    return {
      levelId: this.levelId,
      tier: nextTier,
      maxTier: entry.tiers.length,
      speaker: hint.speaker,
      text: hint.text,
      shouldHighlightTarget: nextTier === entry.tiers.length,
    };
  }

  /**
   * Context-aware hint lookup for Level 14: tracks progressive hint tier per puzzle phase
   * so pressing H on the North Pedestal ALWAYS addresses restoration, never the opening!
   */
  requestContextHint(phase, { sideViewOpen = false } = {}) {
    if (this.levelId !== 14) {
      return this.requestNextHint();
    }
    const key = sideViewOpen && (phase === 'tilted' || phase === 'wall_contact')
      ? `${phase}_side_open` : phase;
    const list = LEVEL14_PHASE_HINTS[key] || LEVEL14_PHASE_HINTS.approach;
    const prevTier = this.phaseTiers[key] || 0;
    const nextTier = Math.min(prevTier + 1, list.length);
    this.phaseTiers[key] = nextTier;
    this.currentTier = nextTier;
    this.stagnationSec = 0;
    this.pulseSuggested = false;
    const hint = list[nextTier - 1];
    return {
      levelId: this.levelId,
      phase: key,
      tier: nextTier,
      maxTier: list.length,
      speaker: hint.speaker,
      text: hint.text,
      shouldHighlightTarget: nextTier === list.length,
    };
  }

  getSnapshot() {
    return {
      levelId: this.levelId,
      tier: this.currentTier,
      maxTier: this.getMaxTier(),
      stagnationSec: this.stagnationSec,
      pulseSuggested: this.pulseSuggested,
    };
  }
}
