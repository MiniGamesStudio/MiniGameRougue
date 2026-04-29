/**
 * BinaryExporter - FlatBuffers 二进制数据导出器
 * 
 * 将 Excel 解析后的数据行序列化为 FlatBuffers 二进制格式，
 * 输出 .bin 文件到配置的输出目录。
 * 
 * 使用 flatbuffers Builder 手动构建二进制数据，
 * 不依赖 flatc 生成的 TypeScript 代码。
 */

import * as flatbuffers from 'flatbuffers';
import * as fs from 'fs';
import * as path from 'path';
import { SheetData, FieldDef } from './ExcelReader';

/** 导出结果 */
export interface ExportResult {
    /** 是否导出成功 */
    success: boolean;
    /** 输出文件路径 */
    outputPath: string;
    /** 表名 */
    tableName: string;
    /** 记录数 */
    rowCount: number;
    /** 文件大小（字节） */
    fileSize: number;
    /** 错误信息 */
    error?: string;
}

/**
 * 将表名转换为 PascalCase
 */
function toPascalCase(name: string): string {
    return name
        .split(/[_\-\s]+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}

export class BinaryExporter {
    /**
     * 将 SheetData 导出为 FlatBuffers 二进制文件
     * @param sheet 解析后的工作表数据
     * @param outputDir 输出目录
     * @returns 导出结果
     */
    static export(sheet: SheetData, outputDir: string): ExportResult {
        const tableName = toPascalCase(sheet.sheetName);
        const outputPath = path.join(outputDir, `${tableName}.bin`);

        try {
            // 确保输出目录存在
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const builder = new flatbuffers.Builder(1024);

            // 序列化所有数据行
            const rowOffsets: number[] = [];
            for (const row of sheet.rows) {
                const offset = BinaryExporter.serializeRow(builder, sheet.fields, row);
                rowOffsets.push(offset);
            }

            // 创建行数组（items 向量）
            const itemsOffset = BinaryExporter.createVector(builder, rowOffsets);

            // 创建根 table（ListTable）
            builder.startObject(1);
            builder.addFieldOffset(0, itemsOffset, 0);
            const rootOffset = builder.endObject();

            builder.finish(rootOffset);

            // 获取二进制数据并写入文件
            const buf = builder.asUint8Array();
            fs.writeFileSync(outputPath, Buffer.from(buf));

            return {
                success: true,
                outputPath,
                tableName,
                rowCount: sheet.rows.length,
                fileSize: buf.length,
            };
        } catch (err: any) {
            const errorMsg = err.message || '未知导出错误';
            console.error(`[BinaryExporter] 导出失败: ${tableName} - ${errorMsg}`);

            return {
                success: false,
                outputPath,
                tableName,
                rowCount: 0,
                fileSize: 0,
                error: errorMsg,
            };
        }
    }

    /**
     * 批量导出多个工作表
     */
    static exportAll(sheets: SheetData[], outputDir: string): ExportResult[] {
        return sheets.map(sheet => BinaryExporter.export(sheet, outputDir));
    }

    /**
     * 序列化单行数据为 FlatBuffers table
     */
    private static serializeRow(
        builder: flatbuffers.Builder,
        fields: FieldDef[],
        row: any[]
    ): number {
        // 预先创建所有需要 offset 的字段（string、array 等）
        const fieldOffsets: (number | null)[] = [];

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const value = i < row.length ? row[i] : null;
            fieldOffsets.push(BinaryExporter.prepareFieldOffset(builder, field, value));
        }

        // 开始构建 table
        builder.startObject(fields.length);

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const value = i < row.length ? row[i] : null;
            const offset = fieldOffsets[i];

            BinaryExporter.addField(builder, i, field, value, offset);
        }

        return builder.endObject();
    }

    /**
     * 预先创建需要 offset 的字段值（string、vector 等必须在 startObject 之前创建）
     */
    private static prepareFieldOffset(
        builder: flatbuffers.Builder,
        field: FieldDef,
        value: any
    ): number | null {
        if (field.type === 'string') {
            const strValue = value != null ? String(value) : '';
            return builder.createString(strValue);
        }

        if (field.type.startsWith('array:')) {
            return BinaryExporter.createArrayOffset(builder, field.type, value);
        }

        return null;
    }

    /**
     * 向 builder 添加字段值
     */
    private static addField(
        builder: flatbuffers.Builder,
        fieldIndex: number,
        field: FieldDef,
        value: any,
        offset: number | null
    ): void {
        const type = field.type;

        if (type === 'int') {
            builder.addFieldInt32(fieldIndex, value != null ? Math.floor(Number(value)) : 0, 0);
        } else if (type === 'float') {
            builder.addFieldFloat32(fieldIndex, value != null ? Number(value) : 0.0, 0.0);
        } else if (type === 'bool') {
            const boolVal = value === true || value === 1 || value === 'true';
            builder.addFieldInt8(fieldIndex, boolVal ? 1 : 0, 0);
        } else if (type === 'string') {
            if (offset != null) {
                builder.addFieldOffset(fieldIndex, offset, 0);
            }
        } else if (type.startsWith('enum:')) {
            // 枚举存储为 byte
            builder.addFieldInt8(fieldIndex, value != null ? Number(value) : 0, 0);
        } else if (type.startsWith('array:')) {
            if (offset != null) {
                builder.addFieldOffset(fieldIndex, offset, 0);
            }
        }
    }

    /**
     * 创建数组类型的 vector offset
     */
    private static createArrayOffset(
        builder: flatbuffers.Builder,
        type: string,
        value: any
    ): number | null {
        const innerType = type.substring(6); // 去掉 "array:" 前缀
        let arr: any[] = [];

        if (Array.isArray(value)) {
            arr = value;
        } else if (typeof value === 'string') {
            try {
                arr = JSON.parse(value);
            } catch {
                arr = [];
            }
        }

        if (arr.length === 0) return null;

        if (innerType === 'int') {
            // 创建 int32 vector
            builder.startVector(4, arr.length, 4);
            for (let i = arr.length - 1; i >= 0; i--) {
                builder.addInt32(Math.floor(Number(arr[i])));
            }
            return builder.endVector();
        }

        if (innerType === 'float') {
            builder.startVector(4, arr.length, 4);
            for (let i = arr.length - 1; i >= 0; i--) {
                builder.addFloat32(Number(arr[i]));
            }
            return builder.endVector();
        }

        if (innerType === 'string') {
            // string vector 需要先创建所有 string offset
            const strOffsets: number[] = arr.map((s: any) => builder.createString(String(s)));
            builder.startVector(4, strOffsets.length, 4);
            for (let i = strOffsets.length - 1; i >= 0; i--) {
                builder.addOffset(strOffsets[i]);
            }
            return builder.endVector();
        }

        if (innerType === 'bool') {
            builder.startVector(1, arr.length, 1);
            for (let i = arr.length - 1; i >= 0; i--) {
                builder.addInt8(arr[i] ? 1 : 0);
            }
            return builder.endVector();
        }

        return null;
    }

    /**
     * 创建 offset vector（用于 table 数组）
     */
    private static createVector(builder: flatbuffers.Builder, offsets: number[]): number {
        builder.startVector(4, offsets.length, 4);
        for (let i = offsets.length - 1; i >= 0; i--) {
            builder.addOffset(offsets[i]);
        }
        return builder.endVector();
    }
}
