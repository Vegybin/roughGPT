// Import Pinecone Client
import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone Client


// Function to chunk a long text into smaller parts
function chunkText(text, chunkSize = 30) {
  const words = text.split(" ");
  let chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push({text: words.slice(i, i + chunkSize).join(" ")});
  }
  return chunks;
}

// Function to get text embeddings
async function getEmbedding(pc, texts) {
const response = await pc.inference.embed(
    "multilingual-e5-large", 
    texts.map(d => d.text),
    {inputType: 'passage', truncate: 'END'}
  );
  
  
    let n=response.length, i=0 ;
    let arr=[];
    
    for(i=0;i<n;i++)
     {
      arr.push(response[i].values);
     }
     return arr;
}


// Function to insert a note into Pinecone
async function insertNote(apiKey, fullText) {
  const pc = new Pinecone({
    apiKey: apiKey,
  });
  let chunked=[];
  chunked= chunkText(fullText);
  const index = pc.index("rough-man"); // Connect to your Pinecone index
  let vectors= await getEmbedding(pc,chunked);
  const fetchResult = await index.fetch(['count']);
  let noteId= fetchResult.records.count.metadata.count;
  let records=[];
  for (let i = 0; i < vectors.length; i++) {
    records.push({
      id: `${noteId}-${i}`,
      values: vectors[i],
      metadata: { note_id: noteId, full_text: fullText, chunk_index: i },
    });
  }
 
  await index.upsert(records);
  await index.upsert([{id:"count", values: vectors[0], metadata: {count: parseInt(noteId)+1}}]);
  console.log("Note stored successfully!");
}

// Function to search for notes based on query
async function searchNotes(query) {
  const queryVector = await getEmbedding(query);
  const results = await index.query({
    vector: queryVector,
    topK: 5,
    includeMetadata: true,
  });

  let fullNotes = new Set();
  results.matches.forEach((match) => fullNotes.add(match.metadata.full_text));

  return Array.from(fullNotes);
}

// Example Usage
// (async () => {
//   const noteId = "note123";
//   const fullNote = "This is a long note that needs to be chunked and stored in Pinecone for efficient retrieval.";
//   await insertNote(noteId, fullNote);

//   const query = "long note";
//   const matchedNotes = await searchNotes(query);
//   console.log(matchedNotes); // Outputs matching full notes
// })();