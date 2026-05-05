#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

mod embedded_python;

use embedded_python::{
    extract_pdf_analysis_bundle_embedded,
    generate_text_embedding,
    generate_batch_embeddings,
    get_embedded_python_status,
    prepare_embedded_python_runtime,
    EmbeddedPythonManager,
};

#[derive(Serialize, Deserialize)]
struct RequestBody {
    model: String,
    messages: Vec<Message>,
    stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
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
async fn test_model_connection_rust(
    api_key: String,
    api_base_url: String,
    model: String,
) -> Result<bool, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(12))
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;

    let request_body = RequestBody {
        model,
        messages: vec![Message {
            role: "user".to_string(),
            content: "hi".to_string(),
        }],
        stream: Some(false),
        max_tokens: Some(1),
        temperature: Some(0.0),
    };

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

    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response text: {}", e))?;

    serde_json::from_str::<ApiResponse>(&response_text)
        .map_err(|e| format!("Failed to parse API response: {}. Response body: {}", e, response_text))?;

    Ok(true)
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
        max_tokens: Some(4000),
        temperature: Some(0.7),
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
        .manage(EmbeddedPythonManager::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            analyze_content_rust,
            test_model_connection_rust,
            get_embedded_python_status,
            prepare_embedded_python_runtime,
            extract_pdf_analysis_bundle_embedded,
            generate_text_embedding,
            generate_batch_embeddings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}