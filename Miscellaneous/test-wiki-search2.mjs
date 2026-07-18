async function testMoreRobustSearch() {
  const query = "Lalbagh Botanical Garden Bangalore";
  
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=1`;
  const res = await fetch(searchUrl);
  const data = await res.json();
  
  const bestTitle = data.query?.search?.[0]?.title;
  console.log("Best Robust Title:", bestTitle);
  
  if (bestTitle) {
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(bestTitle)}`;
    const imgRes = await fetch(imgUrl);
    const imgData = await imgRes.json();
    console.log("Photo URL:", Object.values(imgData.query.pages)[0]?.original?.source);
  }
}
testMoreRobustSearch();
