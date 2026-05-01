# 实现计划：六角格地形生成系统（Hex Terrain Generation）

## 概述

基于设计文档，将六角格地形生成系统分解为增量式编码任务。每个任务在前一个任务的基础上构建，最终将所有组件集成到现有 RoguelikeGame 模块中。所有纯逻辑模块（不依赖 Cocos Creator API）优先实现，便于在 Node.js 环境中进行测试验证。

## 任务

- [x] 1. 搭建测试基础设施与核心接口定义
  - [x] 1.1 配置 Jest + fast-check 测试环境
    - 在项目根目录配置 Jest（TypeScript 支持），安装 `jest`、`ts-jest`、`@types/jest`、`fast-check` 依赖
    - 创建 `jest.config.ts`，配置 `ts-jest` 转换器和 `tests/hex-terrain/` 测试目录
    - 创建 `tests/hex-terrain/` 目录结构（包含 `integration/` 子目录）
    - 验证 `npx jest --config jest.config.ts` 可正常运行
    - _需求: 全局测试基础设施_

  - [x] 1.2 创建 IHexTerrainType 地形类型接口
    - 创建 `assets/scripts/Game/RoguelikeGame/Data/Interfaces/IHexTerrainType.ts`
    - 定义 `IHexTerrainType` 接口：typeId、displayName、moveSpeedModifier、walkable、effectIds、visualAsset、getDefaultConfig()
    - 定义 `HexTerrainConfig` 配置数据类型：包含 elevationRange 可选字段
    - 遵循现有 IEnemyType、IRoomType 等接口的设计模式
    - _需求: 3.7, 3.8_

  - [x] 1.3 创建 ITerrainEffect 地形效果接口
    - 创建 `assets/scripts/Game/RoguelikeGame/Data/Interfaces/ITerrainEffect.ts`
    - 定义 `ITerrainEffect` 接口：typeId、displayName、apply()、remove()、update()
    - 定义 `TerrainEffectTarget` 接口：hp、maxHp、attack、defense、moveSpeed、baseMoveSpeed、cooldownModifier、evasionModifier
    - _需求: 5.8, 5.9_

- [x] 2. 实现坐标系统（HexCoordinate）
  - [x] 2.1 实现 HexCoordinate 坐标转换器
    - 创建 `assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexCoordinate.ts`
    - 实现 AxialCoord、CubeCoord、PixelCoord 接口和 HexOrientation 枚举、HexLayout 接口
    - 实现坐标转换方法：axialToCube、cubeToAxial、axialToPixel、pixelToAxial、cubeRound
    - 实现距离计算 distance、邻居查询 neighbors、范围查询 range
    - 实现工具方法：equals、toKey、fromKey
    - _需求: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 2.2 编写属性测试：立方坐标约束不变量
    - **Property 1: 立方坐标约束不变量** — 任意轴向坐标 (q, r) 转换为立方坐标后满足 q + r + s = 0
    - **验证: 需求 1.2**

  - [ ]* 2.3 编写属性测试：轴向坐标 ↔ 立方坐标往返一致性
    - **Property 2: 轴向坐标 ↔ 立方坐标往返一致性**
    - **验证: 需求 1.8**

  - [ ]* 2.4 编写属性测试：轴向坐标 → 像素坐标 → 轴向坐标往返一致性
    - **Property 3: 轴向 → 像素 → 轴向往返一致性**（FlatTop 和 PointyTop 两种朝向）
    - **验证: 需求 1.9**

  - [ ]* 2.5 编写属性测试：距离对称性与非负性
    - **Property 4: 六角格距离对称性与非负性** — distance(a,b) >= 0, distance(a,b) == distance(b,a), distance(a,a) == 0
    - **验证: 需求 1.5**

  - [ ]* 2.6 编写属性测试：邻居数量与距离不变量
    - **Property 5: 邻居数量与距离不变量** — neighbors 返回恰好 6 个坐标，每个与 center 距离为 1
    - **验证: 需求 1.6**

  - [ ]* 2.7 编写属性测试：范围查询包含性
    - **Property 6: 范围查询包含性** — range 返回的所有坐标距离不超过 radius，且所有距离不超过 radius 的坐标都被包含
    - **验证: 需求 1.7**

  - [ ]* 2.8 编写坐标系统单元测试
    - 测试 FlatTop 和 PointyTop 两种朝向的像素坐标转换具体数值
    - 测试 fromKey 解析格式不正确字符串的行为
    - 测试 range 接收负数 radius 返回空数组
    - _需求: 1.3, 1.4_

