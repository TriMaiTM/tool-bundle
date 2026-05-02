import WordCounter from "./WordCounter";
import CaseConverter from "./CaseConverter";
import JsonFormatter from "./JsonFormatter";
import Base64Encoder from "./Base64Encoder";
import LoremGenerator from "./LoremGenerator";
import TextReverser from "./TextReverser";
import LineCounter from "./LineCounter";
import SlugGenerator from "./SlugGenerator";
import UrlEncoder from "./UrlEncoder";
import HashGenerator from "./HashGenerator";
import RegexTester from "./RegexTester";
import ImageConverter from "./ImageConverter";
import ImageResizer from "./ImageResizer";
import ImageCompressor from "./ImageCompressor";
import ImageCropper from "./ImageCropper";

interface Props {
  toolId: string;
}

// Image converter tools with their specific configurations
const IMAGE_CONVERTER_CONFIGS: Record<
  string,
  {
    from: string;
    to: string;
    mime: "image/png" | "image/jpeg" | "image/webp";
    accept: string;
  }
> = {
  "png-to-jpg": {
    from: "PNG",
    to: "JPG",
    mime: "image/jpeg",
    accept: "image/png",
  },
  "jpg-to-png": {
    from: "JPG",
    to: "PNG",
    mime: "image/png",
    accept: "image/jpeg",
  },
  "jpg-to-webp": {
    from: "JPG",
    to: "WebP",
    mime: "image/webp",
    accept: "image/jpeg",
  },
  "png-to-webp": {
    from: "PNG",
    to: "WebP",
    mime: "image/webp",
    accept: "image/png",
  },
  "webp-to-png": {
    from: "WebP",
    to: "PNG",
    mime: "image/png",
    accept: "image/webp",
  },
};

export default function ToolRenderer({ toolId }: Props) {
  // Check if it's an image converter tool
  const converterConfig = IMAGE_CONVERTER_CONFIGS[toolId];
  if (converterConfig) {
    return (
      <ImageConverter
        fromFormat={converterConfig.from}
        toFormat={converterConfig.to}
        targetMime={converterConfig.mime}
        accept={converterConfig.accept}
      />
    );
  }

  // Map other tool IDs to components
  switch (toolId) {
    case "image-resizer":
      return <ImageResizer />;
    case "image-compressor":
      return <ImageCompressor />;
    case "image-cropper":
      return <ImageCropper />;
    case "word-counter":
      return <WordCounter />;
    case "case-converter":
      return <CaseConverter />;
    case "json-formatter":
      return <JsonFormatter />;
    case "base64-encoder":
      return <Base64Encoder />;
    case "lorem-generator":
      return <LoremGenerator />;
    case "text-reverser":
      return <TextReverser />;
    case "line-counter":
      return <LineCounter />;
    case "slug-generator":
      return <SlugGenerator />;
    case "url-encoder":
      return <UrlEncoder />;
    case "hash-generator":
      return <HashGenerator />;
    case "regex-tester":
      return <RegexTester />;
    default:
      return (
        <div class="text-center py-12">
          <p class="text-muted">This tool is coming soon.</p>
        </div>
      );
  }
}
