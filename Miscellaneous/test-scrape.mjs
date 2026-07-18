async function testScrape() {
  const query = "Taj Mahal Agra tourist attraction";
  const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  
  const html = await res.text();
  
  // Google Images usually stores the first few image URLs in plain text or embedded base64, 
  // but a simple regex to find the first gstatic thumbnail:
  const match = html.match(/https:\/\/encrypted-tbn0\.gstatic\.com\/images\?q=[^"&]*/);
  
  if (match) {
    console.log("Found image:", match[0]);
  } else {
    console.log("No image found");
    console.log(html.substring(0, 500));
  }
}

testScrape();