- [x] 3. 实现六角格网格数据结构（HexGrid）
  - [x] 3.1 实现 HexGrid 网格类
    - 创建 `assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexGrid.ts`
    - 实现 HexCell、CellRuntimeState 接口和 CellVisibility、MapBoundaryShape 枚举
    - 实现 HexGrid 类：构造函数、setCell、getCell、isInBounds、forEach、cells、getWalkableNeighbors
    - 实现序列化方法 serialize（支持紧凑格式和完整格式）
    - 实现反序列化静态方法 deserialize（含数据校验和错误信息返回）
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.1, 10.2, 10.3, 10.5, 10.6_

  - [ ]* 3.2 编写属性测试：网格查询一致性
    - **Property 7: 网格查询一致性** — isInBounds(coord) 返回 true 当且仅当 getCell(coord) 返回非 null
    - **验证: 需求 2.3, 2.5**

  - [ ]* 3.3 编写属性测试：HexGrid 序列化往返一致性
    - **Property 8: HexGrid 序列化往返一致性** — 序列化后反序列化产生等价的 HexGrid（紧凑格式和完整格式均测试）
    - **验证: 需求 2.7, 6.7, 10.4**

  - [ ]* 3.4 编写网格数据单元测试
    - 测试三种边界形状（Rectangle、Hexagon、Rhombus）的网格创建
    - 测试 HexCell 包含所有必需字段
    - 测试 forEach 遍历所有格子
    - 测试紧凑格式序列化产生更小的输出
    - 测试反序列化对各种非法输入（null、缺少字段、坐标不合法等）的错误信息
    - _需求: 2.2, 2.4, 2.6, 10.5, 10.6_

- [x] 4. 检查点 — 确保坐标系统和网格数据测试全部通过
  - 运行 `npx jest tests/hex-terrain/HexCoordinate.test.ts tests/hex-terrain/HexGrid.test.ts`，确保所有测试通过
  - 如有问题请向用户确认

- [x] 5. 实现噪声生成器与地形生成器
  - [x] 5.1 实现 SimplexNoise 噪声生成器
    - 创建 `assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/SimplexNoise.ts`
    - 实现完整的 2D Simplex Noise 算法（纯 TypeScript，无外部依赖）
    - 实现种子控制的排列表生成 `_buildPermutationTable(seed)`
    - 实现 `noise2D(x, y)` 返回 [-1, 1] 范围的噪声值
    - 实现 `fbm(x, y, octaves, frequency, amplitude, lacunarity, persistence)` 多层叠加噪声，归一化到 [0, 1]
    - _需求: 4.1, 4.4_

  - [ ]* 5.2 编写属性测试：噪声输出范围
    - **Property 12: 噪声输出范围** — fbm() 输出始终在 [0, 1] 范围内
    - **验证: 需求 4.4**

  - [x] 5.3 实现 HexMapGenerator 程序化地形生成器
    - 创建 `assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexMapGenerator.ts`
    - 定义 HexMapConfig 接口（包含所有生成参数）
    - 实现 generate(config) 方法：生成边界坐标 → 噪声海拔 → 地形映射 → 连通性修复
    - 实现 `_generateBoundaryCoords` 支持 Rectangle、Hexagon、Rhombus 三种边界形状
    - 实现 `_mapElevationToTerrain` 海拔到地形类型映射（含温度噪声沙漠判定）
    - 实现 `_applyDifficultyBias` 楼层难度偏移
    - 实现 `_ensureConnectivity` BFS 连通性验证和 `_connectToMainland` 修复
    - _需求: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 5.4 编写属性测试：确定性地形生成
    - **Property 11: 确定性地形生成** — 相同种子和配置生成完全相同的 HexGrid
    - **验证: 需求 4.2, 4.9**

  - [ ]* 5.5 编写属性测试：海拔到地形类型映射正确性
    - **Property 13: 海拔到地形类型映射正确性** — 海拔值映射到正确的地形类型
    - **验证: 需求 4.3**

  - [ ]* 5.6 编写属性测试：可通行区域连通性
    - **Property 14: 可通行区域连通性** — 生成的地图中所有可通行格子形成单个连通分量
    - **验证: 需求 4.5, 4.7**

