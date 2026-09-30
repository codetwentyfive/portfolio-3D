import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 await page.goto(`${process.env.PREVIEW_URL || 'http://localhost:3100'}/en`);
 await page.locator('.world-enhancement[data-ready="true"]').waitFor({timeout:60000});
 // Capture the actual WebGL composition, lighting and camera, never substitute artwork.
 await page.addStyleTag({content:'.studio-canvas {position:fixed!important;inset:0!important;width:1200px!important;height:760px!important;background:#e9eae5;z-index:9999;} .world-poster{display:none!important;} body * {visibility:hidden!important;} .world-enhancement canvas {visibility:visible!important;}'});
 await page.waitForTimeout(600);
 const png=await page.locator('.world-enhancement canvas').screenshot();
 await sharp(png).webp({quality:88}).toFile(path.resolve(import.meta.dirname,'../public/images/worlds/denkpause-v1.webp'));
 console.log(await sharp(png).metadata());
} finally {await browser.close();}
