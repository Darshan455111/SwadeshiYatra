import { getPlacePhotoUrl } from "./lib/google-places.js";

async function test() {
  const url = await getPlacePhotoUrl("Taj Mahal", "Agra");
  console.log("Photo URL:", url);
}

test();
