//import express from 'express';
//const app = express();
 
import { readFile } from "node:fs/promises";
import { createServer } from "node:https";
import { Server } from "socket.io";


import { ChatOpenAI } from "langchain/chat_models/openai";

import { loadQARefineChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

import * as dotenv from "dotenv";
dotenv.config();


const key = await readFile("key.pem");
const cert = await readFile("cert.pem");

const httpsServer = createServer({
  key,
  cert
}, async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    const content = await readFile("./index.html");
    res.writeHead(200, {
      "content-type": "text/html"
    });
    res.write(content)+"ooo";
    res.end();
  } else {
    res.writeHead(404).end();
  }
});

const port = process.env.PORT || 3000;

httpsServer.listen(port, () => {
  console.log(`server listening at https://localhost:${port}`);
});

const io = new Server(httpsServer);

io.on("connection", (socket) => {
  console.log(`connected with transport ${socket.conn.transport.name}`);

  socket.conn.on("upgrade", (transport) => {
    console.log(`transport upgraded to ${transport.name}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`disconnected due to ${reason}`);
  });

  socket.on('chat message', msg => { 
    
    run(msg)
    
  });


});


 

const question="";

export async function run(question) {
   
  // Create the models and chain
  const embeddings = new OpenAIEmbeddings();
  const model = new ChatOpenAI({  
    temperature: 0 ,
    max_tokens: 50,
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token) {
                       
         // process.stdout.write(token.slice(-2));
       
           
           var text = token.replace('\n', '<br><br>') 
           
         //   io.emit('chat message', text);

        },
      },
    ],
  });
  const chain = loadQARefineChain(model);

  // Load the documents and create the vector store
  const loader = new PDFLoader("nom151.pdf", {
    splitPages: true,
  });
  const docs = await loader.loadAndSplit();
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings);


 
 

  // Select the relevant documents
 // const question = "cuales son los requsitos para cumplir con la nom 151?";
  const relevantDocs = await store.similaritySearch(question);

   

  const res = await chain.call({ input_documents: relevantDocs,
    question}, [
    {
      handleLLMNewToken(token) {
        process.stdout.write(token);
        var text = token.replace('\n', '<br><br>') 
      //  io.emit('chat message', text);

      },
    },
  ]);

  console.log(res)
  print_result_words(res)
  
 
   
}

 

 
const  print_result_words = async (res) => {
 
  let restult=res.output_text
  
  
 // let restult = JSON.stringify(res.output_text, null, 2);
 
  var text =  restult.replace(/\n/g, "<br>");
 
  const myArray =  text.split(" ");
  var i =0;
  for (i = 0; i < myArray.length; i++) {
    console.log(myArray[i])
     
   io.emit('chat message',myArray[i]+" ");
     await sleep(100);
  }
 
}

const sleep = async (milliseconds) => {
  await new Promise(resolve => {
      return setTimeout(resolve, milliseconds)
  });
};
//run("cuales son los requsitos para cumplir con la nom 151?")
 
 