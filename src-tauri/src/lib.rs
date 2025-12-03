use anyhow::Result;
use reqwest;
use serde::{Deserialize, Serialize};

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
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

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

    let chat_response: ChatResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    if chat_response.choices.is_empty() {
        return Err("API 返回空响应".to_string());
    }

    Ok(chat_response.choices[0].message.content.clone())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, analyze_content_rust])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
