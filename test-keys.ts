import { GoogleGenerativeAI } from "@google/generative-ai";

async function testKeys() {
  const keys = [
    "AIzaSyDfRRt-CoDRmINuvPaevjaqkERxV7ISTt4",
    "AIzaSyCovWsRC7ghEDi-vfEa4GGScfqm1d6Xou0"
  ];

  for (const key of keys) {
    console.log(`Testing key: ${key.slice(0, 10)}...`);
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    try {
      const result = await model.generateContent("Hi");
      console.log(`Success with key! Response: ${result.response.text().slice(0, 20)}`);
    } catch (err: any) {
      console.error(`Failure with key: ${err.message || err}`);
      if (err.status) console.error(`Status: ${err.status}`);
    }
  }
}

testKeys();
