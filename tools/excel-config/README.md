# Excel 配置文件目录

本目录存放游戏配置的 Excel 源文件（.xlsx 格式）。

## 表头约定

| 行号 | 用途 | 示例 |
|------|------|------|
| 第1行 | 字段名 | id, name, hp, speed, skills |
| 第2行 | 字段类型 | int, string, float, float, array:int |
| 第3行 | 注释说明 | 敌人ID, 名称, 生命值, 移动速度, 技能列表 |
| 第4行起 | 数据行 | 1001, 史莱姆, 100, 50, [1,2] |

## 支持的字段类型

| 类型标注 | 说明 | 示例值 |
|---------|------|--------|
| int | 整数 | 100 |
| float | 浮点数 | 3.14 |
| bool | 布尔值 | true / false / 0 / 1 |
| string | 字符串 | 史莱姆 |
| enum:EnumName | 枚举 | 0 / 1 / 2 |
| array:int | 整数数组 | [1,2,3] |
| array:string | 字符串数组 | ["a","b"] |

## 特殊行处理

- 空行会被自动跳过
- 第一列以 `#` 开头的行视为注释行，会被跳过

## 需要创建的配置文件

| 文件名 | 说明 | 关键字段 |
|--------|------|----------|
| enemy.xlsx | 敌人配置 | id, name, typeId, maxHp, attack, defense, moveSpeed, attackRange, attackCooldown, expDrop, goldDrop, skillIds |
| weapon.xlsx | 武器配置 | id, name, typeId, baseDamage, attackSpeed, range, cooldown, projectileCount, rarity, icon, description |
| item.xlsx | 道具配置 | id, name, typeId, attribute, modType, baseValue, valuePerLevel, maxLevel, rarity, icon, description |
| pet.xlsx | 宠物配置 | id, name, typeId, baseAttack, followDistance, attackRange, attackCooldown, passiveAttribute, passiveModType, passiveValue, maxLevel, icon, description |
| class.xlsx | 职业配置 | id, name, typeId, rarity, bonusMaxHp, bonusAttack, bonusDefense, bonusMoveSpeed, unlockType, unlockTargetValue, unlockDescription, icon, description |
| npc.xlsx | NPC配置 | id, name, typeId, services, baseDialogue, affinityDialogue, icon, description |
| costume.xlsx | 换装配置 | id, name, slot, unlockMethod, unlockValue, icon, description |
| event.xlsx | 事件配置 | id, name, typeId, description, options, weight, icon |
| shop.xlsx | 商店配置 | id, name, goodsTypeId, basePrice, priceGrowth, rarity, weight, icon, description |
| dungeon.xlsx | 地牢配置 | id, name, baseRoomCount, roomGrowth, typeWeights, eliteMinFloor, bossRequired, difficultyMultiplier |

## 导出命令

```bash
cd tools/excel-exporter
npm install
npm run build
npm run export-config
```
