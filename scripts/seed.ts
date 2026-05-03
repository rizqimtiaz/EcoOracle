import { seedNetwork } from "../lib/seed";

seedNetwork()
  .then((r) => {
    // eslint-disable-next-line no-console
    console.log(`✓ EcoOracle network seeded with ${r.parcels} parcels and ${r.portfolios} portfolios.`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
