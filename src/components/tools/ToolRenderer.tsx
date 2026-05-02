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
import PercentageCalculator from "./PercentageCalculator";
import UnitConverter from "./UnitConverter";
import BmiCalculator from "./BmiCalculator";
import LoanCalculator from "./LoanCalculator";
import AgeCalculator from "./AgeCalculator";
import PdfMerger from "./PdfMerger";
import PdfSplitter from "./PdfSplitter";
import PdfCompressor from "./PdfCompressor";
import PdfRotator from "./PdfRotator";
import PdfToText from "./PdfToText";
import PasswordGenerator from "./PasswordGenerator";
import PasswordStrengthChecker from "./PasswordStrengthChecker";
import OtpGenerator from "./OtpGenerator";
import TextRepeater from "./TextRepeater";
import RemoveDuplicateLines from "./RemoveDuplicateLines";
import TextSorter from "./TextSorter";
import ReadingTimeCalculator from "./ReadingTimeCalculator";
import MarkdownToHtml from "./MarkdownToHtml";
import HtmlToMarkdown from "./HtmlToMarkdown";
import CssFormatter from "./CssFormatter";
import YamlFormatter from "./YamlFormatter";
import ColorPicker from "./ColorPicker";
import ColorPaletteGenerator from "./ColorPaletteGenerator";
import ContrastChecker from "./ContrastChecker";
import CssGradientGenerator from "./CssGradientGenerator";
import CountdownTimer from "./CountdownTimer";
import TimezoneConverter from "./TimezoneConverter";
import DateDifferenceCalculator from "./DateDifferenceCalculator";
import UnixTimestampConverter from "./UnixTimestampConverter";

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
    case "percentage-calculator":
      return <PercentageCalculator />;
    case "unit-converter":
      return <UnitConverter />;
    case "bmi-calculator":
      return <BmiCalculator />;
    case "loan-calculator":
      return <LoanCalculator />;
    case "age-calculator":
      return <AgeCalculator />;
    case "pdf-merger":
      return <PdfMerger />;
    case "pdf-splitter":
      return <PdfSplitter />;
    case "pdf-compressor":
      return <PdfCompressor />;
    case "pdf-rotator":
      return <PdfRotator />;
    case "pdf-to-text":
      return <PdfToText />;
    case "password-generator":
      return <PasswordGenerator />;
    case "password-strength-checker":
      return <PasswordStrengthChecker />;
    case "otp-generator":
      return <OtpGenerator />;
    case "text-repeater":
      return <TextRepeater />;
    case "remove-duplicate-lines":
      return <RemoveDuplicateLines />;
    case "text-sorter":
      return <TextSorter />;
    case "reading-time-calculator":
      return <ReadingTimeCalculator />;
    case "markdown-to-html":
      return <MarkdownToHtml />;
    case "html-to-markdown":
      return <HtmlToMarkdown />;
    case "css-formatter":
      return <CssFormatter />;
    case "yaml-formatter":
      return <YamlFormatter />;
    case "color-picker":
      return <ColorPicker />;
    case "color-palette-generator":
      return <ColorPaletteGenerator />;
    case "contrast-checker":
      return <ContrastChecker />;
    case "css-gradient-generator":
      return <CssGradientGenerator />;
    case "countdown-timer":
      return <CountdownTimer />;
    case "timezone-converter":
      return <TimezoneConverter />;
    case "date-difference-calculator":
      return <DateDifferenceCalculator />;
    case "unix-timestamp-converter":
      return <UnixTimestampConverter />;
    default:
      return (
        <div class="text-center py-12">
          <p class="text-muted">This tool is coming soon.</p>
        </div>
      );
  }
}
