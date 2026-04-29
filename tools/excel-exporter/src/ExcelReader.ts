/**
 * ExcelReader - Excel 配置文件读取器
 * 
 * 读取 .xlsx 文件，解析表头行和数据行：
 *   第1行 = 字段名
 *   第2行 = 字段类型
 *   第3行 = 注释说明
 *   第4行起 = 数据行
 * 
 * 跳过空行和以 # 开头的注释行。
 * 类型不匹配时记录错误并中止该表导出。
 */

import * as XLSX from 'xlsx';
import * as path from 'path';

/** 字段定义 */
export interface FieldDef {
    /** 字段名 */
    name: string;
    /** 字段类型标注（如 int, float, bool, string, enum:Name, array:int, array:string） */
    type: string;
    /** 注释说明 */
    comment: string;
}

/** 解析后的工作表数据 */
export interface SheetData {
    /** 工作表名称 */
    sheetName: string;
    /** 字段定义列表 */
    fields: FieldDef[];
    /** 数据行（每行为一个值数组，顺序与 fields 对应） */
    rows: any[][];
}

/** 支持的字段类型 */
const VALID_TYPES = ['int', 'float', 'bool', 'string'];

/**
 * 检查类型标注是否合法
 */
function isValidType(type: string): boolean {
    if (VALID_TYPES.includes(type)) return true;
    if (type.startsWith('enum:') && type.length > 5) return true;
    if (type.startsWith('array:')) {
        const inner = type.substring(6);
        return VALID_TYPES.includes(inner) || inner.startsWith('enum:');
    }
    return false;
}

/**
 * 验证单元格值是否匹配声明的类型
 */
function validateCellType(value: any, type: string): boolean {
    // 空值允许（可选字段）
    if (value === null || value === undefined || value === '') return true;

    if (type === 'int') {
        return typeof value === 'number' && Number.isInteger(value);
    }
    if (type === 'float') {
        return typeof value === 'number';
    }
    if (type === 'bool') {
        if (typeof value === 'boolean') return true;
        if (typeof value === 'number') return value === 0 || value === 1;
        if (typeof value === 'string') {
            const lower = value.toLowerCase();
            return lower === 'true' || lower === 'false' || lower === '0' || lower === '1';
        }
        return false;
    }
    if (type === 'string') {
        return true; // 任何值都可以转为字符串
    }
    if (type.startsWith('enum:')) {
        // 枚举值应为整数或字符串标识
        return typeof value === 'number' || typeof value === 'string';
    }
    if (type.startsWith('array:')) {
        // 数组值应为字符串格式 "[1,2,3]" 或已解析的数组
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed);
            } catch {
                return false;
            }
        }
        return false;
    }
    return false;
}

/**
 * 将单元格值转换为目标类型
 */
function convertCellValue(value: any, type: string): any {
    if (value === null || value === undefined || value === '') return getDefaultValue(type);

    if (type === 'int') {
        return typeof value === 'number' ? Math.floor(value) : parseInt(String(value), 10);
    }
    if (type === 'float') {
        return typeof value === 'number' ? value : parseFloat(String(value));
    }
    if (type === 'bool') {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        const lower = String(value).toLowerCase();
        return lower === 'true' || lower === '1';
    }
    if (type === 'string') {
        return String(value);
    }
    if (type.startsWith('enum:')) {
        return typeof value === 'number' ? value : String(value);
    }
    if (type.startsWith('array:')) {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return [];
            }
        }
        return [];
    }
    return value;
}

/**
 * 获取类型的默认值
 */
function getDefaultValue(type: string): any {
    if (type === 'int') return 0;
    if (type === 'float') return 0.0;
    if (type === 'bool') return false;
    if (type === 'string') return '';
    if (type.startsWith('enum:')) return 0;
    if (type.startsWith('array:')) return [];
    return null;
}

