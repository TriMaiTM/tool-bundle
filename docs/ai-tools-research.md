# AI Tools Research — Kế hoạch phát triển tiếp theo

> Nghiên cứu các AI tools khả thi tiếp theo cho ToolBundle. Tất cả chạy 100% client-side.

## Trạng thái hiện tại

| Metric | Before | After |
|---|---|---|
| AI Tools | 8 | 16 |
| Total Tools | 108 | 226 |
| Tech Stack | Transformers.js v3.8.1 + Tesseract.js | — |
| Models | ONNX Runtime WASM/WebGPU | — |
| Cache | IndexedDB | — |

### Đã implement (16 tools)

| Tool | Model | Size | Task | Status |
|---|---|---|---|---|
| OCR | Tesseract.js | ~4MB | image-to-text (OCR) | ✅ Done |
| Background Remover | RMBG-1.4 | ~170MB | image-segmentation | ✅ Done |
| Text Summarizer | distilbart-cnn-6-6 | ~90MB | summarization | ✅ Done |
| Object Detection | detr-resnet-50 | ~50MB | object-detection | ✅ Done |
| Grammar Checker | T5-small | ~250MB | text2text-generation | ✅ Done |
| Image Captioning | vit-gpt2 | ~1.2GB | image-to-text | ✅ Done |
| Sentiment Analysis | DistilBERT SST-2 | ~270MB | sentiment-analysis | ✅ Done |
| Question Answering | DistilBERT QA | ~270MB | question-answering | ✅ Done |
| AI Translator | MarianMT | ~300MB | translation | ✅ Done |
| Speech to Text | Whisper tiny | ~75MB | automatic-speech-recognition | ✅ Done |
| Text to Speech | Web Speech API | 0MB | text-to-speech | ✅ Done |
| Named Entity Recognition | bert-base-NER | ~400MB | token-classification | ✅ Done |
| Face Detection | detr-resnet-50 | ~50MB | object-detection | ✅ Done |
| Paraphrase Generator | t5-small | ~250MB | text2text-generation | ✅ Done |
| Language Detector | Heuristic | 0MB | Unicode analysis | ✅ Done |
| Keyword Extractor | all-MiniLM-L6-v2 | ~20MB | feature-extraction | ✅ Done |

---

## Tier 1 — Ưu tiên cao

> **Trạng thái:** 5/6 tools đã implement. Chỉ còn Image Upscaler chưa làm (không có ONNX model phù hợp).

### 1. Text Translation ✅
> **Đã implement** → AI Translator (MarianMT, ~300MB)

---

### 2. Speech-to-Text (Voice Recognition) ✅
> **Đã implement** → Speech to Text (Whisper tiny, ~75MB)

---

### 3. Named Entity Recognition (NER) ✅
> **Đã implement** → Named Entity Recognition (bert-base-NER, ~400MB)

---

### 4. Image Upscaler (Super Resolution) ⬜
| | |
|---|---|
| **Mô tả** | Phóng to ảnh mà không mất chất lượng |
| **Task** | `image-to-image` (super resolution) |
| **Model** | Real-ESRGAN hoặc ESRGAN variants |
| **Model size** | ~60MB — 100MB |
| **Độ khó** | ⭐⭐⭐ Khó |
| **UX** | Upload ảnh → chọn scale (2x, 4x) → download |
| **Lý do ưu tiên** | Rất nhiều user cần upscale ảnh cũ/ảnh low-res |
| **Hạn chế** | Không có ONNX model sẵn. Cần convert thủ công hoặc tìm alternative |
| **Approach** | Thử `Xenova/super-resolution` hoặc dùng Canvas API với AI sharpening |

**Implementation notes:**
```
- Nếu dùng Transformers.js: cần model đã convert sang ONNX
- Fallback: Dùng Canvas API upscale + sharpen filter (không phải AI nhưng vẫn tốt hơn bilinear)
- Alternative: Dùng `@anthropic-ai/image-upscaler` nếu có
- Input: PNG/JPG image
- Output: Upscaled PNG image
- Progress bar cho processing (chậm trên CPU)
```

---

### 5. Text-to-Speech ✅
> **Đã implement** → Text to Speech (Web Speech API, 0MB)

---

### 6. Face Detection ✅
> **Đã implement** → Face Detection (detr-resnet-50, ~50MB)

---

## Tier 2 — Ưu tiên trung bình

> **Trạng thái:** 3/6 tools đã implement. Còn lại: Zero-shot Classification, Text Generation, Image Similarity.

