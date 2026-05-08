use anyhow::Result;
use reqwest;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
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
    message: ChatMessage,
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

/// Analyze content using LLM API
#[tauri::command]
async fn analyze_content_rust(
    api_key: String,
    api_base_url: String,
    system_prompt: String,
    text_content: String,
    model: String,
) -> Result<String, String> {
    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: system_prompt,
        },
        ChatMessage {
            role: "user".to_string(),
            content: text_content,
        },
    ];

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

    Ok(chat_response.choices[0].message.content.clone())
}

/// Extract images from a PDF file using lopdf, with easyyun API as fallback.
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

                    let ext = if filter_str.contains("DCTDecode") {
                        "jpg"
                    } else if filter_str.contains("JPXDecode") {
                        "jp2"
                    } else {
                        "bmp"
                    };

                    let file_name = format!(
                        "{}_page{}_img{:03}.{}",
                        base_name, page_num, image_index, ext
                    );
                    let local_path = format!("{}/{}", output_dir.replace('\\', "/"), file_name);

                    // Get color space name
                    let color_space = pdf_image.color_space.as_deref().unwrap_or("Unknown");

                    // Save the image
                    let content = pdf_image.content;
                    let save_result = save_image_from_stream(
                        content,
                        width,
                        height,
                        color_space,
                        pdf_image.origin_dict,
                        &local_path,
                    );

                    if let Ok(()) = save_result {
                        extracted_images.push(ExtractedImage {
                            page_number: *page_num,
                            file_name,
                            local_path,
                        });
                    }
                }
            }
            Err(_) => continue,
        }
    }

    // If no embedded images found, try the easyyun API as fallback
    if extracted_images.is_empty() {
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

/// Save image data from PDF stream to a file.
/// For JPEG/DCTDecode streams, save raw bytes as .jpg.
/// For other streams, save raw bytes as .bin (for debugging) or attempt BMP.
fn save_image_from_stream(
    content: &[u8],
    width: u32,
    height: u32,
    color_space: &str,
    dict: &lopdf::Dictionary,
    output_path: &str,
) -> Result<(), String> {
    // Check the filter to determine the image format
    let filter = match dict.get(b"Filter") {
        Ok(f) => match f {
            lopdf::Object::Name(n) => String::from_utf8_lossy(n).to_string(),
            lopdf::Object::Array(arr) => arr
                .iter()
                .filter_map(|o| match o {
                    lopdf::Object::Name(n) => Some(String::from_utf8_lossy(n).to_string()),
                    _ => None,
                })
                .collect::<Vec<_>>()
                .join(","),
            _ => "Unknown".to_string(),
        },
        Err(_) => "None".to_string(),
    };

    // If the image is JPEG encoded (DCTDecode), save directly as .jpg
    if filter.contains("DCTDecode") {
        fs::write(output_path, content)
            .map_err(|e| format!("保存 JPEG 图片失败: {}", e))?;
        return Ok(());
    }

    // If the image is JPXDecode (JPEG2000), save as .jp2
    if filter.contains("JPXDecode") {
        fs::write(output_path, content)
            .map_err(|e| format!("保存 JP2 图片失败: {}", e))?;
        return Ok(());
    }

    // For FlateDecode or unfiltered raw pixel data, create a simple BMP
    // BMP is simple enough to write without external crates
    let channels = if color_space == "DeviceRGB" || color_space == "CalRGB" {
        3
    } else if color_space == "DeviceCMYK" {
        4
    } else {
        1 // Grayscale (DeviceGray)
    };

    let expected_size = (width * height * channels) as usize;
    if content.len() < expected_size {
        return Err(format!(
            "图片数据不足: 期望 {} 字节, 实际 {} 字节",
            expected_size,
            content.len()
        ));
    }

    // Convert to RGB if needed, then write BMP
    let rgb_data = if color_space == "DeviceCMYK" {
        cmyk_to_rgb(content)
    } else if color_space == "DeviceGray" {
        // Convert grayscale to RGB
        content
            .iter()
            .take((width * height) as usize)
            .flat_map(|&g| [g, g, g])
            .collect()
    } else {
        // Already RGB
        content[..expected_size].to_vec()
    };

    write_bmp(&rgb_data, width, height, output_path)
}

/// Write a simple 24-bit BMP file
fn write_bmp(rgb_data: &[u8], width: u32, height: u32, output_path: &str) -> Result<(), String> {
    let row_size = ((width * 3 + 3) & !3) as usize; // Rows are padded to 4-byte boundaries
    let pixel_data_size = row_size * height as usize;
    let file_size = 54 + pixel_data_size; // 14 (header) + 40 (info) + pixel data

    let mut bmp = Vec::with_capacity(file_size as usize);

    // BMP Header (14 bytes)
    bmp.extend_from_slice(b"BM"); // Signature
    bmp.extend_from_slice(&file_size.to_le_bytes()); // File size
    bmp.extend_from_slice(&[0, 0, 0, 0]); // Reserved
    bmp.extend_from_slice(&54u32.to_le_bytes()); // Pixel data offset

    // DIB Header (40 bytes) - BITMAPINFOHEADER
    bmp.extend_from_slice(&40u32.to_le_bytes()); // Header size
    bmp.extend_from_slice(&(width as i32).to_le_bytes()); // Width
    bmp.extend_from_slice(&(height as i32).to_le_bytes()); // Height (positive = bottom-up)
    bmp.extend_from_slice(&1u16.to_le_bytes()); // Planes
    bmp.extend_from_slice(&24u16.to_le_bytes()); // Bits per pixel
    bmp.extend_from_slice(&0u32.to_le_bytes()); // Compression (none)
    bmp.extend_from_slice(&(pixel_data_size as u32).to_le_bytes()); // Image size
    bmp.extend_from_slice(&2835u32.to_le_bytes()); // X pixels per meter (72 DPI)
    bmp.extend_from_slice(&2835u32.to_le_bytes()); // Y pixels per meter
    bmp.extend_from_slice(&0u32.to_le_bytes()); // Colors used
    bmp.extend_from_slice(&0u32.to_le_bytes()); // Important colors

    // Pixel data (BMP stores pixels bottom-up, BGR order)
    let padding = row_size - (width * 3) as usize;
    for y in (0..height).rev() {
        for x in 0..width {
            let idx = ((y * width + x) * 3) as usize;
            if idx + 2 < rgb_data.len() {
                // BGR order
                bmp.push(rgb_data[idx + 2]); // B
                bmp.push(rgb_data[idx + 1]); // G
                bmp.push(rgb_data[idx]);     // R
            } else {
                bmp.push(0);
                bmp.push(0);
                bmp.push(0);
            }
        }
        // Padding
        for _ in 0..padding {
            bmp.push(0);
        }
    }

    fs::write(output_path, bmp)
        .map_err(|e| format!("保存 BMP 图片失败: {}", e))
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
/// This requires the PDF to be accessible via a public URL
async fn call_easyyun_extract_api(
    pdf_path: &str,
    output_dir: &str,
    base_name: &str,
) -> Result<Vec<ExtractedImage>, String> {
    // Read PDF and encode to base64 for potential future API support
    let _pdf_bytes = fs::read(pdf_path)
        .map_err(|e| format!("读取 PDF 失败: {}", e))?;

    // The easyyun API requires a publicly accessible URL
    // For local files, we cannot directly use this API
    // This is a placeholder for when a URL is available
    // In the future, we could upload to a temporary file hosting service

    let client = reqwest::Client::new();

    // Try with the file path as input (won't work for local files, but kept for future use)
    let request_body = serde_json::json!({
        "app_key": "app_key_test",
        "input": pdf_path
    });

    let response = client
        .post("https://pdf-api.pdfai.cn/v1/pdf/pdf_extract_image")
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("API 请求失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 返回错误状态: {}", response.status()));
    }

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("读取 API 响应失败: {}", e))?;

    let api_response: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|e| format!("解析 API 响应失败: {}", e))?;

    if api_response["code"].as_u64() != Some(200) {
        return Err(format!(
            "API 返回错误: {}",
            api_response["code_msg"].as_str().unwrap_or("未知错误")
        ));
    }

    let file_urls = match api_response["data"]["file_url"].as_array() {
        Some(urls) => urls,
        None => return Ok(Vec::new()),
    };

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
        .invoke_handler(tauri::generate_handler![
            analyze_content_rust,
            extract_pdf_images,
            test_model_connection_rust,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
