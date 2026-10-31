import { Html, Head, Main, NextScript } from "next/document";

function MyDocument() {
  return (
    <Html>
      <Head />
      <body>
        <script src="/theme-init.js" />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

export default MyDocument;
