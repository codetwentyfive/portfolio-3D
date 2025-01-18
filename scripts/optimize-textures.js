#!/usr/bin/env node

import sharp from 'sharp';
import { readdirSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function optimizeTexture(inputPath, outputPath, isLowQuality = false) {
    try {
        const ext = extname(inputPath).toLowerCase();
        const isJPG = ext === '.jpg' || ext === '.jpeg';
        const processor = sharp(inputPath)
            .resize(isLowQuality ? 512 : 2048, isLowQuality ? 512 : 2048, { 
                fit: 'inside',
                withoutEnlargement: true 
            });

        if (isJPG) {
            await processor.jpeg({
                quality: isLowQuality ? 60 : 85,
                effort: 10
            }).toFile(outputPath);
        } else {
            await processor.png({
                compressionLevel: 9,
                effort: 10,
                quality: isLowQuality ? 60 : 85
            }).toFile(outputPath);
        }
            
        console.log(`Optimized ${isLowQuality ? 'low-res' : 'high-res'}: ${inputPath} -> ${outputPath}`);
    } catch (error) {
        console.error(`Error processing ${inputPath}:`, error);
    }
}

async function main() {
    const textureDir = join(__dirname, '../src/assets/3d');
    const files = readdirSync(textureDir);
    
    const optimizationPromises = files
        .filter(file => file.includes('_extracted') && (file.endsWith('.png') || file.endsWith('.jpg')))
        .flatMap(file => {
            const inputPath = join(textureDir, file);
            const baseOutputPath = join(textureDir, file.replace('_extracted', ''));
            const lowResPath = baseOutputPath.replace('.', '_low.');
            const highResPath = baseOutputPath.replace('.', '_high.');
            
            return [
                optimizeTexture(inputPath, lowResPath, true),
                optimizeTexture(inputPath, highResPath, false)
            ];
        });
    
    await Promise.all(optimizationPromises);
}

main().catch(console.error); 