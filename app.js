import http from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { writeFile } from 'fs/promises';



const PORT = process.env.PORT || 3001;


const DATA_FILE = path.join("data", "links.json");

const serveFile = async(res, filePath, ContentType) => {
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": ContentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": ContentType });
    res.end("404 page not found");
  }
};

const loadLinks = async()=>{

  try{
    const data= await readFile(DATA_FILE,"utf-8");
    return JSON.parse(data);

  }catch(error){
    if(error.code === "ENOENT"){
  await writeFile(DATA_FILE,JSON.stringify({}));
  return {};
    }
  throw error;
}
}
const saveFiles = async(links)=>{
  await writeFile(DATA_FILE,JSON.stringify(links));
}

const server = http.createServer(async(req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      return serveFile(res, path.join("publice", "index.html"), "text/html");
    } else if (req.url === '/style.css') {
      return serveFile(res, path.join("publice", "style.css"), "text/css");
    }else if(req.url ==="/links") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify((await loadLinks())));

    }else{
      const links = await loadLinks();
      const shortCode=req.url.slice(1);
      console.log(req.url);
      if(links[shortCode]){
        res.writeHead(301,{location :links[shortCode]});
        return res.end();
      }
        res.writeHead(404, { "Content-Type": "text/plain" }); // <-- fixed typo
           return res.end('URL is not found');
    }
  }
if (req.method === "POST" && req.url === "/Shorten") {
    const links = await loadLinks();
    let body = "";
    req.on('data', (chunk) => {
        body += chunk;
    });
    req.on('end', async () => { // <-- changed from res.on to req.on
        console.log(body);
        const { url, shortCode } = JSON.parse(body);
        if (!url) {
            res.writeHead(400, { "Content-Type": "text/plain" }); // <-- fixed typo
            res.end('URL is not found');
            return;
        }
        const finalShortCode = shortCode || randomBytes(4).toString('hex');
        if (links[finalShortCode]) {
            res.writeHead(400, { "Content-Type": "text/plain" }); // <-- fixed typo
            res.end('shortCode already in use: choose another one');
            return;
        }
        links[finalShortCode] = url;
        await saveFiles(links);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ Success: true, shortCode: finalShortCode }));
    });
}

});



server.listen(PORT,  () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