- [x] 6. 实现地形类型与地形效果
  - [x] 6.1 实现六种基础地形类型
    - 创建 `assets/scripts/Game/RoguelikeGame/Types/Terrains/` 目录
    - 实现 PlainsTerrain.ts（moveSpeedModifier=1.0, walkable=true）
    - 实现 ForestTerrain.ts（moveSpeedModifier=0.7, walkable=true, effectIds=['speed_modifier','evasion_boost']）
    - 实现 MountainTerrain.ts（moveSpeedModifier=0.4, walkable=true, effectIds=['speed_modifier','defense_boost']）
    - 实现 WaterTerrain.ts（moveSpeedModifier=0.0, walkable=false）
    - 实现 DesertTerrain.ts（moveSpeedModifier=0.8, walkable=true, effectIds=['speed_modifier','cooldown_reduction']）
    - 实现 SwampTerrain.ts（moveSpeedModifier=0.5, walkable=true, effectIds=['speed_modifier','dot_damage']）
    - 每种类型实现 IHexTerrainType 接口和 getDefaultConfig() 方法
    - _需求: 3.1, 3.2, 3.7, 3.8_

  - [x] 6.2 实现五种地形效果
    - 创建 `assets/scripts/Game/RoguelikeGame/Types/TerrainEffects/` 目录
    - 实现 SpeedModifierEffect.ts — 根据地形的 moveSpeedModifier 修正实体移动速度
    - 实现 DefenseBoostEffect.ts — 山地地形增加防御力（需求 3.4）
    - 实现 DotDamageEffect.ts — 沼泽地形周期性伤害（需求 3.5）
    - 实现 CooldownReductionEffect.ts — 沙漠地形加速技能冷却（需求 3.6）
    - 实现 EvasionBoostEffect.ts — 森林地形增加闪避率（需求 3.3）
    - 每种效果实现 ITerrainEffect 接口的 apply()、remove()、update() 方法
    - _需求: 3.3, 3.4, 3.5, 3.6, 5.8, 5.9_

  - [ ]* 6.3 编写属性测试：地形效果属性修正
    - **Property 9: 地形效果属性修正** — apply() 后属性发生预期变化，remove() 后恢复原值
    - **验证: 需求 3.3, 3.4, 3.6**

  - [ ]* 6.4 编写属性测试：沼泽持续伤害
    - **Property 10: 沼泽持续伤害** — update(dt) 调用后目标 hp 减少
    - **验证: 需求 3.5**

  - [ ]* 6.5 编写地形类型单元测试
    - 验证 6 种地形类型的 moveSpeedModifier 值符合需求
    - 验证地形类型可通过 TypeRegistry 注册和创建
    - _需求: 3.1, 3.2, 3.7_

- [x] 7. 检查点 — 确保噪声生成器、地形生成器和地形类型/效果测试全部通过
  - 运行 `npx jest tests/hex-terrain/SimplexNoise.test.ts tests/hex-terrain/HexMapGenerator.test.ts tests/hex-terrain/TerrainEffectManager.test.ts`，确保所有测试通过
  - 如有问题请向用户确认

