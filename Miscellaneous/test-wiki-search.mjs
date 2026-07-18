async function testBetterWikiSearch() {
  const query = "Lalbagh Botanical Garden Bangalore"; // example of something that might fail direct title match
  
  // Step 1: OpenSearch to find the closest page title
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  const bestMatchTitle = searchData[1]?.[0];
  console.log("Best Match Title:", bestMatchTitle);
  
  if (bestMatchTitle) {
    // Step 2: Fetch the image for that title
    const imageQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(bestMatchTitle)}`;
    const imgRes = await fetch(imageQueryUrl);
    const imgData = await imgRes.json();
    
    const pages = imgData.query.pages;
    const pageId = Object.keys(pages)[0];
    const photoUrl = pages[pageId]?.original?.source;
    
    console.log("Photo URL:", photoUrl);
  } else {
    console.log("No Wikipedia match found.");
  }
}

testBetterWikiSearch();
