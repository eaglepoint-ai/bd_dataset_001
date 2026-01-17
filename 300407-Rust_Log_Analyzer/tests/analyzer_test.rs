use std::process::Command;
use serde_json::Value;
use std::path::PathBuf;

fn get_binary_path() -> PathBuf {
    // In cargo test, the binary is in target/release/
    // Use cargo's CARGO_BIN_EXE environment variable if available
    if let Ok(path) = std::env::var("CARGO_BIN_EXE_loganalyzer") {
        return PathBuf::from(path);
    }
    
    // Fallback: construct the path
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push("target");
    path.push("release");
    path.push("loganalyzer");
    path
}

fn get_test_file_path(filename: &str) -> String {
    // Tests run from repository_after, but test files are in ../tests/
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push("..");
    path.push("tests");
    path.push(filename);
    path.to_str().unwrap().to_string()
}

#[test]
fn test_empty_log_file() {
    let output = Command::new(get_binary_path())
        .arg(get_test_file_path("empty.log"))
        .output()
        .expect("Failed to execute command");

    assert!(output.status.success());
    
    let json: Value = serde_json::from_slice(&output.stdout).expect("Invalid JSON");
    assert_eq!(json["total_requests"], 0);
    assert_eq!(json["total_bytes"], 0);
    assert_eq!(json["error_rate"], 0.0);
}

#[test]
fn test_invalid_log_lines() {
    let output = Command::new(get_binary_path())
        .arg(get_test_file_path("invalid.log"))
        .output()
        .expect("Failed to execute command");

    assert!(output.status.success());
    
    let json: Value = serde_json::from_slice(&output.stdout).expect("Invalid JSON");
    assert_eq!(json["total_requests"], 0);
    assert_eq!(json["skipped_lines"], 3);
}

#[test]
fn test_sample_log_basic_stats() {
    let output = Command::new(get_binary_path())
        .arg(get_test_file_path("sample.log"))
        .output()
        .expect("Failed to execute command");

    assert!(output.status.success());
    
    let json: Value = serde_json::from_slice(&output.stdout).expect("Invalid JSON");
    assert_eq!(json["total_requests"], 10);
    assert!(json["total_bytes"].as_u64().unwrap() > 0);
    assert!(json["requests_by_status"].as_object().unwrap().contains_key("200"));
    assert!(json["requests_by_status"].as_object().unwrap().contains_key("404"));
}

#[test]
fn test_datetime_filter() {
    let output = Command::new(get_binary_path())
        .arg(get_test_file_path("sample.log"))
        .arg("--from")
        .arg("2023-10-10 14:00")
        .output()
        .expect("Failed to execute command");

    assert!(output.status.success());
    
    let json: Value = serde_json::from_slice(&output.stdout).expect("Invalid JSON");
    // Should only include entries from 14:00 onwards (8 entries)
    assert!(json["total_requests"].as_u64().unwrap() < 10);
}

#[test]
fn test_status_filter() {
    let output = Command::new(get_binary_path())
        .arg(get_test_file_path("sample.log"))
        .arg("--status")
        .arg("4xx")
        .output()
        .expect("Failed to execute command");

    assert!(output.status.success());
    
    let json: Value = serde_json::from_slice(&output.stdout).expect("Invalid JSON");
    // Should only count 4xx status codes
    let requests_by_status = json["requests_by_status"].as_object().unwrap();
    for (status, _) in requests_by_status {
        let status_code: u16 = status.parse().unwrap();
        assert!(status_code >= 400 && status_code < 500);
    }
}

#[test]
fn test_file_not_found() {
    let output = Command::new(get_binary_path())
        .arg("nonexistent.log")
        .output()
        .expect("Failed to execute command");

    assert!(!output.status.success());
    assert_eq!(output.status.code().unwrap(), 1);
    assert!(!output.stderr.is_empty());
}

#[test]
fn test_top_ips() {
    let output = Command::new(get_binary_path())
        .arg(get_test_file_path("sample.log"))
        .arg("--top-ips")
        .arg("3")
        .output()
        .expect("Failed to execute command");

    assert!(output.status.success());
    
    let json: Value = serde_json::from_slice(&output.stdout).expect("Invalid JSON");
    let top_ips = json["top_ips"].as_array().unwrap();
    assert!(top_ips.len() <= 3);
    
    // Verify descending order
    if top_ips.len() > 1 {
        let first_count = top_ips[0]["count"].as_u64().unwrap();
        let second_count = top_ips[1]["count"].as_u64().unwrap();
        assert!(first_count >= second_count);
    }
}

#[test]
fn test_error_rate_calculation() {
    let output = Command::new(get_binary_path())
        .arg(get_test_file_path("sample.log"))
        .output()
        .expect("Failed to execute command");

    assert!(output.status.success());
    
    let json: Value = serde_json::from_slice(&output.stdout).expect("Invalid JSON");
    let error_rate = json["error_rate"].as_f64().unwrap();
    
    // Sample has 3 errors (404, 403, 500) out of 10 requests = 30%
    assert!((error_rate - 30.0).abs() < 0.1);
}
