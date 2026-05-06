# AI Tools Research — Kế hoạch phát triển tiếp theo

> Nghiên cứu các AI tools khả thi tiếp theo cho ToolBundle. Tất cả chạy 100% client-side.

## Trạng thái hiện tại

| Metric | Value |
|---|---|
| AI Tools đã có | 8 |
| Tech Stack | Transformers.js v3.8.1 + Tesseract.js |
| Models | ONNX Runtime WASM/WebGPU |
| Cache | IndexedDB |

### Đã implement (8 tools)

| Tool | Model | Size | Task |
|---|---|---|---|
| OCR | Tesseract.js | ~4MB | image-to-text (OCR) |
| Background Remover | RMBG-1.4 | ~170MB | image-segmentation |
| Text Summarizer | distilbart-cnn-6-6 | ~90MB | summarization |
| Object Detection | detr-resnet-50 | ~50MB | object-detection |
| Grammar Checker | T5-small | ~250MB | text2text-generation |
| Image Captioning | vit-gpt2 | ~1.2GB | image-to-text |
| Sentiment Analysis | DistilBERT SST-2 | ~270MB | sentiment-analysis |
| Question Answering | DistilBERT QA | ~270MB | question-answering |

---

## Tier 1 — Ưu tiên cao (Nên làm tiếp)

### 1. Text Translation
| | |
|---|---|
| **Mô tả** | Dịch văn bản giữa các ngôn ngữ |
| **Task** | `translation` |
| **Model** | `Xenova/opus-mt-en-vi`, `Xenova/opus-mt-vi-en`, `Xenova/opus-mt-en-zh`, v.v. |
| **Model size** | ~300MB mỗi cặp ngôn ngữ |
| **Độ khó** | ⭐⭐ Trung bình |
| **UX** | Chọn ngôn ngữ nguồn/đích → nhập text → nhận kết quả |
| **Lý do ưu tiên** | Rất nhiều user Việt Nam cần dịch thuật. Hữu ích cho sinh viên, freelancer |
| **Hạn chế** | Mỗi cặp ngôn ngữ cần model riêng (~300MB). Có thể load on-demand theo cặp |
| **Approach** | Load model theo cặp ngôn ngữ user chọn. Hiển thị progress bar. Cache vào IndexedDB |

**Ngôn ngữ nên hỗ trợ (theo thứ tự):**
1. English ↔ Vietnamese (quan trọng nhất cho user VN)
2. English ↔ Chinese
3. English ↔ Japanese
4. English ↔ Korean
5. English ↔ French
6. English ↔ German

**Implementation notes:**
```
- Dùng `pipeline("translation", "Xenova/opus-mt-en-vi")`
- Output: { translation_text: "Kết quả dịch" }
- Có thể gộp nhiều cặp ngôn ngữ vào 1 tool với dropdown chọn
- Model sẽ được download theo cặp ngôn ngữ user chọn
```

---

### 2. Speech-to-Text (Voice Recognition)
| | |
|---|---|
| **Mô tả** | Chuyển giọng nói thành văn bản |
| **Task** | `automatic-speech-recognition` |
| **Model** | `Xenova/whisper-tiny.en` (~75MB), `Xenova/whisper-base.en` (~150MB) |
| **Model size** | 75MB — 500MB tùy variant |
| **Độ khó** | ⭐⭐ Trung bình |
| **UX** | Upload file audio/record microphone → hiển thị text |
| **Lý do ưu tiên** | Rất hữu ích cho content creator, journalist, sinh viên |
| **Hạn chế** | Whisper tiny chất lượng thấp. Base/Small tốt hơn nhưng nặng hơn |
| **Approach** | Dùng Whisper tiny cho English. Có thể thêm multi-language sau |

