/**
 * SchemaRegistry - Schema 注册表
 * 
 * 跟踪每个 FBS Schema 的内容哈希值和最后导出时间戳。
 * 用于增量导出时的变更检测和 Schema 兼容性检查。
 * 
 * 注册表数据存储在 schema-registry.json 文件中。
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FieldDef } from './ExcelReader';

/** 单个 Schema 的注册信息 */
export interface SchemaEntry {
    /** 表名 */
    tableName: string;
    /** Schema 内容的 SHA256 哈希值 */
    contentHash: string;
    /** 最后导出时间戳（ISO 格式） */
    lastExportTime: string;
    /** 字段定义快照（用于兼容性检查） */
    fields: FieldSnapshot[];
}

/** 字段快照（用于兼容性比较） */
export interface FieldSnapshot {
    name: string;
    type: string;
}

/** 兼容性检查结果 */
export interface CompatibilityResult {
    /** 是否兼容 */
    compatible: boolean;
    /** 是否有变更 */
    hasChanges: boolean;
    /** 变更详情 */
    details: ChangeDetail[];
}

/** 变更详情 */
export interface ChangeDetail {
    /** 变更类型 */
    changeType: 'field_added' | 'field_deleted' | 'type_changed' | 'field_renamed';
    /** 字段名 */
    fieldName: string;
    /** 旧类型（类型变更时） */
    oldType?: string;
    /** 新类型（类型变更时） */
    newType?: string;
    /** 是否为不兼容变更 */
    breaking: boolean;
    /** 描述信息 */
    message: string;
}

/** 注册表数据结构 */
interface RegistryData {
    version: number;
    entries: Record<string, SchemaEntry>;
}

export class SchemaRegistry {
    /** 注册表文件路径 */
    private registryPath: string;
    /** 注册表数据 */
    private data: RegistryData;

    constructor(registryDir: string) {
        this.registryPath = path.join(registryDir, 'schema-registry.json');
        this.data = this.load();
    }

    /**
     * 加载注册表数据
     */
    private load(): RegistryData {
        if (fs.existsSync(this.registryPath)) {
            try {
                const content = fs.readFileSync(this.registryPath, 'utf-8');
                return JSON.parse(content) as RegistryData;
            } catch (err) {
                console.warn(`[SchemaRegistry] 注册表文件解析失败，将创建新的注册表`);
            }
        }
        return { version: 1, entries: {} };
    }

    /**
     * 保存注册表数据到文件
     */
    save(): void {
        const dir = path.dirname(this.registryPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.registryPath, JSON.stringify(this.data, null, 2), 'utf-8');
    }

    /**
     * 计算内容的 SHA256 哈希值
     */
    static computeHash(content: string): string {
        return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
    }

    /**
     * 检查 Schema 是否发生变更
     * @param tableName 表名
     * @param schemaContent Schema 文件内容
     * @returns 是否有变更
     */
    hasChanged(tableName: string, schemaContent: string): boolean {
        const entry = this.data.entries[tableName];
        if (!entry) return true; // 新表，视为有变更

        const currentHash = SchemaRegistry.computeHash(schemaContent);
        return entry.contentHash !== currentHash;
    }

    /**
     * 检查 Schema 兼容性
     * @param tableName 表名
     * @param newFields 新的字段定义
     * @returns 兼容性检查结果
     */
    checkCompatibility(tableName: string, newFields: FieldDef[]): CompatibilityResult {
        const entry = this.data.entries[tableName];

        // 新表，完全兼容
        if (!entry) {
            return { compatible: true, hasChanges: true, details: [] };
        }

        const oldFields = entry.fields;
        const newFieldMap = new Map(newFields.map(f => [f.name, f.type]));
        const oldFieldMap = new Map(oldFields.map(f => [f.name, f.type]));

        const details: ChangeDetail[] = [];

        // 检查删除的字段（不兼容变更）
        for (const oldField of oldFields) {
            if (!newFieldMap.has(oldField.name)) {
                details.push({
                    changeType: 'field_deleted',
                    fieldName: oldField.name,
                    oldType: oldField.type,
                    breaking: true,
                    message: `字段 "${oldField.name}" (${oldField.type}) 已被删除 - 不兼容变更`,
                });
            }
        }

        // 检查类型变更（不兼容变更）
        for (const newField of newFields) {
            const oldType = oldFieldMap.get(newField.name);
            if (oldType && oldType !== newField.type) {
                details.push({
                    changeType: 'type_changed',
                    fieldName: newField.name,
                    oldType,
                    newType: newField.type,
                    breaking: true,
                    message: `字段 "${newField.name}" 类型从 "${oldType}" 变更为 "${newField.type}" - 不兼容变更`,
                });
            }
        }

        // 检查新增的字段（兼容变更）
        for (const newField of newFields) {
            if (!oldFieldMap.has(newField.name)) {
                details.push({
                    changeType: 'field_added',
                    fieldName: newField.name,
                    newType: newField.type,
                    breaking: false,
                    message: `新增字段 "${newField.name}" (${newField.type}) - 兼容变更`,
                });
            }
        }

        const hasBreaking = details.some(d => d.breaking);
        const hasChanges = details.length > 0;

        return {
            compatible: !hasBreaking,
            hasChanges,
            details,
        };
    }

    /**
     * 更新注册表中的 Schema 信息
     * @param tableName 表名
     * @param schemaContent Schema 文件内容
     * @param fields 字段定义
     */
    update(tableName: string, schemaContent: string, fields: FieldDef[]): void {
        this.data.entries[tableName] = {
            tableName,
            contentHash: SchemaRegistry.computeHash(schemaContent),
            lastExportTime: new Date().toISOString(),
            fields: fields.map(f => ({ name: f.name, type: f.type })),
        };
    }

    /**
     * 获取指定表的注册信息
     */
    getEntry(tableName: string): SchemaEntry | null {
        return this.data.entries[tableName] ?? null;
    }

    /**
     * 获取所有已注册的表名
     */
    getRegisteredTables(): string[] {
        return Object.keys(this.data.entries);
    }

    /**
     * 获取指定表的最后导出时间
     */
    getLastExportTime(tableName: string): Date | null {
        const entry = this.data.entries[tableName];
        if (!entry) return null;
        return new Date(entry.lastExportTime);
    }

    /**
     * 移除指定表的注册信息
     */
    remove(tableName: string): void {
        delete this.data.entries[tableName];
    }

    /**
     * 清空注册表
     */
    clear(): void {
        this.data.entries = {};
    }
}
