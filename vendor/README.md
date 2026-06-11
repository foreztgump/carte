# vendor/

`tender-sdk-0.0.0.tgz` — packed from the private `tender` repo (`packages/sdk`) so CI can resolve `@tender/sdk` without access to that repo. Temporary: remove and switch `packages/orders-backend` back to a registry dependency once `@tender/sdk` is published to npm (PRO-766 / PRO-787).

Refresh with: `cd ../tender/packages/sdk && pnpm pack --pack-destination ../../../carte/vendor`
