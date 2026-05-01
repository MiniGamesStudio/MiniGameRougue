# 需求文档：六角格地形生成系统（Hex Terrain Generation）

## 简介

基于现有 RoguelikeGame 模块架构，新增六角格（Hex Grid）地形生成系统。该系统生成类似文明6（Civilization 6）、Humankind 等4X策略游戏中的六角格地图，但适配类吸血鬼幸存者（Vampire Survivors）风格的肉鸽动作游戏实时战斗场景。六角格地形替代现有的矩形房间布局，为战斗区域提供多样化的地形效果（平原、山地、森林、水域等），通过程序化噪声算法生成自然过渡的地形分布，并与现有的 Extensible_System 可扩展架构保持一致。

## 术语表

- **Hex_Grid**：六角格网格，由多个 Hex_Cell 按六角形排列组成的二维网格结构，使用轴向坐标系（Axial Coordinates）定位每个格子
- **Hex_Cell**：六角格单元，网格中的单个六角形格子，包含地形类型、坐标和运行时状态
- **Axial_Coordinate**：轴向坐标，使用 (q, r) 两个轴表示六角格位置的坐标系统，其中 q 为列轴、r 为行轴
- **Cube_Coordinate**：立方坐标，使用 (q, r, s) 三个轴表示六角格位置的坐标系统，满足约束 q + r + s = 0，用于距离计算和路径查找
- **Hex_Terrain_Type**：六角格地形类型，定义格子的地形种类（平原、森林、山地、水域、沙漠、沼泽等），每种类型具有不同的视觉表现和战斗效果
- **Hex_Map_Generator**：六角格地图生成器，使用程序化算法生成完整的六角格地形地图
- **Noise_Generator**：噪声生成器，使用 Simplex Noise 或 Perlin Noise 算法生成连续的伪随机数值，用于地形分布的程序化生成
- **Terrain_Effect**：地形效果，地形类型对战斗实体产生的运行时影响，包括移动速度修正、伤害修正和特殊状态
- **Hex_Pathfinder**：六角格寻路器，基于六角格网格的 A* 寻路算法实现，考虑地形通行代价
- **Hex_Coordinate_Converter**：六角格坐标转换器，负责轴向坐标、立方坐标和像素坐标之间的相互转换
- **Biome**：生态群落，由多种 Hex_Terrain_Type 按特定规则组合形成的区域主题，影响地形类型的分布概率
- **Hex_Map_Config**：六角格地图配置，通过 Type_Config 定义的地图生成参数，包括地图尺寸、地形分布、噪声参数等
- **Terrain_Transition**：地形过渡，相邻六角格之间地形类型的视觉过渡效果
- **Fog_Of_War**：战争迷雾，限制玩家视野范围的系统，未探索区域显示为遮罩状态
- **Hex_Renderer**：六角格渲染器，负责将六角格网格数据转换为 Cocos Creator 场景中的可视化节点

## 需求

### 需求 1：六角格坐标系统

**用户故事：** 作为开发者，我希望有一套完整的六角格坐标系统，以便在六角格网格上进行位置计算、距离测量和坐标转换。

#### 验收标准

1. THE Hex_Coordinate_Converter SHALL 支持轴向坐标 (q, r) 和立方坐标 (q, r, s) 两种坐标表示方式
2. THE Hex_Coordinate_Converter SHALL 提供轴向坐标到立方坐标的转换方法，转换结果满足约束 q + r + s = 0
3. THE Hex_Coordinate_Converter SHALL 提供立方坐标到像素坐标的转换方法，支持 flat-top 和 pointy-top 两种六角格朝向
4. THE Hex_Coordinate_Converter SHALL 提供像素坐标到轴向坐标的转换方法，将任意像素位置映射到最近的六角格
5. THE Hex_Coordinate_Converter SHALL 提供计算两个六角格之间距离的方法，使用立方坐标曼哈顿距离公式 `max(abs(q1-q2), abs(r1-r2), abs(s1-s2))`
6. THE Hex_Coordinate_Converter SHALL 提供获取指定六角格所有相邻格子坐标的方法，每个六角格恰好有 6 个相邻格子
7. THE Hex_Coordinate_Converter SHALL 提供获取指定六角格在指定半径范围内所有格子坐标的方法
8. FOR ALL 有效的轴向坐标，转换为立方坐标后再转换回轴向坐标 SHALL 产生与原始坐标相同的结果（往返一致性）
9. FOR ALL 有效的立方坐标，转换为像素坐标后再转换回立方坐标 SHALL 产生与原始坐标相同的结果（往返一致性）