### 6. Zero-shot Text Classification ⬜
| | |
|---|---|
| **Mô tả** | Phân loại text vào bất kỳ category nào mà không cần training |
| **Task** | `zero-shot-classification` |
| **Model** | `Xenova/deberta-v3-xsmall-mnli` (~200MB) hoặc `Xenova/bart-large-mnli` (~1.5GB) |
| **Model size** | 200MB — 1.5GB |
| **Độ khó** | ⭐⭐ Trung bình |
| **UX** | Nhập text + nhập labels → nhận kết quả phân loại |
| **Lý do** | Rất flexible — user tự define categories |

---

### 7. Face Detection ✅
> **Đã implement** → Face Detection (detr-resnet-50, ~50MB) — moved to Tier 1

---

### 8. Paraphrase Generator ✅
> **Đã implement** → Paraphrase Generator (t5-small, ~250MB)

---

### 9. Text Generation (Creative Writing) ⬜
| | |
|---|---|
| **Mô tả** | Tạo text dựa trên prompt |
| **Task** | `text-generation` |
| **Model** | `Xenova/gpt2` (~500MB) hoặc `Xenova/distilgpt2` (~350MB) |
| **Model size** | 350MB — 500MB |
| **Độ khó** | ⭐⭐ Trung bình |
| **UX** | Nhập prompt → AI generates continuation |
| **Lý do** | Fun, creative tool |

---

### 10. Image Similarity (CLIP) ⬜
| | |
|---|---|
| **Mô tả** | Tìm ảnh tương tự hoặc search ảnh bằng text |
| **Task** | `zero-shot-image-classification` hoặc `feature-extraction` |
| **Model** | `Xenova/clip-vit-base-patch32` (~150MB) |
| **Model size** | ~150MB |
| **Độ khó** | ⭐⭐⭐ Khó |
| **UX** | Upload 2 ảnh → so sánh similarity score |
| **Lý do** | Unique tool, ít competitors |

---

### 11. Language Detection ✅
> **Đã implement** → Language Detector (Heuristic, 0MB)

---

### 12. Keyword Extraction ✅
> **Đã implement** → Keyword Extractor (all-MiniLM-L6-v2, ~20MB)

---

## Tier 3 — Ưu tiên thấp (Nice to have)

### 13. Depth Estimation
| | |
|---|---|
| **Model** | `Xenova/dpt-large` (~350MB) hoặc `Xenova/depth-anything-v2-small` |
| **Mô tả** | Ước tính độ sâu trong ảnh |
| **Output** | Grayscale depth map |

### 14. Image Colorization
| | |
|---|---|
| **Model** | DeOldify hoặc custom |
| **Mô tả** | Tô màu ảnh đen trắng |
| **Hạn chế** | Có thể không có ONNX model sẵn |

### 15. Pose Estimation
| | |
|---|---|
| **Model** | MoveNet (~10MB) |
| **Mô tả** | Phát hiện tư thế cơ thể |
| **Output** | Skeleton overlay trên ảnh |

### 16. Audio Classification
| | |
|---|---|
| **Model** | `Xenova/ast-finetuned-audioset-10-10-0.4593` (~300MB) |
| **Mô tả** | Nhận diện loại âm thanh |
| **Use case** | Upload audio → phân loại (nhạc, giọng nói, tiếng ồn...) |

### 17. Hate Speech Detection
| | |
|---|---|
| **Model** | `Xenova/toxic-bert` (~400MB) |
| **Mô tả** | Phát hiện ngôn từ thù địch |
| **Use case** | Content moderation tool |

### 18. Text Emotion Detection
| | |
|---|---|
| **Model** | `Xenova/distilroberta-base-go-emotions` (~300MB) |
| **Mô tả** | Phát hiện cảm xúc chi tiết (28 loại: joy, anger, sadness...) |
| **Khác sentiment** | Sentiment chỉ có positive/negative. Emotion có nhiều loại hơn |

---

## Bảng tổng hợp ưu tiên

