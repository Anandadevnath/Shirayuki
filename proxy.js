import http from 'http';
import https from 'https';
import url from 'url';

const PORT = 8081;

const server = http.createServer((req, res) => {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Cache-Control, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Extract the target URL from query parameter or construct from path
  const parsedUrl = url.parse(req.url, true);
  let targetUrl = parsedUrl.query.url;
  
  // If no URL parameter, check if it's a relative path request for HLS segments
  if (!targetUrl && parsedUrl.pathname !== '/') {
    // This is likely a relative HLS segment request
    const baseUrl = 'https://sunburst93.live/_v7/d8e56d406f04d29b74b4e03042fca324d71f0cd196c65f1fcb9c6d27377df7bd17b6ce13536ee8f21bbfe92902b58f639455ccab8671ba0aa00782c152a6b8084cc518d7e32b2415bbe87dad7d55eb0736a3a15011d0533eceafe7a5841fde57bf868c98b776c63a5d23bbb687bf37df7365905359f738d51b40f6138f9e5d77';
    targetUrl = baseUrl + parsedUrl.pathname;
  }

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Missing url parameter or invalid path');
    return;
  }

  // Parse the target URL
  const targetParsed = url.parse(targetUrl);
  const isHttps = targetParsed.protocol === 'https:';
  const httpModule = isHttps ? https : http;

  // Prepare request options
  const options = {
    hostname: targetParsed.hostname,
    port: targetParsed.port || (isHttps ? 443 : 80),
    path: targetParsed.path,
    method: req.method,
    headers: {
      'Referer': 'https://megacloud.blog/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      // Remove Accept-Encoding to avoid compression issues
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site'
    }
  };

  // Forward range header if present (for video streaming)
  if (req.headers.range) {
    options.headers.Range = req.headers.range;
  }

  console.log(`Proxying request to: ${targetUrl}`);

  // Make the request to the target server
  const proxyReq = httpModule.request(options, (proxyRes) => {
    // Remove content-encoding headers to avoid decoding issues
    const headers = { ...proxyRes.headers };
    delete headers['content-encoding'];
    delete headers['content-length'];
    
    // Copy status code and headers from target response
    res.writeHead(proxyRes.statusCode, headers);
    
    // Check if this is an HLS playlist that needs URL rewriting
    const contentType = proxyRes.headers['content-type'] || '';
    if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegURL') || targetUrl.includes('.m3u8')) {
      let data = '';
      proxyRes.setEncoding('utf8');
      
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });
      
      proxyRes.on('end', () => {
        // Rewrite URLs in the playlist to go through our proxy
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        let rewrittenData = data;
        
        // Rewrite relative .m3u8 playlist references
        rewrittenData = rewrittenData.replace(/^(?!https?:\/\/)([^\s\n]+\.m3u8)/gm, (match, filename) => {
          return `http://127.0.0.1:8081?url=${encodeURIComponent(baseUrl + filename)}`;
        });
        
        // Rewrite absolute .m3u8 playlist references
        rewrittenData = rewrittenData.replace(/^(https?:\/\/[^\s\n]+\.m3u8)/gm, (match, fullUrl) => {
          return `http://127.0.0.1:8081?url=${encodeURIComponent(fullUrl)}`;
        });
        
        // Rewrite relative video segment references
        rewrittenData = rewrittenData.replace(/^(?!https?:\/\/)([^\s\n]+\.(ts|jpg|jpeg|mp4|webm|html))/gm, (match, filename) => {
          return `http://127.0.0.1:8081?url=${encodeURIComponent(baseUrl + filename)}`;
        });
        
        // Rewrite absolute video segment references  
        rewrittenData = rewrittenData.replace(/^(https?:\/\/[^\s\n]+\.(ts|jpg|jpeg|mp4|webm|html))/gm, (match, fullUrl) => {
          return `http://127.0.0.1:8081?url=${encodeURIComponent(fullUrl)}`;
        });
        
        res.end(rewrittenData);
      });
    } else {
      // For non-playlist files (video segments), just pipe the response
      proxyRes.pipe(res);
    }
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: ' + err.message);
  });

  // Pipe the request data to the target server
  req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CORS proxy server running on http://127.0.0.1:${PORT}`);
  console.log(`Access from network: http://127.0.0.1:${PORT}`);
  console.log(`Usage: http://127.0.0.1:${PORT}?url=<target_url>`);
});