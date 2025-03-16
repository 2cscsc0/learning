import { NextResponse } from 'next/server';
import sharp from 'sharp';

const fs = require('fs');
const path = require('path');

import Replicate from "replicate";

const replicate = new Replicate();

import { readFile, writeFile } from 'fs/promises';


export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/', request.url))
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const promptField = formData.get('prompt');

    if (!promptField || typeof promptField !== 'string') {
      return new Response('Prompt is required', { status: 400 });
    }
    const prompt = promptField.trim();

    const modelField = formData.get('model');
    if (!modelField || typeof modelField !== 'string') {
      return new Response('Model is required', { status: 400 });
    }

    const model = modelField.trim();

    let imageField = formData.get('image') as string;
    let maskField = formData.get('mask') as string;

    if (imageField && !imageField.startsWith('data:image') || maskField && !maskField.startsWith('data:image')) {
      return new Response('Invalid image or mask, should be base64 encoded', { status: 400 });
    }

    if (imageField && maskField) {
      const metaImage = await sharp(Buffer.from(imageField.split(",")[1], "base64")).metadata();
      const metaMask = await sharp(Buffer.from(maskField.split(",")[1], "base64")).metadata();

      if (metaImage.width !== metaMask.width || metaImage.height !== metaMask.height) {
        return new Response('Image and mask dimensions do not match', { status: 400 });
      }

      const [ output ]: any = await replicate.run( // weird fix
      //"lucataco/sdxl-inpainting:a5b13068cc81a89a4fbeefeccc774869fcb34df4dbc92c1555e0f2771d49dde7",
      //"black-forest-labs/flux-fill-dev",
      "some/model",
      {
        input: {
          image: imageField,
          mask: maskField,
          prompt: prompt,
        }
      }
      )
      const outputBlob = await output.blob();
      const outputBuffer = await outputBlob.arrayBuffer();

      const generatedImage = Buffer.from(outputBuffer).toString('base64');

      return NextResponse.json({ image: generatedImage });
    }
    
    {
      try {
      const imageDir = path.join(process.cwd(), 'images');
      const files = fs.readdirSync(imageDir).filter((file: string) =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      );
      
      if (files.length === 0) {
        return NextResponse.json({ error: 'No images found' }, { status: 404 });
      }
      
      const randomImage = files[Math.floor(Math.random() * files.length)];
      const imagePath = path.join(imageDir, randomImage);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      return NextResponse.json({ image: base64Image });
      } catch (error) {
      console.error("Error reading random image:", error);
      return NextResponse.json({ error: 'Failed to get random image' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
/* WORKS on replicate
import Replicate from "replicate";

const replicate = new Replicate();
const [ output ]: any = await replicate.run( // weird fix
"lucataco/sdxl-inpainting:a5b13068cc81a89a4fbeefeccc774869fcb34df4dbc92c1555e0f2771d49dde7",
{
  input: {
    image: await readFile("./images/image.png"),
    mask: await readFile("./images/mask.png"),
    prompt: prompt,
  }
}
)
const outputBlob = await output.blob();
const outputBuffer = await outputBlob.arrayBuffer();

const generatedImage = Buffer.from(outputBuffer).toString('base64');

return NextResponse.json({ image: generatedImage });
*/