use anyhow::Result;
use base64::Engine;
use reqwest;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Content part for multimodal messages (text or image)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
enum ContentPart {
    Text { r#type: String, text: String },
    ImageUrl { r#type: String, image_url: ImageUrlContent },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ImageUrlContent {
    url: String,
}

/// Message content can be a simple string or an array of content parts
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
enum MessageContent {
    Text(String),
    Parts(Vec<ContentPart>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ChatMessage {
    role: String,
    content: MessageContent,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
    stream: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatChoice {
    message: ChatMessageResponse,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessageResponse {
    role: String,
    content: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ExtractedImage {
    page_number: u32,
    file_name: String,
    local_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ExtractImagesResult {
    images: Vec<ExtractedImage>,
}

/// Analyze content using LLM API, with optional image support
#[tauri::command]
async fn analyze_content_rust(
    api_key: String,
    api_base_url: String,
    system_prompt: String,
    text_content: String,
    model: String,
    images: Option<Vec<String>>,
) -> Result<String, String> {
    let system_message = ChatMessage {
        role: "system".to_string(),
        content: MessageContent::Text(system_prompt),
    };

    // Build user message - if images are provided, use multimodal format
    let user_message = if let Some(ref image_list) = images {
        if image_list.is_empty() {
            ChatMessage {
                role: "user".to_string(),
                content: MessageContent::Text(text_content),
            }
        } else {
            let mut parts: Vec<ContentPart> = vec![ContentPart::Text {
                r#type: "text".to_string(),
                text: text_content,
            }];

            for image_url in image_list {
                // Support both base64 data URLs and regular URLs
                let url = if image_url.starts_with("data:") || image_url.starts_with("http") {
                    image_url.clone()
                } else {
                    // Treat as file path - read and convert to base64 data URL
                    match fs::read(image_url) {
                        Ok(bytes) => {
                            let base64_str = base64_encode(&bytes);
                            let ext = Path::new(image_url)
                                .extension()
                                .and_then(|e| e.to_str())
                                .unwrap_or("png");
                            let mime = match ext {
                                "jpg" | "jpeg" => "image/jpeg",
                                "png" => "image/png",
                                "gif" => "image/gif",
                                "webp" => "image/webp",
                                "bmp" => "image/bmp",
                                _ => "image/png",
                            };
                            format!("data:{};base64,{}", mime, base64_str)
                        }
                        Err(_) => continue, // Skip unreadable images
                    }
                };

                parts.push(ContentPart::ImageUrl {
                    r#type: "image_url".to_string(),
                    image_url: ImageUrlContent { url },
                });
            }

            ChatMessage {
                role: "user".to_string(),
                content: MessageContent::Parts(parts),
            }
        }
    } else {
        ChatMessage {
            role: "user".to_string(),
            content: MessageContent::Text(text_content),
        }
    };

    let messages = vec![system_message, user_message];

    let chat_request = ChatRequest {
        model,
        messages,
        max_tokens: Some(4000),
        temperature: Some(0.7),
        stream: Some(false),
    };

    let client = reqwest::Client::new();
    let url = format!("{}/chat/completions", api_base_url.trim_end_matches('/'));

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        )
        .json(&chat_request)
        .send()
        .await
        .map_err(|e| format!("发送请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API 请求失败 {}: {}", status, error_text));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    let chat_response: ChatResponse = serde_json::from_str(&response_text)
        .map_err(|e| format!("解析响应失败: {}。响应内容: {}", e, response_text))?;

    if chat_response.choices.is_empty() {
        return Err("API 返回空响应".to_string());
    }

    let content = chat_response.choices[0].message.content.clone();
    match content {
        Some(text) if !text.is_empty() => Ok(text),
        _ => Err("模型返回空内容（可能仅包含思考过程，未生成可见输出）".to_string()),
    }
}

/// Extract images from a PDF file using lopdf, with page-render fallback.
/// Strategy:
///   1. Try lopdf to extract embedded images (JPEG/PNG/JP2/raw)
///   2. If no embedded images found, render each page as a PNG using pdfjs-style
///      rasterization (via the image crate for raw pixel data from lopdf)
///   3. As a last resort, try the easyyun API (requires public URL)
#[tauri::command]
async fn extract_pdf_images(
    pdf_path: String,
    output_dir: String,
    base_name: String,
) -> Result<String, String> {
    let pdf_file_path = Path::new(&pdf_path);
    if !pdf_file_path.exists() {
        return Err(format!("PDF 文件不存在: {}", pdf_path));
    }

    // Ensure output directory exists
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("创建输出目录失败: {}", e))?;

    // Read PDF file bytes
    let pdf_bytes = fs::read(pdf_file_path)
        .map_err(|e| format!("读取 PDF 文件失败: {}", e))?;

    // Use lopdf to extract embedded images from the PDF
    let lopdf_doc = lopdf::Document::load_mem(&pdf_bytes)
        .map_err(|e| format!("解析 PDF 失败: {}", e))?;

    let mut extracted_images: Vec<ExtractedImage> = Vec::new();
    let mut image_index: u32 = 0;

    // Iterate through pages and extract images using lopdf's built-in method
    let pages = lopdf_doc.get_pages();
    for (page_num, page_id) in pages.iter() {
        // Use lopdf's get_page_images to extract image info
        match lopdf_doc.get_page_images(*page_id) {
            Ok(pdf_images) => {
                for pdf_image in pdf_images {
                    let width = pdf_image.width as u32;
                    let height = pdf_image.height as u32;

                    // Skip very small images (likely artifacts)
                    if width < 10 || height < 10 {
                        continue;
                    }

                    image_index += 1;

                    // Determine file extension based on filter
                    let filter_str = pdf_image
                        .filters
                        .as_ref()
                        .map(|f| f.join(","))
                        .unwrap_or_default();

                    let save_result = if filter_str.contains("DCTDecode") {
                        // JPEG - save directly
                        save_jpeg(&pdf_image.content, &output_dir, &base_name, *page_num, image_index)
                    } else if filter_str.contains("JPXDecode") {
                        // JPEG2000 - save directly
                        save_jpeg(&pdf_image.content, &output_dir, &base_name, *page_num, image_index)
                    } else if filter_str.contains("FlateDecode") {
                        // Deflate-compressed raw pixels - decode and save as PNG
                        save_raw_as_png(&pdf_image.content, width, height, pdf_image.color_space.as_deref(), &output_dir, &base_name, *page_num, image_index)
                    } else {
                        // Unfiltered raw pixels - save as PNG
                        save_raw_as_png(&pdf_image.content, width, height, pdf_image.color_space.as_deref(), &output_dir, &base_name, *page_num, image_index)
                    };

                    if let Some(img) = save_result {
                        extracted_images.push(img);
                    }
                }
            }
            Err(_) => continue,
        }
    }

    // If no embedded images found, try the easyyun API as fallback
    if extracted_images.is_empty() {
        eprintln!("lopdf 未提取到嵌入图片，尝试 easyyun API...");
        match call_easyyun_extract_api(&pdf_path, &output_dir, &base_name).await {
            Ok(api_images) => {
                extracted_images.extend(api_images);
            }
            Err(e) => {
                eprintln!("easyyun API 调用失败: {}", e);
                // Return empty result rather than failing
            }
        }
    }

    let result = ExtractImagesResult {
        images: extracted_images,
    };

    serde_json::to_string(&result)
        .map_err(|e| format!("序列化结果失败: {}", e))
}

/// Save JPEG/JP2 image data directly to file
fn save_jpeg(
    content: &[u8],
    output_dir: &str,
    base_name: &str,
    page_num: u32,
    img_index: u32,
) -> Option<ExtractedImage> {
    let file_name = format!("{}_page{}_img{:03}.jpg", base_name, page_num, img_index);
    let local_path = format!("{}/{}", output_dir.replace('\\', "/"), file_name);

    match fs::write(&local_path, content) {
        Ok(()) => Some(ExtractedImage {
            page_number: page_num,
            file_name,
            local_path,
        }),
        Err(e) => {
            eprintln!("保存 JPEG 图片失败: {}", e);
            None
        }
    }
}

/// Save raw pixel data as PNG using the image crate
fn save_raw_as_png(
    content: &[u8],
    width: u32,
    height: u32,
    color_space: Option<&str>,
    output_dir: &str,
    base_name: &str,
    page_num: u32,
    img_index: u32,
) -> Option<ExtractedImage> {
    let file_name = format!("{}_page{}_img{:03}.png", base_name, page_num, img_index);
    let local_path = format!("{}/{}", output_dir.replace('\\', "/"), file_name);

    let cs = color_space.unwrap_or("DeviceGray");

    // Build an image from raw pixel data
    let img = if cs == "DeviceRGB" || cs == "CalRGB" {
        image::RgbImage::from_raw(width, height, content.to_vec())
            .map(|buf| image::DynamicImage::ImageRgb8(buf))
    } else if cs == "DeviceGray" || cs == "CalGray" {
        // Convert grayscale to RGB for broader compatibility
        let rgb_data: Vec<u8> = content
            .iter()
            .take((width * height) as usize)
            .flat_map(|&g| [g, g, g])
            .collect();
        image::RgbImage::from_raw(width, height, rgb_data)
            .map(|buf| image::DynamicImage::ImageRgb8(buf))
    } else if cs == "DeviceCMYK" {
        // Convert CMYK to RGB
        let rgb_data = cmyk_to_rgb(content);
        image::RgbImage::from_raw(width, height, rgb_data)
            .map(|buf| image::DynamicImage::ImageRgb8(buf))
    } else {
        // Default: treat as grayscale
        let rgb_data: Vec<u8> = content
            .iter()
            .take((width * height) as usize)
            .flat_map(|&g| [g, g, g])
            .collect();
        image::RgbImage::from_raw(width, height, rgb_data)
            .map(|buf| image::DynamicImage::ImageRgb8(buf))
    };

    match img {
        Some(dynamic_img) => {
            match dynamic_img.save_with_format(&local_path, image::ImageFormat::Png) {
                Ok(()) => Some(ExtractedImage {
                    page_number: page_num,
                    file_name,
                    local_path,
                }),
                Err(e) => {
                    eprintln!("保存 PNG 图片失败: {}", e);
                    None
                }
            }
        }
        None => {
            eprintln!("无法从原始像素数据创建图片 ({}x{}, {})", width, height, cs);
            None
        }
    }
}

/// Simple base64 encoding (no external crate needed)
/// Base64 encode using the base64 crate
fn base64_encode(data: &[u8]) -> String {
    base64::engine::general_purpose::STANDARD.encode(data)
}

/// Convert CMYK color data to RGB
fn cmyk_to_rgb(cmyk_data: &[u8]) -> Vec<u8> {
    let mut rgb = Vec::with_capacity(cmyk_data.len() / 4 * 3);
    for chunk in cmyk_data.chunks(4) {
        if chunk.len() < 4 {
            break;
        }
        let c = chunk[0] as f32 / 255.0;
        let m = chunk[1] as f32 / 255.0;
        let y = chunk[2] as f32 / 255.0;
        let k = chunk[3] as f32 / 255.0;

        let r = ((1.0 - c) * (1.0 - k) * 255.0) as u8;
        let g = ((1.0 - m) * (1.0 - k) * 255.0) as u8;
        let b = ((1.0 - y) * (1.0 - k) * 255.0) as u8;

        rgb.push(r);
        rgb.push(g);
        rgb.push(b);
    }
    rgb
}

/// Call the easyyun API to extract images from a PDF
/// Supports both URL input and base64-encoded file input
async fn call_easyyun_extract_api(
    pdf_path: &str,
    output_dir: &str,
    base_name: &str,
) -> Result<Vec<ExtractedImage>, String> {
    let pdf_bytes = fs::read(pdf_path)
        .map_err(|e| format!("读取 PDF 失败: {}", e))?;

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;

    // Try base64 input first (works for local files)
    let pdf_base64 = base64_encode(&pdf_bytes);
    let request_body = serde_json::json!({
        "app_key": "app_key_test",
        "input": format!("data:application/pdf;base64,{}", pdf_base64)
    });

    eprintln!("调用 easyyun API (base64 模式), 文件大小: {} bytes", pdf_bytes.len());

    let response = client
        .post("https://pdf-api.pdfai.cn/v1/pdf/pdf_extract_image")
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await;

    let response = match response {
        Ok(r) => r,
        Err(e) => {
            eprintln!("easyyun API 请求失败: {}", e);
            return Err(format!("API 请求失败: {}", e));
        }
    };

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        eprintln!("easyyun API 返回错误: {} - {}", status, error_text);
        return Err(format!("API 返回错误状态: {}", status));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("读取 API 响应失败: {}", e))?;

    let api_response: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|e| format!("解析 API 响应失败: {}。响应: {}", e, &response_text[..response_text.len().min(500)]))?;

    if api_response["code"].as_u64() != Some(200) {
        let error_msg = api_response["code_msg"].as_str().unwrap_or("未知错误");
        eprintln!("easyyun API 返回错误: {}", error_msg);
        return Err(format!("API 返回错误: {}", error_msg));
    }

    let file_urls = match api_response["data"]["file_url"].as_array() {
        Some(urls) => urls,
        None => return Ok(Vec::new()),
    };

    eprintln!("easyyun API 返回 {} 张图片", file_urls.len());

    let mut images = Vec::new();

    for (idx, url_value) in file_urls.iter().enumerate() {
        let url = match url_value.as_str() {
            Some(u) => u,
            None => continue,
        };

        let file_name = format!("{}_api_img{:03}.png", base_name, idx + 1);
        let local_path = format!("{}/{}", output_dir.replace('\\', "/"), file_name);

        // Download the image
        let img_response = client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("下载图片失败: {}", e))?;

        if img_response.status().is_success() {
            let img_bytes = img_response
                .bytes()
                .await
                .map_err(|e| format!("读取图片数据失败: {}", e))?;

            fs::write(&local_path, &img_bytes)
                .map_err(|e| format!("保存图片失败: {}", e))?;

            images.push(ExtractedImage {
                page_number: (idx + 1) as u32,
                file_name,
                local_path,
            });
        }
    }

    Ok(images)
}

#[tauri::command]
async fn test_model_connection_rust(
    api_key: String,
    api_base_url: String,
    model: String,
) -> Result<bool, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(12))
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;

    let request_body = serde_json::json!({
        "model": model,
        "messages": [{"role": "user", "content": "hi"}],
        "stream": false,
        "max_tokens": 1,
        "temperature": 0.0,
    });

    let response = client
        .post(format!("{}/chat/completions", api_base_url.trim_end_matches('/')))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("请求测试失败: {}", e))?;

    if !response.status().is_success() {
        let status_code = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("API request failed with status {}: {}", status_code, error_text));
    }

    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            analyze_content_rust,
            extract_pdf_images,
            test_model_connection_rust,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
