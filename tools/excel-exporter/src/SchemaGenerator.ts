/**
 * SchemaGenerator - FlatBuffers Schema 生成器
 * 
 * 根据 Excel 解析后的 SheetData 自动生成 .fbs Schema 文件。
 * 
 * 类型映射：
 *   int       → int32
 *   float     → float32
 *   bool      → bool
 *   string    → string
 *   enum:Name → byte
 *   array:int → [int32]
 *   array:string → [string]
 */

import * as fs from 'fs';
import * as path from 'path';
import { SheetData, FieldDef } from './ExcelReader';

/** 生成的 Schema 信息 */
export interface SchemaInfo {
    /** Schema 文件名（不含路径） */
    fileName: string;
    /** Schema 文件完整路径 */
    filePath: string;
    /** Schema 文件内容 */
    content: string;
    /** 对应的表名 */
    tableName: string;
}

/**
 * 将 Excel 类型标注映射为 FlatBuffers 类型
 */
function mapToFbsType(excelType: string): string {
    switch (excelType) {
        case 'int':
            return 'int32';
        case 'float':
            return 'float32';
        case 'bool':
            return 'bool';
        case 'string':
            return 'string';
        default:
            if (excelType.startsWith('enum:')) {
                // 枚举类型映射为 byte
                return 'byte';
            }
            if (excelType.startsWith('array:')) {
                const innerType = excelType.substring(6);
                const fbsInner = mapToFbsType(innerType);
                return `[${fbsInner}]`;
            }
            return 'string'; // 默认回退
    }
}

/**
 * 将表名转换为 PascalCase 格式（用于 FlatBuffers table 名称）
 */
function toPascalCase(name: string): string {
    return name
        .split(/[_\-\s]+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}

export class SchemaGenerator {
    /**
     * 根据 SheetData 生成 FBS Schema 文件
     * @param sheets 解析后的工作表数据
     * @param outputDir Schema 输出目录
     * @returns 生成的 Schema 信息列表
     */
    static generate(sheets: SheetData[], outputDir: string): SchemaInfo[] {
        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const results: SchemaInfo[] = [];

        for (const sheet of sheets) {
            const schemaInfo = SchemaGenerator.generateSchema(sheet, outputDir);
            results.push(schemaInfo);
        }

        return results;
    }

    /**
     * 为单个工作表生成 FBS Schema
     */
    private static generateSchema(sheet: SheetData, outputDir: string): SchemaInfo {
        const tableName = toPascalCase(sheet.sheetName);
        const listTableName = `${tableName}List`;
        const fileName = `${tableName}.fbs`;
        const filePath = path.join(outputDir, fileName);

        const lines: string[] = [];

        // 文件头注释
        lines.push(`// 自动生成的 FlatBuffers Schema 文件`);
        lines.push(`// 源工作表: ${sheet.sheetName}`);
        lines.push(`// 请勿手动修改此文件`);
        lines.push('');
        lines.push(`namespace Config;`);
        lines.push('');

        // 生成单条记录的 table 定义
        lines.push(`/// ${sheet.sheetName} 单条记录`);
        lines.push(`table ${tableName} {`);

        for (const field of sheet.fields) {
            const fbsType = mapToFbsType(field.type);
            const comment = field.comment ? `  /// ${field.comment}` : '';
            lines.push(`  ${field.name}:${fbsType};${comment}`);
        }

        lines.push('}');
        lines.push('');

        // 生成列表容器 table（用于存储多条记录）
        lines.push(`/// ${sheet.sheetName} 记录列表`);
        lines.push(`table ${listTableName} {`);
        lines.push(`  items:[${tableName}];`);
        lines.push('}');
        lines.push('');

        // 声明 root_type
        lines.push(`root_type ${listTableName};`);
        lines.push('');

        const content = lines.join('\n');

        // 写入文件
        fs.writeFileSync(filePath, content, 'utf-8');

        return { fileName, filePath, content, tableName };
    }

    /**
     * 生成 Schema 内容但不写入文件（用于比较和测试）
     */
    static generateContent(sheet: SheetData): string {
        const tableName = toPascalCase(sheet.sheetName);
        const listTableName = `${tableName}List`;

        const lines: string[] = [];

        lines.push(`// 自动生成的 FlatBuffers Schema 文件`);
        lines.push(`// 源工作表: ${sheet.sheetName}`);
        lines.push(`// 请勿手动修改此文件`);
        lines.push('');
        lines.push(`namespace Config;`);
        lines.push('');
        lines.push(`/// ${sheet.sheetName} 单条记录`);
        lines.push(`table ${tableName} {`);

        for (const field of sheet.fields) {
            const fbsType = mapToFbsType(field.type);
            const comment = field.comment ? `  /// ${field.comment}` : '';
            lines.push(`  ${field.name}:${fbsType};${comment}`);
        }

        lines.push('}');
        lines.push('');
        lines.push(`/// ${sheet.sheetName} 记录列表`);
        lines.push(`table ${listTableName} {`);
        lines.push(`  items:[${tableName}];`);
        lines.push('}');
        lines.push('');
        lines.push(`root_type ${listTableName};`);
        lines.push('');

        return lines.join('\n');
    }
}