- [x] 8. 实现寻路器（HexPathfinder）
  - [x] 8.1 实现 HexPathfinder A* 寻路器
    - 创建 `assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexPathfinder.ts`
    - 定义 PathResult 接口：found、path、totalCost
    - 实现 findPath(grid, start, goal) 方法：A* 算法，路径代价 = 1 / moveSpeedModifier
    - 实现 _reconstructPath 路径重建
    - 处理边界情况：起点/终点不在边界内、终点不可通行、无可通行路径
    - _需求: 5.4, 5.5, 5.6, 5.7_

  - [ ]* 8.2 编写属性测试：寻路路径有效性
    - **Property 17: 寻路路径有效性** — 路径中每个格子可通行，相邻坐标距离为 1，首尾为起终点
    - **验证: 需求 5.4, 5.5, 5.6**

  - [ ]* 8.3 编写寻路器单元测试
    - 测试起点到终点无可通行路径时返回 found=false
    - 测试起点或终点不在边界内时返回 found=false
    - 测试终点不可通行时返回 found=false
    - _需求: 5.7_

- [x] 9. 实现地形效果管理器（TerrainEffectManager）
  - [x] 9.1 实现 TerrainEffectManager
    - 创建 `assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/TerrainEffectManager.ts`
    - 实现实体格子跟踪（entityId → 当前坐标键）和活跃效果跟踪（entityId → 效果实例列表）
    - 实现 updateEntityTerrain(entityId, currentCoord, target, grid)：格子变化时移除旧效果、应用新效果
    - 实现 updateEffects(dt, entityId, target)：每帧更新持续性效果
    - 实现 removeAllEffects(entityId, target) 和 clear()
    - _需求: 5.1, 5.2, 5.3_

  - [ ]* 9.2 编写属性测试：地形移动速度修正
    - **Property 15: 地形移动速度修正** — updateEntityTerrain 后实体 moveSpeed 等于 baseMoveSpeed × moveSpeedModifier
    - **验证: 需求 5.1, 5.2**

  - [ ]* 9.3 编写属性测试：地形效果切换
    - **Property 16: 地形效果切换** — 从地形 A 移动到地形 B 后，仅有地形 B 的效果处于激活状态
    - **验证: 需求 5.3**

- [x] 10. 实现战争迷雾系统（FogOfWar）
  - [x] 10.1 实现 FogOfWar 战争迷雾
    - 创建 `assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/FogOfWar.ts`
    - 定义 FogOfWarConfig 接口：baseViewRadius
    - 实现 init(grid)：将所有格子设为 Unexplored
    - 实现 updateVisibility(playerCoord, viewRadiusModifier)：计算视野范围，更新可见状态，返回新揭开的格子
    - 实现 getVisibility(coord) 查询方法
    - 处理视野半径修正：森林 -1，山地 +1，最小值为 1
    - _需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 10.2 编写属性测试：迷雾初始化
    - **Property 18: 迷雾初始化** — init() 后所有格子 visibility 为 Unexplored
    - **验证: 需求 8.1**

  - [ ]* 10.3 编写属性测试：迷雾可见性更新与状态转换
    - **Property 19: 迷雾可见性更新与状态转换** — 视野内格子为 Visible，离开视野的已探索格子变为 Explored（不回退到 Unexplored）
    - **验证: 需求 8.2, 8.3**

  - [ ]* 10.4 编写迷雾系统单元测试
    - 测试森林地形减少视野半径 1 格
    - 测试山地地形增加视野半径 1 格
    - 测试 baseViewRadius 配置参数生效
    - _需求: 8.4, 8.5, 8.6_

- [x] 11. 检查点 — 确保寻路器、效果管理器和迷雾系统测试全部通过
  - 运行 `npx jest tests/hex-terrain/HexPathfinder.test.ts tests/hex-terrain/TerrainEffectManager.test.ts tests/hex-terrain/FogOfWar.test.ts`，确保所有测试通过
  - 如有问题请向用户确认

