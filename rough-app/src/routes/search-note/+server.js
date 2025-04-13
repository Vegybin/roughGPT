// Import Pinecone Client
import { Pinecone } from "@pinecone-database/pinecone";
import { json } from "@sveltejs/kit";
// Initialize Pinecone Client


// Function to get text embeddings
async function getEmbedding(pc, texts) {
    let response = await pc.inference.embed(
        "multilingual-e5-large", 
        texts.map(d => d.text),
        {inputType: 'query', truncate: 'END'}
      );
    
        response=response.data;
    
        let n=response.length, i=0 ;
        let arr=[];
        
        for(i=0;i<n;i++)
         {
          arr.push(response[i].values);
         }
         return arr;
    }
    
    

// Function to insert a note into Pinecone

export async function POST({ request }) {
    try {
        const { apiKey, text } = await request.json();
        const pc = new Pinecone({ apiKey });
          let texts = [{text}];
          // Wait for the embedding to be generated
        const vector = await getEmbedding(pc, texts);
          const index = pc.index("rough-man");
          
          // Replace with an actual embedded vector
          const response = await index.query({
            vector: vector[0], // Your real vector here
            topK: 100,
            includeMetadata: true,
          });
        
          var matches = [];
          for(let index=0; index<response.matches.length; index++){
            if(response.matches[index].id.includes("-"))
              matches.push(response.matches[index].metadata?.full_text);
          }
          return json({data:[...new Set(matches)]});
    } catch (error) {
        console.error("Error searching note:", error);
        return json({ error: error });
    }
}