export class ExcelReader {
    /**
     * 读取 Excel 文件，返回所有工作表的解析数据
     * @param filePath Excel 文件路径
     * @returns 解析后的 SheetData 数组，解析失败的表不包含在结果中
     */
    static read(filePath: string): SheetData[] {
        const fileName = path.basename(filePath);
        const workbook = XLSX.readFile(filePath);
        const results: SheetData[] = [];

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) continue;

            const sheetData = ExcelReader.parseSheet(sheet, sheetName, fileName);
            if (sheetData) {
                results.push(sheetData);
            }
        }

        return results;
    }

    /**
     * 解析单个工作表
     */
    private static parseSheet(
        sheet: XLSX.WorkSheet,
        sheetName: string,
        fileName: string
    ): SheetData | null {
        // 将工作表转为二维数组（保留原始类型）
        const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: null,
            raw: true,
        });

        if (rawData.length < 3) {
            console.error(`[ExcelReader] ${fileName}/${sheetName}: 表头行不足（至少需要3行：字段名、字段类型、注释）`);
            return null;
        }

        // 第1行：字段名
        const nameRow = rawData[0];
        // 第2行：字段类型
        const typeRow = rawData[1];
        // 第3行：注释
        const commentRow = rawData[2];

        // 解析字段定义
        const fields: FieldDef[] = [];
        const colCount = nameRow.length;

        for (let col = 0; col < colCount; col++) {
            const name = nameRow[col] != null ? String(nameRow[col]).trim() : '';
            const type = typeRow[col] != null ? String(typeRow[col]).trim() : '';
            const comment = commentRow[col] != null ? String(commentRow[col]).trim() : '';

            if (!name) continue; // 跳过无字段名的列

            if (!isValidType(type)) {
                console.error(
                    `[ExcelReader] ${fileName}/${sheetName}: 列 "${name}" 的类型标注 "${type}" 不合法`
                );
                return null;
            }

            fields.push({ name, type, comment });
        }

        if (fields.length === 0) {
            console.error(`[ExcelReader] ${fileName}/${sheetName}: 未找到有效字段定义`);
            return null;
        }

        // 第4行起：数据行
        const rows: any[][] = [];
        let hasError = false;

        for (let rowIdx = 3; rowIdx < rawData.length; rowIdx++) {
            const rawRow = rawData[rowIdx];
            if (!rawRow || rawRow.length === 0) continue; // 跳过空行

            // 检查是否为注释行（第一个单元格以 # 开头）
            const firstCell = rawRow[0];
            if (firstCell != null && String(firstCell).trim().startsWith('#')) continue;

            // 检查是否为全空行
            const isAllEmpty = rawRow.every(
                (cell: any) => cell === null || cell === undefined || String(cell).trim() === ''
            );
            if (isAllEmpty) continue;

            // 解析数据行
            const row: any[] = [];
            let fieldIdx = 0;

            for (let col = 0; col < colCount && fieldIdx < fields.length; col++) {
                const name = nameRow[col] != null ? String(nameRow[col]).trim() : '';
                if (!name) continue; // 跳过无字段名的列

                const field = fields[fieldIdx];
                const cellValue = col < rawRow.length ? rawRow[col] : null;

                // 类型验证
                if (!validateCellType(cellValue, field.type)) {
                    console.error(
                        `[ExcelReader] ${fileName}/${sheetName}: ` +
                        `第 ${rowIdx + 1} 行，列 "${field.name}" 的值 "${cellValue}" ` +
                        `与声明类型 "${field.type}" 不匹配`
                    );
                    hasError = true;
                    break;
                }

                // 类型转换
                row.push(convertCellValue(cellValue, field.type));
                fieldIdx++;
            }

            if (hasError) break;

            // 补齐缺失的列
            while (row.length < fields.length) {
                row.push(getDefaultValue(fields[row.length].type));
            }

            rows.push(row);
        }

        if (hasError) {
            console.error(`[ExcelReader] ${fileName}/${sheetName}: 类型验证失败，中止该表导出`);
            return null;
        }

        return { sheetName, fields, rows };
    }
}