- [x] 12. 实现渲染器与配置数据
  - [x] 12.1 实现 HexRenderer 六角格渲染器
    - 创建 `assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexRenderer.ts`
    - 使用框架层 ObjectPool 管理瓦片节点的创建和回收
    - 实现 updateView(grid, centerCoord, viewRadius)：按需渲染视野范围内的格子，回收离开视野的瓦片
    - 实现 highlightCell(coord)：高亮当前所在格子
    - 实现 clear()：清空所有渲染瓦片
    - 实现 _setupTileNode、_applyTerrainVisual、_applyTerrainIcon、_updateTileVisibility、_setHighlight 私有方法
    - _需求: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 12.2 创建地形配置数据结构
    - 在 `assets/scripts/Game/RoguelikeGame/Data/ConfigTables.ts` 中新增地形配置数据类型定义
    - 定义 TerrainTypeConfigTable、TerrainTypeConfigRow（地形类型配置表）
    - 定义 BiomeConfigTable、BiomeConfigRow（生态群落配置表）
    - 定义 MapGenConfigTable、MapGenConfigRow（地图生成配置表，按房间类型）
    - 创建默认配置数据（6 种地形类型参数、3 种房间类型的地图生成参数）
    - _需求: 9.1, 9.2, 9.3, 9.5_

  - [ ]* 12.3 编写属性测试：地形配置数据序列化往返一致性
    - **Property 20: 地形配置数据序列化往返一致性** — TerrainTypeConfigRow 序列化后反序列化产生等价结果
    - **验证: 需求 9.4**

- [x] 13. 集成到现有系统
  - [x] 13.1 扩展 TypeRegistration 注册地形类型和效果
    - 在 `assets/scripts/Game/RoguelikeGame/Types/TypeRegistration.ts` 中新增：
    - 导入 IHexTerrainType、ITerrainEffect 接口和所有地形类型/效果实现类
    - 创建 terrainRegistry 和 terrainEffectRegistry 注册表实例
    - 在 registerAllTypes() 中注册 6 种地形类型和 5 种地形效果
    - 更新日志输出包含地形类型和地形效果的注册数量
    - _需求: 3.7, 5.8_

  - [x] 13.2 扩展 RoomGenerator 集成 HexMapGenerator
    - 修改 `assets/scripts/Game/RoguelikeGame/Runtime/RoomGenerator.ts`
    - 在 RoomNode 接口中新增可选字段 `hexGrid?: HexGrid`
    - 在 RoomGenerator 构造函数中注入 HexMapGenerator 依赖
    - 在 generateFloor 流程中为每个房间调用 HexMapGenerator.generate() 生成六角格地图
    - 实现 _getHexMapConfig(roomTypeId, floorIndex) 根据房间类型返回不同的 HexMapConfig
    - _需求: 6.1, 6.2, 6.3, 6.5, 6.6_

  - [x] 13.3 扩展 DungeonManager 传递 HexGrid 数据
    - 修改 `assets/scripts/Game/RoguelikeGame/Runtime/DungeonManager.ts`
    - 在 enterRoom 流程中将当前房间的 hexGrid 数据传递给战斗场景
    - 初始化 HexRenderer、FogOfWar 和 TerrainEffectManager
    - _需求: 6.4_

  - [ ]* 13.4 编写集成测试
    - 创建 `tests/hex-terrain/integration/RoomGenerator.integration.test.ts`
    - 验证 RoomGenerator 生成的房间包含 hexGrid 字段
    - 验证不同房间类型（battle、elite、boss）生成不同风格的地图
    - 创建 `tests/hex-terrain/integration/DungeonManager.integration.test.ts`
    - 验证 DungeonManager.enterRoom 可访问房间的 hexGrid
    - _需求: 6.1, 6.2, 6.4, 6.5_

- [x] 14. 最终检查点 — 确保所有测试通过
  - 运行 `npx jest --config jest.config.ts` 执行全部测试
  - 确保所有测试通过，如有问题请向用户确认

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加速 MVP 开发
- 每个任务引用了具体的需求编号，确保需求可追溯
- 检查点任务确保增量验证，及早发现问题
- 属性测试验证设计文档中定义的 20 个正确性属性
- 单元测试验证具体示例和边界条件
- 所有纯逻辑模块（HexCoordinate、HexGrid、SimplexNoise、HexMapGenerator、HexPathfinder、TerrainEffectManager、FogOfWar）不依赖 Cocos Creator API，可在 Node.js 环境中直接测试
- HexRenderer 依赖 Cocos Creator API（Node、ObjectPool），需在引擎环境中测试
