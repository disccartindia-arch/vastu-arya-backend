#!/bin/bash
# Run this from your backend root to fix 45,000+ -> 73,000+ in seed.ts
sed -i 's/45,000+ clients/73,000+ clients/g' src/utils/seed.ts
sed -i "s/45,000+ Clients/73,000+ Clients/g" src/utils/seed.ts
echo "Seed.ts patched: 45,000+ -> 73,000+"