### 需求 2：六角格网格数据结构

**用户故事：** 作为开发者，我希望有一个高效的六角格网格数据结构，以便存储和访问地图中所有六角格的地形数据。

#### 验收标准

1. THE Hex_Grid SHALL 使用轴向坐标 (q, r) 作为主键存储 Hex_Cell 数据
2. THE Hex_Grid SHALL 支持矩形、六角形和菱形三种地图边界形状
3. THE Hex_Grid SHALL 提供按坐标查询单个 Hex_Cell 的方法，查询不存在的坐标时返回 null
4. THE Hex_Grid SHALL 提供遍历所有 Hex_Cell 的迭代方法
5. THE Hex_Grid SHALL 提供检查指定坐标是否在地图边界内的方法
6. THE Hex_Cell SHALL 包含以下数据字段：轴向坐标、地形类型标识符、海拔值、是否可通行、地形效果列表和运行时状态
7. FOR ALL 由 Hex_Grid 存储的 Hex_Cell 数据，序列化后再反序列化 SHALL 产生与原始数据等价的结果（往返一致性）

### 需求 3：地形类型系统

**用户故事：** 作为玩家，我希望地图上有多样化的地形类型，以便不同区域的战斗体验具有差异性和策略性。

#### 验收标准

1. THE Hex_Terrain_Type SHALL 支持至少六种基础地形类型：平原（Plains）、森林（Forest）、山地（Mountain）、水域（Water）、沙漠（Desert）和沼泽（Swamp）
2. THE Hex_Terrain_Type SHALL 为每种地形类型定义移动速度修正系数，平原为 1.0（基准），森林为 0.7，山地为 0.4，水域为 0（不可通行），沙漠为 0.8，沼泽为 0.5
3. WHILE Player_Character 处于森林地形上，THE Terrain_Effect SHALL 降低 Enemy 对 Player_Character 的远程攻击命中率
4. WHILE Player_Character 处于山地地形上，THE Terrain_Effect SHALL 增加 Player_Character 的防御力
5. WHILE Player_Character 处于沼泽地形上，THE Terrain_Effect SHALL 对 Player_Character 施加周期性的少量伤害
6. WHILE Player_Character 处于沙漠地形上，THE Terrain_Effect SHALL 加速 Player_Character 的技能冷却恢复
7. THE Hex_Terrain_Type SHALL 采用 Extensible_System 架构，通过 Type_Registry 注册地形类型，新增地形类型只需实现 Base_Interface 并注册到 Type_Registry，无需修改地形系统的核心逻辑
8. THE Hex_Terrain_Type SHALL 通过 Type_Config 驱动地形类型的属性和效果参数，新增地形类型通过添加配置数据即可生效

### 需求 4：程序化地形生成算法

**用户故事：** 作为玩家，我希望每次进入战斗区域时地形布局都不同且自然合理，以便获得肉鸽游戏的随机性体验。

#### 验收标准

