/**
 * SchemaCompiler - FlatBuffers Schema 编译器
 * 
 * 调用 flatc 编译器将 .fbs Schema 文件编译为 TypeScript 访问代码。
 * 命令格式: flatc --ts -o <outputDir> <schemaFile>
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/** 编译结果 */
export interface CompileResult {
    /** 是否编译成功 */
    success: boolean;
    /** Schema 文件路径 */
    schemaFile: string;
    /** 输出目录 */
    outputDir: string;
    /** 错误信息（编译失败时） */
    error?: string;
}

export class SchemaCompiler {
    /** flatc 编译器路径 */
    private flatcPath: string;

    constructor(flatcPath: string = 'flatc') {
        this.flatcPath = flatcPath;
    }

    /**
     * 编译单个 .fbs Schema 文件为 TypeScript 代码
     * @param schemaFile .fbs 文件路径
     * @param outputDir TypeScript 输出目录
     * @returns 编译结果
     */
    compile(schemaFile: string, outputDir: string): CompileResult {
        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 检查 Schema 文件是否存在
        if (!fs.existsSync(schemaFile)) {
            return {
                success: false,
                schemaFile,
                outputDir,
                error: `Schema 文件不存在: ${schemaFile}`,
            };
        }

        const command = `${this.flatcPath} --ts -o "${outputDir}" "${schemaFile}"`;

        try {
            execSync(command, {
                stdio: 'pipe',
                timeout: 30000, // 30秒超时
            });

            return {
                success: true,
                schemaFile,
                outputDir,
            };
        } catch (err: any) {
            const stderr = err.stderr ? err.stderr.toString() : '';
            const message = err.message || '未知编译错误';

            console.error(
                `[SchemaCompiler] 编译失败: ${path.basename(schemaFile)}\n` +
                `  命令: ${command}\n` +
                `  错误: ${stderr || message}`
            );

            return {
                success: false,
                schemaFile,
                outputDir,
                error: stderr || message,
            };
        }
    }

    /**
     * 批量编译多个 Schema 文件
     * @param schemaFiles .fbs 文件路径列表
     * @param outputDir TypeScript 输出目录
     * @returns 编译结果列表
     */
    compileAll(schemaFiles: string[], outputDir: string): CompileResult[] {
        const results: CompileResult[] = [];

        for (const schemaFile of schemaFiles) {
            const result = this.compile(schemaFile, outputDir);
            results.push(result);

            if (result.success) {
                console.log(`[SchemaCompiler] 编译成功: ${path.basename(schemaFile)}`);
            }
        }

        return results;
    }

    /**
     * 检查 flatc 编译器是否可用
     * @returns 是否可用
     */
    isAvailable(): boolean {
        try {
            execSync(`${this.flatcPath} --version`, { stdio: 'pipe', timeout: 5000 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取 flatc 版本信息
     * @returns 版本字符串，不可用时返回 null
     */
    getVersion(): string | null {
        try {
            const output = execSync(`${this.flatcPath} --version`, {
                stdio: 'pipe',
                timeout: 5000,
            });
            return output.toString().trim();
        } catch {
            return null;
        }
    }
}