**Implementation notes:**
```
- Dùng `pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en")`
- Input: File audio (MP3, WAV, M4A, OGG) hoặc microphone recording
- Output: { text: "Transcribed text" }
- Web Audio API để decode audio file
- MediaRecorder API để record từ microphone
- Whisper tiny: ~75MB, đủ cho English cơ bản
- Whisper base: ~150MB, chất lượng tốt hơn
```

**Features:**
- Upload file audio (drag & drop)
- Record from microphone (real-time)
- Timestamp output (optional)
- Language detection (Whisper multi-language)

---

### 3. Named Entity Recognition (NER)
| | |
|---|---|
| **Mô tả** | Nhận diện tên riêng, địa điểm, tổ chức trong văn bản |
| **Task** | `token-classification` |
| **Model** | `Xenova/bert-base-NER` (~400MB) hoặc `Xenova/distilbert-NER` (~250MB) |
| **Model size** | 250MB — 400MB |
| **Độ khó** | ⭐⭐ Trung bình |
| **UX** | Nhập text → highlight các entity (Person, Location, Organization) |
| **Lý do ưu tiên** | Hữu ích cho researcher, journalist, data analyst |
| **Hạn chế** | Chỉ hỗ trợ English. Cần fine-tune cho tiếng Việt |
| **Approach** | Dùng DistilBERT NER cho nhẹ hơn. Highlight kết quả với màu theo loại entity |

**Implementation notes:**
```
- Dùng `pipeline("token-classification", "Xenova/distilbert-NER")`
- Input: Text paragraph
- Output: [{ entity: "B-PER", word: "John", score: 0.99, start, end }, ...]
- Highlight text với màu theo loại: PER (xanh), LOC (vàng), ORG (đỏ), MISC (tím)
- Copy extracted entities theo category
```

---

### 4. Image Upscaler (Super Resolution)
| | |
|---|---|
| **Mô tả** | Phóng to ảnh mà không mất chất lượng |
| **Task** | `image-to-image` (super resolution) |
| **Model** | Real-ESRGAN hoặc ESRGAN variants |
| **Model size** | ~60MB — 100MB |
| **Độ khó** | ⭐⭐⭐ Khó |
| **UX** | Upload ảnh → chọn scale (2x, 4x) → download |
| **Lý do ưu tiên** | Rất nhiều user cần upscale ảnh cũ/ảnh low-res |
| **Hạn chế** | Có thể không có ONNX model sẵn. Có thể cần convert thủ công |
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

### 5. Text-to-Speech
| | |
|---|---|
| **Mô tả** | Đọc văn bản thành giọng nói |
| **Task** | Web Speech API (built-in) hoặc `text-to-speech` |
| **Model** | Không cần model (Web Speech API) hoặc Transformers.js TTS |
| **Model size** | 0MB (Web Speech API) hoặc ~100MB+ (TTS model) |
| **Độ khó** | ⭐ Dễ (Web Speech API) / ⭐⭐⭐ Khó (custom model) |
| **UX** | Nhập text → chọn voice/language → nghe hoặc download |
| **Lý do ưu tiên** | Hữu ích cho accessibility, language learning |
| **Hạn chế** | Web Speech API: giọng nói phụ thuộc browser/OS. Không download được |
| **Approach** | Dùng Web Speech API trước (0MB, instant). Custom model sau |

**Implementation notes:**
```
- Web Speech API: speechSynthesis.speak(new SpeechSynthesisUtterance(text))
- Hỗ trợ: chọn voice, speed, pitch, volume
- Download: Dùng MediaRecorder + AudioContext để capture output
- Limitation: Không phải browser nào cũng hỗ trợ download
- Alternative: Transformers.js TTS models (nặng hơn nhưng chất lượng tốt hơn)
```

---

## Tier 2 — Ưu tiên trung bình

### 6. Zero-shot Text Classification
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

### 7. Face Detection
| | |
|---|---|
| **Mô tả** | Phát hiện khuôn mặt trong ảnh |
| **Task** | `object-detection` hoặc custom |
| **Model** | BlazeFace hoặc MediaPipe Face Detection |
| **Model size** | ~5MB — 15MB |
| **Độ khó** | ⭐⭐ Trung bình |
| **UX** | Upload ảnh → detect faces → blur/pixelate faces |
| **Lý do** | Privacy tool — blur faces trước khi share ảnh |

---

### 8. Paraphrase Generator
| | |
|---|---|
| **Mô tả** | Viết lại câu cùng nghĩa nhưng khác cách diễn đạt |
| **Task** | `text2text-generation` |
| **Model** | `Xenova/paraphrase-T5-small` (~250MB) |
| **Model size** | ~250MB |
| **Độ khó** | ⭐ Dễ |
| **UX** | Nhập text → nhận nhiều cách viết lại |
| **Lý do** | Hữu ích cho content writer, student |

---

### 9. Text Generation (Creative Writing)
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

### 10. Image Similarity (CLIP)
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

### 11. Language Detection
| | |
|---|---|
| **Mô tả** | Phát hiện ngôn ngữ của văn bản |
| **Task** | `text-classification` hoặc heuristics |
| **Model** | Có thể dùng heuristics (Unicode ranges) không cần model |
| **Model size** | 0MB (heuristics) hoặc ~10MB (model) |
| **Độ khó** | ⭐ Dễ |
| **UX** | Nhập text → hiển thị ngôn ngữ + confidence |
| **Lý do** | Nhanh, nhẹ, utility tool |

---

### 12. Keyword Extraction
| | |
|---|---|
| **Mô tả** | Trích xuất keywords quan trọng từ văn bản |
| **Task** | `feature-extraction` + algorithm |
| **Model** | `Xenova/all-MiniLM-L6-v2` (~20MB) |
| **Model size** | ~20MB |
| **Độ khó** | ⭐⭐ Trung bình |
| **UX** | Nhập text → hiển thị top keywords với score |
| **Lý do** | Hữu ích cho SEO, content writing |

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

| # | Tool | Category | Model Size | Effort | Impact | Priority |
|---|---|---|---|---|---|---|
| 1 | Text Translation | Text | ~300MB | TB | ⭐⭐⭐⭐⭐ | 🔴 Cao |
| 2 | Speech-to-Text | Audio | ~75MB | TB | ⭐⭐⭐⭐⭐ | 🔴 Cao |
| 3 | Text-to-Speech | Audio | 0MB | Dễ | ⭐⭐⭐⭐ | 🔴 Cao |
| 4 | Named Entity Recognition | Text | ~250MB | TB | ⭐⭐⭐⭐ | 🔴 Cao |
| 5 | Image Upscaler | Image | ~60MB | Khó | ⭐⭐⭐⭐ | 🟡 TB |
| 6 | Face Detection | Image | ~5MB | TB | ⭐⭐⭐ | 🟡 TB |
| 7 | Zero-shot Classification | Text | ~200MB | TB | ⭐⭐⭐ | 🟡 TB |
| 8 | Paraphrase Generator | Text | ~250MB | Dễ | ⭐⭐⭐ | 🟡 TB |
| 9 | Language Detection | Text | 0MB | Dễ | ⭐⭐⭐ | 🟡 TB |
| 10 | Keyword Extraction | Text | ~20MB | TB | ⭐⭐⭐ | 🟡 TB |
| 11 | Text Generation | Text | ~350MB | TB | ⭐⭐ | 🟢 Thấp |
| 12 | Image Similarity | Image | ~150MB | Khó | ⭐⭐ | 🟢 Thấp |
| 13 | Depth Estimation | Image | ~350MB | TB | ⭐⭐ | 🟢 Thấp |
| 14 | Image Colorization | Image | TBD | Khó | ⭐⭐ | 🟢 Thấp |
| 15 | Pose Estimation | Image | ~10MB | TB | ⭐⭐ | 🟢 Thấp |
| 16 | Audio Classification | Audio | ~300MB | TB | ⭐ | 🟢 Thấp |
| 17 | Hate Speech Detection | Text | ~400MB | TB | ⭐ | 🟢 Thấp |
| 18 | Emotion Detection | Text | ~300MB | TB | ⭐⭐ | 🟢 Thấp |

---

## Khuyến nghị — Batch tiếp theo (6 tools)

Dựa trên impact/effort ratio, đề xuất implement 6 tools tiếp theo:

### Batch A: Text & Audio (impact cao nhất)
1. **Text Translation** — User VN rất cần. Model ~300MB
2. **Speech-to-Text (Whisper)** — Content creator cần. Model ~75MB
3. **Text-to-Speech** — Web Speech API, 0MB, instant

### Batch B: NLP & Image
4. **Named Entity Recognition** — Research/journalism. Model ~250MB
5. **Face Detection** — Privacy tool. Model ~5MB
6. **Paraphrase Generator** — Content writing. Model ~250MB

### Tổng model size cho Batch A+B
- Translation (1 pair): ~300MB
- Whisper tiny: ~75MB
- TTS: 0MB (Web Speech API)
- NER: ~250MB
- Face Detection: ~5MB
- Paraphrase: ~250MB
- **Tổng: ~905MB** (download on-demand, cache vào IndexedDB)

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

| Metric | Hiện tại | Mục tiêu |
|---|---|---|
| AI Tools | 8 | 14 (+6) |
| Total Tools | 108 | 114 |
| Categories | 16 | 16 (vẫn trong AI) |
| Pages | 126 | 132 |

---

*Cập nhật: 2026-05-04*