1. THE Hex_Map_Generator SHALL 使用 Simplex Noise 算法生成连续的海拔值分布，确保相邻格子之间的地形过渡自然
2. THE Hex_Map_Generator SHALL 支持通过种子值（seed）控制随机生成结果，相同种子值生成相同的地形布局
3. THE Hex_Map_Generator SHALL 根据海拔值阈值将连续噪声值映射为离散的地形类型：水域（海拔 < 0.3）、沼泽（0.3-0.4）、平原（0.4-0.6）、森林（0.6-0.75）、山地（0.75-0.9）、沙漠由第二层噪声叠加温度参数决定
4. THE Hex_Map_Generator SHALL 支持多层噪声叠加（Octave Noise），通过频率和振幅参数控制地形的粗糙度和细节层次
5. THE Hex_Map_Generator SHALL 确保生成的地图中可通行区域形成连通区域，玩家可从起始位置到达地图上所有可通行格子
6. THE Hex_Map_Generator SHALL 根据当前楼层深度调整地形分布参数，更深的楼层生成更多高难度地形（山地、沼泽比例增加）
7. WHEN 生成的地图存在不连通的可通行区域时，THE Hex_Map_Generator SHALL 通过将隔断格子转换为可通行地形来修复连通性
8. THE Hex_Map_Generator SHALL 通过 Hex_Map_Config 配置地图尺寸、噪声参数、地形阈值和楼层难度曲线，所有生成参数均可通过配置调整
9. FOR ALL 相同的种子值和配置参数，THE Hex_Map_Generator SHALL 生成完全相同的地形布局（确定性生成）

### 需求 5：地形效果与战斗集成

**用户故事：** 作为玩家，我希望地形对战斗产生实际影响，以便利用地形优势制定战斗策略。

#### 验收标准

1. WHILE Player_Character 在六角格地图上移动时，THE Terrain_Effect SHALL 根据当前所在格子的地形类型实时调整 Player_Character 的移动速度
2. WHILE Enemy 在六角格地图上移动时，THE Terrain_Effect SHALL 根据当前所在格子的地形类型实时调整 Enemy 的移动速度
3. WHEN Player_Character 从一个六角格移动到相邻六角格时，THE Terrain_Effect SHALL 移除旧格子的地形效果并应用新格子的地形效果
4. WHEN Enemy 尝试移动到不可通行的六角格时，THE Hex_Pathfinder SHALL 重新计算绕行路径
5. THE Hex_Pathfinder SHALL 使用 A* 算法在六角格网格上进行寻路，路径代价考虑地形的移动速度修正系数
6. THE Hex_Pathfinder SHALL 返回从起点到终点的六角格坐标序列，路径中不包含不可通行的格子
7. IF 起点到终点之间不存在可通行路径，THEN THE Hex_Pathfinder SHALL 返回空路径并通知调用方
8. THE Terrain_Effect SHALL 采用 Extensible_System 架构，通过 Type_Registry 注册地形效果类型，新增地形效果只需实现 Base_Interface 并注册到 Type_Registry，无需修改效果系统的核心逻辑
9. THE Terrain_Effect SHALL 通过 Type_Config 驱动地形效果的参数，新增地形效果通过添加配置数据即可生效

### 需求 6：六角格地图与现有地牢系统集成

**用户故事：** 作为开发者，我希望六角格地形系统与现有的地牢生成系统无缝集成，以便每个房间内部使用六角格地形布局进行战斗。

#### 验收标准

1. THE Hex_Map_Generator SHALL 作为 RoomGenerator 的子系统运行，每个 RoomNode 内部包含一个独立的 Hex_Grid 实例
2. WHEN Room_Generator 生成战斗房间时，THE Hex_Map_Generator SHALL 根据房间配置生成对应尺寸和地形分布的六角格地图
3. THE RoomNode SHALL 扩展包含 Hex_Grid 字段，存储该房间的六角格地形数据
4. WHEN 玩家进入房间时，THE DungeonManager SHALL 将当前房间的 Hex_Grid 数据传递给战斗场景进行渲染
5. THE Hex_Map_Generator SHALL 根据房间类型（战斗房间、精英房间、Boss 房间）生成不同风格的地形布局：战斗房间为开阔地形，精英房间包含更多障碍地形，Boss 房间为竞技场风格的对称布局
6. THE Hex_Map_Config SHALL 支持按房间类型配置不同的地图生成参数，通过 Type_Config 驱动
7. FOR ALL 由 Hex_Map_Generator 生成的 Hex_Grid 数据，序列化后再反序列化 SHALL 产生与原始数据等价的结果（往返一致性）

### 需求 7：六角格渲染

**用户故事：** 作为玩家，我希望六角格地形在游戏中有清晰的视觉呈现，以便直观地识别不同地形类型和规划移动路线。

