#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function optimizeModel() {
    const inputPath = join(__dirname, '../src/assets/3d/bird_extracted.gltf');
    const outputPath = join(__dirname, '../src/assets/3d/bird_optimized.glb');

    try {
        console.log('Optimizing model...');
        
        // Basic GLB conversion with minimal optimization
        const command = `gltf-pipeline -i "${inputPath}" -o "${outputPath}" -b`;
        
        const { stdout, stderr } = await execAsync(command);
        
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        
        console.log('Model optimization complete!');
    } catch (error) {
        console.error('Error optimizing model:', error);
        process.exit(1);
    }
}

optimizeModel(); 