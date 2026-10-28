'use client';

import { NetworkErrorScreen } from '@/components/NetworkError/NetworkErrorScreen';

export default function GlobalError() {
  return (
    <html lang="en">
      <head>
        <title>This site can’t be reached</title>
      </head>
      <body>
        <NetworkErrorScreen />
      </body>
    </html>
  );
}

