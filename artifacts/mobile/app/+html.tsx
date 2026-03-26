import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Web-only HTML template — only rendered during `expo export --platform web`.
 * Adds PWA meta tags, icons, and theme configuration.
 * Has no effect on native iOS/Android builds.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* PWA identity */}
        <meta name="application-name" content="Voice Persona AI" />
        <meta name="theme-color" content="#050508" />
        <meta name="background-color" content="#050508" />

        {/* iOS home screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="VoiceAI" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />

        {/* Android / standard PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="shortcut icon" href="/icon.png" />

        {/* Open Graph */}
        <meta property="og:title" content="Voice Persona AI" />
        <meta
          property="og:description"
          content="Transform any text into speech with your own voice persona. Record, choose a mode, generate."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/icon.png" />

        {/* Suppress scroll bounce on iOS web */}
        <ScrollViewStyleReset />

        <title>Voice Persona AI</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
