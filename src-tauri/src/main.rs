#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct RequestBody {
    model: String,
    messages: Vec<Message>,
    stream: Option<bool>,
}

#[derive(Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Serialize, Deserialize)]
struct ApiResponse {
    choices: Vec<Choice>,
}

#[derive(Serialize, Deserialize)]
struct Choice {
    message: Message,
}

#[tauri::command]
async fn analyze_content_rust(api_key: String, api_base_url: String, system_prompt: String, text_content: String, model: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let request_body = RequestBody {
        model: model.clone(),
        messages: vec![
            Message { role: "system".to_string(), content: system_prompt },
            Message { role: "user".to_string(), content: format!("这是我上传的文档内容，请开始分析：\n\n{}", text_content) },
        ],
        stream: Some(false),
    };

    let mut request_builder = client
        .post(format!("{}/chat/completions", api_base_url.trim_end_matches('/')))
        .json(&request_body);

    if api_base_url.contains("bigmodel.cn") {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", api_key));
    } else {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", api_key));
    }

    let response = request_builder.send().await;

    match response {
        Ok(res) => {
            let status_code = res.status();
            if status_code.is_success() {
                let response_text = res.text().await.map_err(|e| format!("Failed to read response text: {}", e))?;
                match serde_json::from_str::<ApiResponse>(&response_text) {
                    Ok(api_response) => {
                        if let Some(choice) = api_response.choices.get(0) {
                            Ok(choice.message.content.clone())
                        } else {
                            Err("API did not return any choices.".to_string())
                        }
                    }
                    Err(e) => Err(format!("Failed to parse API response: {}. Response body: {}", e, response_text)),
                }
            } else {
                let error_text = res.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                Err(format!("API request failed with status {}: {}", status_code, error_text))
            }
        }
        Err(e) => Err(format!("Request error: {}", e)),
    }
}


fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![analyze_content_rust])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}