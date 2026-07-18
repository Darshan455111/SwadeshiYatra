// test-rotation-logic.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  console.log("Checking API Keys...");
  const keysStr = process.env.GEMINI_API_KEYS || "";
  const keys = keysStr.split(",").map(k => k.trim()).filter(k => k.length > 0);
  
  console.log(`Found ${keys.length} keys.`);
  keys.forEach((k, i) => console.log(`Key ${i+1}: ${k.substring(0, 10)}...`));

  if (keys.length < 2) {
    console.error("Error: Expected at least 2 keys in .env.local");
    process.exit(1);
  }

  console.log("Success: Environment configured correctly for rotation.");
}

test();