| # | Tool | Category | Model Size | Effort | Impact | Priority | Status |
|---|---|---|---|---|---|---|---|
| 1 | Text Translation | Text | ~300MB | TB | ⭐⭐⭐⭐⭐ | 🔴 Cao | ✅ Done |
| 2 | Speech-to-Text | Audio | ~75MB | TB | ⭐⭐⭐⭐⭐ | 🔴 Cao | ✅ Done |
| 3 | Text-to-Speech | Audio | 0MB | Dễ | ⭐⭐⭐⭐ | 🔴 Cao | ✅ Done |
| 4 | Named Entity Recognition | Text | ~250MB | TB | ⭐⭐⭐⭐ | 🔴 Cao | ✅ Done |
| 5 | Image Upscaler | Image | ~60MB | Khó | ⭐⭐⭐⭐ | 🟡 TB | ⬜ Chưa |
| 6 | Face Detection | Image | ~5MB | TB | ⭐⭐⭐ | 🟡 TB | ✅ Done |
| 7 | Zero-shot Classification | Text | ~200MB | TB | ⭐⭐⭐ | 🟡 TB | ⬜ Chưa |
| 8 | Paraphrase Generator | Text | ~250MB | Dễ | ⭐⭐⭐ | 🟡 TB | ✅ Done |
| 9 | Language Detection | Text | 0MB | Dễ | ⭐⭐⭐ | 🟡 TB | ✅ Done |
| 10 | Keyword Extraction | Text | ~20MB | TB | ⭐⭐⭐ | 🟡 TB | ✅ Done |
| 11 | Text Generation | Text | ~350MB | TB | ⭐⭐ | 🟢 Thấp | ⬜ Chưa |
| 12 | Image Similarity | Image | ~150MB | Khó | ⭐⭐ | 🟢 Thấp | ⬜ Chưa |
| 13 | Depth Estimation | Image | ~350MB | TB | ⭐⭐ | 🟢 Thấp | ⬜ Chưa |
| 14 | Image Colorization | Image | TBD | Khó | ⭐⭐ | 🟢 Thấp | ⬜ Chưa |
| 15 | Pose Estimation | Image | ~10MB | TB | ⭐⭐ | 🟢 Thấp | ⬜ Chưa |
| 16 | Audio Classification | Audio | ~300MB | TB | ⭐ | 🟢 Thấp | ⬜ Chưa |
| 17 | Hate Speech Detection | Text | ~400MB | TB | ⭐ | 🟢 Thấp | ⬜ Chưa |
| 18 | Emotion Detection | Text | ~300MB | TB | ⭐⭐ | 🟢 Thấp | ⬜ Chưa |

---

## Khuyến nghị — Batch tiếp theo

> Tier 1 đã hoàn thành (5/6). Chuyển focus sang Tier 2 còn lại.

### Batch tiếp theo: Tier 2 còn lại (3 tools)

1. **Zero-shot Text Classification** — Flexible, user tự define categories. Model ~200MB
2. **Text Generation** — Creative writing tool. Model ~350MB
3. **Image Similarity (CLIP)** — Unique tool, ít competitors. Model ~150MB

### Tổng model size
- Zero-shot Classification: ~200MB
- Text Generation: ~350MB
- Image Similarity: ~150MB
- **Tổng: ~700MB** (download on-demand, cache vào IndexedDB)

### Lưu ý
- Image Upscaler (Tier 1) bỏ qua vì không có ONNX model phù hợp
- Tier 3 (Depth Estimation, Image Colorization, Pose Estimation, Audio Classification, Hate Speech Detection, Emotion Detection) — ưu tiên thấp, có thể làm sau

---

## Technical Considerations

### Model Loading Strategy
```
1. User mở tool → lazy load component
2. User click "Process" → download model lần đầu
3. Progress bar hiển thị tiến trình download
4. Model cache vào IndexedDB
5. Các lần sau: load từ cache (instant)
```

### Memory Management
```
- Giải phóng model sau khi dùng (nếu ít dùng)
- Hoặc giữ trong memory cho tool phổ biến
- Giới hạn ảnh input: max 2048px
- Giải phóng Blob/URL sau khi process
```

### Browser Compatibility
```
- WASM: Hỗ trợ tất cả browser hiện đại
- WebGPU: Chrome/Edge 113+. Fallback sang WASM
- Web Speech API: Chrome, Edge, Safari, Firefox
- MediaRecorder API: Chrome, Edge, Firefox, Safari
```

### Chunk Size Optimization
```
- Transformers.js runtime: ~894KB (shared across all AI tools)
- Mỗi tool: ~5-6KB component code
- Model: download riêng, không bundle vào JS
- ONNX Runtime WASM: ~21MB (shared)
```

---

## KPIs mục tiêu

| Metric | Trước | Hiện tại | Mục tiêu tiếp theo |
|---|---|---|---|
| AI Tools | 8 | 16 | 19 (+3) |
| Total Tools | 108 | 226 | 229+ |
| Categories | 16 | 16 | 16 (vẫn trong AI) |
| Pages | 126 | 254 | — |

---

*Cập nhật: 2026-06-09*
