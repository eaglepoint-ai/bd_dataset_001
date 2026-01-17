use clap::Parser;
use regex::Regex;
use chrono::{DateTime, FixedOffset, NaiveDateTime};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::process;

#[derive(Parser, Debug)]
#[command(name = "loganalyzer")]
#[command(about = "Analyze web server access logs in Combined Log Format")]
struct Args {
    /// Path to the log file
    logfile: String,

    /// Start datetime filter (format: "YYYY-MM-DD HH:MM")
    #[arg(long)]
    from: Option<String>,

    /// End datetime filter (format: "YYYY-MM-DD HH:MM")
    #[arg(long)]
    to: Option<String>,

    /// Filter by status class (2xx, 3xx, 4xx, 5xx)
    #[arg(long)]
    status: Option<String>,

    /// Number of top IPs to show (default: 10)
    #[arg(long, default_value = "10")]
    top_ips: usize,
}

#[derive(Debug, Serialize, Deserialize)]
struct TopIp {
    ip: String,
    count: usize,
}

#[derive(Debug, Serialize)]
struct LogStats {
    total_requests: usize,
    total_bytes: u64,
    skipped_lines: usize,
    requests_by_status: HashMap<String, usize>,
    requests_by_hour: HashMap<String, usize>,
    top_ips: Vec<TopIp>,
    error_rate: f64,
    avg_response_size: f64,
}

#[derive(Debug)]
struct LogEntry {
    ip: String,
    timestamp: DateTime<FixedOffset>,
    status: u16,
    bytes: u64,
}

fn parse_log_line(line: &str, re: &Regex) -> Option<LogEntry> {
    let caps = re.captures(line)?;
    
    // Extract fields
    let ip = caps.get(1)?.as_str().to_string();
    let timestamp_str = caps.get(4)?.as_str();
    let status_str = caps.get(6)?.as_str();
    let bytes_str = caps.get(7)?.as_str();
    
    // Parse timestamp: 10/Oct/2023:13:55:36 -0700
    let timestamp = DateTime::parse_from_str(timestamp_str, "%d/%b/%Y:%H:%M:%S %z").ok()?;
    
    // Parse status code
    let status = status_str.parse::<u16>().ok()?;
    
    // Parse bytes (may be "-" for no content)
    let bytes = if bytes_str == "-" {
        0
    } else {
        bytes_str.parse::<u64>().ok()?
    };
    
    Some(LogEntry {
        ip,
        timestamp,
        status,
        bytes,
    })
}

fn parse_filter_datetime(datetime_str: &str) -> Result<DateTime<FixedOffset>, String> {
    // Parse format: "YYYY-MM-DD HH:MM"
    let naive = NaiveDateTime::parse_from_str(datetime_str, "%Y-%m-%d %H:%M")
        .map_err(|e| format!("Invalid datetime format: {}", e))?;
    
    // Convert to DateTime with UTC offset (assuming UTC for filters)
    let datetime = DateTime::<FixedOffset>::from_naive_utc_and_offset(
        naive,
        FixedOffset::east_opt(0).unwrap()
    );
    
    Ok(datetime)
}

fn matches_status_filter(status: u16, filter: &Option<String>) -> bool {
    match filter {
        None => true,
        Some(f) => {
            match f.as_str() {
                "2xx" => status >= 200 && status < 300,
                "3xx" => status >= 300 && status < 400,
                "4xx" => status >= 400 && status < 500,
                "5xx" => status >= 500 && status < 600,
                _ => true,
            }
        }
    }
}

fn main() {
    let args = Args::parse();
    
    // Open log file
    let file = match File::open(&args.logfile) {
        Ok(f) => f,
        Err(e) => {
            eprintln!("Error: Could not open file '{}': {}", args.logfile, e);
            process::exit(1);
        }
    };
    
    // Parse datetime filters
    let from_filter = if let Some(ref from_str) = args.from {
        match parse_filter_datetime(from_str) {
            Ok(dt) => Some(dt),
            Err(e) => {
                eprintln!("Error parsing --from: {}", e);
                process::exit(1);
            }
        }
    } else {
        None
    };
    
    let to_filter = if let Some(ref to_str) = args.to {
        match parse_filter_datetime(to_str) {
            Ok(dt) => Some(dt),
            Err(e) => {
                eprintln!("Error parsing --to: {}", e);
                process::exit(1);
            }
        }
    } else {
        None
    };
    
    // Compile regex for Combined Log Format
    // Format: <IP> <identity> <user> [<timestamp>] "<request>" <status> <bytes> "<referer>" "<user-agent>"
    let re = Regex::new(
        r#"^(\S+) (\S+) (\S+) \[([^\]]+)\] "([^"]*)" (\d+) (\S+)(?: "([^"]*)" "([^"]*)")?$"#
    ).unwrap();
    
    let reader = BufReader::new(file);
    
    let mut total_requests = 0;
    let mut total_bytes = 0u64;
    let mut skipped_lines = 0;
    let mut requests_by_status: HashMap<String, usize> = HashMap::new();
    let mut requests_by_hour: HashMap<String, usize> = HashMap::new();
    let mut ip_counts: HashMap<String, usize> = HashMap::new();
    let mut error_count = 0;
    
    for line in reader.lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => {
                skipped_lines += 1;
                continue;
            }
        };
        
        let entry = match parse_log_line(&line, &re) {
            Some(e) => e,
            None => {
                skipped_lines += 1;
                continue;
            }
        };
        
        // Apply datetime filters
        if let Some(ref from) = from_filter {
            if entry.timestamp < *from {
                continue;
            }
        }
        
        if let Some(ref to) = to_filter {
            if entry.timestamp > *to {
                continue;
            }
        }
        
        // Apply status filter
        if !matches_status_filter(entry.status, &args.status) {
            continue;
        }
        
        // Update statistics
        total_requests += 1;
        total_bytes += entry.bytes;
        
        // Count by status
        let status_key = entry.status.to_string();
        *requests_by_status.entry(status_key).or_insert(0) += 1;
        
        // Count by hour (format: "2023-10-10 13:00")
        let hour_key = entry.timestamp.format("%Y-%m-%d %H:00").to_string();
        *requests_by_hour.entry(hour_key).or_insert(0) += 1;
        
        // Count by IP
        *ip_counts.entry(entry.ip.clone()).or_insert(0) += 1;
        
        // Count errors (4xx and 5xx)
        if entry.status >= 400 {
            error_count += 1;
        }
    }
    
    // Calculate error rate
    let error_rate = if total_requests > 0 {
        (error_count as f64 / total_requests as f64) * 100.0
    } else {
        0.0
    };
    
    // Calculate average response size
    let avg_response_size = if total_requests > 0 {
        total_bytes as f64 / total_requests as f64
    } else {
        0.0
    };
    
    // Get top N IPs
    let mut ip_vec: Vec<(String, usize)> = ip_counts.into_iter().collect();
    ip_vec.sort_by(|a, b| b.1.cmp(&a.1));
    let top_ips: Vec<TopIp> = ip_vec
        .into_iter()
        .take(args.top_ips)
        .map(|(ip, count)| TopIp { ip, count })
        .collect();
    
    // Create statistics output
    let stats = LogStats {
        total_requests,
        total_bytes,
        skipped_lines,
        requests_by_status,
        requests_by_hour,
        top_ips,
        error_rate,
        avg_response_size,
    };
    
    // Output as pretty-printed JSON
    let json = serde_json::to_string_pretty(&stats).unwrap();
    println!("{}", json);
}
