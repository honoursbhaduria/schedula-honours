import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

async function test() {
  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: 'dummy',
      model: 'gemini-1.5-flash',
    });
    console.log('Model instantiated successfully:', model.model);
  } catch (e) {
    console.error('Error instantiating model:', e);
  }
}

test();
