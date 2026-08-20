const { createUIMessageStream } = require('ai');
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue('0:"start"\n');
    controller.enqueue('9:{"toolCallId":"call_427910","toolName":"showTutorProfiles","args":{}}\n');
    controller.enqueue('a:{"toolCallId":"call_427910","toolName":"showTutorProfiles","args":{},"result":{"tutors":[]}}\n');
    controller.close();
  }
});
const uiStream = createUIMessageStream(stream);
const reader = uiStream.getReader();
async function readAll() {
  while(true) {
    const {done, value} = await reader.read();
    if(done) break;
    console.log(JSON.stringify(value, null, 2));
  }
}
readAll().catch(console.error);