#### 验收标准

1. THE Hex_Renderer SHALL 根据 Hex_Grid 数据在 Cocos Creator 场景中生成对应的六角格瓦片节点
2. THE Hex_Renderer SHALL 为每种 Hex_Terrain_Type 使用不同的颜色或纹理进行视觉区分
3. THE Hex_Renderer SHALL 使用 ObjectPool 管理六角格瓦片节点的创建和回收，避免频繁的节点创建销毁
4. WHEN 玩家在地图上移动时，THE Hex_Renderer SHALL 仅渲染玩家视野范围内的六角格瓦片，超出视野范围的瓦片回收到对象池
5. THE Hex_Renderer SHALL 在六角格瓦片上显示地形类型的图标或标识，辅助玩家识别地形
6. WHEN 玩家所在格子发生变化时，THE Hex_Renderer SHALL 高亮显示当前所在的六角格

### 需求 8：战争迷雾系统

**用户故事：** 作为玩家，我希望地图上有战争迷雾效果，以便探索未知区域时获得发现感和紧张感。

#### 验收标准

1. THE Fog_Of_War SHALL 将所有六角格初始化为未探索状态（完全遮罩）
2. WHEN Player_Character 移动时，THE Fog_Of_War SHALL 揭开以 Player_Character 所在格子为中心、指定视野半径内的所有六角格
3. THE Fog_Of_War SHALL 区分三种可见状态：未探索（完全遮罩）、已探索但不在视野内（半透明遮罩）和当前视野内（完全可见）
4. WHILE Player_Character 处于森林地形上，THE Fog_Of_War SHALL 将视野半径减少 1 格
5. WHILE Player_Character 处于山地地形上，THE Fog_Of_War SHALL 将视野半径增加 1 格
6. THE Fog_Of_War SHALL 通过 Hex_Map_Config 配置基础视野半径参数

### 需求 9：六角格地形配置数据

**用户故事：** 作为开发者，我希望所有地形相关的配置数据通过统一的数据管线管理，以便策划人员可以方便地调整地形参数。

#### 验收标准

1. THE Game_Module SHALL 使用配置文件定义所有 Hex_Terrain_Type 的属性：地形标识符、显示名称、移动速度修正、是否可通行、地形效果列表和视觉资源路径
2. THE Game_Module SHALL 使用配置文件定义 Hex_Map_Config 的参数：地图宽度、地图高度、噪声种子、噪声频率、噪声振幅、噪声叠加层数、各地形类型的海拔阈值
3. THE Game_Module SHALL 使用配置文件定义 Biome 的参数：生态群落标识符、包含的地形类型及其权重、出现的楼层范围
4. FOR ALL 有效的地形配置数据对象，序列化后再反序列化 SHALL 产生与原始对象等价的结果（往返一致性）
5. THE Hex_Map_Generator SHALL 通过 ConfigManager 加载地形配置数据，配置变更后无需修改生成器代码

### 需求 10：六角格地形序列化与反序列化

**用户故事：** 作为开发者，我希望六角格地图数据支持序列化和反序列化，以便保存和恢复地图状态。

#### 验收标准

1. THE Hex_Grid SHALL 提供将完整地图数据序列化为 JSON 格式的方法
2. THE Hex_Grid SHALL 提供从 JSON 数据反序列化恢复完整地图状态的方法
3. THE Hex_Grid 的序列化数据 SHALL 包含地图尺寸、边界形状、所有 Hex_Cell 的坐标和地形类型、以及运行时状态（已探索、迷雾状态等）
4. FOR ALL 有效的 Hex_Grid 实例，序列化为 JSON 后再反序列化 SHALL 产生与原始实例等价的 Hex_Grid（往返一致性）
5. THE Hex_Grid 的序列化方法 SHALL 提供紧凑格式选项，省略默认值字段以减小数据体积
6. THE Hex_Grid 的反序列化方法 SHALL 对输入数据进行校验，IF 数据格式不合法或字段缺失，THEN THE Hex_Grid SHALL 返回明确的错误信息
