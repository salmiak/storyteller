import OpenAI from "openai";
import readline from 'readline';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI();

async function generateImage(prompt) {
    // Process each line here
    console.log('Process line:', prompt);

    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        // n: 1,
        response_format: "b64_json",
        size: "1024x1024",
    });
    // image_url = response.data.data[0].url;
    let image_info = response.data[0];

    // Your base64 encoded image string
    const base64Image = image_info.b64_json; // Your base64 string goes here

    // Remove the data:image/<image-type>;base64, prefix
    const dataWithoutPrefix = base64Image.replace(/^data:image\/\w+;base64,/, '');

    // Decode the base64 string into a buffer
    const imageBuffer = Buffer.from(dataWithoutPrefix, 'base64');

    // Specify the file path where you want to save the image
    const outputPath = `output/${uuidv4()}.jpg`; // Change the file extension as needed

    // Write the buffer to a file
    fs.writeFileSync(outputPath, imageBuffer, 'binary');

    console.log('Image saved successfully at:', outputPath);
}

async function main() {

    // Replace 'your-file.txt' with the path to your text file
    const filePath = 'prompts.txt';

    // Create a readable stream for the file
    const fileStream = fs.createReadStream(filePath);

    // Create a readline interface
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity // To recognize both '\r\n' and '\n' as line endings
    });

    // Event listener for each line read
    rl.on('line', generateImage);

    // Event listener when the file reading is complete
    rl.on('close', () => {
        console.log('File reading complete.');
    });
    

}

main();