import "dotenv/config";
import { scanWishlistMatches } from "./scanWishlistMatches";

scanWishlistMatches()
  .then((r) => {
    console.log(r);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
